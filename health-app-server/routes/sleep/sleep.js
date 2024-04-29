// 导入express
const express = require('express')
const router = express.Router()
const { sleepTimeSchema, getSleepSchema, joiValidator } = require('../../middleware/form_validate')
const { recordSleep, getSleepRecord } = require('../../controllers/sleep_controller')

/**
 * 记录睡眠
 */
router.put('/add_sleep_record', joiValidator(sleepTimeSchema), recordSleep)

/**
 * 获取最新一条睡眠数据
 */
/**
 * 路由级别中间件，向后传递需要取几条数据
 */
const setNumberDay = (req, res, next) => {
    req.number = 1
    next()
}
router.get('/get_lastest_day_sleep_record', joiValidator(getSleepSchema), setNumberDay, getSleepRecord)

// 计算今天是本周的第几天
const today = new Date()
let dayOfWeek = today.getDay()
dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

/**
 * 获取本周睡眠数据
 */
router.get('/get_this_week_sleep_record', joiValidator(getSleepSchema), getSleepRecord)

// 导出路由实例
module.exports = router
