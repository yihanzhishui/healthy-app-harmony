var FoodItem = /** @class */ (function () {
    function FoodItem(food_id, food_name, food_image, calories, create_time, food_tags) {
        this.food_id = 0
        this.food_name = ''
        this.food_image = ''
        this.calories = 0
        this.create_time = ''
        this.food_tags = ''
        this.eat_quantity = 0
        this.calories_intake = 0
        this.eat_time = ''
        this.food_id = food_id
        this.food_name = food_name
        this.food_image = food_image
        this.calories = calories
        this.create_time = create_time
        this.food_tags = food_tags
    }
    return FoodItem
})()
var SportItem = /** @class */ (function () {
    function SportItem(data) {
        var _a, _b, _c, _d
        this.exercise_plan = (_a = data.exercise_plan) !== null && _a !== void 0 ? _a : ''
        this.exercise_time = (_b = data.exercise_time) !== null && _b !== void 0 ? _b : ''
        this.duration = (_c = data.duration) !== null && _c !== void 0 ? _c : 0
        this.distance = (_d = data.distance) !== null && _d !== void 0 ? _d : 0
    }
    return SportItem
})()
var SleepItem = /** @class */ (function () {
    function SleepItem(data) {
        var _a, _b, _c
        this.sleep_time = (_a = data.sleep_time) !== null && _a !== void 0 ? _a : ''
        this.wake_time = (_b = data.wake_time) !== null && _b !== void 0 ? _b : ''
        this.duration = (_c = data.duration) !== null && _c !== void 0 ? _c : 0
    }
    return SleepItem
})()
var AIPlanItem = /** @class */ (function () {
    function AIPlanItem(data) {
        var _a, _b, _c, _d, _e
        this.plan_name = '高效减肥计划'
        this.plan_cycle = 30
        this.plan_start_time = '2023-06-20'
        this.plan_end_time = '2023-07-20'
        this.calories_intake_per_day = 1500
        this.diet = []
        this.sport = []
        try {
            this.plan_name = (_a = data.plan_name) !== null && _a !== void 0 ? _a : ''
            this.plan_cycle = (_b = data.plan_cycle) !== null && _b !== void 0 ? _b : 0
            this.plan_start_time = (_c = data.plan_start_time) !== null && _c !== void 0 ? _c : ''
            this.plan_end_time = (_d = data.plan_end_time) !== null && _d !== void 0 ? _d : ''
            this.calories_intake_per_day = (_e = data.calories_intake_per_day) !== null && _e !== void 0 ? _e : 0
            // 修改处理diet逻辑
            for (var meal in data.diet) {
                if (data.diet.hasOwnProperty(meal)) {
                    this.diet.push(data.diet[meal])
                }
            }
            // 修改处理exercise逻辑
            if (data.exercise) {
                for (var exercise in data.exercise) {
                    if (data.exercise.hasOwnProperty(exercise)) {
                        this.sport.push([data.exercise[exercise]])
                    }
                }
            }
            this.sleep = data.sleep ? new SleepItem(data.sleep) : new SleepItem({})
        } catch (e) {
            console.error('AIPlanItem:' + e.message)
        }
    }
    return AIPlanItem
})()
var str =
    '{\n\t"status": "success",\n\t"code": 2000,\n\t"message": "\u83B7\u53D6AI\u51CF\u8102\u65B9\u6848\u6210\u529F",\n\t"data": {\n\t\t"plan_name": "\u5065\u5EB7\u51CF\u8102\u8BA1\u5212",\n\t\t"plan_cycle": 30,\n\t\t"plan_start_time": "2023-05-01",\n\t\t"plan_end_time": "2023-05-31",\n\t\t"calories_intake_per_day": 1600,\n\t\t"diet": {\n\t\t\t"breakfast": [\n\t\t\t\t{\n\t\t\t\t\t"food_id": 54,\n\t\t\t\t\t"food_name": "\u9E21\u86CB",\n\t\t\t\t\t"food_image": "/food_image/egg.png",\n\t\t\t\t\t"diet_type": "breakfast",\n\t\t\t\t\t"eat_quantity": 2,\n\t\t\t\t\t"calories_intake": 156\n\t\t\t\t},\n\t\t\t\t{\n\t\t\t\t\t"food_id": 53,\n\t\t\t\t\t"food_name": "\u897F\u7EA2\u67FF",\n\t\t\t\t\t"food_image": "/food_image/tomato.png",\n\t\t\t\t\t"diet_type": "breakfast",\n\t\t\t\t\t"eat_quantity": 2,\n\t\t\t\t\t"calories_intake": 36\n\t\t\t\t}\n\t\t\t],\n\t\t\t"lunch": [\n\t\t\t\t{\n\t\t\t\t\t"food_id": 52,\n\t\t\t\t\t"food_name": "\u5927\u7C73",\n\t\t\t\t\t"food_image": "/food_image/rice.png",\n\t\t\t\t\t"diet_type": "lunch",\n\t\t\t\t\t"eat_quantity": 0.5,\n\t\t\t\t\t"calories_intake": 175\n\t\t\t\t},\n\t\t\t\t{\n\t\t\t\t\t"food_id": 57,\n\t\t\t\t\t"food_name": "\u83E0\u83DC",\n\t\t\t\t\t"food_image": "/food_image/spinach.png",\n\t\t\t\t\t"diet_type": "lunch",\n\t\t\t\t\t"eat_quantity": 150,\n\t\t\t\t\t"calories_intake": 345\n\t\t\t\t}\n\t\t\t],\n\t\t\t"dinner": [\n\t\t\t\t{\n\t\t\t\t\t"food_id": 56,\n\t\t\t\t\t"food_name": "\u7389\u7C73\u9762",\n\t\t\t\t\t"food_image": "/food_image/corn.png",\n\t\t\t\t\t"diet_type": "dinner",\n\t\t\t\t\t"eat_quantity": 0.2,\n\t\t\t\t\t"calories_intake": 73\n\t\t\t\t},\n\t\t\t\t{\n\t\t\t\t\t"food_id": 53,\n\t\t\t\t\t"food_name": "\u897F\u7EA2\u67FF",\n\t\t\t\t\t"food_image": "/food_image/tomato.png",\n\t\t\t\t\t"diet_type": "dinner",\n\t\t\t\t\t"eat_quantity": 2,\n\t\t\t\t\t"calories_intake": 36\n\t\t\t\t},\n\t\t\t\t{\n\t\t\t\t\t"food_id": 54,\n\t\t\t\t\t"food_name": "\u9E21\u86CB",\n\t\t\t\t\t"food_image": "/food_image/egg.png",\n\t\t\t\t\t"diet_type": "dinner",\n\t\t\t\t\t"eat_quantity": 1,\n\t\t\t\t\t"calories_intake": 78\n\t\t\t\t}\n\t\t\t],\n\t\t\t"extra_meal": [\n\t\t\t\t{\n\t\t\t\t\t"food_id": 55,\n\t\t\t\t\t"food_name": "\u674F\u4EC1",\n\t\t\t\t\t"food_image": "/food_image/almond.jpg",\n\t\t\t\t\t"diet_type": "extra_meal",\n\t\t\t\t\t"eat_quantity": 10,\n\t\t\t\t\t"calories_intake": 57.9\n\t\t\t\t}\n\t\t\t]\n\t\t},\n\t\t"exercise": {\n\t\t\t"outdoor_running": {\n\t\t\t\t"exercise_type": "outdoor_running",\n\t\t\t\t"exercise_time": "19:00",\n\t\t\t\t"duration": 30,\n\t\t\t\t"distance": 3000\n\t\t\t}\n\t\t},\n\t\t"sleep": {\n\t\t\t"sleep_time": "22:30",\n\t\t\t"wake_time": "06:30",\n\t\t\t"duration": 420\n\t\t},\n\t\t"fat_loss_plan_id": 8\n\t}\n}'
var data = JSON.parse(str).data
var ai = new AIPlanItem(data)
console.log(JSON.stringify(ai))
