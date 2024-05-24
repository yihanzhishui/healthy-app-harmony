// 导入express
const express = require('express')
const router = express.Router()
const expressWs = require('express-ws')(router)
const {
    getAIFatLossPlanSchema,
    adoptAIFatLossPlanSchema,
    getLatestExercisePlanSchema,
    getFatLossPlanSchema,
    addRecordSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    getAIFatLossPlan,
    getAIFatLossPlanWS,
    adoptAIFatLossPlan,
    getLatestExercisePlan,
    getFatLossPlan,
    addSportRecord,
} = require('../../controllers/sport_controller')

const { send } = require('../../middleware/response_handler')
const { logger_info: logger } = require('../../utils/logger')

/**
 * 获取AI减脂方案
 */
router.get('/get_ai_plan', joiValidator(getAIFatLossPlanSchema, true), getAIFatLossPlan)
// 使用websocket向客户端发送消息
router.ws('/ws/get_ai_plan', joiValidator(getAIFatLossPlanSchema, true), getAIFatLossPlanWS)

/**
 * 采纳AI减脂方案
 */
router.get('/adopt_ai_fat_loss_plan', joiValidator(adoptAIFatLossPlanSchema, true), adoptAIFatLossPlan)

/**
 * 获取运动方案
 */
router.get('/get_latest_exercise_plan', joiValidator(getLatestExercisePlanSchema), getLatestExercisePlan)

/**
 * 获取减脂计划表
 */
router.get('/get_fat_loss_plan', joiValidator(getFatLossPlanSchema), getFatLossPlan)

/**
 * 添加运动记录
 */
router.put('/add_exercise_record', joiValidator(addRecordSchema), addSportRecord)

// 导出路由实例
module.exports = router
