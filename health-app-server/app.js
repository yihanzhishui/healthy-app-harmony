// 项目基本配置
// 端口号
const port = 3000

// 导入 log 模块
const { logger_info: logger } = require('./utils/logger')

// 导入并配置Express框架
const express = require('express')
const app = express()

// 导入并配置跨域处理中间件
const cors = require('cors')
app.use(cors())

// 导入并配置表单解析中间件
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

// 导入并使用用户路由模块
const userRouter = require('./routes/user')
app.use('/user', userRouter)

// 导入错误级别中间件
const { sendError } = require('./utils/response_handler')
// 使用中间件
app.use(sendError)

app.listen(port, () => {
    logger.info(`服务器运行在 http://localhost:${port}`)
})
