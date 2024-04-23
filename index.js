/**
 * 使用邮箱验证码登录，QQ邮箱作为SMTP服务提供商，请设计并实现一个Node.js后端接口，使用express框架编写。
 * 该接口应该能够发送邮箱验证码，并存储在redis数据库中，接收邮箱号码和验证码作为输入，并验证它们是否匹配。
 * 如果匹配成功，则返回登录成功的状态码；否则，返回登录失败的状态码。
 */
const express = require('express')
const bodyParser = require('body-parser')
const redis = require('redis')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))

const client = redis.createClient()

app.post('/send-code', (req, res) => {
    const { email } = req.body
    if (!email) {
        return res.status(400).send('Invalid email')
    }

    const code = Math.floor(100000 + Math.random() * 900000)
    client.set(email, code, (err, reply) => {
        if (err) {
            return res.status(500).send('Error saving code to Redis')
        }

        const smtp = require('nodemailer')
        const transporter = smtp.createTransport({
            service: 'qq',
            auth: {
                user: 'your-email@qq.com',
                pass: 'your-password',
            },
        })

        const mailOptions = {
            to: email,
            subject: 'Email Verification Code',
            text: `Your verification code is ${code}`,
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).send('Error sending email')
            }

            res.send('Email sent')
        })
    })
})

app.post('/verify-code', (req, res) => {
    const { email, code } = req.body
    if (!email || !code) {
        return res.status(400).send('Invalid email or code')
    }

    client.get(email, (err, reply) => {
        if (err) {
            return res.status(500).send('Error getting code from Redis')
        }

        if (!reply) {
            return res.status(401).send('Invalid email')
        }

        if (parseInt(reply) === code) {
            return res.status(200).send('Login successful')
        } else {
            return res.status(401).send('Invalid code')
        }
    })
})

app.listen(3000, () => {
    console.log('Server listening on port 3000')
})
