const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const { redis_config } = require('../config/config')
const { logger_redis: logger } = require('./logger')

// 引入正确的 Redis 客户端库
const { createClient } = require('@redis/client')

class TokenManager {
    constructor() {
        // 使用 createClient 方法创建 Redis 客户端
        this.client = createClient({
            url: `redis://${redis_config.host}:${redis_config.port}`,
            password: redis_config.password,
        })

        this.client.on('error', (error) => {
            console.log('#####')
            logger.error('Redis 连接错误:', error.message)
            // 处理连接错误
            this.catchError(error)
        })
    }

    catchError(error) {
        logger.error('发生错误:', error.message)
        throw error
    }

    /**
     * 生成 JWT Token
     * @param {Object} payload - Token 载荷数据
     * @param {String} secret - 密钥
     * @param {Number} expiresIn - 过期时间（单位：秒）
     * @returns {String} JWT Token
     */
    async generateToken(payload, secret, expiresIn) {
        try {
            return 'Bearer ' + jwt.sign(payload, secret, { expiresIn })
        } catch (error) {
            this.catchError(error)
        }
    }

    /**
     * 存储 Token 及关联信息
     * @param {String} token - JWT Token
     * @param {String} userId - 用户ID
     * @param {Number} tokenTTL - Token 过期时间（单位：秒）
     * @returns {Promise<void>}
     */
    async storeToken(token, userId, tokenTTL) {
        try {
            await this.client.set(token, userId, 'EX', tokenTTL)
        } catch (error) {
            this.catchError(error)
        }
    }

    /**
     * 验证 Token
     * @param {String} token - JWT Token
     * @returns {Promise<Boolean>} - 是否验证成功
     */
    async verifyToken(token) {
        try {
            const __token = await this.client.get(token)
            return __token !== null
        } catch (error) {
            this.catchError(error)
        }
    }

    /**
     * 删除 Token
     * @param {String} token - JWT Token
     * @returns {Promise<void>}
     */
    async removeToken(token) {
        try {
            await this.client.del(token)
        } catch (error) {
            this.catchError(error)
        }
    }
}

const Token = new TokenManager()

module.exports = {
    Token,
}
