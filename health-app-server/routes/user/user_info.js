// 导入express
const express = require('express')
const router = express.Router()
const {
    changeUsernameSchema,
    changePasswordSchema,
    changeAvatarSchema,
    bindEmailSchema,
    bindHuaweiAccountSchema,
    updateUserBodyInfoSchema,
    getUserAccountInfoSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    changeUsername,
    changePassword,
    changeAvatar,
    bindEmail,
    bindHuaweiAccount,
    updateUserBodyInfo,
    getUserBodyInfo,
    getUserAccountInfo,
} = require('../../controllers/user_controller')

const { decrypt } = require('../../middleware/decrypt')

/**
 * 修改用户名
 */
router.put('/update_username', joiValidator(changeUsernameSchema), changeUsername)

/**
 * 修改用户密码
 */
router.put('/update_password', joiValidator(changePasswordSchema), decrypt, changePassword)

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

/**
 * 修改身高、体重、生日、性别
 */
router.put('/update_user_body_info', joiValidator(updateUserBodyInfoSchema), updateUserBodyInfo)

/**
 * 获取身高、体重、生日、性别
 */
router.get('/get_user_body_info', joiValidator(updateUserBodyInfoSchema, true), getUserBodyInfo)

/**
 * 获取用户账号信息
 */
router.get('/get_user_account_info', joiValidator(getUserAccountInfoSchema, true), getUserAccountInfo)

// 导出路由实例
module.exports = router
