const expressJwt = require('express-jwt')
const { token_config } = require('../config/config')

function validateToken() {
    return expressJwt({
        secret: token_config.secret,
        algorithms: ['HS256'], // 默认使用 HS256 算法
        credentialsRequired: options.credentialsRequired !== false, // 默认要求必须提供 token
        getToken: (req) => req.headers.authorization || req.headers.token, // 从请求头的 Authorization 或 token 字段提取 token
    })
}

module.exports = validateToken
