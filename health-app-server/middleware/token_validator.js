const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const redis = require('../utils/redis_manager')
const { token_config } = require('../config/config')
const { logger_redis: logger } = require('../utils/logger')
const { RedisError } = require('../utils/custom_error')
const TokenManager = require('../utils/token_manager')
const { send, sendError } = require('../middleware/response_handler')

const tokenManager = new TokenManager()

async function verifyToken(req, res, next) {
    // if(req.header('Authorization'))
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        if (!token) {
            send(res, 4003, '无效的 token')
            return
        }

        const decoded = await tokenManager.verifyToken(token)
        if (!decoded) {
            send(res, 4003, '无效的 token')
            return
        }

        req.user_id = decoded.user_id
        next()
    } catch (error) {
        logger.error(error)
        send(res, 4003, '无效的 token')
    }
}

module.exports = verifyToken
