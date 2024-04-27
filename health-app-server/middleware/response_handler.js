const Joi = require('joi')
const { logger_user, logger_redis } = require('../utils/logger')
const { ValidationError, RedisError } = require('../utils/custom_error')
/**
 * 错误级别中间件
 * @param {Response} res 响应对象
 * @param {number} code 错误码
 * @param {string} message 错误信息
 */
const sendError = (err, req, res, next) => {
    // 记录日志
    // 如果错误属于表单验证错误，则返回4000
    if (err instanceof ValidationError) {
        logger_user.error(err.message)
        send(res, 4000, err.message)
        return
    }
    // redis 错误
    if (err instanceof RedisError) {
        logger_redis.error(err.message)
        send(res, 5000, '服务器内部错误')
        return
    }
    // TODO 对其他错误进行处理
    send(res, 5000, '服务器内部错误')
    return
}

/**
 * 发送响应数据
 * @param {Response} res 响应对象
 * @param {string} status 状态
 * @param {number} code 响应码
 * @param {string} message 响应信息
 * @param {object | undefined} data 响应数据
 */
const send = (res, code, message, data = undefined) => {
    let status = 'success'

    if (code < 2000) status = 'pending'
    if (code >= 4000) status = 'fail'

    const response = {
        status: status,
        code: code,
        message: message,
        data: data,
    }

    res.send(response)
    return
}

module.exports = { sendError, send }
