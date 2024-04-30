const { db, releaseConnection } = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const ai_ask = require('../utils/ai_ask')
const { QUESTION, AI_ANSWER_KEY_FAT_LOSS } = require('../constant/constant')
const redis = require('../utils/redis_manager')

/**
 * 处理获取AI减脂方案
 */
const getAIFatLossPlan = async (req, res) => {
    const { user_id, ...other } = req.body
    const connection = await db.getConnection()
    try {
        // 开启事务
        await connection.beginTransaction()
        // 检查用户是否存在
        let sql_check = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [results] = await connection.query(sql_check, [user_id])
        if (results.length === 0) {
            send(res, 2000, '用户不存在')
            logger.info('用户不存在')
            return
        }
        // 获取食物列表的 food_id、food_name、food_image、calories
        let sql_food = `SELECT food_id, food_name, food_image, calories FROM food`
        let [foodList] = await connection.query(sql_food)
        // 询问基础数据---食物参考列表
        let food_list_json = JSON.stringify(foodList)
        // 从user_info中获取用户信息
        sql = `SELECT * , DATE_FORMAT(birthday, '%Y-%m-%d') AS formatted_birthday FROM user_info WHERE user_id = ?`
        let [userInfoResults] = await connection.query(sql, [user_id])
        if (userInfoResults.length === 0) {
            send(res, 4003, '用户信息不存在')
            return
        }
        const { height, weight, gender, formatted_birthday: birthday } = userInfoResults[0]
        const bmi = parseFloat((weight / ((height / 100) * (height / 100))).toFixed(2))
        // 询问基础数据---用户身体信息
        let user_info_json = JSON.stringify({ height, weight, bmi, gender, age: calculateAge(birthday), ...other })
        let recommend_fat_loss_plan_ai_json = await ai_ask(
            QUESTION.GET_AI_FAT_LOSS_PLAN,
            user_info_json,
            food_list_json
        )
        recommend_fat_loss_plan_ai_json = recommend_fat_loss_plan_ai_json.replace(/^\s*```json\s*\n|```$/gm, '')
        // 暂存至redis
        await redis.set(AI_ANSWER_KEY_FAT_LOSS + user_id, recommend_fat_loss_plan_ai_json)
        // 格式化
        let recommend_fat_loss_plan_ai = JSON.parse(recommend_fat_loss_plan_ai_json)
        send(res, 200, '获取AI减脂方案成功', { ...recommend_fat_loss_plan_ai })
        await connection.commit()
        logger.info(`用户 ${user_id} 获取AI减脂方案成功`)
    } catch (error) {
        // 回滚事务
        await connection.rollback()
        sendError(error, req, res, 4002, '获取AI减脂方案失败')
        logger.error('获取AI减脂方案失败')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 采纳AI减脂方案，将数据存入数据库
 */
const adoptAIFatLossPlan = async (req, res) => {
    send(res, 200, '采纳AI减脂方案成功', req.body)
    return
}

/**
 * 计算年龄
 */
function calculateAge(birthdate) {
    const today = new Date()
    const birthDate = new Date(birthdate)

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    // 如果需要计算月数和天数，可以进一步细化此函数
    // 下面是一个简单的示例，只计算月数
    let months
    if (monthDiff > 0) {
        months = monthDiff
    } else {
        months = 12 + monthDiff // 考虑到如果是负数，需要加一年的月份数
    }

    // 计算剩余天数，注意需要处理当月的天数差异
    let days
    if (today.getDate() >= birthDate.getDate()) {
        days = today.getDate() - birthDate.getDate()
    } else {
        const lastMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate() // 获取上个月最后一天的日期
        days = lastMonthDays - birthDate.getDate() + today.getDate() // 上个月剩余天数加上本月已过的天数
    }

    // return { years: age, months, days }
    return age
}

module.exports = {
    getAIFatLossPlan,
    adoptAIFatLossPlan,
}
