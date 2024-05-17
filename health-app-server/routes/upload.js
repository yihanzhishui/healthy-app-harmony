// 导入express
const express = require('express')
const router = express.Router()

// 导入并配置 multer 模块
const multer = require('multer')

const { send } = require('../middleware/response_handler')
const { logger_info: logger } = require('../utils/logger')

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
router.post('/avatar', upload.single('file'), (req, res) => {
    const { user_id } = req.body
    try {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.')
        }
        const filePath = req.file.path // 获取文件保存路径
        // 将filePath中的\\替换成/， 并去掉assets/image前缀
        const newFilePath = filePath.replace(/\\/g, '/').replace('assets/image', '')
        logger.info(user_id)
        logger.info(newFilePath)

        send(res, 2000, '上传成功', { user_id, path: newFilePath })
    } catch (e) {}
})

// 导出路由实例
module.exports = router
