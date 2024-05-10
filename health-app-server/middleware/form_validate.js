// 导入joi
const Joi = require('joi')
const { logger_user: logger } = require('../utils/logger')
const { send } = require('../middleware/response_handler')

// 导入自定义错误模块
const { ValidationError } = require('../utils/custom_error')

// #region 正则表达式
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
 * 身体形态正则
 */
const bodyShapePattern = /苹果型|梨型|三角型|匀称型|辣椒型|沙漏型/

/**
 * 运动经验正则
 */
const sportExperiencePattern = /有经验|无经验/

/**
 * 重点关注区域正则
 */
const focusAreaPattern = /胸部|背部|手臂|腹部|臀部|腿部|全身/

// #endregion

// 定义验证规则
// #region 用户信息验证

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
const passwordSchema = Joi.string().required()
const newPasswordSchema = Joi.string().required()

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
 * 修改身高、体重、生日、性别验证规则
 * height: 身高，单位为cm
 * weight: 体重，单位为kg
 * birthday: 生日，格式为YYYY-MM-DD
 * gender: 性别，只能从“0、1”中选
 */
const updateUserBodyInfoSchema = Joi.object({
    user_id: userIdSchema,
    height: Joi.number().positive(),
    weight: Joi.number().positive(),
    birthday: Joi.string().regex(datePattern),
    gender: Joi.number().integer().valid(0, 1),
})

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
 * 日期时间格式验证规则
 */
const dateTimeSchema = Joi.string().regex(dateTimeimePattern).required()

/**
 * 日期格式验证规则
 */
const dateSchema = Joi.string().regex(datePattern)

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

/**
 * 饮食类型验证规则
 * 只能从“早餐、午餐、晚餐、加餐”中选breakfast|lunch|dinner|extra_meal
 */
const dietTypePattern = /^(breakfast|lunch|dinner|extra_meal)$/

/**
 * 获取今日摄入热量验证规则
 */
const getTodayCaloriesSchema = Joi.object({
    user_id: userIdSchema,
})

/**
 * 添加到饮食记录验证规则
 */
const addToDietSchema = Joi.object({
    user_id: userIdSchema,
    diet_type: dietTypePattern,
    // food_list: Joi.string().required(),
})

/**
 * 根据饮食类型获取饮食记录验证规则
 */
const getDietByTypeSchema = Joi.object({
    user_id: userIdSchema,
    diet_type: dietTypePattern,
})

/**
 * 根据创建时间获取饮食记录验证规则
 */
const getDietByCreateTimeSchema = Joi.object({
    user_id: userIdSchema,
    create_time: dateSchema,
})

/**
 * 获取饮食推荐验证规则
 */
const getRecommendDietSchema = Joi.object({
    user_id: userIdSchema,
})

/**
 * 添加到饮食推荐验证规则
 */
const addToRecommendedDietSchema = Joi.object({
    user_id: userIdSchema,
})

// #endregion

// #region 运动减脂相关验证

/**
 * 获取 AI 运动减脂计划验证规则
 */
const getAIFatLossPlanSchema = Joi.object({
    user_id: userIdSchema,
    body_shape: Joi.string().regex(bodyShapePattern).required(),
    sport_experience: Joi.string().regex(sportExperiencePattern).required(),
    reduction_speed: Joi.string().required(),
    target_weight: Joi.string().required(),
    focus_area: Joi.string().regex(focusAreaPattern).required(),
    num_per_week_exercise: Joi.string().required(),
})

/**
 * 采纳 AI 运动减脂计划验证规则
 */
const adoptAIFatLossPlanSchema = Joi.object({
    user_id: userIdSchema,
})

/**
 * 获取运动计划验证规则
 */
const getLatestExercisePlanSchema = Joi.object({
    user_id: userIdSchema,
    page_number: Joi.number().integer().positive(),
    page_size: Joi.number().integer().positive(),
})

/**
 * 获取减脂计划验证规则
 */
const getFatLossPlanSchema = Joi.object({
    user_id: userIdSchema,
    page_number: Joi.number().integer().positive(),
    page_size: Joi.number().integer().positive(),
    create_date: dateSchema,
})

// #endregion

// #region 音乐相关验证

/**
 * 根据音乐分类获取音乐基本信息验证规则
 */
const getMusicInfoByCategorySchema = Joi.object({
    user_id: userIdSchema,
    category: Joi.string().required(),
    page_number: Joi.number().integer().positive(),
    page_size: Joi.number().integer().positive(),
})

/**
 * 获取某音乐具体信息验证规则
 */
const getMusicSchema = Joi.object({
    user_id: userIdSchema,
    page_number: Joi.number().integer().positive(),
    page_size: Joi.number().integer().positive(),
    music_id: userIdSchema,
})

/**
 * 收藏音乐验证规则
 */
const handleFavoriteMusicSchema = Joi.object({
    user_id: userIdSchema,
    music_id: userIdSchema,
    favorite_time: dateTimeSchema,
})

/**
 * 根据用户ID获取用户收藏的音乐验证规则
 */
const getFavoriteMusicSchema = Joi.object({
    user_id: userIdSchema,
    page_number: Joi.number().integer().positive(),
    page_size: Joi.number().integer().positive(),
})

// #endregion

// #region 获取验证码相关验证

const getSMSCodeSchema = Joi.object({
    phone: phoneSchema,
})

const getEmailCodeSchema = Joi.object({
    email: emailSchema,
})

// #endregion
// 封装 Joi 验证为中间件
const joiValidator = (schema, is_query = false) => {
    const extendedSchema = schema.clone().options({ allowUnknown: true })

    return (req, res, next) => {
        let err
        if (is_query) {
            const { error } = extendedSchema.validate(req.query)
            err = error
        } else {
            const { error } = extendedSchema.validate(req.body)
            err = error
        }

        if (err) {
            const [{ message, path }] = err.details

            // 构建错误信息并记录日志
            const errorMessage = `${path.join('.')} 输入有误: ${message}`
            logger.error(errorMessage)

            // 直接向客户端响应错误，不再创建自定义错误类实例
            send(res, 4000, errorMessage)
        } else {
            next() // 验证成功，继续处理请求
        }
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
    updateUserBodyInfoSchema,
    // 睡眠相关验证
    sleepTimeSchema,
    getSleepSchema,
    // 食物相关验证
    getFoodListSchema,
    getFoodListByTagSchema,
    // 饮食相关验证
    addToDietSchema,
    getDietByTypeSchema,
    getDietByCreateTimeSchema,
    getRecommendDietSchema,
    addToRecommendedDietSchema,
    getTodayCaloriesSchema,
    // 运动减脂相关验证
    getAIFatLossPlanSchema,
    adoptAIFatLossPlanSchema,
    getLatestExercisePlanSchema,
    getFatLossPlanSchema,
    // 音乐相关验证
    getMusicInfoByCategorySchema,
    getMusicSchema,
    handleFavoriteMusicSchema,
    getFavoriteMusicSchema,
    // 获取验证码相关验证
    getSMSCodeSchema,
    getEmailCodeSchema,
    joiValidator,
}
