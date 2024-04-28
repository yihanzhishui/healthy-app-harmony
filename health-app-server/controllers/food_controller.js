const db = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')

/**
 * 处理获取食物列表，需要实现分页查询功能
 */
const getFoodList = async (req, res) => {
    const { page_number, page_size } = req.body
    const offset = (page_number - 1) * page_size
    const limit = page_size
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        let sql = `SELECT * FROM food LIMIT ${offset}, ${limit}`
        let results = await connection.query(sql)
        // 提交事务
        await connection.commit()
        send(res, 2000, '获取食物列表成功', { food_list: results[0] })
        logger.info('获取食物列表成功')
        connection.release()
        return
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(res, 5000, '获取食物列表失败')
        logger.error('获取食物列表失败')
        connection.release()
        return
    }
}

/**
 * 处理根据标签获取食物列表，需要实现分页查询功能
 * 含有标签的食物列表
 */
const getFoodListByTag = async (req, res) => {
    const { page_number, page_size, tag } = req.body
    const offset = (page_number - 1) * page_size
    const limit = page_size
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        let sql = `SELECT * FROM food WHERE food_tags like '%${tag}%' LIMIT ${offset}, ${limit}`
        let results = await connection.query(sql)
        // 提交事务
        await connection.commit()
        send(res, 2000, '获取食物列表成功', { food_list: results[0] })
        logger.info('获取食物列表成功')
        connection.release()
        return
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 5000, '获取食物列表失败')
        logger.error('获取食物列表失败')
        connection.release()
        return
    }
}

module.exports = {
    getFoodList,
    getFoodListByTag,
}
