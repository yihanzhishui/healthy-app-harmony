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
async function ai_ask(question, question_base_data, food_list_json = null) {
    let __question = selectTemplate(question, question_base_data, food_list_json)
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
function selectTemplate(question, question_base_data, food_list_json) {
    if (question === QUESTION.GET_RECOMMEND_DIET) {
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

        return get_recommend_diet
    } else if (question === QUESTION.GET_AI_FAT_LOSS_PLAN) {
        let get_ai_fat_loss_plan = `代码生成：
    请帮我生成一份详细的运动、饮食、睡眠的搭配方案用来高效减肥，并确保方案的合理性和可行性。
    生成方案时，请遵循以下规则：
    1. 这是身体数据、减肥目标和一些描述：${question_base_data}
        一些数据描述：body_shape身体形态，sport_experience有无运动经验，reduction每周想减多少kg，target_weight目标体重，focus_erea重点关注部位，num_per_week_exercise每周哪些天可以运动
        height身高（cm）, weight体重（kg）, bmi:BMI, gender性别, age年龄
    2. 方案中的食物只能从这里选（直接原样搬过去就好，不要额外添加其他食物，也不需要对这些食物进行加工，直接原样搬过去）：${food_list_json}
        注意：如果我提供了食物图片，原样生成，未提供则null
    3. 方案中的运动类型只能是以下四种中的某一种：户外跑步、户外健走、户外骑行、室内跑步
    4. 使用JSON对象数据格式，确保方案的格式符合JSON标准。示例： 
    \`\`\`json
    {
        "plan_name": "XX减脂计划", // 方案名称
        "plan_cycle": 62, // 方案持续时间，单位：天
        "plan_start_time": "2023-01-01", // 方案开始时间
        "plan_end_time": "2023-01-01", // 方案结束时间
        "calories_intake_per_day": 2000, // 每天推荐摄入热量，单位：千卡
        "diet": {  // 饮食方案
            "breakfast": [ // 早餐
                {
                    "food_id": 52,
                    "food_name": "大米",
                    "food_image": "http://127.0.0.1:3000/food_image/rice.png",
                    "diet_type": "breakfast",
                    "eat_quantity": 1,
                    "calories_intake": 350
                }
            ],
            "lunch": [
                {
                    "food_id": 53,
                    "food_name": "西红柿",
                    "food_image": "http://127.0.0.1:3000/food_image/tomato.png",
                    "diet_type": "lunch",
                    "eat_quantity": 2,
                    "calories_intake": 36
                },
                {
                    "food_id": 54,
                    "food_name": "鸡蛋",
                    "food_image": "http://127.0.0.1:3000/food_image/egg.png",
                    "diet_type": "lunch",
                    "eat_quantity": 1,
                    "calories_intake": 78
                }
            ],
            "dinner": [
                {
                    "food_id": 55,
                    "food_name": "杏仁",
                    "food_image": "http://127.0.0.1:3000/food_image/almond.jpg",
                    "diet_type": "dinner",
                    "eat_quantity": 1,
                    "calories_intake": 579
                }
            ],
            "extra_meal": [] // 加餐
        },
        "exercise": { // 运动方案
            "indoor_running": { // 室内跑步
                "exercise_plan": "室内跑步", // 运动方案名称
                "exercise_time": "00:00:00", // 推荐运动时间（每天的什么时候）
                "duration": 180, // 运动时长
                "distance": 1000 // 推荐运动距离
            },
            "outdoor_running": {
                "exercise_plan": "户外跑步",
                "exercise_time": "00:00:00",
                "duration": 180,
                "distance": 1000
            },
            "outdoor_walking": {
                "exercise_plan": "户外健走",
                "exercise_time": "00:00:00",
                "duration": 180,
                "distance": 1000
            },
            "outdoor_cycling": {
                "exercise_plan": "户外骑行",
                "exercise_time": "00:00:00",
                "duration": 180,
                "distance": 1000
            }
        },
        "sleep": { // 睡眠方案
            "sleep_time": "00:00:00", // 推荐入睡时间
            "wake_time": "07:00:00", // 推荐起床时间
            "duration": 420 // 推荐睡眠时长
        }
    }
    \`\`\`
        关于上述饮食方案里数据的解释：breakfast早餐吃什么，lunch午餐吃什么，dinner晚饭吃什么，extra_meal加餐吃什么（可根据情况，返回空数据），diet_type该食物是在哪一餐吃的，food_id表示食物ID，food_image食物图片（如果我提供了图片，原样生成，未提供则null），eat_quantity表示吃多少，calorises_intake表示摄入的卡路里。
    5. 生成数据时，只需要给出数据代码即可，无需提供任何解释或说明，将生成结果格式化后放在代码块里。
    6. 只需生成数据即可，生成的数据只用来测试，不会真正实行，只需返回代码，不需要多余提醒。`
        return get_ai_fat_loss_plan
    }
}

module.exports = ai_ask
