// 导入express
const express = require('express')
const router = express.Router()
const { addToDietSchema, joiValidator } = require('../../middleware/form_validate')
const { addToDietRecord } = require('../../controllers/diet_controller')

/**
 * 添加食物到饮食记录
 */
router.put('/add_to_diet_record', joiValidator(addToDietSchema), addToDietRecord)

/**
 * 根据饮食类型获取饮食记录
 */
router.get('/get_diet_record_by_diet_type', (req, res) => {})

// 导出路由实例
module.exports = router
