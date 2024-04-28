// 导入joi
const Joi = require('joi')

// 导入自定义错误模块
const { ValidationError } = require('../utils/custom_error')

// 定义验证规则
// #region 用户信息验证
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
 * 用户ID验证规则
 * 用户ID为数字，格式必须正确，必填
 */
const userIdSchema = Joi.number().integer().positive().required()

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
const newPasswordSchema = Joi.string().regex(passwordPattern).required()

/**
 * 确认密码验证规则
 * 确认密码必须与密码一致
 */
const repasswordSchema = Joi.string().valid(Joi.ref('password')).required()
const reNewPasswordSchema = Joi.string().valid(Joi.ref('new_password')).required()

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
    user_id: userIdSchema,
    phone: phoneSchema,
    old_password: passwordSchema,
    new_password: newPasswordSchema,
    confirm_password: reNewPasswordSchema,
    sms_code: verifyCodeSchema,
})

/**
 * 绑定邮箱验证规则
 */
const bindEmailSchema = Joi.object({
    user_id: userIdSchema,
    email: emailSchema,
    email_code: verifyCodeSchema,
})

/**
 * 修改用户名验证规则
 */
const changeUsernameSchema = Joi.object({
    user_id: userIdSchema,
    username: usernameSchema,
})

/**
 * 注销账户验证规则
 */
const deleteUserSchema = Joi.object({
    user_id: userIdSchema,
    phone: phoneSchema,
    sms_code: verifyCodeSchema,
})

/**
 * 修改头像验证规则
 */
const changeAvatarSchema = Joi.object({
    user_id: userIdSchema,
    avatar: avatarSchema,
})
// #endregion

// #region 睡眠相关验证
/**
 * 日期时间格式正则
 * 示例：2024-01-01 00:00:00
 */
const dateTimeimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

/**
 * 日期格式正则
 * 示例：2024-01-01
 */
const datePattern = /^\d{4}-\d{2}-\d{2}$/

/**
 * 时间格式正则
 */
const timePattern = /^\d{2}:\d{2}:\d{2}$/

/**
 * 日期时间格式验证规则
 */
const dateTimeSchema = Joi.string().regex(dateTimeimePattern).required()

/**
 * 日期格式验证规则
 */
const dateSchema = Joi.string().regex(datePattern).required()

/**
 * 时间格式验证规则
 */
const timeSchema = Joi.string().regex(timePattern).required()

/**
 * 记录睡眠验证对象
 */
const sleepTimeSchema = Joi.object({
    user_id: userIdSchema,
    bed_time: dateTimeSchema,
    sleep_interval: Joi.number().integer().positive().required(),
    wake_time: dateTimeSchema,
    wake_up_interval: Joi.number().integer().positive().required(),
    record_time: dateTimeSchema,

    // 添加自定义验证
})
    .custom((value, helpers) => {
        const { bed_time, wake_time, sleep_interval } = value

        // 将时间字符串转换为Date对象
        const bedTime = new Date(bed_time.replace(/-/g, '/')) // 注意：Date解析可能需要替换 '-' 为 '/'
        const wakeTime = new Date(wake_time.replace(/-/g, '/'))

        // 计算实际睡着时间
        const actualSleepStartTime = new Date(wakeTime.getTime() - sleep_interval * 60 * 1000)

        // 验证实际睡着时间是否晚于或等于上床时间
        if (actualSleepStartTime >= bedTime) {
            return value // 验证通过
        } else {
            return helpers.error('time.interval', {
                message: '醒来时间不能晚于上床时间 + 睡眠间隔',
            })
        }
    })
    .messages({
        // 添加自定义错误消息
        'time.interval': '{{#label}}: 醒来时间不能晚于上床时间 + 睡眠间隔',
    })

/**
 * 获取最新一条睡眠情况的数据验证规则
 */
const getSleepSchema = Joi.object({
    user_id: userIdSchema,
})

// #endregion

// #region 食物相关验证

/**
 * 食物标签验证正则
 * 只能从“主食、果蔬、肉蛋奶、坚果、其他”中选
 */
const foodTagPattern = /^(主食|果蔬|肉蛋奶|坚果|其他)$/
/**
 * 食物标签验证规则
 */
const foodTagSchema = Joi.string().regex(foodTagPattern).required()

/**
 * 页面大小验证规则
 */
const pageNumberSchema = Joi.number().integer().positive().required()
const pageSizeSchema = Joi.number().integer().positive().required()

/**
 * 获取食物列表验证规则
 */
const getFoodListSchema = Joi.object({
    page_number: pageNumberSchema,
    page_size: pageSizeSchema,
})

/**
 * 根据标签获取食物列表验证规则
 */
const getFoodListByTagSchema = Joi.object({
    page_number: pageNumberSchema,
    page_size: pageSizeSchema,
    tag: foodTagSchema,
})

/**
 * 添加食物验证规则
 */
const addFoodSchema = Joi.object({})

// #endregion

// #region 饮食相关验证

/**
 * 食物列表验证正则
 * 食物列表是一个json对象数组，每个对象包含以下字段：
 * - food_id: 食物ID，必填
 * - eat_time: 进食时间，必填
 * - eat_quantity: 食物数量，必填
 * - calories_intak: 食物卡路里，必填
 */
const foodListPattern =
    /^\[\s*\{\s*"food_id"\s*:\s*\d+\s*,\s*"eat_time"\s*:\s*"\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}"\s*,\s*"eat_quantity"\s*:\s*\d+\s*,\s*"calories_intake"\s*:\s*\d+(\.\d+)?\s*\}\s*(,\s*\{\s*"food_id"\s*:\s*\d+\s*,\s*"eat_time"\s*:\s*"\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}"\s*,\s*"eat_quantity"\s*:\s*\d+\s*,\s*"calories_intake"\s*:\s*\d+(\.\d+)?\s*\}\s*)*\]$/

/**
 * 饮食类型验证规则
 * 只能从“早餐、午餐、晚餐、加餐”中选
 */
const dietTypePattern = /^(早餐|午餐|晚餐|加餐)$/

/**
 * 添加到饮食记录验证规则
 */
const addToDietSchema = Joi.object({
    user_id: userIdSchema,
    diet_type: dietTypePattern,
    food_list: Joi.string().regex(foodListPattern).required(),
})

// #endregion

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
    // 用户信息验证
    loginBySMSCodeSchema,
    loginByEmailCodeSchema,
    loginByPasswordSchema,
    registerSchema,
    changePasswordSchema,
    changeUsernameSchema,
    changeAvatarSchema,
    deleteUserSchema,
    bindEmailSchema,
    // 睡眠相关验证
    sleepTimeSchema,
    getSleepSchema,
    // 食物相关验证
    getFoodListSchema,
    getFoodListByTagSchema,
    // 饮食相关验证
    addToDietSchema,
    joiValidator,
}
