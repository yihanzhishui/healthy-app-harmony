// 引入环境变量
require('dotenv').config()
const { logger_code_api: logger } = require('../utils/logger')
const { sms_config, email_config } = require('../config/config')
const tencentcloud = require('tencentcloud-sdk-nodejs-sms')
const SmsClient = tencentcloud.sms.v20210111.Client
// 导入腾讯云短信SDK
const Qcloudsms = require('qcloudsms_js')
// 导入 nodemailer
const nodemailer = require('nodemailer')
const redis = require('./redis_manager')

/**
 * 发送短信验证码
 * @param {string | number} phone
 * @param {string | number} verify_code
 */
const sendSMSVerifyCode = (phone, verify_code) => {
    const clientConfig = {
        credential: {
            secretId: process.env.secretId,
            secretKey: process.env.secretKey,
        },
        region: 'ap-guangzhou',
        profile: {
            httpProfile: {
                endpoint: 'sms.tencentcloudapi.com',
            },
        },
    }

    // 实例化要请求产品的client对象,clientProfile是可选的
    const client = new SmsClient(clientConfig)
    const params = {
        PhoneNumberSet: [`86${phone}`],
        SmsSdkAppId: process.env.AppId,
        SignName: process.env.SignName,
        TemplateId: process.env.TemplateID,
        TemplateParamSet: [verify_code.toString()],
    }
    return client.SendSms(params).then(
        async (data) => {
            try {
                await redis.set(phone, verify_code)
            } catch (error) {
                logger.error('Redis 存储 Token 失败' + error.message)
            }
            logger.info('短信发送成功', data)
        },
        (err) => {
            logger.error('验证码发送失败', err.message)
        }
    )
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
        html: `<!DOCTYPE html>
        <html lang="zh">
            <head>
                <meta charset="UTF-8" />
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f5f5f5;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 30px;
                        background-color: #fff;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #007bff;
                    }
                    p {
                        line-height: 1.6;
                    }
                    .code-box {
                        background-color: #007bff;
                        color: #fff;
                        display: inline-block;
                        padding: 10px 20px;
                        font-weight: bold;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .action {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 30px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>欢迎来到「健康方舟」</h1>
                    <p>您好，<strong>${email}</strong>,</p>
                    <p>感谢您选择我们！为了保障您的账户安全，以下是您的登录验证码，请妥善保管：</p>
                    <div class="code-box">${verify_code}</div>
        
                    <p>此验证码有效期为10分钟，请在此时间内完成验证操作。如非本人操作，请忽略此邮件。</p>
        
                    <p>祝您使用愉快！</p>
                    <p>敬上，<br />「健康方舟」</p>
                </div>
            </body>
        </html>
        `,
    }

    return transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            logger.error('邮件发送失败' + error.message)
        } else {
            try {
                await redis.set(email, verify_code)
                logger.info('邮件发送成功', info)
                return
            } catch (error) {
                logger.error('Redis 存储 Token 失败' + error.message)
                return
            }
        }
    })
}

module.exports = {
    sendSMSVerifyCode,
    sendEmailVerifyCode,
}
