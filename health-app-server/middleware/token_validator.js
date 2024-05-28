const { logger_redis: logger } = require('../utils/logger')
const TokenManager = require('../utils/token_manager')
const { send } = require('../middleware/response_handler')

const tokenManager = new TokenManager()

async function verifyToken(req, res, next) {
    let user_id = req.body.user_id ?? req.query.user_id ?? -1

    try {
        const token = req.header('authorization').toString().replace('Bearer ', '')
        // logger.info('开始验证token：' + token)
        if (!token) {
            send(res, 4005, '无效的 token')
            return
        }

        const decoded = await tokenManager.verifyToken(token)
        if (!decoded) {
            send(res, 4005, '无效的 token')
            return
        }
        logger.info(`token验证成功，用户id为${decoded}`)
        // 刷新token有效时间
        logger.info('刷新token有效时间' + user_id)
        await tokenManager.refreshTokenTTL(user_id, 60000)
        req.user_id = decoded.user_id
        next()
    } catch (error) {
        logger.error(error)
        send(res, 4005, '无效的 token')
    }
}

module.exports = verifyToken
