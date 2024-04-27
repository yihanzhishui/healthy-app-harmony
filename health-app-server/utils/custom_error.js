/**
 * 表单验证错误
 */
class ValidationError extends Error {
    constructor(message, code) {
        super(message)
        this.code = code
    }
}

module.exports = {
    ValidationError,
}
