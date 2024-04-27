// 导入发送验证码模块
const { send } = require('../middleware/response_handler')
const { sendSMSVerifyCode, sendEmailVerifyCode } = require('../utils/verify_code')

// 生成验证码
const verify_code = Math.floor(100000 + Math.random() * 900000)

// 获取手机短信验证码
const getSmsVerificationCode = (req, res) => {
    const phone = req.query.phone
    // 调用发送验证码模块发送短信验证码
    sendSMSVerifyCode(phone, verify_code)
    send(res, 2000, '发送成功')
}
// 获取邮箱验证码
const getEmailVerificationCode = (req, res) => {
    const email = req.query.email
    // 调用发送验证码模块发送邮箱验证码
    sendEmailVerifyCode(email, verify_code)
    send(res, 2000, '发送成功')
}

module.exports = {
    getSmsVerificationCode,
    getEmailVerificationCode,
}
