// 请求地址： https://aip.baidubce.com/rest/2.0/wenxinworkshop/api/v1/template/info
// 请求方式： GET
require('dotenv').config()
const { ai_config } = require('../config/config')
const axios = require('axios')
const { QUESTION } = require('../constant/constant')
const { logger_info: logger } = require('./logger')

// 获取 access token
async function fetchAccessToken() {
    const accessTokenRes = await axios.post(ai_config.ACCESS_TOKEN_URL, null, {
        params: {
            grant_type: 'client_credentials',
            client_id: process.env.baiduApiKey,
            client_secret: process.env.baiduApiSecret,
        },
    })
    return accessTokenRes.data.access_token
}

// 全局存储一个 access token -> 过期时间对象
let accessToken = {
    expiredTime: 0,
    value: '',
}

async function getAccessToken() {
    if (accessToken.value && Date.now() < accessToken.expiredTime) {
        return accessToken.value
    }
    const token = await fetchAccessToken()
    accessToken = {
        expiredTime: Date.now() + 29 * 86400 * 1000, // 29 days
        value: token,
    }
    return token
}

const CHAT_URL = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions'

/**
 * 向AI提问
 * @param {string} question 要问的问题，将用于选择问题模板
 * @param {string} question_base_data 问题基础数据，将用于问题回答的基础
 * @returns {object} 返回一个对象，包含两个属性：requestId（提问ID）和result（回答结果）
 */
async function ai_ask(question, question_base_data) {
    let __question = selectTemplate(question, question_base_data)
    const messages = [{ role: 'user', content: __question }]
    const token = await getAccessToken()
    const res = await axios.post(CHAT_URL, { messages }, { params: { access_token: token } })
    const { data } = res
    logger.info('AI：', { ...data, result: '内容不展示' })
    return data.result
}

/**
 * 选择使用哪个问题模板
 */
function selectTemplate(question, question_base_data) {
    let get_recommend_diet = `
        代码生成：
        生成代码时，请遵循以下规则：
        1. 只能从以下数据中选择：${question_base_data}
        2. 使用JSON对象数据格式，确保方案的格式符合JSON标准。示例：
            \`\`\`json
            {
                "breakfast": [
                    {
                        "food_id": 1,
                        "food_name: "米饭",
                        "food_image": null,
                        "diet_type": "breakfast",
                        "eat_quantity": 2,
                        "calories_intake": 500
                    },
                ],
                "lunch": [
                    {
                        "food_id": 1,
                        "food_name: "米饭",
                        "food_image": null,
                        "diet_type": "lunch",
                        "eat_quantity": 2,
                        "calories_intake": 500
                    },
                ],
                "dinner": [
                    {
                        "food_id": 1,
                        "food_name: "米饭",
                        "food_image": null,
                        "diet_type": "dinner",
                        "eat_quantity": 2,
                        "calories_intake": 500
                    },
                ],
                "extra_meal": [
                    {
                        "food_id": 1,
                        "food_name: "米饭",
                        "food_image": null,
                        "diet_type": "extra_meal",
                        "eat_quantity": 2,
                        "calories_intake": 500
                    },
                ],
            }
            \`\`\`
            关于上述数据的解释：breakfast早餐吃什么，lunch午餐吃什么，dinner晚饭吃什么，extra_meal加餐吃什么（可根据情况，返回空数据），diet_type该食物是在哪一餐吃的，food_id表示食物ID，food_image食物图片（如果我提供了图片，原样生成，未提供则null），eat_quantity表示吃多少，calorises_intake表示摄入的卡路里。
        3. 请确保方案的合理性和可行性。
        4. 生成数据时，只需要给出数据代码即可，无需提供任何解释或说明。
        5. 将生成结果格式化后放在代码块里。`

    if (question === QUESTION.GET_RECOMMEND_DIET) {
        return get_recommend_diet
    }
}

module.exports = ai_ask
