/**
 * 表单验证错误
 */
class ValidationError extends Error {
    constructor(message, code) {
        super(message)
        this.code = code
    }
}

/**
 * redis 数据库操作错误
 */
class RedisError extends Error {
    constructor(message, code) {
        super(message)
        this.code = code
    }
}

module.exports = {
    ValidationError,
    RedisError,
}
