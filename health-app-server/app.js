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
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }))

// 使用express托管静态资源
app.use('/food_image', express.static('assets/image/food_image'))
app.use('/music_cover', express.static('assets/image/music_cover'))
app.use('/avatar', express.static('assets/image/avatar'))
app.use('/music', express.static('assets/music'))

// 错误级别中间件
const { sendError } = require('./middleware/response_handler')
app.use(sendError)

// 用户路由,无需token
const userRouter = require('./routes/user/user_login_reg')
app.use('/user', userRouter)

// 用户路由,需要token
const userInfoRouter = require('./routes/user/user_info')
app.use('/user_info', verifyToken, userInfoRouter)

// 睡眠记录，需要token
const sleepRecordRouter = require('./routes/sleep/sleep')
app.use('/sleep', verifyToken, sleepRecordRouter)

// 食物，需要token
const foodRecordRouter = require('./routes/diet/food')
app.use('/food', verifyToken, foodRecordRouter)

// 饮食记录，需要token
const dietRecordRouter = require('./routes/diet/diet')
app.use('/diet', verifyToken, dietRecordRouter)

// 运动记录，需要token
const sportRecordRouter = require('./routes/sport/sport')
app.use('/sport', verifyToken, sportRecordRouter)

// 音乐模块，需要token
const musicRouter = require('./routes/music/music')
app.use('/music', verifyToken, musicRouter)

// 验证码
const verifyCodeRouter = require('./routes/verify_code/verify_code')
app.use('/code', verifyCodeRouter)

const uploadRouter = require('./routes/upload')
app.use('/upload', verifyToken, uploadRouter)

app.listen(port, () => {
    logger.info(`服务器运行在 http://localhost:${port}`)
})
