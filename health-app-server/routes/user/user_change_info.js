// 导入express
const express = require('express')
const router = express.Router()
const {
    changeUsernameSchema,
    changePasswordSchema,
    changeAvatarSchema,
    bindEmailSchema,
    bindHuaweiAccountSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    changeUsername,
    changePassword,
    changeAvatar,
    bindEmail,
    bindHuaweiAccount,
} = require('../../controllers/user_controller')

/**
 * 修改用户名
 */
router.put('/update_username', joiValidator(changeUsernameSchema), changeUsername)

/**
 * 修改用户密码
 */
router.put('/update_password', joiValidator(changePasswordSchema), changePassword)

/**
 * 修改用户头像
 */
router.put('/update_avatar', joiValidator(changeAvatarSchema), changeAvatar)

/**
 * 绑定邮箱
 */
router.put('/binding_email', joiValidator(bindEmailSchema), bindEmail)

/**
 * 绑定华为账号
 */
// TODO
// router.post('/binding_huawei_account', joiValidator(bindHuaweiAccountSchema), bindHuaweiAccount)

// 导出路由实例
module.exports = router
