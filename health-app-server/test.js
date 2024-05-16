const calculateAverageTimes = (records) => {
    if (records.length === 0) return {}

    // 函数：提取时间部分并转换为分钟数
    const extractTimeInMinutes = (datetime) => {
        const [hours, minutes, seconds] = datetime.split(' ')[1].split(':').map(Number)
        return hours * 60 + minutes + seconds / 60
    }

    // 函数：提取日期时间部分并转换为时间戳（毫秒数）
    const extractTimestamp = (datetime) => {
        return new Date(datetime).getTime()
    }

    // 函数：计算平均时间部分并返回字符串 HH:mm:ss
    const calculateAverageTime = (timeArray) => {
        const averageMinutes = timeArray.reduce((sum, time) => sum + time, 0) / timeArray.length
        const averageHours = Math.floor(averageMinutes / 60)
        const averageMinutesPart = Math.floor(averageMinutes % 60)
        const averageSecondsPart = Math.round((averageMinutes - Math.floor(averageMinutes)) * 60)
        return `${String(averageHours).padStart(2, '0')}:${String(averageMinutesPart).padStart(2, '0')}:${String(
            averageSecondsPart
        ).padStart(2, '0')}`
    }

    // 函数：计算平均时间戳并返回日期时间字符串
    const calculateAverageTimestamp = (timestampArray) => {
        const averageTimestamp = timestampArray.reduce((sum, time) => sum + time, 0) / timestampArray.length
        const averageDate = new Date(averageTimestamp)
        return averageDate.toISOString().slice(0, 19).replace('T', ' ')
    }

    // 提取并计算各字段的平均值
    const sleepTimes = records.map((record) => extractTimeInMinutes(record.formatted_sleep_time))
    const bedTimes = records.map((record) => extractTimeInMinutes(record.formatted_bed_time))
    const wakeTimes = records.map((record) => extractTimeInMinutes(record.formatted_wake_time))
    const wakeUpTimes = records.map((record) => extractTimeInMinutes(record.formatted_wake_up_time))

    return {
        averageSleepTime: calculateAverageTime(sleepTimes),
        averageBedTime: calculateAverageTime(bedTimes),
        averageWakeTime: calculateAverageTime(wakeTimes),
        averageWakeUpTime: calculateAverageTime(wakeUpTimes),
    }
}
