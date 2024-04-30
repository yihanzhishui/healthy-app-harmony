// 导入express
const express = require('express')
const router = express.Router()
const {
    addToDietSchema,
    getDietByTypeSchema,
    getDietByCreateTimeSchema,
    getRecommendDietSchema,
    addToRecommendedDietSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    addToDietRecord,
    getDietRecordByType,
    getDietRecordByCreateTime,
    getRecommendDiet,
    addToRecommendedDietRecord,
} = require('../../controllers/diet_controller')

/**
 * 添加食物到饮食记录
 */
router.put('/add_to_diet_record', joiValidator(addToDietSchema), addToDietRecord)

/**
 * 根据饮食类型获取饮食记录
 */
router.get('/get_diet_record_by_diet_type', joiValidator(getDietByTypeSchema), getDietRecordByType)

/**
 * 根据日期获取饮食记录
 */
router.get('/get_diet_record_by_create_time', joiValidator(getDietByCreateTimeSchema), getDietRecordByCreateTime)

/**
 * 获取饮食推荐
 */
router.get('/get_recommend_diet', joiValidator(getRecommendDietSchema), getRecommendDiet)

/**
 * 将AI推荐饮食添加到饮食推荐记录表
 */
router.put('/add_to_recommended_diet_record', joiValidator(addToRecommendedDietSchema), addToRecommendedDietRecord)

// 导出路由实例
module.exports = router