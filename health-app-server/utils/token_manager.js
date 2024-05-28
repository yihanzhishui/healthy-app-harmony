const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const redis = require('./redis_manager')
const { token_config } = require('../config/config')
const { RedisError } = require('./custom_error')

class TokenManager {
    constructor() {
        this.secret = token_config.secret
    }

    /**
     * 生成 JWT Token
     * @param {Object} payload - Token 载荷数据
     * @param {Number} expiresIn - 过期时间（单位：秒）
     * @returns {Promise<String>} - JWT Token
     */
    async generateToken(payload, expiresIn = token_config.expiresIn) {
        const token = jwt.sign(payload, this.secret, { expiresIn })
        return token
    }

    /**
     * 存储 Token 及关联信息
     * @param {String} token - JWT Token
     * @param {String} userId - 用户ID
     * @param {Number} tokenTTL - Token 过期时间（单位：秒）
     * @returns {Promise<void>}
     */
    async storeToken(token, userId, tokenTTL = token_config.TTL) {
        const key = 'token:' + userId
        try {
            await redis.set(key, token, tokenTTL)
        } catch (error) {
            throw new RedisError('Redis 存储 Token 失败', 5001)
        }
    }

    /**
     * 验证 Token
     * @param {String} token - JWT Token
     * @returns {Promise<Object|Boolean>} - 如果验证成功，返回解密后的载荷；否则返回 false
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret)
            return decoded
        } catch (error) {
            return false
        }
    }

    /**
     * 删除 Token
     * @param {String} token - JWT Token
     * @returns {Promise<void>}
     */
    async removeToken(key) {
        key = 'token:' + key
        await redis.del(key)
    }

    /**
     * 刷新 Token 有效期
     * params {key} key - Token 键名
     * params {number} tokenTTL - Token 过期时间（单位：秒）
     * returns
     */
    async refreshTokenTTL(key, tokenTTL = 60000) {
        key = 'token:' + key
        await redis.refreshTTL(key, tokenTTL)
    }
}

module.exports = TokenManager
