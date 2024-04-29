const { db, releaseConnection } = require('../utils/database')
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
    try {
        await connection.beginTransaction()

        const checkUserSql = `SELECT COUNT(*) AS user_exists FROM user WHERE user_id = ? AND is_deleted = '0'`
        const [[userExistsResult]] = await connection.query(checkUserSql, [user_id])

        if (!userExistsResult.user_exists) {
            await connection.rollback()
            send(res, 4003, '用户不存在')
            return
        }

        const insertSql = `
            INSERT INTO sleep_record (
                user_id, bed_time, sleep_interval, wake_time, wake_up_interval, 
                bed_time_duration, sleep_duration, sleep_quality, sleep_time, 
                wake_up_time, record_time, create_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `
        const insertParams = [
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

        const [insertResult] = await connection.query(insertSql, insertParams)

        if (insertResult.affectedRows !== 1) {
            await connection.rollback()
            logger.error(`用户 ${user_id} 新增睡眠记录失败`)
            send(res, 5001, '新增睡眠记录失败')
            return
        }

        await connection.commit()
        logger.info(`用户 ${user_id} 新增睡眠记录成功`)

        // 封装响应数据为对象
        const responseData = {
            status: 'success',
            code: 2000,
            message: '新增记录成功',
            data: {
                insertedRecord: {
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
                    create_time: new Date().toISOString(),
                },
            },
        }

        send(res, responseData.code, responseData.message, responseData.data)
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理获取睡眠记录
 * @param {number} num 获取几条
 */
const getSleepRecord = async (req, res) => {
    const user_id = req.body.user_id
    const number = req.number || 7 // 默认获取本周
    const connection = await db.getConnection()

    try {
        let startDateStr
        if (number === 1) {
            // 查询当天记录
            const today = new Date()
            startDateStr = today.toISOString().split('T')[0]
        } else {
            startDateStr = getStartOfWeekStr()
        }

        let sql = `SELECT 
            *, 
            DATE_FORMAT(bed_time, '%Y-%m-%d %H:%i:%s') AS formatted_bed_time, 
            DATE_FORMAT(wake_time, '%Y-%m-%d %H:%i:%s') AS formatted_wake_time,
            DATE_FORMAT(record_time, '%Y-%m-%d %H:%i:%s') AS formatted_sleep_time,
            DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s') AS formatted_create_time
            FROM sleep_record 
            WHERE user_id = ? AND create_time >= ?
            ORDER BY record_time DESC 
            LIMIT ?`

        // 如果number为1，只获取一条记录；否则获取本周所有记录
        const limit = number === 1 ? 1 : number
        let [results] = await connection.query(sql, [user_id, startDateStr, limit])
        if (results) {
            results.forEach((result) => {
                result.bed_time = result.formatted_bed_time
                result.wake_time = result.formatted_wake_time
                result.sleep_time = result.formatted_sleep_time // 确认这个字段是否需要，SQL中未明确对应字段
                result.wake_up_time = result.formatted_create_time // 确保字段名正确
                result.record_time = result.formatted_create_time
                result.create_time = result.formatted_create_time
                result.bed_time_duration = convertMinutesToTimeObject(result.bed_time_duration)
                result.sleep_duration = convertMinutesToTimeObject(result.sleep_duration)
                result.wake_up_interval = convertMinutesToTimeObject(result.wake_up_interval)
                // 删除不再需要的格式化字段，避免泄露不必要的信息
                delete result.formatted_bed_time
                delete result.formatted_wake_time
                delete result.formatted_sleep_time
                delete result.formatted_create_time
            })
        }

        let message = number === 1 ? '获取当天睡眠记录成功' : '获取本周睡眠记录成功'
        logger.info(`用户 ${user_id} ${message}`)
        send(res, 2000, message, results)
    } catch (error) {
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
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

/**
 * 动态计算本周一的日期
 * @returns {string} 本周一的日期字符串
 */
const getStartOfWeekStr = () => {
    const today = new Date()
    const diff = today.getDay() - 1 // getDay()返回的是0(周日)到6(周六)，我们需要周一，所以减1
    const startOfWeek = new Date(today.setDate(today.getDate() - diff)) // 设置日期为本周一
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0] // 转换为ISO格式日期字符串用于SQL查询
    return startOfWeekStr
}

module.exports = {
    recordSleep,
    getSleepRecord,
}
