// 导入数据库处理模块
const db = require('../utils/database')
// 导入获取验证码模块
const { getSmsVerificationCode, getEmailVerificationCode } = require('../controllers/verify_code_controller')
// 导入发送响应模块
const { send } = require('../utils/response_handler')

//
/**
 * 处理用户注册
 */
const register = (req, res) => {}

/**
 * 处理短信验证码登录
 */

const loginBySMSCode = (req, res) => {}

module.exports = {
    register,
    loginBySMSCode,
}
