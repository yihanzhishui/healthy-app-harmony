// 导入文件读写模块
const fs = require('fs')

// 导入并配置 mysql2 模块
const mysql = require('mysql2')

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
                console.log('写入失败')
            }
        })
        return
    }
    console.log('数据库连接成功')
    return
})
// 导出连接池
module.exports = db