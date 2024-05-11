const { db, releaseConnection } = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const ai_ask = require('../utils/ai_ask')
const { QUESTION, AI_ANSWER_KEY_FAT_LOSS } = require('../constant/constant')
const redis = require('../utils/redis_manager')

/**
 * 处理获取AI减脂方案
 */
const getAIFatLossPlan = async (req, res) => {
    const { user_id, focus_area, target_weight, reduction_speed, ...other } = req.query
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 2000, '用户不存在')
            logger.info('用户不存在')
            return
        }
        // 获取食物列表的 food_id、food_name、food_image、calories
        // 获取一个4以内的随机数
        let offset = Math.floor(Math.random() * 4)
        let sql_food = `SELECT food_id, food_name, food_image, calories FROM food LIMIT ${offset}, 6`
        let [foodList] = await connection.query(sql_food)
        // 询问基础数据---食物参考列表
        let food_list_json = JSON.stringify(foodList)
        // 从user_info中获取用户信息
        sql = `SELECT * , DATE_FORMAT(birthday, '%Y-%m-%d') AS formatted_birthday FROM user_info WHERE user_id = ?`
        let [userInfoResults] = await connection.query(sql, [user_id])
        if (userInfoResults.length === 0) {
            send(res, 4003, '用户信息不存在')
            return
        }
        const { height, weight, gender, formatted_birthday: birthday } = userInfoResults[0]
        const bmi = parseFloat((weight / ((height / 100) * (height / 100))).toFixed(2))
        // 询问基础数据---用户身体信息
        let user_info_json = JSON.stringify({ height, weight, bmi, gender, age: calculateAge(birthday), ...other })
        let recommend_fat_loss_plan_ai_json = await ai_ask(
            QUESTION.GET_AI_FAT_LOSS_PLAN,
            user_info_json,
            food_list_json
        )
        recommend_fat_loss_plan_ai_json = recommend_fat_loss_plan_ai_json.replace(/^\s*```json\s*\n|```$/gm, '')
        // 格式化
        let recommend_fat_loss_plan_ai = JSON.parse(recommend_fat_loss_plan_ai_json)

        // 将数据插入到数据库中
        sql = `INSERT INTO 
        fat_loss_plan 
        (user_id, plan_name, target_weight, reduction_speed, focus_area, plan_cycle,
            plan_start_time, plan_end_time, create_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`

        let [results_plan] = await connection.query(sql, [
            user_id,
            recommend_fat_loss_plan_ai.plan_name,
            target_weight,
            reduction_speed,
            focus_area,
            recommend_fat_loss_plan_ai.plan_cycle,
            recommend_fat_loss_plan_ai.plan_start_time,
            recommend_fat_loss_plan_ai.plan_end_time,
        ])
        let plan_id = results_plan.insertId
        recommend_fat_loss_plan_ai.fat_loss_plan_id = plan_id
        recommend_fat_loss_plan_ai_json = JSON.stringify(recommend_fat_loss_plan_ai)
        // 暂存至redis
        await redis.set(AI_ANSWER_KEY_FAT_LOSS + user_id, recommend_fat_loss_plan_ai_json)
        send(res, 200, '获取AI减脂方案成功', { ...recommend_fat_loss_plan_ai })
        await connection.commit()
        logger.info(`用户 ${user_id} 获取AI减脂方案成功`)
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '获取AI减脂方案失败')
        logger.error('获取AI减脂方案失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 采纳AI减脂方案，将数据存入数据库
 */
const adoptAIFatLossPlan = async (req, res) => {
    const { user_id } = req.query
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 从redis中存储AI减脂方案
        let recommend_fat_loss_plan_ai_json = await redis.get(AI_ANSWER_KEY_FAT_LOSS + user_id)
        if (!recommend_fat_loss_plan_ai_json) {
            send(res, 4003, 'AI减脂方案不存在')
            return
        }
        // 格式化
        let recommend_fat_loss_plan_ai = JSON.parse(recommend_fat_loss_plan_ai_json)
        // 处理、拆分数据
        let { plan_name, diet, exercise, sleep, fat_loss_plan_id } = recommend_fat_loss_plan_ai

        // 处理diet
        let diet_list = []
        Object.values(diet).forEach(async (item) => {
            diet_list = diet_list.concat(item)
        })
        // 响应数据
        let diet_response_data = []

        diet_list.forEach(async (item) => {
            // 检查食物表中是否存在该食物
            let sql_check_food = `SELECT * FROM food WHERE food_id = ?`
            let [results_food] = await connection.query(sql_check_food, [item.food_id])
            if (results_food.length === 0) {
                diet_response_data.push({
                    status: 4003,
                    food_id: item.food_id,
                    food_name: item.food_name,
                    message: '食物已失效',
                })
            } else {
                diet_list.push({
                    user_id: user_id,
                    food_id: item.food_id,
                    food_name: item.food_name,
                    food_image: item.food_image,
                    calories_intake: item.calories_intake,
                    eat_quantity: item.eat_quantity,
                    diet_type: item.diet_type,
                })
            }
        })

        // 处理exercise
        let exercise_list = []
        Object.values(exercise).forEach(async (item) => {
            exercise_list.push({
                user_id: user_id,
                fat_loss_plan_id: fat_loss_plan_id || null,
                exercise_type: item.exercise_type,
                exercise_time: item.exercise_time,
                duration: item.duration,
                distance: item.distance,
            })
        })

        // 将diet_list存入数据库
        let recommended_diet_ids = []
        if (diet_list.length !== 0) {
            sql = `INSERT INTO
                    recommended_diet (user_id, fat_loss_plan_id, food_id, calories_intake, eat_quantity, diet_type, create_time)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())`

            for (let i = 0; i < diet_list.length; i++) {
                let [results_diet] = await connection.query(sql, [
                    user_id,
                    fat_loss_plan_id || null,
                    diet_list[i].food_id,
                    diet_list[i].calories_intake,
                    diet_list[i].eat_quantity,
                    diet_list[i].diet_type,
                ])
                recommended_diet_ids.push(results_diet.insertId)
            }
        }

        // 将exercise_list存入数据库
        let exercise_plan_ids = []
        if (exercise_list.length !== 0) {
            sql = `INSERT INTO
                    exercise_plan (user_id,  exercise_type, exercise_time, duration, distance, create_time)
                    VALUES (?, ?, ?, ?, ?, NOW())`

            for (let i = 0; i < exercise_list.length; i++) {
                let [results_exercise] = await connection.query(sql, [
                    user_id,
                    exercise_list[i].exercise_type,
                    exercise_list[i].exercise_time,
                    parseFloat(exercise_list[i].duration),
                    parseFloat(exercise_list[i].distance),
                ])
                exercise_plan_ids.push(results_exercise.insertId)
            }
        }
        recommended_diet_ids = recommended_diet_ids.join(',')
        exercise_plan_ids = exercise_plan_ids.join(',')
        // 向ai_plan表插入数据
        sql = `INSERT INTO ai_plan 
                    (user_id, fat_loss_plan_id, plan_name, recommended_calories, recommended_diet_ids, exercise_plan_ids, create_time)
                VALUES (?, ?, ?, ?, ?, ?, NOW())`
        let [results_ai_plan] = await connection.query(sql, [
            user_id,
            fat_loss_plan_id || null,
            plan_name,
            recommend_fat_loss_plan_ai.calories_intake_per_day,
            recommended_diet_ids,
            exercise_plan_ids,
        ])
        if (results_ai_plan.affectedRows === 0) {
            send(res, 4002, '采纳AI减脂方案失败')
            return
        }

        send(res, 2000, '采纳AI减脂方案成功')
        logger.info(`用户 ${user_id} 采纳AI减脂方案成功`)
        // 删除redis中的数据
        await redis.del(AI_ANSWER_KEY_FAT_LOSS + user_id)
        // 提交事务
        await connection.commit()
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '采纳AI减脂方案失败')
        logger.error('采纳AI减脂方案失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取最新一条运动记录
 * 默认只查最近一条，支持分页查询
 */
const getLatestExercisePlan = async (req, res) => {
    const { user_id } = req.body
    page_number = req.body.page_number || 1
    page_size = req.body.page_size || 1
    let offset = (page_number - 1) * page_size
    let limit = parseInt(page_size)
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 查询运动记录
        let sql = `SELECT *, 
                        DATE_FORMAT(exercise_time, '%Y-%m-%d %H:%i:%s') AS exercise_time,
                        DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s') AS create_time
                    FROM exercise_plan WHERE user_id = ? ORDER BY create_time DESC LIMIT ?, ?`
        let [results_exercise_plan] = await connection.query(sql, [user_id, offset, limit])
        if (results_exercise_plan.length === 0) {
            send(res, 4003, '运动记录不存在')
            return
        }
        send(res, 2000, '获取运动记录成功', results_exercise_plan)
        logger.info(`用户 ${user_id} 获取运动记录成功`)
        // 提交事务
        await connection.commit()
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '获取运动记录失败')
        logger.error(`用户 ${user_id} 获取运动记录失败`)
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取减脂计划记录
 * 默认只查最近一条，支持分页查询
 */
const getFatLossPlan = async (req, res) => {
    const { user_id } = req.body
    page_number = req.body.page_number || 1
    page_size = req.body.page_size || 1
    let offset = (page_number - 1) * page_size
    let limit = parseInt(page_size)
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 查询减脂计划记录
        let sql = `SELECT *,
                        DATE_FORMAT(plan_start_time, '%Y-%m-%d %H:%i:%s') AS plan_start_time,
                        DATE_FORMAT(plan_end_time, '%Y-%m-%d %H:%i:%s') AS plan_end_time,
                        DATE_FORMAT(create_date, '%Y-%m-%d') AS create_date
                    FROM fat_loss_plan WHERE user_id = ? ORDER BY create_date DESC LIMIT ?, ?`
        let [results_ai_plan] = await connection.query(sql, [user_id, offset, limit])
        if (results_ai_plan.length === 0) {
            send(res, 4003, '减脂计划记录不存在')
            return
        }
        send(res, 2000, '获取减脂计划记录成功', results_ai_plan)
        logger.info(`用户 ${user_id} 获取减脂计划记录成功`)
        // 提交事务
        await connection.commit()
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '获取减脂计划记录失败')
        logger.error(`用户 ${user_id} 获取减脂计划记录失败`)
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 计算年龄
 */
function calculateAge(birthdate) {
    const today = new Date()
    const birthDate = new Date(birthdate)

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    // 如果需要计算月数和天数，可以进一步细化此函数
    // 下面是一个简单的示例，只计算月数
    let months
    if (monthDiff > 0) {
        months = monthDiff
    } else {
        months = 12 + monthDiff // 考虑到如果是负数，需要加一年的月份数
    }

    // 计算剩余天数，注意需要处理当月的天数差异
    let days
    if (today.getDate() >= birthDate.getDate()) {
        days = today.getDate() - birthDate.getDate()
    } else {
        const lastMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate() // 获取上个月最后一天的日期
        days = lastMonthDays - birthDate.getDate() + today.getDate() // 上个月剩余天数加上本月已过的天数
    }

    // return { years: age, months, days }
    return age
}

module.exports = {
    getAIFatLossPlan,
    adoptAIFatLossPlan,
    getLatestExercisePlan,
    getFatLossPlan,
}
