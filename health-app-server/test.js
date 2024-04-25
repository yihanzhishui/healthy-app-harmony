// 导入模块
const express = require('express')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const salt = require('./utils/salt')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(expressJwt({ secret: salt }).unless({ path: ['/login'] }))

// 登录接口
app.post('/login', (req, res) => {
    // 假设用户名为 "admin"，密码为 "123456"
    const { username, password } = req.body
    console.log(username, password)
    if (username === 'admin' && password === '123456') {
        // 生成 JWT
        const token = jwt.sign({ username }, salt, { expiresIn: '1h' })
        res.json({ token: 'Bearer ' + token })
    } else {
        res.status(401).json({ error: 'Invalid username or password' })
    }
})

// 处理token解析失败
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: '无效 token' })
    }
})

app.post('/get', (req, res) => {
    console.log(req.body)
    res.send({
        status: 'success',
        code: 200,
        data: req.user,
    })
})

// 监听 3000 端口
app.listen(3000, () => {
    console.log('Server is running on port 127.0.0.1:3000')
})
