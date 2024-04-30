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

const music = [
    {
        music_name: '下雨声，助眠纯音乐，白噪音',
        music_file_path: 'http://127.0.0.1:3000/music/A-60分钟雨声白噪音_下雨声_助眠纯音乐.mp3',
        music_duration: '60:00:00',
        music_file_type: 'mp3',
        music_file_size: 27.7,
        music_file_md5: 'ade1d8db0a8a1efde1a577bf52e39a14',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/A-60分钟雨声白噪音_下雨声_助眠纯音乐.jpg',
        tags: '白噪音,助眠,雨声',
        category: '安心入眠',
        listen_count: 10,
    },
    {
        music_name: '乡村，远山炊烟，治愈烟火气',
        music_file_path: 'http://127.0.0.1:3000/music/A-乡村环境音_远山炊烟_治愈的烟火气.mp3',
        music_duration: '00:30:38',
        music_file_type: 'mp3',
        music_file_size: 14.1,
        music_file_md5: 'c86639854ec8727e3b4b603e89683142',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/A-乡村环境音_远山炊烟_治愈的烟火气.jpg',
        tags: '宁静,鸟语花香,惬意午休',
        category: '惬意午休',
        listen_count: 25,
    },
    {
        music_name: '小区，清晨，鸟语花香',
        music_file_path: 'http://127.0.0.1:3000/music/A-小区清晨鸟语花香白噪音.m4a',
        music_duration: '00:35:19',
        music_file_type: 'm4a',
        music_file_size: 16.7,
        music_file_md5: '8c5e62aa7a92f1986567fc748db95c45',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/A-小区清晨鸟语花香白噪音.jpg',
        tags: '快速清醒,惬意清晨,鸟语花香',
        category: '快速清醒',
        listen_count: 23,
    },
    {
        music_name: '全景观绕，舒缓，助眠雨声',
        music_file_path: 'http://127.0.0.1:3000/music/B-8D全景声音环绕_432hz更舒缓更助眠雨声-白噪音.aac',
        music_duration: '00:44:46',
        music_file_type: 'aac',
        music_file_size: 21.7,
        music_file_md5: 'de5479020c11855c632bd081ab2973f7',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/B-8D全景声音环绕_432hz更舒缓更助眠雨声-白噪音.jpg',
        tags: '全景观绕,助眠雨声,宁静悠闲',
        category: '深睡助眠',
        listen_count: 29,
    },
    {
        music_name: '大自然，下雨天',
        music_file_path: 'http://127.0.0.1:3000/music/B-白噪音_聆听大自然_睡眠_助眠_下雨天.mp3',
        music_duration: '00:44:29',
        music_file_type: 'mp3',
        music_file_size: 40.7,
        music_file_md5: '94266ebb59a9db9620ec78da9b61c767',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/B-白噪音_聆听大自然_睡眠_助眠_下雨天.jpg',
        tags: '拥抱自然,助眠雨声,宁静悠闲',
        category: '快速入睡',
        listen_count: 29,
    },
    {
        music_name: '温暖，壁炉中燃烧的柴火',
        music_file_path: 'http://127.0.0.1:3000/music/B-壁炉中燃烧的柴火_非循环白噪音舒缓解压.wav',
        music_duration: '00:35:52',
        music_file_type: 'wav',
        music_file_size: 90.5,
        music_file_md5: '240066869980eb96cae06c865a40d1c2',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/B-壁炉中燃烧的柴火_非循环白噪音舒缓解压.jpg',
        tags: '温暖,舒缓解压,宁静悠闲',
        category: '安心入睡',
        listen_count: 29,
    },
    {
        music_name: '舒缓助眠音乐',
        music_file_path: 'http://127.0.0.1:3000/music/W-大堡礁.mp3',
        music_duration: '00:02:23',
        music_file_type: 'mp3',
        music_file_size: 2.5,
        music_file_md5: 'f0daddde1f8df956788e6804158f774b',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/W-大堡礁.jpg',
        tags: '舒缓助眠',
        category: '专心学习',
        listen_count: 29,
    },
    {
        music_name: '钢琴，雨声',
        music_file_path: 'http://127.0.0.1:3000/music/W-蓝色溶洞.mp3',
        music_duration: '00:02:58',
        music_file_type: 'mp3',
        music_file_size: 2.72,
        music_file_md5: 'dd65b13c4ade62aeac1ce79c95a213b0',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/W-蓝色溶洞.jpg',
        tags: '钢琴雨声,舒缓助眠',
        category: '专心学习',
        listen_count: 29,
    },
    {
        music_name: '绿色萤火虫',
        music_file_path: 'http://127.0.0.1:3000/music/W-绿色萤火虫.mp3',
        music_duration: '00:01:59',
        music_file_type: 'mp3',
        music_file_size: 1.82,
        music_file_md5: 'f520709d9c33d7f0c4973aec8b583e69',
        music_album_cover: 'http://127.0.0.1:3000/music_cover/W-绿色萤火虫.jpg',
        tags: '钢琴雨声,舒缓助眠',
        category: '专心学习',
        listen_count: 29,
    },
]

// const music = [
//     {
//         music_name: '下雨声，助眠纯音乐，白噪音',
//         music_file_path: 'http://127.0.0.1:3000/music/A-60分钟雨声白噪音_下雨声_助眠纯音乐.mp3',
//         music_duration: '60:00:00',
//         music_file_type: 'mp3',
//         music_file_size: 27.7,
//         music_file_md5: 'ade1d8db0a8a1efde1a577bf52e39a14',
//         music_album_cover: 'http://127.0.0.1:3000/music_cover/A-60分钟雨声白噪音_下雨声_助眠纯音乐.jpg',
//         tags: '白噪音,助眠,雨声',
//         category: '安心入眠',
//         listen_count: 10,
//     },
// ]

// 将上述数据插入到数据库中。
const insertFood = async () => {
    const connection = await db.getConnection()
    let food_sql =
        'INSERT INTO food (food_name, food_image, calories, food_tags, create_time) VALUES (?, ?, ?, ?, NOW())'
    let music_sql = `INSERT INTO music (music_name, music_file_path, music_duration, music_file_type, music_file_size, music_file_md5, music_album_cover, tags, category, listen_count, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`
    try {
        for (const item of music) {
            await connection.query(music_sql, [
                item.music_name,
                item.music_file_path,
                convertTimeToSeconds(item.music_duration),
                item.music_file_type,
                item.music_file_size,
                item.music_file_md5,
                item.music_album_cover,
                item.tags,
                item.category,
                item.listen_count,
            ])
        }
    } catch (error) {
        console.log(error)
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}
function convertTimeToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number)
    return hours * 3600 + minutes * 60 + seconds
}

insertFood()
