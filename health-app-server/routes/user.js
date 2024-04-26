// 导入express
const express = require('express')

// 创建路由实例
const router = express.Router()

// 导入表单验证规则
const {
    loginBySMSCodeSchema,
    loginByEmailCodeSchema,
    loginByPasswordSchema,
    registerSchema,
    joiValidator,
} = require('../utils/form_validate')

// 导入用户控制器
const userController = require('../controllers/user_controller')

// 注册用户

router.post('/register', userController.register)

// 登录
router.post('/login', joiValidator(loginBySMSCodeSchema), userController.loginBySMSCode)

// 导出路由实例
module.exports = router
