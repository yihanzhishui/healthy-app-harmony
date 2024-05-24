// 导入express
const express = require('express')
const router = express.Router()

// 导入并配置 multer 模块
const multer = require('multer')

const { send } = require('../../middleware/response_handler')
const { logger_info: logger } = require('../../utils/logger')
const { db, releaseConnection } = require('../../utils/database')

// 配置文件上传的存储路径和文件名
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'assets/image/avatar/') // 存储在 uploads 目录下
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // 保留原始文件名
    },
})

// 创建 multer 实例，指定存储配置
const upload = multer({ storage: storage })
// 添加文件上传路由处理
router.post('/avatar', upload.single('file'), async (req, res) => {
    const { user_id } = req.body
    logger.info(req.header('authorization').toString())
    // 获取数据库连接
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()

        // 接收文件上传
        if (!req.file) {
            send(res, 4000, '上传失败: 没有文件')
            return
        }
        const filePath = req.file.path // 获取文件保存路径
        // 将filePath中的\\替换成/， 并去掉assets/image前缀
        const newFilePath = filePath.replace(/\\/g, '/').replace('assets/image', '')

        // 查询用户是否存在
        let sql = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        ;[results] = await connection.query(sql, [user_id])
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }

        // 更新用户头像
        logger.info('测试测试+++++++')
        sql = `UPDATE user SET avatar = ? WHERE user_id = ?`
        const insertResult = await connection.query(sql, [newFilePath, user_id])
        if (insertResult.affectedRows === 0) {
            await connection.rollback()
            send(res, 4004, '更新用户头像失败')
            return
        }
        send(res, 2000, '更新成功', { user_id, path: newFilePath })
    } catch (e) {
        logger.error('更新头像失败：' + e)
        await connection.rollback()
        send(res, 5000, '更新头像失败')
        return
    } finally {
        // 释放数据库连接
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
})

// 导出路由实例
module.exports = router
