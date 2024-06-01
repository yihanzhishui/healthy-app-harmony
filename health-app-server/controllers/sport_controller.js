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
    logger.info('用户请求获取AI减脂方案http: ' + JSON.stringify(req.query))
    const { user_id, focus_area, target_weight, reduction_speed, height, weight, gender, ...other } = req.query
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

        const { height: height_db, weight: weight_db, gender, formatted_birthday: birthday_db } = userInfoResults[0]
        const bmi = parseFloat(
            (
                (weight ?? weight_db ?? 65) /
                (((height ?? height_db ?? 170) / 100) * (height ?? height_db ?? 170))
            ).toFixed(2)
        )
        // 询问基础数据---用户身体信息
        let user_info_json = JSON.stringify({
            height: height ?? height_db ?? 170,
            weight: weight ?? weight_db ?? 65,
            bmi,
            gender: gender ?? 1,
            age: calculateAge(birthday_db) ?? 20,
            ...other,
        })
        let recommend_fat_loss_plan_ai_json
        try {
            recommend_fat_loss_plan_ai_json = await ai_ask(
                QUESTION.GET_AI_FAT_LOSS_PLAN,
                user_info_json,
                food_list_json
            )
            recommend_fat_loss_plan_ai_json = recommend_fat_loss_plan_ai_json.replace(/^\s*```json\s*\n|```$/gm, '')
        } catch (error) {
            recommend_fat_loss_plan_ai_json = JSON.stringify({
                plan_name: '健康减脂计划',
                plan_cycle: 90,
                plan_start_time: '2023-04-01',
                plan_end_time: '2023-06-29',
                calories_intake_per_day: 1800,
                diet: {
                    breakfast: [
                        {
                            food_id: 54,
                            food_name: '鸡蛋',
                            food_image: '/food_image/egg.png',
                            diet_type: 'breakfast',
                            eat_quantity: 2,
                            calories_intake: 156,
                        },
                        {
                            food_id: 57,
                            food_name: '菠菜',
                            food_image: '/food_image/spinach.png',
                            diet_type: 'breakfast',
                            eat_quantity: 100,
                            calories_intake: 23,
                        },
                    ],
                    lunch: [
                        {
                            food_id: 52,
                            food_name: '大米',
                            food_image: '/food_image/rice.png',
                            diet_type: 'lunch',
                            eat_quantity: 150,
                            calories_intake: 525,
                        },
                        {
                            food_id: 53,
                            food_name: '西红柿',
                            food_image: '/food_image/tomato.png',
                            diet_type: 'lunch',
                            eat_quantity: 200,
                            calories_intake: 36,
                        },
                        {
                            food_id: 56,
                            food_name: '玉米面',
                            food_image: '/food_image/corn.png',
                            diet_type: 'lunch',
                            eat_quantity: 50,
                            calories_intake: 182.5,
                        },
                    ],
                    dinner: [
                        {
                            food_id: 57,
                            food_name: '菠菜',
                            food_image: '/food_image/spinach.png',
                            diet_type: 'dinner',
                            eat_quantity: 100,
                            calories_intake: 23,
                        },
                        {
                            food_id: 55,
                            food_name: '杏仁',
                            food_image: '/food_image/almond.jpg',
                            diet_type: 'dinner',
                            eat_quantity: 10,
                            calories_intake: 57.9,
                        },
                    ],
                    extra_meal: [
                        {
                            food_id: 54,
                            food_name: '鸡蛋',
                            food_image: '/food_image/egg.png',
                            diet_type: 'extra_meal',
                            eat_quantity: 1,
                            calories_intake: 78,
                        },
                    ],
                },
                exercise: {
                    outdoor_running: {
                        exercise_type: 'outdoor_running',
                        exercise_time: '18:30',
                        duration: 30,
                        distance: 3000,
                    },
                },
                sleep: {
                    sleep_time: '23:00',
                    wake_time: '06:30',
                    duration: 450,
                },
            })
        }
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
        send(res, 2000, '获取AI减脂方案成功', { ...recommend_fat_loss_plan_ai })
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

// WebSocket处理函数
const getAIFatLossPlanWS = async (ws, req) => {
    logger.info('用户请求获取AI减脂方案: ' + req.query)
    const { user_id, focus_area, target_weight, reduction_speed, height, weight, gender, ...other } = req.query
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            ws.send(JSON.stringify({ status: 'fail', code: 4004, message: '用户不存在' }))
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

        const {
            height: height_db,
            weight: weight_db,
            gender: gender_db,
            formatted_birthday: birthday_db,
        } = userInfoResults[0]
        const bmi = parseFloat(
            ((weight ?? weight_db) / (((height ?? height_db) / 100) * ((height ?? height_db) / 100))).toFixed(2)
        )
        // 询问基础数据---用户身体信息
        let user_info_json = JSON.stringify({
            height: height ?? height_db ?? 170,
            weight: weight ?? weight_db ?? 65,
            bmi,
            gender: gender ?? gender_db ?? 1,
            age: calculateAge(birthday_db) ?? 20,
            ...other,
        })
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
        ws.send(
            JSON.stringify({
                status: 'success',
                code: 2000,
                message: '获取AI减脂方案成功',
                data: { ...recommend_fat_loss_plan_ai },
            })
        )
        await connection.commit()
        logger.info(`用户 ${user_id} 获取AI减脂方案成功`)
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        ws.send(
            JSON.stringify({
                status: 'fail',
                code: 4002,
                message: '获取AI减脂方案失败',
            })
        )
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
        // 做完这些操作后将redis中数据清除
        await redis.del(AI_ANSWER_KEY_FAT_LOSS + user_id)
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
 * 添加运动记录
 */
const addSportRecord = async (req, res) => {
    const { user_id, exercise_type, exercise_time, calories_burned, duration } = req.body
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 开始插入运动记录
        let sql = `INSERT INTO exercise_record (user_id, exercise_type, exercise_time, calories_burned, duration, create_time) VALUES (?, ?, ?, ?, ?, NOW())`
        let [insertResults] = await connection.query(sql, [
            user_id,
            exercise_type,
            exercise_time,
            calories_burned,
            duration,
        ])
        if (insertResults.affectedRows === 0) {
            connection.rollback()
            send(res, 4003, '添加运动记录失败')
            return
        }
        send(res, 2000, '添加运动记录成功')
    } catch (error) {
        connection.rollback()
        sendError(error, req, res, 5000, '添加运动记录失败')
    } finally {
        if (connection) {
            releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取运动记录表
 */
const getSportRecord = async (req, res) => {
    let { user_id, offset, limit } = req.query
    if (offset === undefined || limit === undefined) {
        ;(offset = 1), (limit = 10)
    }
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [userResults] = await connection.query(sql_check, [user_id])
        if (userResults.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 开始查询运动记录表
        let sql = `SELECT *,
                        DATE_FORMAT(exercise_time, '%Y-%m-%d') AS formatted_exercise_time,
                        DATE_FORMAT(create_time, '%Y-%m-%d') AS formatted_create_time
                    FROM 
                        exercise_record 
                    WHERE
                        user_id = ? 
                    ORDER BY
                        create_time DESC 
                    LIMIT ? OFFSET ?`
        let [results] = await connection.query(sql, [user_id, offset, limit])
        // 处理查询结果
        let response_data = []
        results.forEach((result) => {
            response_data.push({
                exercise_record_id: result.exercise_record_id,
                exercise_type: result.exercise_type,
                exercise_time: result.formatted_exercise_time,
                distance: result.exercise_time * 0.000621371192,
                calories_burned: result.calories_burned,
                duration: result.duration,
            })
        })

        send(res, 2000, '获取运动记录成功', response_data)
    } catch (error) {
        connection.rollback()
        sendError(error, req, res, 5000, '获取运动记录失败')
    } finally {
        if (connection) {
            releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取今日运动消耗热量
 */
const getTodaySportCalories = async (req, res) => {
    let { user_id } = req.query
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [userResults] = await connection.query(sql_check, [user_id])
        if (userResults.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 开始查询运动记录表
        let sql = `SELECT SUM(calories_burned) AS total_calories
                    FROM exercise_record
                    WHERE user_id = ?
                    AND DATE(exercise_time) = CURDATE()`

        let [results] = await connection.query(sql, [user_id])
        let total_calories = results[0].total_calories
        if (total_calories === null) {
            total_calories = 0
        }
        send(res, 2000, '获取今日运动消耗热量成功', total_calories)
    } catch (error) {
        connection.rollback()
        sendError(error, req, res, 5000, '获取今日运动消耗热量失败')
    } finally {
        if (connection) {
            releaseConnection(connection)
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
    getAIFatLossPlanWS,
    adoptAIFatLossPlan,
    getLatestExercisePlan,
    getFatLossPlan,
    addSportRecord,
    getSportRecord,
    getTodaySportCalories,
}
