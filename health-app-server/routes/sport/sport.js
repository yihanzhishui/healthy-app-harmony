// 导入express
const express = require('express')
const router = express.Router()
const {
    getAIFatLossPlanSchema,
    adoptAIFatLossPlanSchema,
    getLatestExercisePlanSchema,
    getFatLossPlanSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    getAIFatLossPlan,
    adoptAIFatLossPlan,
    getLatestExercisePlan,
    getFatLossPlan,
} = require('../../controllers/sport_controller')

/**
 * 获取AI减脂方案
 */
router.get('/get_ai_plan', joiValidator(getAIFatLossPlanSchema), getAIFatLossPlan)

/**
 * 采纳AI减脂方案
 */
router.get('/adopt_ai_fat_loss_plan', joiValidator(adoptAIFatLossPlanSchema), adoptAIFatLossPlan)

/**
 * 获取运动方案
 */
router.get('/get_latest_exercise_plan', joiValidator(getLatestExercisePlanSchema), getLatestExercisePlan)

/**
 * 获取减脂计划表
 */
router.get('/get_fat_loss_plan', joiValidator(getFatLossPlanSchema), getFatLossPlan)

// 导出路由实例
module.exports = router
