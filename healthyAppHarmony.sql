-- 创建 MySQL 数据库 healthy_DB
-- 接下来的 SQL 语句仅适用于 MySQL 数据库
CREATE DATABASE healthy_DB;

-- 使用 healthy_DB 数据库
USE healthy_DB;

-- 判断用户表是否已经存在，不存在则创建
-- 用户ID：主键、自增长、整数类型、从 1000 开始递增
-- 用户名：字符串类型、长度为 20、可为空
-- 电话：字符串类型、长度为 11、可为空
-- 邮箱：字符串类型长度为 50、可为空
-- 密码：字符串类型、长度为 50、不可为空
-- 密码加密盐：字符串类型、长度为 8、不可为空
-- 头像：字符串类型、长度为 255、可为空
CREATE TABLE IF NOT EXISTS user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NULL,
    phone VARCHAR(11) NULL,
    email VARCHAR(50) NULL,
    password VARCHAR(50) NOT NULL,
    salt VARCHAR(8) NOT NULL,
    avatar VARCHAR(255) NULL
);



-- 判断用户信息表是否已经存在，不存在则创建
-- 用户ID：整数类型、外键，引用用户表的主键
-- 身高：浮点数类型、可为空
-- 体重：浮点数类型、可为空
-- 年龄：整数类型、可为空
-- 生日：日期时间类型、可为空
-- 性别：布尔类型，取值为 '0' 或 '1'，分别表示'男'、'女'，可为空
-- 创建时间：日期时间类型、不可为空
-- 最近修改时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS user_info (
    user_id INT,
    height FLOAT NULL,
    weight FLOAT NULL,
    age INT NULL,
    birthday DATETIME NULL,
    gender BOOLEAN NULL,
    create_time DATETIME NOT NULL,
    update_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);


-- 判断运动记录表是否已经存在，不存在则创建
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 运动类型：字符串类型，'室外跑步'、'室外健走'、'室外骑行'、'室内跑步'、不可为空
-- 运动时间：日期时间类型、不可为空
-- 消耗能量：整数类型、不可为空
-- 运动距离：浮点数类型、不可为空
-- 运动时长：整数类型、不可为空
-- 运动轨迹：文本类型、可为空
-- 创建时间：日期时间类型，不可为空
CREATE TABLE IF NOT EXISTS exercise_record (
    exercise_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    exercise_type VARCHAR(20) NOT NULL,
    exercise_time DATETIME NOT NULL,
    calories_burned INT NOT NULL,
    distance FLOAT NOT NULL,
    duration INT NOT NULL,
    exercise_track TEXT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);


-- 判断食物表是否已经存在，不存在则创建
-- 食物ID：主键、自增长、整数类型
-- 食物名称：字符串类型、长度为 20、不可为空
-- 食物图片：字符串类型、长度为 255、可为空
-- 食物热量：整数类型、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS food (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    food_name VARCHAR(20) NOT NULL,
    food_image VARCHAR(255) NULL,
    calories INT NOT NULL,
    create_time DATETIME NOT NULL
);


-- 判断饮食记录表是否已经存在，不存在则创建
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 饮食类型：字符串类型，长度为 20、'早餐'、'午餐'、'晚餐'、'加餐'、不可为空
-- 食物ID：整数类型、外键，引用食物表的主键
-- 食用时间：日期时间类型、不可为空
-- 食用数量：整数类型、不可为空
-- 摄入热量：整数类型、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS diet_record (
    diet_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    diet_type VARCHAR(20) NOT NULL,
    food_id INT,
    eat_time DATETIME NOT NULL,
    eat_quantity INT NOT NULL,
    calories_intake INT NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (food_id) REFERENCES food(food_id)
);


-- 判断睡眠记录表是否已经存在，不存在则创建
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 上床时间：日期时间类型，不可为空
-- 入睡上床时间间隔：整数类型、不可为空
-- 醒来时间：日期时间类型，不可为空
-- 醒来起床时间间隔：整数类型、不可为空
-- 卧床时间：整数类型，不可为空
-- 睡眠时间：整数类型，不可为空
-- 睡眠质量：字符串类型、长度为20、'优质睡眠'、'良好睡眠'、'一般睡眠'、'差睡眠'、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS sleep_record (
    sleep_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    bed_time DATETIME NOT NULL,
    sleep_interval INT NOT NULL,
    wake_time DATETIME NOT NULL,
    wake_up_interval INT NOT NULL,
    bed_time_duration INT NOT NULL,
    sleep_duration INT NOT NULL,
    sleep_quality VARCHAR(20) NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);


-- 判断健康指标记录表是否已经存在，不存在则创建
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 测量时间：日期时间类型、不可为空
-- 测量类型：字符串类型，长度为20、'血压'、'心率'、'体温'、'血糖'、'血氧'、'体温'、不可为空
-- 测量结果：字符串类型、长度为20、根据测量类型不同，对应不同测量结果
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS health_indicator_record (
    health_indicator_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    measure_time DATETIME NOT NULL,
    measure_type VARCHAR(20) NOT NULL,
    measure_result VARCHAR(20) NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);



-- 判断减脂计划表是否已经存在，不存在则创建
-- 计划ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 计划名称：字符串类型、长度为20、不可为空
-- 计划目标体重：浮点数类型、不可为空
-- 计划减重速度：字符串类型、长度为2、'推荐'、'快速'、'激进'、不可为空
-- 重点减脂部位：字符串类型、长度为14，不可为空
-- 预期结果：字符串类型、长度为100、根据计划目标不同，对应不同预期结果
-- 计划周期：整数类型、不可为空
-- 计划开始时间：日期时间类型、不可为空
-- 计划结束时间：日期时间类型、不可为空
-- 创建日期：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS fat_loss_plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    plan_name VARCHAR(20) NOT NULL,
    target_weight FLOAT NOT NULL,
    reduction_speed VARCHAR(2) NOT NULL,
    focus_area VARCHAR(14) NOT NULL,
    expected_result VARCHAR(100) NOT NULL,
    plan_cycle INT NOT NULL,
    plan_start_time DATETIME NOT NULL,
    plan_end_time DATETIME NOT NULL,
    create_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);


-- 判断减脂记录表是否已经存在，不存在则创建
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 计划ID：整数类型、外键，引用减脂计划表的主键
-- 记录时间：日期时间类型、不可为空
-- 记录类型：字符串类型、长度为20、'体重'、'饮食'、'运动'、不可为空
-- 记录内容：字符串类型、长度为20、根据记录类型不同，对应不同记录内容
-- 记录数值：整数类型、根据记录类型不同，对应不同记录数值
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS fat_loss_record (
    fat_loss_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    plan_id INT,
    record_time DATETIME NOT NULL,
    record_type VARCHAR(20) NOT NULL,
    record_content VARCHAR(20) NOT NULL,
    record_value INT NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (plan_id) REFERENCES fat_loss_plan(plan_id)
)


-- 判断运动计划表是否已经存在，不存在则创建
-- 计划ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 减脂计划表ID：整数类型、外键，引用减脂计划表的主键
-- 运动类型：字符串类型、长度为20、'室内跑步'、'室内健走'、'室内骑行'、'室外跑步'、'室外健走'、'室外骑行'、不可为空
-- 运动时间：日期时间类型、不可为空
-- 运动距离：浮点数类型、不可为空
-- 运动时长：整数类型、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS exercise_plan (
    exercise_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    fat_loss_plan_id INT,
    exercise_type VARCHAR(20) NOT NULL,
    exercise_time DATETIME NOT NULL,
    distance FLOAT NOT NULL,
    duration INT NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (fat_loss_plan_id) REFERENCES fat_loss_plan(plan_id)
)


-- 判断AI方案表是否已经存在，不存在则创建
-- 方案ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 计划表ID：整数类型、外键，引用减脂计划表的主键
-- 方案名称：字符串类型、长度为20、不可为空
-- 推荐摄入热量：整数类型、不可为空
-- 推荐膳食搭配：字符串类型、长度为200、不可为空
-- 推荐运动计划：字符串类型、长度为200、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS ai_plan (
    ai_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    fat_loss_plan_id INT,
    plan_name VARCHAR(20) NOT NULL,
    recommended_calories INT NOT NULL,
    recommended_diet_combination VARCHAR(200) NOT NULL,
    recommended_exercise_plan TEXT NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (fat_loss_plan_id) REFERENCES fat_loss_plan(plan_id)
)


-- 判断音乐表是否已经存在，不存在则创建
-- 音乐ID：主键、自增长、整数类型
-- 音乐名称：字符串类型、长度为20、不可为空
-- 音乐文件路径：字符串类型、长度为255、不可为空
-- 音乐时长：整数类型、不可为空
-- 标签：字符串类型、长度为50、不可为空
-- 分类：字符串类型、长度为 5、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS music (
    music_id INT AUTO_INCREMENT PRIMARY KEY,
    music_name VARCHAR(20) NOT NULL,
    music_file_path VARCHAR(255) NOT NULL,
    music_duration INT NOT NULL,
    tags VARCHAR(50) NOT NULL,
    category VARCHAR(5) NOT NULL,
    create_time DATETIME NOT NULL
);


-- 判断收藏音乐表是否已经存在，不存在则创建
-- 收藏ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 音乐ID：整数类型、外键，引用音乐表的主键
-- 收藏时间：日期时间类型、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE IF NOT EXISTS favorite_music (
    favorite_music_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    music_id INT,
    favorite_time DATETIME NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (music_id) REFERENCES music(music_id)
)