// 项目基本配置
// 端口号
const port = 3000

// 导入 log 模块
const { logger_info: logger } = require('./utils/logger')
const verifyToken = require('./middleware/token_validator')

// 导入并配置Express框架
const express = require('express')
const app = express()

// 导入并配置跨域处理中间件
const cors = require('cors')
app.use(cors())

// 导入并配置表单解析中间件
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }))

// 使用express托管静态资源
app.use('/food_image', express.static('assets/image/food_image'))
app.use('/music_cover', express.static('assets/image/music_cover'))
app.use('/music', express.static('assets/music'))

// 导入错误级别中间件
const { sendError } = require('./middleware/response_handler')
app.use(sendError)

// 导入并使用用户路由模块,无需token
const userRouter = require('./routes/user/user_login_reg')
app.use('/user', userRouter)

// 导入并使用用户路由模块,需要token
const userInfoRouter = require('./routes/user/user_info')
app.use('/user_info', verifyToken, userInfoRouter)

// 导入并使用睡眠记录模块，需要token
const sleepRecordRouter = require('./routes/sleep/sleep')
app.use('/sleep', verifyToken, sleepRecordRouter)

// 导入并使用食物模块，需要token
const foodRecordRouter = require('./routes/diet/food')
app.use('/food', verifyToken, foodRecordRouter)

// 导入并使用饮食记录模块，需要token
const dietRecordRouter = require('./routes/diet/diet')
app.use('/diet', verifyToken, dietRecordRouter)

// 导入并使用运动记录模块，需要token
const sportRecordRouter = require('./routes/sport/sport')
app.use('/sport', verifyToken, sportRecordRouter)

// 导入并使用获取验证码路由模块
const verifyCodeRouter = require('./routes/verify_code/verify_code')
app.use('/code', verifyCodeRouter)

app.listen(port, () => {
    logger.info(`服务器运行在 http://localhost:${port}`)
})
