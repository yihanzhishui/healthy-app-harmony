// 导入模块
const express = require('express')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const salt = require('./utils/salt')

const app = express()

app.use(bodyParser.json())

// 生成 JWT 的中间件

// 登录接口
app.post('/login', (req, res) => {
    // 假设用户名为 "admin"，密码为 "password"
    const { username, password } = req.body
    console.log(username, password)
    if (username === 'admin' && password === 'password') {
        // 生成 JWT
        const token = jwt.sign({ username }, salt, { expiresIn: '1h' })
        res.json({ token: 'Bearer ' + token })
    } else {
        res.status(401).json({ error: 'Invalid username or password' })
    }
})

// 监听 3000 端口
app.listen(3000, () => {
    console.log('Server is running on port 127.0.0.1:3000')
})
