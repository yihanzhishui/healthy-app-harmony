// 导入express
const express = require('express')

// 创建路由实例
const router = express.Router()

// 导入验证码处理模块
const { getSmsVerificationCode, getEmailVerificationCode } = require('../controllers/verify_code_controller')

// 获取手机验证码
router.get('/get_sms_verification_code', getSmsVerificationCode)

// 获取邮箱验证码
router.get('/get_email_verification_code', getEmailVerificationCode)

// 导出路由实例
module.exports = router
