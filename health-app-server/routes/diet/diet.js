// 导入express
const express = require('express')
const router = express.Router()
const {
    addToDietSchema,
    getDietByTypeSchema,
    getDietByCreateTimeSchema,
    getRecommendDietSchema,
    addToRecommendedDietSchema,
    getTodayCaloriesSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    addToDietRecord,
    getDietRecordByType,
    getDietRecordByCreateTime,
    getRecommendDiet,
    addToRecommendedDietRecord,
    getTodayCalories,
} = require('../../controllers/diet_controller')

/**
 * 添加食物到饮食记录
 */
router.put('/add_to_diet_record', joiValidator(addToDietSchema), addToDietRecord)

/**
 * 根据饮食类型获取饮食记录
 */
router.get('/get_diet_record_by_diet_type', joiValidator(getDietByTypeSchema, true), getDietRecordByType)

/**
 * 根据日期获取饮食记录
 */
router.get('/get_diet_record_by_create_time', joiValidator(getDietByCreateTimeSchema, true), getDietRecordByCreateTime)

/**
 * 获取饮食推荐
 */
router.get('/get_recommend_diet', joiValidator(getRecommendDietSchema, true), getRecommendDiet)

/**
 * 将AI推荐饮食添加到饮食推荐记录表
 */
router.put('/add_to_recommended_diet_record', joiValidator(addToRecommendedDietSchema), addToRecommendedDietRecord)

/**
 * 获取今日摄入热量
 */
router.get('/get_today_calories', joiValidator(getTodayCaloriesSchema, true), getTodayCalories)

// 导出路由实例
module.exports = router
