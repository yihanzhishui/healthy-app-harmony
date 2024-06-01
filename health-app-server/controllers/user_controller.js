const { db, releaseConnection } = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const bcryptjs = require('bcryptjs')
const TokenManager = require('../utils/token_manager')
const redis = require('../utils/redis_manager')
require('dotenv').config()

const db_error = (res, err) => {
    logger.error('数据库查询出现错误：' + err.message)
    send(res, 5001, '数据库查询出现错误')
}

/**
 * 处理用户注册
 */
const register = async (req, res) => {
    const { phone, sms_code, password } = req.body
    const smsCodeRedis = await redis.get(phone)

    if (smsCodeRedis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }

    // TODO 验证通过，删除验证码
    // await redis.del(phone)

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction()

        // 查询用户是否存在
        let sql = `SELECT * FROM user WHERE phone = ?`
        let [results] = await connection.query(sql, [phone])
        if (results.length > 0) {
            await connection.rollback()
            send(res, 4003, '该手机号已被注册')
            return
        }

        let userRecord = results[0]
        let isUpdating = userRecord && userRecord.is_deleted === 1

        // 准备密码加密
        const salt = bcryptjs.genSaltSync(10)
        const hashedPassword = bcryptjs.hashSync(password, salt)

        // 构建SQL和参数
        let sqlStatement, sqlParams
        if (isUpdating) {
            sqlStatement = `UPDATE user SET password = ?, salt = ?, is_deleted = '0' WHERE phone = ?`
            sqlParams = [hashedPassword, salt, phone]
        } else {
            sqlStatement = `INSERT INTO user (phone, username , password, salt, is_deleted) VALUES (?, ?, ?, ?, '0')`
            sqlParams = [phone, phone.substring(0, 3) + '****' + phone.substring(7), hashedPassword, salt]
        }

        // 执行SQL
        let [updateResults] = await connection.query(sqlStatement, sqlParams)

        // 确定user_id
        let userId = isUpdating ? userRecord.user_id : updateResults.insertId

        if (updateResults.affectedRows === 1) {
            await connection.commit()
            logger.info(`用户 ${phone} ${isUpdating ? '重新激活成功' : '注册成功'}, user_id = ${userId}`)
            send(res, 2000, `${isUpdating ? '重新激活' : '注册'}成功`, { user_id: userId })
        } else {
            await connection.rollback()
            logger.info(`用户 ${phone} ${isUpdating ? '重新激活' : '注册'}失败`)
            send(res, 4002, `${isUpdating ? '重新激活' : '注册'}失败`)
        }
    } catch (err) {
        if (connection) {
            await connection.rollback()
        }
        logger.error('数据库操作出现错误：' + err.message)
        sendError(err, req, res)
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理短信验证码登录
 */
const loginBySMSCode = async (req, res) => {
    const { phone, sms_code } = req.body
    const smsCodeRedis = await redis.get(phone)

    if (smsCodeRedis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }
    // TODO 验证通过，删除验证码
    // await redis.del(phone)

    let connection
    try {
        connection = await db.getConnection()
        await connection.beginTransaction()

        const sql = `SELECT * FROM user WHERE phone = ? AND is_deleted = '0'`
        const [results] = await connection.query(sql, [phone])

        if (results.length === 0) {
            await connection.rollback()
            send(res, 1001, '用户不存在')
            return
        }

        const { user_id, password, salt, avatar, ...payload } = results[0]

        const tokenManager = new TokenManager()
        const token = await tokenManager.generateToken(payload)
        await tokenManager.storeToken(token, user_id)

        await connection.commit()
        logger.info(`用户 ${user_id} 通过短信验证码登录成功`)
        send(res, 2000, '登录成功', { user_id, token: `Bearer ${token}` })
        return
    } catch (error) {
        if (connection) {
            await connection.rollback() // 失败时回滚事务
        }
        logger.error('数据库查询出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
        return
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}

/**
 * 处理邮箱验证码登录
 */
const loginByEmailCode = async (req, res) => {
    const { email, email_code } = req.body
    logger.info(`用户 ${email} 尝试通过邮箱验证码登录: ${email_code}`)

    const emailCodeRedis = await redis.get(email)
    if (emailCodeRedis !== email_code) {
        send(res, 4002, '验证码错误')
        return
    }
    // TODO 验证通过，删除验证码
    // await redis.del(phone)

    let connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        const sql = `SELECT * FROM user WHERE email = ? AND is_deleted = 0`
        const [results] = await connection.query(sql, [email])

        if (results.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            send(res, 1001, '用户不存在')
            return
        }

        const { user_id, password, salt, avatar, ...payload } = results[0] // 剔除敏感信息

        const tokenManager = new TokenManager()
        const token = await tokenManager.generateToken(payload)
        await tokenManager.storeToken(token, user_id) // 储存token

        await connection.commit() // 所有操作成功，提交事务

        logger.info(`用户 ${user_id} 通过邮箱验证码登录成功`)
        send(res, 2000, '登录成功', { user_id, token: `Bearer ${token}` })
    } catch (error) {
        if (connection) {
            await connection.rollback() // 任何异常，事务回滚
        }

        if (error.message.includes('用户不存在')) {
            send(res, 1001, '用户不存在')
        } else {
            logger.error('操作过程中出现错误：' + error.message)
            send(res, 5000, '服务器内部错误')
        }
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理密码登录
 */
const loginByPassword = async (req, res) => {
    const account = req.body.account
    const password = req.body.password

    // 验证account是否正确，要么是国内手机号，要么是邮箱
    if (!/^1[3-9]\d{9}$/.test(account) && !/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(account)) {
        logger.info(`用户 ${account} 尝试通过账号密码登录, 账号格式错误 ${account}`)
        send(res, 4002, '账号格式错误')
        return
    }
    // TODO 验证通过，删除验证码
    // await redis.del(phone)
    const connection = await db.getConnection()

    try {
        await connection.beginTransaction() // 开始事务

        const sql = `SELECT * FROM user WHERE phone = ? OR email = ?`
        const [results] = await connection.query(sql, [account, account])

        if (results.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            send(res, 1001, '用户不存在')
            return
        }

        const user = results[0]
        const passwordMatch = await bcryptjs.compare(password, user.password)

        if (!passwordMatch) {
            await connection.rollback() // 密码错误，事务回滚
            send(res, 4002, '密码错误')
            return
        }

        // 直接构建不含敏感信息的payload
        const payload = { ...user, password: undefined, salt: undefined, avatar: undefined }

        try {
            const tokenManager = new TokenManager()
            const token = await tokenManager.generateToken(payload)
            await tokenManager.storeToken(token, payload.user_id)

            await connection.commit() // 密码正确，提交事务

            logger.info(`用户 ${payload.user_id} 通过账号密码登录成功`)
            send(res, 2000, '登录成功', { user_id: payload.user_id, token: `Bearer ${token}` })
        } catch (tokenError) {
            await connection.rollback() // token生成或存储失败，事务回滚
            logger.error('token生成或存储失败: ' + tokenError.message)
            send(res, 500, '服务器内部错误')
        }
    } catch (dbError) {
        if (connection) {
            await connection.rollback() // 数据库查询异常，事务回滚
        }
        logger.error('数据库查询出现错误: ' + dbError.message)
        send(res, 500, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
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
    // TODO 验证通过，删除验证码
    // await redis.del(phone)
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 检查用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            send(res, 4003, '用户不存在')
            return
        }

        sql = 'SELECT * FROM user WHERE email = ? AND is_deleted = 0'
        const [emailResults] = await connection.query(sql, email)
        // 检查邮箱是否已绑定其他账号
        if (emailResults.length > 0) {
            await connection.rollback() // 邮箱已绑定，事务回滚
            send(res, 4003, '该邮箱已绑定其他账号')
            return
        }

        // 绑定邮箱
        sql = 'UPDATE user SET email = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [email, user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 绑定成功，提交事务
            logger.info(`用户 ${user_id} 绑定邮箱成功, 成功修改 1 条数据`)
            send(res, 2000, '绑定邮箱成功')
        } else {
            await connection.rollback() // 更新失败，事务回滚
            send(res, 5000, '绑定邮箱失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
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

    let connection
    try {
        connection = await db.getConnection()
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            throw new Error('用户不存在')
        }

        // 修改用户名
        sql = 'UPDATE user SET username = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [username, user_id])

        if (updateResults.affectedRows !== 1) {
            throw new Error('修改昵称失败')
        }

        await connection.commit() // 修改成功，提交事务
        logger.info(`用户 ${user_id} 修改昵称成功, 成功修改 1 条数据`)
        send(res, 2000, '修改昵称成功', { username })
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(
            res,
            error.message.includes('用户不存在') ? 4003 : 5000,
            error.message.includes('用户不存在') ? '用户不存在' : '修改昵称失败'
        )
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理修改头像
 */
const changeAvatar = async (req, res) => {
    const { user_id, avatar } = req.body
    logger.info(avatar)

    let connection
    try {
        connection = await db.getConnection()
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            throw new Error('用户不存在')
        }

        // 修改用户头像
        sql = 'UPDATE user SET avatar = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [avatar, user_id])

        if (updateResults.affectedRows !== 1) {
            throw new Error('修改头像失败')
        }

        await connection.commit() // 修改成功，提交事务
        logger.info(`用户 ${user_id} 修改头像成功, 成功修改 1 条数据`)
        send(res, 2000, '修改头像成功', { avatar })
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(
            res,
            error.message.includes('用户不存在') ? 4003 : 5000,
            error.message.includes('用户不存在') ? '用户不存在' : '修改头像失败'
        )
    } finally {
        if (connection) {
            await releaseConnection(connection) // 调用释放连接的函数
        }
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
    // TODO 验证通过，删除验证码
    // await redis.del(phone)

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            send(res, 4003, '用户不存在')
            return
        }

        // 如果旧密码不为空，则为修改密码
        if (!old_password) {
            // 验证旧密码
            const { password: hashPassword, salt } = userResults[0]
            const oldSaltPassword = bcryptjs.hashSync(old_password, salt)
            if (oldSaltPassword !== hashPassword) {
                await connection.rollback() // 旧密码错误，事务回滚
                send(res, 4003, '旧密码错误')
                return
            }
        }

        // 生成新密码的盐并加密新密码
        const newSalt = bcryptjs.genSaltSync(10)
        const newSaltPassword = bcryptjs.hashSync(new_password, newSalt)

        // 更新密码
        sql = 'UPDATE user SET password = ?, salt = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [newSaltPassword, newSalt, user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 更新成功，提交事务
            logger.info(`用户 ${user_id} 修改密码成功, 成功修改 1 条数据`)
            send(res, 2000, '修改密码成功，请重新登录')
        } else {
            await connection.rollback() // 更新失败，事务回滚
            send(res, 5000, '修改密码失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理找回密码
 */
const forgetPassword = async (req, res) => {
    const { new_password, phone, sms_code } = req.body
    const smsCodeRedis = await redis.get(phone)
    if (smsCodeRedis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }
    // TODO 验证通过，删除验证码
    // await redis.del(phone)

    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE phone = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [phone])

        if (userResults.length === 0) {
            await connection.rollback() // 用户不存在，事务回滚
            send(res, 4003, '该手机号未注册')
            return
        }

        // 生成新密码的盐并加密新密码
        const newSalt = bcryptjs.genSaltSync(10)
        const newSaltPassword = bcryptjs.hashSync(new_password, newSalt)

        // 更新密码
        sql = 'UPDATE user SET password = ?, salt = ? WHERE user_id = ?'
        const [updateResults] = await connection.query(sql, [newSaltPassword, newSalt, userResults[0].user_id])

        if (updateResults.affectedRows === 1) {
            await connection.commit() // 更新成功，提交事务
            logger.info(`用户 ${user_id} 修改密码成功, 成功修改 1 条数据`)
            send(res, 2000, '修改密码成功，请登录')
        } else {
            await connection.rollback() // 更新失败，事务回滚
            send(res, 5000, '修改密码失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
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
    const { user_id, sms_code } = req.query
    const { phone, verify_code: sms_code_redis } = await redis.get(user_id)

    if (sms_code_redis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }
    // TODO 验证通过，删除验证码
    // await redis.del(phone)

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
            return
        }

        // 注销账户成功，删除redis中的用户信息
        const tokenManager = new TokenManager()
        const token = req.headers.authorization || req.headers.token
        tokenManager.removeToken(token)
        logger.info(`用户 ${user_id} 注销账户成功, 成功修改 1 条数据`)

        // 提交事务
        await connection.commit()
        send(res, 2000, '注销账户成功')
    } catch (error) {
        // 捕获到任何异常，事务回滚
        await connection.rollback()
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 4003, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
    }
}

/**
 * 处理修改身高、体重、生日、性别
 */
const updateUserBodyInfo = async (req, res) => {
    const { user_id, height, weight, birthday, gender } = req.body
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = 'SELECT * FROM user WHERE user_id = ? AND is_deleted = 0'
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        // 查询用户信息表user_info中是否存在该用户的信息，没有则创建，有则更新
        sql = 'SELECT * FROM user_info WHERE user_id = ?'
        const [userInfoResults] = await connection.query(sql, [user_id])
        let params
        if (userInfoResults.length === 0) {
            sql = `INSERT INTO 
                        user_info (user_id, height, weight, birthday, gender, create_time, update_time) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())`
            params = [user_id, height || null, weight || null, birthday || null, gender || null]
        } else {
            sql = `UPDATE user_info SET height = ?, weight = ?, birthday = ?, gender = ?, update_time = NOW() WHERE user_id = ?`
            params = [height || null, weight || null, birthday || null, gender || null, user_id]
        }
        const [updateResults] = await connection.query(sql, params)
        if (updateResults.affectedRows === 1) {
            await connection.commit()
            logger.info(`用户 ${user_id} 修改身体信息成功, 成功修改 1 条数据`)
            send(res, 2000, '修改信息成功', {
                user_id,
                height,
                weight,
                birthday,
                age: calculateAge(birthday),
                gender: gender === '1' ? '男' : '女',
            })
        } else {
            await connection.rollback()
            send(res, 5000, '修改信息失败')
        }
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    } finally {
        return
    }
}

/**
 * 处理获取身高、体重、生日、性别
 */
const getUserBodyInfo = async (req, res) => {
    const { user_id } = req.query
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = `SELECT * FROM user WHERE user_id = ? AND is_deleted = 0`
        const [userResults] = await connection.query(sql, [user_id])

        if (userResults.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }

        // 查询用户信息表user_info并同时格式化时间

        sql = `SELECT *, DATE_FORMAT(birthday, '%Y-%m-%d') AS formatted_birthday FROM user_info WHERE user_id = ?`
        const [userInfoResults] = await connection.query(sql, [user_id])
        if (userInfoResults.length === 0) {
            send(res, 4003, '用户信息不存在')
            return
        }
        const userInfo = userInfoResults[0]
        const { height, weight, formatted_birthday, gender } = userInfo
        const age = calculateAge(formatted_birthday)
        // 计算BMI
        const bmi = parseFloat((weight / ((height / 100) * (height / 100))).toFixed(2))
        // 格式化生日
        logger.info(`用户 ${user_id} 获取身体信息成功`)
        send(res, 2000, '获取身体信息成功', {
            user_id,
            height,
            weight,
            bmi,
            birthday: formatted_birthday,
            age,
            gender: gender === 1 ? '男' : '女',
        })
        console.log(userInfo)
    } catch (error) {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
    } finally {
        if (connection) {
            await releaseConnection(connection)
        }
        return
    }
}
/**
 * 获取用户账户信息
 */
const getUserAccountInfo = async (req, res) => {
    const { user_id } = req.query
    const connection = await db.getConnection()
    try {
        await connection.beginTransaction() // 开始事务

        // 查询用户是否存在且未被删除
        let sql = `SELECT username, phone, email, avatar FROM user WHERE user_id = ? AND is_deleted = 0`
        const [userResults] = await connection.query(sql, [user_id])
        if (userResults.length === 0) {
            send(res, 4003, '用户不存在')
            return
        }
        const { username, phone, email, avatar } = userResults[0]
        // 将电话号码和邮箱脱敏
        const phoneNumber = phone.substring(0, 3) + '****' + phone.substring(7)
        const emailAddress = email !== null ? email.substring(0, 3) + '****' + email.substring(6) : email

        let res_data = {
            username,
            phone: phoneNumber,
            email: emailAddress,
            avatar,
        }

        send(res, 2000, '获取账户信息成功', res_data)
    } catch (error) {
        logger.error('数据库操作出现错误：' + error.message)
        send(res, 5000, '服务器内部错误')
        return
    } finally {
        if (connection) {
            await connection.rollback() // 捕获到任何异常，事务回滚
        }
        return
    }
}

/**
 * 计算年龄
 */
function calculateAge(birthdate) {
    const today = new Date()
    const birthDate = new Date(birthdate)

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    // 如果需要计算月数和天数，可以进一步细化此函数
    // 下面是一个简单的示例，只计算月数
    let months
    if (monthDiff > 0) {
        months = monthDiff
    } else {
        months = 12 + monthDiff // 考虑到如果是负数，需要加一年的月份数
    }

    // 计算剩余天数，注意需要处理当月的天数差异
    let days
    if (today.getDate() >= birthDate.getDate()) {
        days = today.getDate() - birthDate.getDate()
    } else {
        const lastMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate() // 获取上个月最后一天的日期
        days = lastMonthDays - birthDate.getDate() + today.getDate() // 上个月剩余天数加上本月已过的天数
    }

    // return { years: age, months, days }
    return age
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
    forgetPassword,
    deleteUser,
    bindEmail,
    bindHuaweiAccount,
    logout,
    updateUserBodyInfo,
    getUserBodyInfo,
    getUserAccountInfo,
}
