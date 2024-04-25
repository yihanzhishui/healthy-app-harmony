// 记录服务运行日志

// 导入log4js配置对象
const { log_config } = require('../config/config')
const log4js = require('log4js')

// 加载log4js配置
log4js.configure(log_config)

const logger_info = log4js.getLogger()
const logger_db = log4js.getLogger('database')
const logger_code_api = log4js.getLogger('code_api')
const logger_user = log4js.getLogger('user')
const logger_music = log4js.getLogger('music')
const logger_diet = log4js.getLogger('diet')
const logger_sport = log4js.getLogger('sport')

// 导出日志对象
module.exports = {
    logger_info,
    logger_db,
    logger_code_api,
    logger_user,
    logger_music,
    logger_diet,
    logger_sport,
}
