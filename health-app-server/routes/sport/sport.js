// 导入express
const express = require('express')
const router = express.Router()
const { getAIFatLossPlanSchema, adoptAIFatLossPlanSchema, joiValidator } = require('../../middleware/form_validate')
const { getAIFatLossPlan, adoptAIFatLossPlan } = require('../../controllers/sport_controller')

/**
 * 获取AI减脂方案
 */
router.get('/get_ai_plan', joiValidator(getAIFatLossPlanSchema), getAIFatLossPlan)

/**
 * 采纳AI减脂方案
 */
router.get('/adopt_ai_fat_loss_plan', joiValidator(adoptAIFatLossPlanSchema), adoptAIFatLossPlan)

// 导出路由实例
module.exports = router
