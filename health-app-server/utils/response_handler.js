const Joi = require('joi')
const { logger_user: logger } = require('./logger')
const { ValidationError } = require('./custom_error')
/**
 * 错误级别中间件
 * @param {Response} res 响应对象
 * @param {number} code 错误码
 * @param {string} message 错误信息
 */
const sendError = (err, req, res, next) => {
    // 记录日志
    // 如果错误属于表单验证错误，则返回4000
    logger.error(err.message)
    if (err instanceof ValidationError) {
        send(res, 4000, err.message)
        return
    }
    // TODO 对其他错误进行处理
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
}

module.exports = { sendError, send }
