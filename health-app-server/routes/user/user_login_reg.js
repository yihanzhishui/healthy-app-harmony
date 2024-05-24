// 导入express
const express = require('express')
const router = express.Router()
const {
    loginBySMSCodeSchema,
    loginByEmailCodeSchema,
    loginByPasswordSchema,
    registerSchema,
    deleteUserSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    register,
    loginBySMSCode,
    loginByEmailCode,
    loginByPassword,
    logout,
    deleteUser,
} = require('../../controllers/user_controller')

const { decrypt } = require('../../middleware/decrypt')

/**
 * 用户注册
 */
router.post('/register', decrypt, joiValidator(registerSchema), register)

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
router.post('/login_by_password', joiValidator(loginByPasswordSchema), decrypt, loginByPassword)

/**
 * 使用华为账号登录
 */
// TODO 使用华为账号登录
// router.post('/login_by_huawei_account', loginByPassword)

/**
 * 退出登录
 */
router.get('/logout', logout)

/**
 * 注销账号
 */
router.delete('/delete_user', joiValidator(deleteUserSchema, true), deleteUser)

// 导出路由实例
module.exports = router
