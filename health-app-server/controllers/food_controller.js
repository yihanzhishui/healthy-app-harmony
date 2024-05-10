const { db, releaseConnection } = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')

/**
 * 处理获取食物列表，需要实现分页查询功能
 */
const getFoodList = async (req, res) => {
    const connection = await db.getConnection()
    try {
        const { page_number, page_size } = req.query
        const offset = (page_number - 1) * page_size
        const limit = parseInt(page_size)

        let sql = `SELECT * FROM food LIMIT ${offset}, ${limit}`
        let [results] = await connection.query(sql)

        // 确保结果是数组类型，即使结果为空
        const foodList = Array.isArray(results) ? results : [results]

        send(res, 2000, '获取食物列表成功', { food_list: foodList })
        logger.info('获取食物列表成功')
    } catch (error) {
        sendError(res, 4002, '获取食物列表失败')
        logger.error('获取食物列表失败', error)
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 处理根据标签获取食物列表，需要实现分页查询功能
 * 含有标签的食物列表
 */
const getFoodListByTag = async (req, res) => {
    logger.error('getFoodListByTag')
    const { page_number, page_size, tag } = req.query
    const offset = (page_number - 1) * page_size
    const limit = parseInt(page_size)
    const connection = await db.getConnection()
    try {
        let sql = `SELECT * FROM food WHERE food_tags like ? LIMIT ?, ?`
        let [results] = await connection.query(sql, [`%${tag}%`, offset, limit])

        if (results.length === 0) {
            send(res, 2000, '食物列表为空', { food_list: [] })
            return
        }
        send(res, 2000, '获取食物列表成功', { food_list: results })
        logger.info('获取食物列表成功')
    } catch (error) {
        sendError(error, req, res, 5000, '获取食物列表失败')
        logger.error('获取食物列表失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

module.exports = {
    getFoodList,
    getFoodListByTag,
}
