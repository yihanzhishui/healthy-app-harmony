const db = require('../utils/database')
const { getSmsVerificationCode, getEmailVerificationCode } = require('../controllers/verify_code_controller')
const { sendError, send } = require('../utils/response_handler')
const { logger_db: logger } = require('../utils/logger')
const { Token } = require('../utils/token')
const { token_config } = require('../config/config')
// 导入加密模块
const bcryptjs = require('bcryptjs')

const db_error = (res, err) => {
    logger.error('数据库查询出现错误：' + err.message)
    sendError(res, 5001, '数据库查询出现错误')
}

/**
 * 处理用户注册
 */
const register = (req, res) => {
    const email = req.body.email || null
    const huawei_auth_token = req.body.huawei_auth_token || null
    const { phone, sms_code, password, confirm_password } = req.body
    // TODO 检查验证码是否正确
    // if (true) {
    //     // 验证码错误
    //     logger.info(`用户 ${phone} 尝试注册，但验证码错误`)
    //     send(res, 1001, '验证码错误')
    //     return
    // }
    // 检查用户是否已经注册
    let sql = `SELECT * FROM user WHERE phone = '${phone}'`
    db.query(sql, (err, result) => {
        if (err) {
            db_error(res, err)
            return
        }
        if (result.length > 0) {
            // 用户已经注册，登录
            // 直接登录
            loginBySMSCode(req, res)
            return
        }
    })

    // 用户不存在，注册，将用户信息插入 user 表
    // 获取加密盐
    const salt = bcryptjs.genSaltSync(8)
    // 加密密码
    const hash_password = bcryptjs.hashSync(password, salt)
    sql = `INSERT INTO user (phone, password, salt, email, avatar) VALUES ('${phone}', '${hash_password}','${salt}', '${email}', '')`
    db.query(sql, (err, result) => {
        if (err) {
            db_error(res, err)
            return
        }
        // 判断是否插入成功
        if (result.affectedRows === 0) {
            // 插入失败
            logger.info(`用户 ${phone} 尝试注册，但注册失败`)
            send(res, 4002, '注册失败')
            return
        }
        // 插入成功
        logger.info(`用户 ${phone} 注册成功`)
        // 注册成功，登录
        loginBySMSCode(req, res)
        return
    })
}

/**
 * 处理短信验证码登录
 */
const loginBySMSCode = (req, res) => {
    // 获取 手机号 和 验证码
    const { phone, sms_code } = req.body
    // TODO 检查验证码是否正确
    // if (true) {
    //     // 验证码错误
    //     logger.info(`用户 ${phone} 尝试登录，但验证码错误`)
    //     send(res, 1001, '验证码错误')
    //     return
    // }

    // 查询数据库中是否存在该手机号
    let sql = `SELECT * FROM user WHERE phone = '${phone}'`
    db.query(sql, (err, result) => {
        // 查询出现错误
        if (err) {
            db_error(res, err)
            return
        }
        if (result.length === 0) {
            // 用户不存在，通知客户端提示用户注册
            logger.info(`用户 ${phone} 尝试登录，但用户不存在`)
            send(res, 1000, '用户不存在')
            return
        }
        // 用户存在，检查验证码是否正确
        // 验证码正确，登录成功，将用户 user_id 和生成的token返回给客户端
        const token = Token.generateToken(
            { ...result[0], password: '', avatar: '' },
            token_config.secret,
            token_config.expiresIn
        )
        try {
            Token.storeToken(token, result[0].user_id, token_config.expiresIn)
            logger.info(`用户 ${phone} 登录成功，登录有效期：${token_config.expiresIn}`)
            send(res, 2000, '登录成功', { user_id: result[0].user_id, token })
            return
        } catch (error) {
            sendError(res, 5001, '登录失败')
        }
        // // 验证码错误，通知客户端提示用户重新获取验证码
        // db_info(res, `用户 ${phone} 尝试登录，但验证码错误`, 1001, '验证码错误')
        // return
    })
}

/**
 * 处理邮箱验证码登录
 */
const loginByEmailCode = (req, res) => {
    const { email, code } = req.body
    // TODO 检查验证码是否正确
    if (true) {
        // 验证码错误
        logger.info(`用户 ${email} 尝试登录，但验证码错误`)
        send(res, 1001, '验证码错误')
        return
    }
    let sql = `SELECT * FROM user WHERE email = '${email}'`
    db.query(sql, (err, result) => {
        if (err) {
            logger.error('数据库查询出现错误：' + err.message)
            sendError(res, 5001, '数据库查询出现错误')
            return
        }
        if (result.length === 0) {
            logger.info(`用户 ${phone} 尝试登录，但用户不存在`)
            send(res, 1000, '用户不存在')
            return
        }
        // 验证码正确，登录成功，将用户 user_id 和生成的token返回给客户端
        // 验证码正确，登录成功，将用户 user_id 和生成的token返回给客户端
        const token = Token.generateToken(
            { ...result[0], password: '', avatar: '' },
            token_config.secret,
            token_config.expiresIn
        )
        Token.storeToken(token, result[0].user_id, token_config.expiresIn)
        logger.info(`用户 ${phone} 登录成功，登录有效期：${token_config.expiresIn}`)
        send(res, 2000, '登录成功', { user_id: result[0].user_id, token })
        return
        // logger.info(`用户 ${phone} 尝试登录，但验证码错误`)
        // send(res, 1001, '验证码错误')
        // return
    })
}

/**
 * 处理密码登录
 */
const loginByPassword = (req, res) => {
    const account = req.body.phone ? req.body.phone : req.body.email
    const password = req.body.password
    let sql = `SELECT * FROM user WHERE phone = '${account}' OR email = '${account}'`
}

module.exports = {
    register,
    loginBySMSCode,
}
