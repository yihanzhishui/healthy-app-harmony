// 导入日志记录模块
const { logger_db: logger } = require('./logger')

// 导入文件读写模块
const fs = require('fs')

// 导入并配置 mysql2 模块
const mysql = require('mysql2/promise')

// 导入数据库配置对象
const { db_config } = require('../config/config')

/**
 * 数据库连接池
 */
const db = mysql.createPool(db_config)

// 测试连接
db.getConnection((err, connection) => {
    if (err) {
        fs.appendFile('./error.log', `${new Date().toLocaleString()}数据库连接失败\n`, (err) => {
            if (err) {
                logger.error('写入失败')
            }
        })
        logger.info(`数据库 ${db_config.database} 连接失败`)
        return
    }
    logger.info(`数据库 ${db_config.database} 连接成功`)
    return
})

/**
 * 释放数据库连接
 * @param {db.connection} conn
 */
async function releaseConnection(conn) {
    try {
        await conn.release()
    } catch (releaseError) {
        // 可以在这里记录释放连接时发生的错误，尽管在正常情况下不应发生
        console.error('释放数据库连接时发生错误:', releaseError)
    }
}
// 导出连接池
module.exports = { db, releaseConnection }
