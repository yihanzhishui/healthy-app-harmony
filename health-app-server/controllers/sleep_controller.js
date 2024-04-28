const db = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')

/**
 * 处理记录睡眠
 */
const recordSleep = async (req, res) => {
    const { user_id, bed_time, sleep_interval, wake_time, wake_up_interval, record_time } = req.body

    const { sleep_duration, sleep_quality, sleep_time, wake_up_time, bed_time_duration } = calculateSleepQuality(
        bed_time,
        sleep_interval,
        wake_time,
        wake_up_interval
    )
    const connection = await db.getConnection()
    // 开始事务
    try {
        await connection.beginTransaction()
        // 查询数据库中是否已经存在该用户
        let sql = `SELECT * FROM user WHERE user_id = ? AND is_deleted = '0'`
        ;[results] = await connection.query(sql, [user_id])

        // 用户不存在
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }

        // 用户存在，尝试插入睡眠记录
        sql = `INSERT INTO sleep_record (user_id, bed_time, sleep_interval, wake_time, wake_up_interval, bed_time_duration, sleep_duration,
            sleep_quality, sleep_time, wake_up_time, record_time, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`
        let params = [
            user_id,
            bed_time,
            sleep_interval,
            wake_time,
            wake_up_interval,
            bed_time_duration,
            sleep_duration,
            sleep_quality,
            sleep_time,
            wake_up_time,
            record_time,
        ]
        ;[results] = await connection.query(sql, params)

        if (results.affectedRows !== 1) {
            // 更新影响行数不为1，事务需要回滚
            await connection.rollback()
            logger.error(`用户 ${user_id} 新增睡眠记录失败:` + error.message)
            send(res, 5001, '新增睡眠记录失败')
            connection.release() // 释放连接
            return
        }

        // 提交事务
        await connection.commit()
        connection.release() // 释放连接
        logger.info(`用户 ${user_id} 新增睡眠记录成功`)
        send(res, 2000, '新增记录成功', params)
    } catch (error) {
        // 捕获到任何异常，事务回滚
        await connection.rollback()
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 4003, '服务器内部错误')
        connection.release() // 释放连接
    }
}

/**
 * 处理获取睡眠记录
 * @param {number} num 获取几条
 */
const getSleepRecord = async (req, res) => {
    // 获取几条数据
    const number = req.number
    const user_id = req.body.user_id
    const connection = await db.getConnection()
    try {
        // 开始事务
        await connection.beginTransaction()
        let sql = `SELECT * FROM sleep_record WHERE user_id = ? ORDER BY record_time DESC LIMIT ?`
        ;[results] = await connection.query(sql, [user_id, number])
        if (results) {
            // 将results结果中的iso时间格式转化为 yyyy-MM-dd HH:mm:ss 格式，将分钟转化成{hour: 0, minute: 0}格式
            results.forEach((result) => {
                result.bed_time = result.bed_time.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                result.wake_time = result.wake_time.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                result.sleep_time = result.record_time.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                result.wake_up_time = result.create_time.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                result.record_time = result.create_time.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                result.create_time = result.create_time.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                result.bed_time_duration = convertMinutesToTimeObject(result.bed_time_duration)
                result.sleep_duration = convertMinutesToTimeObject(result.sleep_duration)
                result.wake_up_interval = convertMinutesToTimeObject(result.wake_up_interval)
            })
        }
        await connection.commit()
        connection.release() // 释放连接
        logger.info(`用户 ${user_id} 获取睡眠记录成功`)
        send(res, 2000, '获取睡眠记录成功', results)
    } catch (error) {
        // 捕获到任何异常，事务回滚
        await connection.rollback()
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5001, '服务器内部错误')
        connection.release() // 释放连接
    }
}

/**
 * 计算睡眠质量
 *  @param {string} bedTimeString 入睡时间
 *  @param {number} fallAsleepTimeMin 入睡时长
 *  @param {string} wakeUpTimeString 醒来时间
 *  @param {number} wakeToRiseTimeMin 醒来时长
 *  @returns {object} 睡眠质量信息
 */
const calculateSleepQuality = (bedTimeString, fallAsleepTimeMin, wakeUpTimeString, wakeToRiseTimeMin) => {
    function parseTime(timeString) {
        const [datePart, timePart] = timeString.split(' ')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hour, minute, second] = timePart.split(':').map(Number)
        return new Date(year, month - 1, day, hour, minute, second) // 注意：JavaScript中的月份是从0开始的
    }

    function formatTime(dateObj) {
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0') // 月份加1并补0
        const day = String(dateObj.getDate()).padStart(2, '0')
        const hour = String(dateObj.getHours()).padStart(2, '0')
        const minute = String(dateObj.getMinutes()).padStart(2, '0')
        const second = String(dateObj.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }

    const bedTime = parseTime(bedTimeString)
    const wakeUpTime = parseTime(wakeUpTimeString)

    let totalTimeInBed = (wakeUpTime - bedTime) / (1000 * 60) // 卧床时间，转换为分钟
    if (totalTimeInBed < 0) {
        totalTimeInBed += 24 * 60 // 跨越午夜加一天的分钟数
    }

    const actualSleepTime = totalTimeInBed - fallAsleepTimeMin - wakeToRiseTimeMin // 实际睡眠时间

    // 计算实际睡着时间和起床时间
    const actualAsleepTime = new Date(bedTime.getTime() + fallAsleepTimeMin * 60 * 1000)
    const actualGetUpTime = new Date(wakeUpTime.getTime() + wakeToRiseTimeMin * 60 * 1000)

    let sleepQuality
    if (actualSleepTime >= 420 && actualSleepTime <= 540) {
        // 7-9小时
        sleepQuality = '优质睡眠'
    } else if ((actualSleepTime >= 360 && actualSleepTime < 420) || (actualSleepTime > 540 && actualSleepTime <= 600)) {
        // 6或10小时
        sleepQuality = '中等睡眠'
    } else if (actualSleepTime < 360) {
        sleepQuality = '睡眠不足'
    } else {
        sleepQuality = '睡眠过度'
    }

    return {
        sleep_duration: actualSleepTime,
        sleep_quality: sleepQuality,
        sleep_time: formatTime(actualAsleepTime),
        wake_up_time: formatTime(actualGetUpTime),
        bed_time_duration: parseInt(totalTimeInBed.toFixed(0)),
    }
}

/**
 * 将时间分钟数转换为{hour: 0, minute: 0}格式
 * @param {number} minutes 分钟数
 * @returns {object} 格式化后的时间对象
 */
const convertMinutesToTimeObject = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return {
        hours: hours,
        minutes: remainingMinutes,
    }
}

module.exports = {
    recordSleep,
    getSleepRecord,
}
