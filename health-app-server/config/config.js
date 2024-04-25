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

// 导出配置对象
module.exports = {
    log_config,
    db_config,
    sms_config,
}
