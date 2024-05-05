// 导入发送验证码模块
const { send } = require('../middleware/response_handler')
const { sendSMSVerifyCode, sendEmailVerifyCode } = require('../utils/verify_code')

// 生成验证码
const verify_code = Math.floor(100000 + Math.random() * 900000)

// 获取手机短信验证码
const getSmsVerificationCode = (req, res) => {
    const phone = req.query.phone
    // 验证phone是否合法，只能使用国内的手机号码
    // 用于验证手机号的正则表达式
    const reg = /^1[3-9]\d{9}$/
    if (!reg.test(phone)) {
        send(res, 4002, '手机号不合法')
        return
    }

    // 调用发送验证码模块发送短信验证码
    sendSMSVerifyCode(phone, verify_code)
    send(res, 2000, '发送成功')
}
// 获取邮箱验证码
const getEmailVerificationCode = (req, res) => {
    const email = req.query.email
    // 验证email是否合法
    const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
    if (!reg.test(email)) {
        send(res, 4002, '邮箱不合法')
        return
    }
    // 调用发送验证码模块发送邮箱验证码
    sendEmailVerifyCode(email, verify_code)
    send(res, 2000, '发送成功')
}

module.exports = {
    getSmsVerificationCode,
    getEmailVerificationCode,
}
