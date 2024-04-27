// 导入@hapi/joi
const Joi = require('joi')

// 导入自定义错误模块
const { ValidationError } = require('../utils/custom_error')

// 定义验证规则

/**
 * 匹配手机号码的正则表达式
 */
const phonePattern = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/

/**
 * 匹配密码的正则表达式
 */
const passwordPattern = /^[\S]{6,12}$/

/**
 * 匹配验证码的正则表达式
 */
const verifyCodePattern = /^\d{6}$/

/**
 * 匹配base64图片文件的正则表达式
 */
const base64Pattern =
    /^(data:image\/(png|jpg|jpeg|gif|bmp|webp|svg\+xml);base64,)([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/

/**
 * 电话号码验证规则
 * 电话号码为字符串，格式必须正确，必填
 */
const phoneSchema = Joi.string().regex(phonePattern).required()

/**
 * 邮箱验证规则
 * 邮箱为字符串，格式必须正确，必填
 */
const emailSchema = Joi.string().email().required()

/**
 * 密码验证规则
 * 密码为字符串，长度必须在6到12位之间，不能包含空格，不能包含汉字，必填
 */
const passwordSchema = Joi.string().regex(passwordPattern).required()

/**
 * 确认密码验证规则
 * 确认密码必须与密码一致
 */
const repasswordSchema = Joi.string().valid(Joi.ref('password')).required()

/**
 * 验证码验证规则
 * 验证码为字符串，长度为6位，只能出现数字，必填
 */
const verifyCodeSchema = Joi.string().length(6).regex(verifyCodePattern).required()

/**
 * 昵称验证规则
 * 昵称为字符串，长度必须在1到8位之间，不能包含空格，必填
 */
const usernameSchema = Joi.string().min(1).max(8).required()

/**
 * 头像验证规则
 * 头像为字符串，格式为图片文件，必填
 */
const avatarSchema = Joi.string().regex(base64Pattern).required()

/**
 * 短信验证码登录验证规则
 */
const loginBySMSCodeSchema = Joi.object({
    phone: phoneSchema,
    sms_code: verifyCodeSchema,
})

/**
 * 邮箱验证码登录验证规则
 */
const loginByEmailCodeSchema = Joi.object({
    email: Joi.string().email(),
    email_code: verifyCodeSchema,
})

/**
 * 密码登录验证规则
 */
const loginByPasswordSchema = Joi.object({
    phone: phoneSchema,
    email: emailSchema,
    password: passwordSchema,
})

/**
 * 注册验证规则
 */
const registerSchema = Joi.object({
    phone: phoneSchema,
    password: passwordSchema,
    confirm_password: repasswordSchema,
    sms_code: verifyCodeSchema,
})

/**
 * 修改密码验证规则
 */
const changePasswordSchema = Joi.object({
    phone: phoneSchema,
    old_password: passwordSchema,
    new_password: passwordSchema,
    confirm_password: repasswordSchema,
    sms_code: verifyCodeSchema,
})

/**
 * 修改用户名验证规则
 */
const changeUsernameSchema = Joi.object({
    username: usernameSchema,
})

/**
 * 注销账户验证规则
 */
const deleteUserSchema = Joi.object({
    phone: phoneSchema,
    sms_code: verifyCodeSchema,
})

/**
 * 修改头像验证规则
 */
const changeAvatarSchema = Joi.object({
    avatar: avatarSchema,
})

// 封装 Joi 验证为中间件
const joiValidator = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body)

        if (error) {
            const { details } = error
            const firstError = details[0]
            const { message, path } = firstError

            const validationError = new ValidationError(`${path.join('.')} 输入有误: ${message}`)
            validationError.statusCode = 4000
            validationError.validationDetails = details.map(({ message, path }) => ({ field: path.join('.'), message }))

            throw validationError // 抛出错误，让上层中间件或应用程序捕获
        }

        next() // 验证成功，继续处理请求
    }
}

module.exports = {
    loginBySMSCodeSchema,
    loginByEmailCodeSchema,
    loginByPasswordSchema,
    registerSchema,
    changePasswordSchema,
    changeUsernameSchema,
    changeAvatarSchema,
    deleteUserSchema,
    joiValidator,
}
