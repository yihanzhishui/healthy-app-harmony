// 引入环境变量
require('dotenv').config()

// 导入日志模块
const { logger_code_api: logger } = require('../utils/logger')

// 导入短信验证码配置对象
const { sms_config } = require('../config/config')

const tencentcloud = require('tencentcloud-sdk-nodejs')

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

    // 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数
    client.SendSms(params, function (err, response) {
        // 请求异常返回，打印异常信息
        if (err) {
            logger.error(err)
            return
        }
        // TODO 请求正常返回，处理返回数据
    })
}

module.exports = { sendSMSVerifyCode }
