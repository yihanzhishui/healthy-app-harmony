// 导入环境变量
require('dotenv').config()

/**
 * log4js 配置对象
 */
const log_config = {
    appenders: {
        // 日志输出类型、输出文件
        file: { type: 'file', filename: './logs/log.log' },
    },
    categories: {
        // 输出到控制台, 级别大于 info 追加到文件
        default: { appenders: ['file'], level: 'info' },
        database: { appenders: ['file'], level: 'info' },
        redis: { appenders: ['file'], level: 'warn' },
        code_api: { appenders: ['file'], level: 'info' },
        user: { appenders: ['file'], level: 'info' },
        music: { appenders: ['file'], level: 'info' },
        diet: { appenders: ['file'], level: 'info' },
        sport: { appenders: ['file'], level: 'info' },
    },
}

/**
 * mysql 数据库配置对象
 */
const db_config = {
    // 数据库地址
    host: 'localhost',
    // 数据库用户名
    user: 'root',
    // 密码
    password: '1234',
    // 数据库名
    database: 'healthy_DB',
}

/**
 * 腾讯短信服务配置对象
 */
const sms_config = {
    /* 建议前5个设置到本机Node环境变量
        //  SecretId
        secretId: '',
        // SecretKey
        secretKey: '',
        // SDKAppId
        sdkAppId: '',
        // 模版ID
        TemplateID: '',
    */
    // 短信签名
    SignName: '健康方舟',
    // 地域，如 "ap-chengdu"
    region: 'ap-chengdu',
    // 请求方式
    method: 'POST',
    // 指定接入地域域名，默认就近地域接入域名为 sms.tencentcloudapi.com
    endpoint: 'sms.tencentcloudapi.com',
    // 超时时间 单位 s，实际可不设置
    timeout: 30,
}

/**
 * 发件人邮箱服务配置对象
 */
const email_config = {
    // 邮箱服务器地址
    // host: 'smtp.qq.com',
    service: 'qq',
    // 邮箱服务器端口
    port: 465,
    // 是否开启安全连接
    secure: false,
    // 是否启用SSL
    // secureConnetion: false,
    // 邮箱用户名
    auth: {
        user: '321840565@qq.com',
        // 邮箱密码
        pass: process.env.qqemailkey,
    },
}

/**
 * token 相关配置
 */
const token_config = {
    // token密钥
    secret: 'healthy_token',
    // token有效时长
    expiresIn: '48h',
    TTL: 48 * 60 * 60 * 1000,
}

/**
 * redis 配置对象
 */
const redis_config = {
    url: 'redis://localhost:6379', // Redis 服务器地址
    password: '', // 如果设置了 Redis 密码，请提供
}

// 导出配置对象
module.exports = {
    log_config,
    db_config,
    sms_config,
    email_config,
    token_config,
    redis_config,
}
