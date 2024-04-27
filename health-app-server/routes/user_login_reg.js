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
    deleteUserSchema,
    joiValidator,
} = require('../middleware/form_validate')

// 导入用户控制器
const {
    register,
    loginBySMSCode,
    loginByEmailCode,
    loginByPassword,
    logout,
} = require('../controllers/user_controller')

/**
 * 用户注册
 */
router.post('/register', joiValidator(registerSchema), register)

/**
 * 使用短信验证码登录
 */
router.post('/login_by_sms_verification_code', joiValidator(loginBySMSCodeSchema), loginBySMSCode)

/**
 * 使用邮箱验证码登录
 */
router.post('/login_by_email_verification_code', joiValidator(loginByEmailCodeSchema), loginByEmailCode)

/**
 * 使用密码登录
 */
router.post('/login_by_password', joiValidator(loginByPasswordSchema), loginByPassword)

/**
 * 使用华为账号登录
 */
// TODO 使用华为账号登录
// router.post('/login_by_huawei_account', loginByPassword)

/**
 * 退出登录
 */
router.post('/logout', logout)

/**
 * 注销账号
 */
router.post('/delete_user', joiValidator(deleteUserSchema), logout)

// 导出路由实例
module.exports = router
