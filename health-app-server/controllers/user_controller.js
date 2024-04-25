// 导入数据库处理模块
const db = require('../utils/database')
// 导入获取验证模块
const { getSmsVerificationCode, getEmailVerificationCode } = require('../controllers/verify_code_controller')

//
/**
 * 处理用户注册
 */
const register = (req, res) => {
    // 检测账号是否已存在
    const { username, password } = req.body
    const sql = `SELECT * FROM user WHERE username='${username}'`
}

/**
 * 处理用户登录
 */
const login = (req, res) => {
    console.log(req.body)
    res.send({
        message: '登录成功',
        code: 2000,
    })
}

module.exports = {
    register,
    login,
}
