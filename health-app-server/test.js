// const ai_ask = require('./utils/ai_ask')
// // const {logger_info:logger}

// let question1 = `数据生成
// 请帮我生成一份这样的数据：
// 1. 常规的食物 5 条
// 2. 每条数据格式如下
//     {
//         "id": 1,
//         "food_name": "食物名称",
//         "food_image": base64编码的图片数据(无需数据，直接null即可),
//         "calories":200,
//         "food_tags": 从这些数据中随机选取一到三个作为食物标签：主食、果蔬、肉蛋奶、坚果、其他
//     }
// 3. 请确保数据格式符合要求，并确保数据的可行性。
// 4. 将生成结果格式化后放在代码块里。
// 5. 只需返回数据即可，无需任何说明与解释。`
// let question2 = `生成Json格式代码：
// 请为我生成一份健康减脂的方案，包含饮食、运动和睡眠三方面。
// 其中：
// 饮食方面，请分别提供早、中、晚三餐的食物以及相应的食用数量、推荐摄入热量。
// 运动方面，请提供一份包含室内跑步、室内健走、室内骑行、室外跑步、室外健走、室外骑行中一到两项的运动方案、推荐运动的时间区间、推荐运动时长（minutes）。
// 睡眠方面，请提供一份包含入睡时间、起床时间、睡眠时长（minutes）的睡眠方案。
// 请帮我生成一份详细的方案，并确保方案的合理性和可行性。

// 生成代码时，请遵循以下规则：
// 1. 使用JSON对象数据格式，确保方案的格式符合JSON标准。示例：
//     {
//         "diet": {
//             "breakfast": {
//                 "food": "食物1",
//                 "quantity": 1,
//                 "calories": 1
//             },
//             "lunch": {
//                 "food": "食物2",
//                 "quantity": 2,
//                 "calories": 2
//             },
//             "dinner": {
//                 "food": "食物3",
//                 "quantity": 3,
//                 "calories": 3
//             }
//         },
//         "exercise": {
//             "indoor_running": {
//                 "exercise_plan": "室内跑步方案",
//                 "time_of_day": "2024-01-01 00:00:00",
//                 "duration": 180
//             },
//             "indoor_walking": {
//                 "exercise_plan": "室内健走方案",
//                 "time_of_day": "2024-01-01 00:00:00",
//                 "duration": 180
//             },
//             "indoor_cycling": {
//                 "exercise_plan": "室内骑行方案",
//                 "time_of_day": "2024-01-01 00:00:00",
//                 "duration": 180
//             },
//             "outdoor_running": {
//                 "exercise_plan": "室外跑步方案",
//                 "time_of_day": "2024-01-01 00:00:00",
//                 "duration": 180
//             },
//             "outdoor_walking": {
//                 "exercise_plan": "室外健走方案",
//                 "time_of_day": "2024-01-01 00:00:00",
//                 "duration": 180
//             },
//             "outdoor_cycling": {
//                 "exercise_plan": "室外骑行方案",
//                 "time_of_day": "2024-01-01 00:00:00",
//                 "duration": 180
//             }
//         },
//         "sleep": {
//             "sleep_time": "2024-01-01 00:00:00",
//             "wake_time": "2024-01-02 07:00:00",
//             "duration": 420
//         }

//     }
// 2. 请确保方案的合理性和可行性。
// 3. 生成数据时，只需要给出数据代码即可，无需提供任何解释或说明。
// 4. 直接以文本形式返回数据，不要将生成结果格式化后放在代码块里。`

// ai_ask(question2)
//     .then((res) => {
//         console.log(JSON.parse(res.result.replace(/^\s*```json\s*\n|```$/gm, '')))
//     })
//     .catch((err) => {
//         console.log(err)
//     })

let text = `\`\`\`json
{
  "diet": {
    "breakfast": {
      "food": "燕麦粥",
      "quantity": 1,
      "calories": 250
    },
    "lunch": {
      "food": "烤鸡胸肉配蔬菜沙拉",
      "quantity": 1,
      "calories": 350
    },
    "dinner": {
      "food": "清蒸鱼配绿叶蔬菜",
      "quantity": 1,
      "calories": 300
    }
  },
  "exercise": {
    "indoor_running": {
      "exercise_plan": "每周三次，每次30分钟，保持中等强度",
      "time_of_day": "每周一、三、五 19:00:00",
      "duration": 180
    },
    "outdoor_walking": {
      "exercise_plan": "每周两次，每次45分钟，保持舒适步速",
      "time_of_day": "每周二、四 08:00:00",
      "duration": 270
    }
  },
  "sleep": {
    "sleep_time": "2024-01-01 22:30:00",
    "wake_time": "2024-01-02 06:30:00",
    "duration": 420
  }
}\`\`\`
`

console.log(
    JSON.parse(`{
    "breakfast": [
        {
            "food_id": 2,
            "eat_quantity": 1,
            "calorises_intake": 400
        }
    ],
    "lunch": [
        {
            "food_id": 3,
            "eat_quantity": 1,
            "calorises_intake": 350
        },
        {
            "food_id": 4,
            "eat_quantity": 1,
            "calorises_intake": 450
        }
    ],
    "dinner": [
        {
            "food_id": 5,
            "eat_quantity": 1,
            "calorises_intake": 400
        }
    ],
    "extra_meal": []
}`)
)
