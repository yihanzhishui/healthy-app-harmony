const { db, releaseConnection } = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const redis = require('../utils/redis_manager')

/**
 * 获取音乐分类列表
 */
const getMusicCategoryList = async (req, res) => {
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        // 从音乐表中查询音乐分类，并去重
        let sql = `SELECT DISTINCT category FROM music`
        let [result] = await connection.query(sql)
        if (result.length === 0) {
            send(res, 4004, '没有音乐分类')
            return
        }
        // 处理音乐分类
        let musicCategoryList = []
        result.forEach((item) => {
            musicCategoryList.push(item.category)
        })
        // 查询音乐分类列表
        send(res, 2000, '查询音乐分类列表成功', { category: musicCategoryList })
        await connection.commit()
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取全部音乐信息
 * 支持分页查询，默认第1页，每页10条
 */
const getAllMusicInfo = async (req, res) => {
    const { user_id } = req.body
    const page_number = parseInt(req.body.page_number) || 1
    const page_size = parseInt(req.body.page_size) || 10
    const offset = (page_number - 1) * page_size
    const limit = page_size
    const connection = await db.getConnection()
    try {
        let sql = `SELECT 
                        music.music_id, music.music_name, music.listen_count, music.category ,music.music_album_cover,
                        CASE 
                            WHEN favorite_music.music_id IS NOT NULL THEN 1 
                            ELSE 0 
                        END AS is_favorited
                    FROM 
                        music
                    LEFT JOIN 
                        favorite_music 
                    ON 
                        music.music_id = favorite_music.music_id AND favorite_music.user_id = ?
                    LIMIT
                        ?, ?`
        let [result] = await connection.query(sql, [user_id, offset, limit])
        if (result.length === 0) {
            send(res, 4004, '没有音乐信息')
            return
        }
        send(res, 2000, '查询音乐信息成功', { result })
        await connection.commit()
        logger.info(`用户 ${user_id} 查询音乐信息成功`)
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 根据音乐分类查询音乐基本信息
 * 支持分页查询，默认第1页，每页10条
 */
const getMusicInfoByCategory = async (req, res) => {
    const { user_id, category } = req.body
    const page_number = parseInt(req.body.page_number) || 1
    const page_size = parseInt(req.body.page_size) || 10
    const offset = (page_number - 1) * page_size
    const limit = page_size
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        let sql = `SELECT 
                        music.music_id, music.music_name, music.listen_count, music.category,
                        CASE 
                            WHEN favorite_music.music_id IS NOT NULL THEN 1 
                            ELSE 0 
                        END AS is_favorited
                    FROM 
                        music
                    LEFT JOIN 
                        favorite_music 
                    ON 
                        music.music_id = favorite_music.music_id AND favorite_music.user_id = ?
                    WHERE
                        music.category = ?
                    LIMIT
                        ?, ?`
        let [result] = await connection.query(sql, [user_id, category, offset, limit])
        if (result.length === 0) {
            send(res, 4004, '没有音乐信息')
            return
        }
        send(res, 2000, '查询音乐信息成功', { result })
        await connection.commit()
        logger.info(`用户 ${user_id} 查询音乐信息成功`)
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 获取音乐具体信息
 */
const getMusic = async (req, res) => {
    const { user_id, music_id } = req.query
    const connection = await db.getConnection()
    try {
        let sql = `SELECT 
                        music.music_id, music.music_name, music.music_file_path, music.music_duration, music.music_file_type, music.music_file_size,
                        music.music_file_md5, music.music_album_cover, music.tags, music.category, music.listen_count,
                        CASE 
                            WHEN favorite_music.music_id IS NOT NULL THEN 1 
                            ELSE 0 
                        END AS is_favorited
                    FROM 
                        music
                    LEFT JOIN 
                        favorite_music 
                    ON 
                        music.music_id = favorite_music.music_id AND favorite_music.user_id = ?
                    WHERE
                        music.music_id = ?`
        let [result] = await connection.query(sql, [user_id, music_id])
        if (result.length === 0) {
            send(res, 4004, '没有音乐信息')
            return
        }
        send(res, 2000, '查询音乐信息成功', { ...result[0] })
        await connection.commit()
        logger.info(`用户 ${user_id} 查询音乐信息成功`)
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 处理收藏、取消收藏音乐
 */
const handleFavoriteMusic = async (req, res) => {
    const { user_id, music_id, favorite_time } = req.body
    const connection = await db.getConnection()
    try {
        // 检查用户是否存在
        let sql = `SELECT user_id FROM user WHERE user_id = ? AND is_deleted = '0'`
        let [userCheck] = await connection.query(sql, [user_id])
        if (userCheck.length === 0) {
            send(res, 4004, '用户不存在')
            return
        }
        // 检查音乐是否存在
        sql = `SELECT music_id FROM music WHERE music_id = ?`
        let [musicCheck] = await connection.query(sql, [music_id])
        if (musicCheck.length === 0) {
            send(res, 4004, '音乐不存在')
            return
        }
        // 检查用户是否已收藏该音乐
        sql = `SELECT music_id FROM favorite_music WHERE user_id = ? AND music_id = ?`
        let [favoriteCheck] = await connection.query(sql, [user_id, music_id])
        if (favoriteCheck.length > 0) {
            sql = 'DELETE FROM favorite_music WHERE user_id = ? AND music_id = ?'
            let [result] = await connection.query(sql, [user_id, music_id])
            if (result.length === 0) {
                send(res, 4004, '取消收藏失败')
                return
            }
            send(res, 2000, '取消收藏成功')
            logger.info(`用户 ${user_id} 取消收藏成功`)
        } else {
            sql = 'INSERT INTO favorite_music (user_id, music_id, favorite_time, create_time) VALUES (?, ?, ?, NOW())'
            let [result] = await connection.query(sql, [user_id, music_id, favorite_time])
            if (result.length === 0) {
                send(res, 4004, '收藏音乐失败')
                return
            }
            send(res, 2000, '收藏音乐成功')
            logger.info(`用户 ${user_id} 收藏音乐成功`)
        }
        await connection.commit()
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 根据用户id获取用户收藏的音乐
 */
const getFavoriteMusicListByUserId = async (req, res) => {
    const { user_id } = req.body
    const page_number = parseInt(req.body.page_number) || 1
    const page_size = parseInt(req.body.page_size) || 10
    const offset = (page_number - 1) * page_size
    const limit = page_size
    const connection = await db.getConnection()
    try {
        let sql = `SELECT 
                        music.music_id, music.music_name, music.listen_count, music.category ,music.music_album_cover,
                        1 AS is_favorited
                    FROM 
                        music
                    INNER JOIN 
                        favorite_music 
                    ON 
                        music.music_id = favorite_music.music_id AND favorite_music.user_id = ?
                    ORDER BY 
                        music.music_id ASC
                    LIMIT ? OFFSET ?`
        let [result] = await connection.query(sql, [user_id, limit, offset])
        if (result.length === 0) {
            send(res, 4004, '没有音乐信息')
            return
        }
        send(res, 2000, '查询音乐信息成功', { result })
        await connection.commit()
        logger.info(`用户 ${user_id} 查询音乐信息成功`)
    } catch (error) {
        await connection.rollback()
        logger.error('数据库操作出现错误:', error)
        send(res, 5001, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

module.exports = {
    getMusicCategoryList,
    getAllMusicInfo,
    getMusicInfoByCategory,
    getMusic,
    handleFavoriteMusic,
    getFavoriteMusicListByUserId,
}
