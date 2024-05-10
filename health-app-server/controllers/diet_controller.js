const { db, releaseConnection } = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const ai_ask = require('../utils/ai_ask')
const { QUESTION, AI_ANSWER_KEY_DIET } = require('../constant/constant')
const redis = require('../utils/redis_manager')

/**
 * 处理添加食物到饮食表
 * 获取到的食物信息是json数组，数组元素是食物对象{food_id,eat_time,eat_quantity,calories_intake}
 * 如果食物表中没有该食物，则返回食物已失效
 */
const addToDietRecord = async (req, res) => {
    let { user_id, diet_type, food_list } = req.body
    const connection = await db.getConnection()
    food_list = JSON.parse(food_list)
    logger.info(food_list)
    try {
        // 开启事务
        await connection.beginTransaction()

        // 检查用户是否存在
        let sql_check_user = `SELECT * FROM user WHERE user_id = ?`
        let [userExists] = await connection.query(sql_check_user, [user_id])
        if (userExists.length === 0) {
            send(res, 2000, '用户不存在')
            logger.info('用户不存在')
            await connection.rollback() // 在发现错误时及时回滚
            connection.release()
            return
        }

        // 预先检查食物ID的有效性，避免循环中多次查询
        const foodIds = food_list.map((food) => food.food_id)
        let sql_check_food = `SELECT food_id FROM food WHERE food_id IN (?)`
        let [foodExists] = await connection.query(sql_check_food, [foodIds])
        const validFoodIds = new Set(foodExists.map((food) => food.food_id))

        let successRecords = []
        let failureRecords = []

        for (const food of food_list) {
            if (!validFoodIds.has(food.food_id)) {
                failureRecords.push({ food_id: food.food_id, message: '食物已失效' })
                logger.info(`食物 ${food.food_id} 已失效`)
                continue
            }

            let sql_insert = `INSERT INTO diet_record (user_id, diet_type, food_id, eat_time, eat_quantity, calories_intake, create_time) VALUES (?, ?, ?, ?, ?, ?, NOW())`
            await connection.query(sql_insert, [
                user_id,
                diet_type,
                food.food_id,
                getTodayDate(),
                food.eat_quantity,
                food.calories_intake,
            ])
            successRecords.push({ food_id: food.food_id, message: '添加食物到饮食表成功' })
            logger.info(`添加食物 ${food.food_id} 到饮食表成功`)
        }

        // 提交事务
        await connection.commit()

        // 组合成功与失败的响应信息
        const combinedResponse = [...successRecords, ...failureRecords]
        send(res, 2000, '处理食物到饮食表请求完成', { res: combinedResponse })
        logger.info('处理食物到饮食表请求完成')
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 5000, '处理食物到饮食表失败')
        logger.error('处理食物到饮食表失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理根据饮食类型获取饮食记录，传入参数有user_id，查询日期时间，饮食类型
 * 多表联合查询：diet_record, food
 */
const getDietRecordByType = async (req, res) => {
    let { user_id, diet_type, eat_time } = req.query
    if (!eat_time) eat_time = getTodayDate()
    logger.info('+++++' + eat_time)
    logger.info('+++++' + user_id)
    logger.info('+++++' + diet_type)
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ?`
        let results = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 2000, '用户不存在')
            logger.info('用户不存在')
            return
        }
        // 获取饮食记录
        let sql = `
            SELECT 
                dr.diet_record_id, 
                dr.diet_type, 
                dr.food_id, 
                f.food_name, 
                f.food_image, 
                dr.eat_quantity, 
                dr.calories_intake
            FROM 
                diet_record dr
            INNER JOIN 
                food f ON dr.food_id = f.food_id
            WHERE 
                dr.user_id = ? AND 
                dr.diet_type = ? AND 
                DATE(dr.eat_time) = ?`

        ;[results] = await connection.query(sql, [user_id, diet_type, eat_time])

        if (results.length === 0) {
            send(res, 2000, '饮食记录为空')
            logger.info('饮食记录为空')
            return
        }

        // 构建响应数据
        const foodList = results.map((record) => ({
            diet_record_id: record.diet_record_id,
            diet_type: record.diet_type,
            food_id: record.food_id,
            food_name: record.food_name,
            food_image: record.food_image,
            eat_quantity: record.eat_quantity,
            calories_intake: record.calories_intake,
        }))

        // 计算总热量
        let totalCalories = 0
        for (let i = 0; i < foodList.length; i++) {
            totalCalories += foodList[i].calories_intake
        }

        // 提交事务（如果是在事务中的话）
        await connection.commit()
        send(res, 2000, '获取饮食记录成功', { diet_food_record: foodList, total_calories: totalCalories })
        logger.info('获取饮食记录成功')
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 5000, '获取饮食记录失败')
        logger.error('获取饮食记录失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 处理根据创建时间获取饮食记录，传入参数有user_id，创建日期时间
 * 多表联合查询：diet_record, food
 */
const getDietRecordByCreateTime = async (req, res) => {
    let { user_id, create_time } = req.body
    if (!create_time) create_time = getTodayDate()
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ?`
        let results = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 2000, '用户不存在')
            return
        }
        // 获取饮食记录
        let sql = `
            SELECT
                dr.diet_record_id,
                    dr.diet_type,
                    dr.food_id,
                    f.food_name,
                    f.food_image,
                    dr.eat_quantity,
                    dr.calories_intake
            FROM
                diet_record dr
                    INNER JOIN
                    food f ON dr.food_id = f.food_id
            WHERE
                dr.user_id = ? AND DATE(dr.create_time) = ?`

        ;[results] = await connection.query(sql, [user_id, create_time])

        if (results.length === 0) {
            send(res, 2000, '饮食记录为空')
            logger.info('饮食记录为空')
            return
        }
        // 构建响应数据
        const foodList = results.map((record) => ({
            diet_record_id: record.diet_record_id,
            diet_type: record.diet_type,
            food_id: record.food_id,
            food_name: record.food_name,
            food_image: record.food_image,
            eat_quantity: record.eat_quantity,
            calories_intake: record.calories_intake,
        }))

        // 提交事务（如果是在事务中的话）
        await connection.commit()
        send(res, 2000, '获取饮食记录成功', { diet_food_record: foodList })
        logger.info('获取饮食记录成功')
        return
    } catch {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 5000, '获取饮食记录失败')
        logger.error('获取饮食记录失败')
        return
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理获取饮食推荐
 */
const getRecommendDiet = async (req, res) => {
    const { user_id } = req.body
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
        let sql_food = `SELECT food_id, food_name, food_image, calories FROM food`
        let [foodList] = await connection.query(sql_food)
        // 生成问题基础数据
        let question_base_data = JSON.stringify(foodList)
        // 获取饮食推荐
        let recommend_diet_ai = await ai_ask(QUESTION.GET_RECOMMEND_DIET, question_base_data)
        let recommend_diet_ai_json = recommend_diet_ai.replace(/^\s*```json\s*\n|```$/gm, '')
        // 将这条记录暂存至redis
        await redis.set(AI_ANSWER_KEY_DIET + user_id, recommend_diet_ai_json)
        // 数据处理
        let recommend_diet_list = JSON.parse(recommend_diet_ai_json)
        send(res, 2000, '获取饮食推荐成功', { ...recommend_diet_list })
        logger.info('获取饮食推荐成功')
        await connection.commit()
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '获取饮食推荐失败')
        logger.error('获取饮食推荐失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 处理将饮食推荐记录添加到饮食推荐记录表
 */
const addToRecommendedDietRecord = async (req, res) => {
    const { user_id } = req.body
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
        // 尝试从Redis中获取饮食推荐记录
        let recommend_diet_ai_json = await redis.get(AI_ANSWER_KEY_DIET + user_id)
        if (!recommend_diet_ai_json) {
            send(res, 2000, '饮食推荐记录不存在')
            return
        }
        let recommend_diet_list = JSON.parse(recommend_diet_ai_json)
        let insertArr = []
        Object.values(recommend_diet_list).forEach((item) => {
            insertArr = insertArr.concat(item)
        })
        // 将insertArr数组中的每一项都添加到饮食推荐记录表中
        let sql = `
                INSERT INTO 
                    recommended_diet 
                    (user_id, food_id, eat_quantity, calories_intake, diet_type, create_time) 
                VALUES 
                    (?, ?, ?, ?, ?, NOW())`
        let resultArr = []
        for (let i = 0; i < insertArr.length; i++) {
            // 查询食物表中是否有这个食物
            let sql_check_food = `SELECT * FROM food WHERE food_id = ?`
            let [results_food] = await connection.query(sql_check_food, [insertArr[i].food_id])
            if (results_food.length === 0) {
                resultArr.push({
                    food_id: insertArr[i].food_id,
                    food_name: insertArr[i].food_name,
                    message: '食物不存在',
                })
                continue
            }
            let cleanDietType = insertArr[i].diet_type.replace(/^'|'$/g, '')
            // 将推荐食物插入饮食推荐记录表
            let result = await connection.query(sql, [
                parseInt(user_id),
                parseInt(insertArr[i].food_id),
                parseInt(insertArr[i].eat_quantity),
                parseInt(insertArr[i].calories_intake),
                cleanDietType,
            ])
            if (result[0].affectedRows === 0) {
                resultArr.push({
                    food_id: insertArr[i].food_id,
                    food_name: insertArr[i].food_name,
                    message: '添加饮食推荐记录失败',
                })
                continue
            }
            resultArr.push({
                food_id: insertArr[i].food_id,
                food_name: insertArr[i].food_name,
                message: '添加饮食推荐记录成功',
            })
        }
        send(res, 2000, '添加成功', { result: resultArr })
        logger.info('添加饮食推荐记录成功')
        await connection.commit()
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '添加饮食推荐记录失败')
        logger.error('添加饮食推荐记录失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取今日热量摄入
 */
const getTodayCalories = async (req, res) => {
    const { user_id } = req.query
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        // 查询今日饮食推荐记录
        let sql = `SELECT SUM(calories_intake) AS total_calories FROM diet_record WHERE user_id = ? AND create_time LIKE ?`
        let [results] = await connection.query(sql, [user_id, getTodayDate() + '%'])
        if (results.length === 0) {
            send(res, 2000, '查询成功', { total_calories: 0 })
            return
        } else {
            send(res, 2000, '查询成功', { total_calories: results[0].total_calories })
            return
        }
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '查询今日热量摄入失败')
        logger.error('查询今日热量摄入失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取今天的日期
 */
function getTodayDate() {
    const date = new Date()
    var year = date.getFullYear()
    // 月份是从0开始的，所以需要+1，并且补零
    var month = ('0' + (date.getMonth() + 1)).slice(-2)
    var day = ('0' + date.getDate()).slice(-2) // 补零
    return year + '-' + month + '-' + day
}

module.exports = {
    addToDietRecord,
    getDietRecordByType,
    getDietRecordByCreateTime,
    getRecommendDiet,
    addToRecommendedDietRecord,
    getTodayCalories,
}
