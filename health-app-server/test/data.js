const { db, releaseConnection } = require('../utils/database')

const food = [
    {
        food_name: '大米',
        food_image: 'http://127.0.0.1:3000/food_image/rice.png',
        calories: 350,
        food_tags: '主食',
    },
    {
        food_name: '西红柿',
        food_image: 'http://127.0.0.1:3000/food_image/tomato.png',
        calories: 18,
        food_tags: '果蔬',
    },
    {
        food_name: '鸡蛋',
        food_image: 'http://127.0.0.1:3000/food_image/egg.png',
        calories: 78,
        food_tags: '肉蛋奶',
    },
    {
        food_name: '杏仁',
        food_image: 'http://127.0.0.1:3000/food_image/almond.jpg',
        calories: 579,
        food_tags: '坚果',
    },
    {
        food_name: '玉米面',
        food_image: 'http://127.0.0.1:3000/food_image/corn.png',
        calories: 365,
        food_tags: '主食',
    },
    {
        food_name: '菠菜',
        food_image: 'http://127.0.0.1:3000/food_image/spinach.png',
        calories: 23,
        food_tags: '果蔬,其他',
    },
    {
        food_name: '牛奶',
        food_image: 'http://127.0.0.1:3000/food_image/milk.png',
        calories: 42,
        food_tags: '肉蛋奶',
    },
    {
        food_name: '核桃',
        food_image: 'http://127.0.0.1:3000/food_image/walnut.jpg',
        calories: 654,
        food_tags: '坚果',
    },
    {
        food_name: '燕麦片',
        food_image: 'http://127.0.0.1:3000/food_image/oats.jpg',
        calories: 389,
        food_tags: '主食,其他',
    },
    {
        food_name: '香蕉',
        food_image: 'http://127.0.0.1:3000/food_image/banana.jpg',
        calories: 89,
        food_tags: '果蔬',
    },
    {
        food_name: '鸡胸肉',
        food_image: 'http://127.0.0.1:3000/food_image/breasts.png',
        calories: 165,
        food_tags: '肉蛋奶',
    },
    {
        food_name: '花生',
        food_image: 'http://127.0.0.1:3000/food_image/peanuts.jpg',
        calories: 567,
        food_tags: '坚果',
    },
    {
        food_name: '全麦面包',
        food_image: 'http://127.0.0.1:3000/food_image/whole_wheat_bread.png',
        calories: 265,
        food_tags: '主食',
    },
    {
        food_name: '胡萝卜',
        food_image: 'http://127.0.0.1:3000/food_image/carrot.png',
        calories: 41,
        food_tags: '果蔬',
    },
    {
        food_name: '酸奶',
        food_image: 'http://127.0.0.1:3000/food_image/yogurt.jpg',
        calories: 59,
        food_tags: '肉蛋奶',
    },
    {
        food_name: '腰果',
        food_image: 'http://127.0.0.1:3000/food_image/hazelnuts.png',
        calories: 553,
        food_tags: '坚果',
    },
    {
        food_name: '糙米',
        food_image: 'http://127.0.0.1:3000/food_image/brown_rice.png',
        calories: 348,
        food_tags: '主食',
    },
    {
        food_name: '西兰花',
        food_image: 'http://127.0.0.1:3000/food_image/broccoli.jpg',
        calories: 34,
        food_tags: '果蔬',
    },
    {
        food_name: '奶酪',
        food_image: 'http://127.0.0.1:3000/food_image/cheese.png',
        calories: 402,
        food_tags: '肉蛋奶',
    },
    {
        food_name: '南瓜籽',
        food_image: 'http://127.0.0.1:3000/food_image/pumpkin_seeds.png',
        calories: 552,
        food_tags: '坚果',
    },
    {
        food_name: '黑豆',
        food_image: 'http://127.0.0.1:3000/food_image/black_soybean.png',
        calories: 341,
        food_tags: '主食,果蔬',
    },
    {
        food_name: '蓝莓',
        food_image: 'http://127.0.0.1:3000/food_image/blueberry.png',
        calories: 57,
        food_tags: '果蔬',
    },
    {
        food_name: '鸭蛋',
        food_image: 'http://127.0.0.1:3000/food_image/duck_egg.jpg',
        calories: 186,
        food_tags: '肉蛋奶',
    },
    {
        food_name: '夏威夷果',
        food_image: 'http://127.0.0.1:3000/food_image/macadamia.png',
        calories: 624,
        food_tags: '坚果',
    },
]

// 将上述数据插入到数据库中。
const insertFood = async () => {
    const connection = await db.getConnection()
    try {
        for (const item of food) {
            await connection.query(
                'INSERT INTO food (food_name, food_image, calories, food_tags, create_time) VALUES (?, ?, ?, ?, NOW())',
                [item.food_name, item.food_image, item.calories, item.food_tags]
            )
        }
    } catch (error) {
        console.log(error)
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

insertFood()
