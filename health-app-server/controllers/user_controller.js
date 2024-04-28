const db = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const bcryptjs = require('bcryptjs')
const TokenManager = require('../utils/token_manager')
const redis = require('../utils/redis_manager')

const db_error = (res, err) => {
    logger.error('数据库查询出现错误：' + err.message)
    send(res, 5001, '数据库查询出现错误')
}
// TODO 记得每次请求过后清除redis中的验证码
/**
 * 处理用户注册
 */
const register = async (req, res) => {
    const { phone, sms_code, password } = req.body
    const sms_code_redis = await redis.get(phone)

    if (sms_code_redis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()
        // 查询用户是否已注册或已注销
        let sql = `SELECT * FROM user WHERE phone = ?`
        let [results] = await connection.query(sql, [phone])

        // 用户已注册且未注销
        if (results.length > 0 && results[0].is_deleted === 0) {
            send(res, 1001, '用户已注册')
            await connection.rollback()
            connection.release()
            return
        }

        let is_deleted = results.length > 0 && results[0].is_deleted === 1 ? 1 : 0
        let user_id = is_deleted ? results[0].user_id : -1

        // 加密密码
        const salt = bcryptjs.genSaltSync(10)
        const hash_password = bcryptjs.hashSync(password, salt)

        // 准备SQL语句
        let insertOrUpdateSql
        let sqlParams
        if (is_deleted === 1) {
            insertOrUpdateSql = `UPDATE user SET password = ?, salt = ?, is_deleted = '0' WHERE phone = ?`
            sqlParams = [hash_password, salt, phone]
        } else {
            insertOrUpdateSql = `INSERT INTO user (phone, password, salt, is_deleted) VALUES (?, ?, ?, '0')`
            sqlParams = [phone, hash_password, salt]
        }

        // 执行插入或更新操作
        ;[results] = await connection.query(insertOrUpdateSql, sqlParams)
        if (results.affectedRows === 1) {
            user_id = is_deleted === 1 ? user_id : results.insertId
            logger.info(`用户 ${phone} 注册成功, user_id = ${user_id}`)

            // 提交事务
            await connection.commit()
            connection.release()
            send(res, 2000, '注册成功', { user_id })
        } else {
            await connection.rollback()
            connection.release()
            logger.info(`用户 ${phone} 注册失败`)
            send(res, 4002, '注册失败')
        }
    } catch (err) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        logger.error('数据库操作出现错误：' + err.message)
        sendError(err, req, res)
        return
    }
}

/**
 * 处理短信验证码登录
 */
const loginBySMSCode = async (req, res) => {
    const { phone, sms_code } = req.body
    const sms_code_redis = await redis.get(phone)

    if (sms_code_redis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()

        // 查询用户是否存在且未被删除
        let sql = `SELECT * FROM user WHERE phone = ? AND is_deleted = '0'`
        const [results] = await connection.query(sql, [phone])

        // 用户不存在
        if (results.length === 0) {
            await connection.rollback()
            connection.release()
            send(res, 1001, '用户不存在')
            return
        }

        // 准备用户信息payload，去除敏感信息
        const payload = { ...results[0], password: '', salt: '', avatar: '' }

        // 使用TokenManager生成并存储Token
        try {
            const tokenManager = new TokenManager()
            const token = await tokenManager.generateToken(payload)
            tokenManager.storeToken(token, payload.user_id)

            // 登录成功，提交事务
            await connection.commit()
            connection.release()
            logger.info(`用户 ${payload.user_id} 通过短信验证码登录成功`)
            send(res, 2000, '登录成功', { user_id: payload.user_id, token: 'Bearer ' + token })
        } catch (tokenError) {
            // Token生成或存储失败，回滚事务
            await connection.rollback()
            connection.release()
            db_error(res, tokenError)
        }
    } catch (dbError) {
        // 数据库查询异常，回滚事务
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        logger.error('数据库查询出现错误：' + dbError.message)
        send(res, 500, '服务器内部错误')
    }
}

/**
 * 处理邮箱验证码登录
 */
const loginByEmailCode = async (req, res) => {
    const { email, email_code } = req.body

    // 验证码校验
    const emailCodeRedis = await redis.get(email)
    if (emailCodeRedis !== email_code) {
        send(res, 4002, '验证码错误')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        let payload = {}
        const sql = `SELECT * FROM user WHERE email = ? AND is_deleted = 0`
        const [results] = await connection.query(sql, [email])

        if (results.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            connection.release() // 释放连接
            send(res, 1001, '用户不存在')
            return
        }

        payload = {
            ...results[0],
            password: undefined, // 更安全地处理密码字段
            salt: undefined,
            avatar: undefined,
        }

        try {
            const tokenManager = new TokenManager()
            const token = await tokenManager.generateToken(payload)
            await tokenManager.storeToken(token, payload.user_id) // 储存token

            await connection.commit() // 所有操作成功，提交事务
            connection.release() // 释放连接

            logger.info(`用户 ${payload.user_id} 通过邮箱验证码登录成功`)
            send(res, 2000, '登录成功', { user_id: payload.user_id, token: `Bearer ${token}` })
        } catch (tokenError) {
            await connection.rollback() // token生成或存储失败，事务回滚
            connection.release() // 释放连接
            db_error(res, tokenError)
        }
    } catch (dbError) {
        if (connection) {
            await connection.rollback() // 数据库查询异常，事务回滚
            connection.release() // 释放连接
        }
        logger.error('数据库查询出现错误：' + dbError.message)
        send(res, 500, '服务器内部错误')
    }
}

// TODO
/**
 *  处理华为账号登录
 */
// const loginByHuaweiAccount = (req, res) => {
//     const { huawei_auth_token } = req.body
//     if (!huawei_auth_token) {
//         sendError(res, 4002, '华为账号授权失败')
//         return
//     }
//     let payload = {}
//     let sql = `SELECT * FROM user WHERE huawei_auth_token = '${huawei_auth_token}'`
//     // 查询数据库中是否已经存在该用户
// }

/**
 * 处理密码登录
 */
const loginByPassword = async (req, res) => {
    const account = req.body.phone || req.body.email
    const password = req.body.password

    if (!account || !password) {
        send(res, 400, '账号或密码不能为空')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        let payload = {}
        let sql = `SELECT * FROM user WHERE phone = ? OR email = ?`
        const [results] = await connection.query(sql, [account, account])

        if (results.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            connection.release() // 释放连接
            send(res, 1001, '用户不存在')
            return
        }

        const user = results[0]
        // 使用bcrypt的compare方法直接比较密码
        const passwordMatch = await bcryptjs.compare(password, user.password)

        if (!passwordMatch) {
            await connection.rollback() // 密码错误，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '密码错误')
            return
        }

        payload = {
            ...user,
            password: undefined, // 清除密码信息
            salt: undefined,
            avatar: undefined,
        }

        try {
            const tokenManager = new TokenManager()
            const token = await tokenManager.generateToken(payload)
            await tokenManager.storeToken(token, payload.user_id) // 存储token

            await connection.commit() // 密码正确，提交事务
            connection.release() // 释放连接

            logger.info(`用户 ${payload.user_id} 通过账号密码登录成功`)
            send(res, 2000, '登录成功', { user_id: payload.user_id, token })
        } catch (tokenError) {
            await connection.rollback() // token生成或存储失败，事务回滚
            connection.release() // 释放连接
            db_error(res, tokenError)
        }
    } catch (dbError) {
        if (connection) {
            await connection.rollback() // 数据库查询异常，事务回滚
            connection.release() // 释放连接
        }
        logger.error('数据库查询出现错误：' + dbError.message)
        send(res, 500, '服务器内部错误')
    }
}

/**
 * 处理绑定邮箱号
 */
const bindEmail = async (req, res) => {
    const { user_id, email, email_code } = req.body

    // 验证验证码
    const emailCodeRedis = await redis.get(email)
    if (emailCodeRedis !== email_code) {
        send(res, 4002, '验证码错误')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 检查用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '用户不存在')
            return
        }

        // 检查邮箱是否已绑定其他账号
        if (userResults[0].email) {
            await connection.rollback() // 邮箱已绑定，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '该邮箱已绑定其他账号')
            return
        }

        // 绑定邮箱
        sql = 'UPDATE user SET email = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [email, user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 绑定成功，提交事务
            connection.release() // 释放连接
            logger.info(`用户 ${user_id} 绑定邮箱成功, 成功修改 1 条数据`)
            send(res, 2000, '绑定邮箱成功')
        } else {
            await connection.rollback() // 更新失败，事务回滚
            connection.release() // 释放连接
            send(res, 5000, '绑定邮箱失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
            connection.release() // 释放连接
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    }
}

/**
 * 处理绑定华为账号
 */
const bindHuaweiAccount = (req, res) => {
    const { user_id, huawei_auth_token } = req.body
    if (!huawei_auth_token) {
        send(res, 4002, '华为账号授权失败')
        return
    }
    // 查询数据库中是否已经存在该用户
    let sql = `SELECT * FROM user WHERE user_id = ?`
    db.query(sql, user_id, (err, results) => {
        if (err) {
            db_error(res, err)
            return
        }
        // 用户不存在
        if (results.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        if (results.length > 1) {
            send(res, 4004, '该华为账号已绑定其他账号')
            return
        }
        // 用户存在，可以绑定华为账号
        sql = `UPDATE user SET huawei_auth_token = ? WHERE user_id = ?`
        db.query(sql, [huawei_auth_token, user_id], (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            if (results.affectedRows === 1) {
                // 绑定华为账号成功
                logger.info(`用户 ${user_id} 绑定华为账号成功, 成功修改 1 条数据`)
                send(res, 2000, '绑定华为账号成功')
                return
            }
        })
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
}

/**
 * 处理修改昵称
 */
const changeUsername = async (req, res) => {
    const { user_id, username } = req.body

    if (!username) {
        send(res, 4002, '昵称不能为空')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '用户不存在')
            return
        }

        // 修改用户名
        sql = 'UPDATE user SET username = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [username, user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 修改成功，提交事务
            connection.release() // 释放连接
            logger.info(`用户 ${user_id} 修改昵称成功, 成功修改 1 条数据`)
            send(res, 2000, '修改昵称成功', { username })
        } else {
            await connection.rollback() // 更新失败，事务回滚
            connection.release() // 释放连接
            send(res, 5000, '修改昵称失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
            connection.release() // 释放连接
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    }
}

/**
 * 处理修改头像
 */
const changeAvatar = async (req, res) => {
    const { user_id, avatar } = req.body

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '用户不存在')
            return
        }

        // 修改用户头像
        sql = 'UPDATE user SET avatar = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [avatar, user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 修改成功，提交事务
            connection.release() // 释放连接
            logger.info(`用户 ${user_id} 修改头像成功, 成功修改 1 条数据`)
            send(res, 2000, '修改头像成功', { avatar })
        } else {
            await connection.rollback() // 更新失败，事务回滚
            connection.release() // 释放连接
            send(res, 5000, '修改头像失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
            connection.release() // 释放连接
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    }
}

/**
 * 处理修改密码
 */
const changePassword = async (req, res) => {
    const { user_id, old_password, new_password, phone, sms_code } = req.body
    const smsCodeRedis = await redis.get(phone)
    if (smsCodeRedis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '用户不存在')
            return
        }

        // 验证旧密码
        const { password: hashPassword, salt } = userResults[0]
        const oldSaltPassword = bcryptjs.hashSync(old_password, salt)
        if (oldSaltPassword !== hashPassword) {
            await connection.rollback() // 旧密码错误，事务回滚
            connection.release() // 释放连接
            send(res, 4003, '旧密码错误')
            return
        }

        // 生成新密码的盐并加密新密码
        const newSalt = bcryptjs.genSaltSync(10)
        const newSaltPassword = bcryptjs.hashSync(new_password, newSalt)

        // 更新密码
        sql = 'UPDATE user SET password = ?, salt = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [newSaltPassword, newSalt, user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 更新成功，提交事务
            connection.release() // 释放连接
            logger.info(`用户 ${user_id} 修改密码成功, 成功修改 1 条数据`)
            send(res, 2000, '修改密码成功，请重新登录')
        } else {
            await connection.rollback() // 更新失败，事务回滚
            connection.release() // 释放连接
            send(res, 5000, '修改密码失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
            connection.release() // 释放连接
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    }
}

/**
 * 处理退出登录
 */
const logout = (req, res) => {
    try {
        send(res, 2000, '退出登录成功')
        return
    } catch (error) {
        logger.error('服务器内部错误：' + error.message)
        send(res, 5000, '服务器内部错误')
        return
    }
}

/**
 * 处理注销账户
 */
const deleteUser = async (req, res) => {
    const { user_id, phone, sms_code } = req.body
    const sms_code_redis = await redis.get(phone)

    if (sms_code_redis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }

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

        // 用户存在，尝试注销账户
        sql = `UPDATE user SET is_deleted = '1' WHERE user_id = ?`
        ;[results] = await connection.query(sql, [user_id])

        if (results.affectedRows !== 1) {
            // 更新影响行数不为1，事务需要回滚
            await connection.rollback()
            send(res, 5001, '注销账户失败')
            connection.release() // 释放连接
            return
        }

        // 注销账户成功，删除redis中的用户信息
        const tokenManager = new TokenManager()
        const token = req.headers.authorization || req.headers.token
        tokenManager.removeToken(token)
        logger.info(`用户 ${user_id} 注销账户成功, 成功修改 1 条数据`)

        // 提交事务
        await connection.commit()
        connection.release() // 释放连接
        send(res, 2000, '注销账户成功')
    } catch (error) {
        // 捕获到任何异常，事务回滚
        await connection.rollback()
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 4003, '服务器内部错误')
        connection.release() // 释放连接
    }
}

module.exports = {
    register,
    loginBySMSCode,
    loginByEmailCode,
    loginByPassword,
    // loginByHuaweiAccount,
    changeUsername,
    changeAvatar,
    changePassword,
    deleteUser,
    bindEmail,
    bindHuaweiAccount,
    logout,
}
