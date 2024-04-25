// 引入环境变量
require('dotenv').config()

// 导入日志模块
const { logger_code_api: logger } = require('../utils/logger')

// 导入邮箱验证码、短信验证码配置对象
const { sms_config, email_config } = require('../config/config')

// 导入腾讯云短信SDK
const tencentcloud = require('tencentcloud-sdk-nodejs')

// 导入 nodemailer
const nodemailer = require('nodemailer')

/**
 * 发送短信验证码
 * @param {string | number} phone
 * @param {string | number} verify_code
 */
const sendSMSVerifyCode = async (phone, verify_code) => {
    // 导入对应产品模块的client models
    const smsClient = tencentcloud.sms.v20210111.Client

    /* 实例化要请求产品(以sms为例)的client对象 */
    const client = new smsClient({
        credential: {
            /* TODO 必填：腾讯云账户密钥对secretId，secretKey。
             * 这里采用的是从环境变量读取的方式，需要在环境变量中先设置这两个值。
             * SecretId、SecretKey 查询: https://console.cloud.tencent.com/cam/capi */
            secretId: process.env.secretId,
            secretKey: process.env.secretKey,
        },
        /* 必填：地域信息，可以直接填写字符串ap-guangzhou*/
        region: sms_config.region,
        /* 非必填:
         * 客户端配置对象，可以指定超时时间等配置 */
        profile: {
            /* SDK默认用TC3-HMAC-SHA256进行签名，非必要请不要修改这个字段 */
            signMethod: 'HmacSHA256',
            httpProfile: {
                /* SDK默认使用POST方法 */
                reqMethod: sms_config.method,
                /* SDK有默认的超时时间，非必要请不要进行调整 */
                // reqTimeout: sms_config.timeout,
                endpoint: sms_config.endpoint,
            },
        },
    })

    /* 请求参数，根据调用的接口和实际情况，可以进一步设置请求参数
     * 属性可能是基本类型，也可能引用了另一个数据结构 */
    const params = {
        SmsSdkAppId: process.env.AppId,
        SignName: sms_config.SignName,
        TemplateId: process.env.TemplateID,
        TemplateParamSet: [`${verify_code}`],
        /* 下发手机号码，采用 e.164 标准，+[国家或地区码][手机号]
         * 示例如：+8613711112222， 其中前面有一个+号 ，86为国家码，13711112222为手机号，最多不要超过200个手机号*/
        PhoneNumberSet: [`+86${phone}`],
        /* 用户的 session 内容（无需要可忽略）: 可以携带用户侧 ID 等上下文信息，server 会原样返回 */
        SessionContext: '',
    }

    return new Promise((resolve, reject) => {
        // 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数
        client.SendSms(params, function (err, response) {
            // 请求异常返回，打印异常信息
            if (err) {
                logger.error('发送验证码失败' + err.message)
                reject(err)
            }
            // TODO 请求正常返回，处理返回数据
        })
    })
}

/**
 * 发送邮件验证码
 * @param {string} email
 * @param {string | number} verify_code
 * @returns
 */
const sendEmailVerifyCode = async (email, verify_code) => {
    const transporter = nodemailer.createTransport(email_config)

    const mailOptions = {
        from: email_config.auth.user,
        to: email,
        subject: '「健康方舟」验证码',
        html: `<h1>「健康方舟」验证码：</h1>
        <span style="color: red;font-size: 20px;font-weight: bold;">${verify_code}</span>，
        如非本人操作，请忽略此邮件！`,
    }

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                logger.error('邮件发送失败' + error.message)
                reject(error)
            } else {
                logger.info('邮件发送成功')
                resolve(info)
            }
        })
    })
}

module.exports = {
    sendSMSVerifyCode,
    sendEmailVerifyCode,
}
