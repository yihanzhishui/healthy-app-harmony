// 导入express
const express = require('express')
const router = express.Router()
const { getFoodListSchema, getFoodListByTagSchema, joiValidator } = require('../../middleware/form_validate')
const { getFoodList, getFoodListByTag } = require('../../controllers/food_controller')

/**
 * 获取食物列表
 */
router.get('/get_food_list', joiValidator(getFoodListSchema), getFoodList)

/**
 * 根据标签获取食物列表
 */
router.get('/get_food_list_by_tag', joiValidator(getFoodListByTagSchema), getFoodListByTag)

module.exports = router
