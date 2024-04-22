-- 创建 MySQL 数据库 healthy_DB
CREATE DATABASE healthy_DB;

-- 使用 healthy_DB 数据库
USE healthy_DB;

-- 创建用户表
-- 用户ID：主键、自增长、整数类型、从 1000 开始递增
-- 用户名：字符串类型、长度为 20、可为空
-- 电话：字符串类型、长度为 11、可为空
-- 邮箱：字符串类型长度为 50、可为空
-- 密码：字符串类型、长度为 50、不可为空
-- 密码加密盐：字符串类型、长度为 8、不可为空
-- 头像：字符串类型、长度为 255、可为空
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NULL,
    phone VARCHAR(11) NULL,
    email VARCHAR(50) NULL,
    password VARCHAR(50) NOT NULL,
    salt VARCHAR(8) NOT NULL,
    avatar VARCHAR(255) NULL
)


-- 创建用户信息表
-- 用户ID：整数类型、外键，引用用户表的主键
-- 身高：浮点数类型、可为空
-- 体重：浮点数类型、可为空
-- 年龄：整数类型、可为空
-- 生日：日期时间类型、可为空
-- 性别：枚举类型，取值为 '男' 或 '女'
-- 创建时间：日期时间类型、不可为空
-- 最近修改时间：日期时间类型、不可为空
CREATE TABLE user_info (
    user_id INT,
    height FLOAT NULL,
    weight FLOAT NULL,
    age INT NULL,
    birthday DATETIME NULL,
    gender ENUM('男', '女') NULL,
    create_time DATETIME NOT NULL,
    update_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
)


-- 创建运动记录表
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 运动类型：枚举类型，取值为 '室外跑步'、'室外健走'、'室外骑行'、'室内跑步'
-- 运动时间：日期时间类型、不可为空
-- 消耗能量：整数类型、不可为空
-- 运动距离：浮点数类型、不可为空
-- 运动时长：整数类型、不可为空
-- 创建时间：日期时间类型，不可为空
CREATE TABLE exercise_record (
    exercise_record INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    exercise_type ENUM('室外跑步', '室外健走', '室外骑行', '室内跑步', '室外散步') NOT NULL,
    exercise_time DATETIME NOT NULL,
    calories_burned INT NOT NULL,
    distance FLOAT NOT NULL,
    duration INT NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
)


-- 创建食物表
-- 食物ID：主键、自增长、整数类型
-- 食物名称：字符串类型、长度为 20、不可为空
-- 食物图片：字符串类型、长度为 255、可为空
-- 食物热量：整数类型、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE food (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    food_name VARCHAR(20) NOT NULL,
    food_image VARCHAR(255) NULL,
    calories INT NOT NULL,
    create_time DATETIME NOT NULL
)


-- 创建饮食记录表
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 饮食类型：枚举类型，取值为 '早餐'、'午餐'、'晚餐'、'加餐'
-- 食物ID：整数类型、外键，引用食物表的主键
-- 食用时间：日期时间类型、不可为空
-- 食用数量：整数类型、不可为空
-- 摄入热量：整数类型、不可为空
-- 创建时间：日期时间类型、不可为空
CREATE TABLE diet_record (
    diet_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    diet_type ENUM('早餐', '午餐', '晚餐', '加餐') NOT NULL,
    food_id INT,
    eat_time DATETIME NOT NULL,
    quantity INT NOT NULL,
    calories_intake INT NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (food_id) REFERENCES food(food_id)
)


-- 创建睡眠记录表
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 上床时间：日期时间类型，不可为空
-- 入睡上床时间间隔：整数类型、不可为空
-- 醒来时间：日期时间类型，不可为空
-- 醒来起床时间间隔：整数类型、不可为空
-- 卧床时间：整数类型，不可为空
-- 睡眠时间：整数类型，不可为空
-- 睡眠质量：枚举类型、取值为 '优质睡眠'、'良好睡眠'、'一般睡眠'、'差睡眠'
-- 创建时间：日期时间类型、不可为空
CREATE TABLE sleep_record (
    sleep_record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    bed_time DATETIME NOT NULL,
    sleep_duration INT NOT NULL,
    wake_time DATETIME NOT NULL,
    get_up_duration INT NOT NULL,
    sleep_time INT NOT NULL,
    sleep_quality ENUM('优质睡眠', '良好睡眠', '一般睡眠', '差睡眠') NOT NULL,
    create_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
)


-- 创建健康指标记录表
-- 记录ID：主键、自增长、整数类型
-- 用户ID：整数类型、外键，引用用户表的主键
-- 测量时间：日期时间类型、不可为空
-- 测量类型：枚举类型，取值为 '血压'、'心率'、'体温'、'血氧'