// 导入express
const express = require('express')

// 创建路由实例
const router = express.Router()

// 导入用户控制器
const userController = require('../controllers/user_controller')

// 注册用户

router.post('/register', userController.register)

// 登录
router.post('/login', userController.login)

// 导出路由实例
module.exports = router
