// 导入express
const express = require('express')

// 创建路由实例
const router = express.Router()

// 导入表单验证规则
const {
    changeUsernameSchema,
    changePasswordSchema,
    changeAvatarSchema,
    bindEmailSchema,
    bindHuaweiAccountSchema,
    joiValidator,
} = require('../middleware/form_validate')

// 导入用户控制器
const {
    changeUsername,
    changePassword,
    changeAvatar,
    bindEmail,
    bindHuaweiAccount,
} = require('../controllers/user_controller')

/**
 * 修改用户名
 */
router.post('/update_username', joiValidator(changeUsernameSchema), changeUsername)

/**
 * 修改用户密码
 */
router.post('/update_password', joiValidator(changePasswordSchema), changePassword)

/**
 * 修改用户头像
 */
router.post('/update_avatar', joiValidator(changeAvatarSchema), changeAvatar)

/**
 * 绑定邮箱
 */
router.post('/binding_email', joiValidator(bindEmailSchema), bindEmail)

/**
 * 绑定华为账号
 */
// TODO
// router.post('/binding_huawei_account', joiValidator(bindHuaweiAccountSchema), bindHuaweiAccount)

// 导出路由实例
module.exports = router
