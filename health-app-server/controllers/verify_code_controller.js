// 导入发送验证码模块
const { sendSMSVerifyCode, sendEmailVerifyCode } = require('../utils/verify_code')

// TODO 算法优化，生成验证码
const verify_code = Math.floor(Math.random() * 1000000)

// 获取手机短信验证码
const getSmsVerificationCode = () => {
    // // 调用发送验证码模块发送短信验证码
    sendSMSVerifyCode()
}
// 获取邮箱验证码
const getEmailVerificationCode = (email) => {
    // 调用发送验证码模块发送邮箱验证码
    sendEmailVerifyCode(email, verify_code)
}

module.exports = {
    getSmsVerificationCode,
    getEmailVerificationCode,
}
