const { createClient } = require('redis')
const { promisify } = require('util')
const { redis_config } = require('../config/config')
const { logger_redis: logger } = require('./logger')

const redisClient = createClient({
    url: 'redis://localhost:6379',
})

;(async () => {
    await redisClient.connect()
})()

module.exports = {
    set: async (key, value, timeout = '60000') => {
        try {
            return await redisClient.set(key, value, { EX: timeout })
        } catch (error) {
            logger.error('Error setting key:', error)
            throw error
        }
    },
    get: async (key) => {
        try {
            return await redisClient.get(key)
        } catch (error) {
            logger.error('Error getting key:', error)
            throw error
        }
    },
    del: async (key) => {
        try {
            return await redisClient.del(key)
        } catch (error) {
            logger.error('Error deleting key:', error)
            throw error
        }
    },
}
