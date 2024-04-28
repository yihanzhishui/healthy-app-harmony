const db = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')

/**
 * 处理添加食物到饮食表
 * 获取到的食物信息是json数组，数组元素是食物对象{food_id,eat_time,eat_quantity,calories_intake}
 * 如果食物表中没有该食物，则返回食物已失效
 */
const addToDietRecord = async (req, res) => {
    let { user_id, diet_type, food_list } = req.body
    const connection = await db.getConnection()
    food_list = JSON.parse(food_list)
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ?`
        let results = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 2000, '用户不存在')
            logger.info('用户不存在')
            connection.release()
            return
        }
        let sql = `INSERT INTO diet_record (user_id, diet_type, food_id, eat_time, eat_quantity, calories_intake, create_time) VALUES ( ?, ?, ?, ?, ?, ?, NOW())`
        let resParams = []
        for (let i = 0; i < food_list.length; i++) {
            const food = food_list[i]
            // 开始添加
            // 判断食物是否存在
            let sql_check = `SELECT * FROM food WHERE food_id = ?`
            let results = await connection.query(sql_check, [food.food_id])
            if (results[0].length === 0) {
                resParams.push({ food_id: food.food_id, message: '食物已失效' })
                logger.info(`食物 ${food.food_id} 已失效`)
                continue
            }
            // 添加食物到饮食表
            await connection.query(sql, [
                user_id,
                diet_type,
                food.food_id,
                food.eat_time,
                food.eat_quantity,
                food.calories_intake,
            ])
            resParams.push({ food_id: food.food_id, message: '添加食物到饮食表成功' })
            logger.info(`添加食物 ${food.food_id} 到饮食表成功`)
        }
        // 提交事务
        await connection.commit()
        send(res, 2000, '添加食物到饮食表成功', { res: resParams })
        logger.info('添加食物到饮食表成功')
        connection.release()
        return
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 5000, '添加食物到饮食表失败')
        logger.error('添加食物到饮食表失败')
        connection.release()
        return
    }
}

/**
 * 处理根据饮食类型获取饮食记录，传入参数有user_id，查询日期，饮食类型
 * 多表联合查询：diet_record, food，返回数据格式为
 "diet_food_record": [
            {
                "food_id": 12,
                "food_name": "米饭",
                "food_image": "../assets/image/food_image/rice.png"
                "eat_quantity": 2,
                "calories_intake": 500
            },
             {
                "food_id": 13,
                "food_name": "面包",
                "food_image": "../assets/image/food_image/bread.png"
                "eat_quantity": 2,
                "calories_intake": 500
            }
        ]
 */
// TODO: 需要优化
const getDietRecordByType = async (req, res) => {
    let { user_id, diet_type, eat_time } = req.body
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
            connection.release()
            return
        }
        // 获取饮食记录
        let sql = `SELECT * FROM diet_record WHERE user_id = ? AND diet_type = ? AND DATE(eat_time) = ?`
        results = await connection.query(sql, [user_id, diet_type, eat_time])
        if (results.length === 0) {
            send(res, 2000, '饮食记录为空')
            logger.info('饮食记录为空')
            connection.release()
            return
        }
        // 获取食物信息
        let food_list = []
        for (let i = 0; i < results.length; i++) {
            const record = results[i]
            let sql_food = `SELECT * FROM food WHERE food_id = ?`
            let results_food = await connection.query(sql_food, [record.food_id])
            if (results_food.length === 0) {
                send(res, 2000, '食物已失效')
                logger.info('食物已失效')
                connection.release()
                return
            }
            food_list.push({
                food_id: record.food_id,
                food_name: results_food[0].food_name,
                food_image: results_food[0].food_image,
                eat_quantity: record.eat_quantity,
            })
        }
        // 提交事务
        await connection.commit()
        send(res, 2000, '获取饮食记录成功', { diet_food_record: food_list })
        logger.info('获取饮食记录成功')
        connection.release()
        return
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 5000, '获取饮食记录失败')
        logger.error('获取饮食记录失败')
        connection.release()
        return
    }
}

module.exports = {
    addToDietRecord,
    getDietRecordByType,
}
