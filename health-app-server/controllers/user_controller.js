const db = require('../utils/database')
const { sendError, send } = require('../middleware/response_handler')
const { logger_db: logger } = require('../utils/logger')
const bcryptjs = require('bcryptjs')
const TokenManager = require('../utils/token_manager')
const redis = require('../utils/redis_manager')
const RedisError = require('../utils/custom_error')

const db_error = (res, err) => {
    logger.error('数据库查询出现错误：' + err.message)
    send(res, 5001, '数据库查询出现错误')
}

/**
 * 处理用户注册
 */
const register = (req, res) => {
    const { phone, sms_code, password } = req.body
    // TODO 判断验证码是否正确
    // 获取redis中存储的验证码
    redis.get(phone).then((sms_code_redis) => {
        if (sms_code_redis !== sms_code) {
            send(res, 4002, '验证码错误')
            return
        }
    })
    // 查询数据库中是否已经存在该用户
    let sql = `SELECT * FROM user WHERE phone = ? AND is_deleted = '0'`
    db.query(sql, phone, (err, results) => {
        if (err) {
            db_error(res, err)
            return
        }
        // 用户已注册
        if (results.length > 0) {
            send(res, 1001, '用户已注册')
            return
        }
        let is_deleted = 0
        sql = `SELECT * FROM user WHERE phone = ? AND is_deleted = '1'`
        db.query(sql, phone, (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            // 用户已注册，但被删除
            if (results.length > 0) {
                is_deleted = 1
            }
        })

        // 用户未注册，可以注册
        // 加密密码
        const salt = bcryptjs.genSaltSync(10)
        const hash_password = bcryptjs.hashSync(password, salt)
        // 插入数据库
        // 注册过，但注销了
        if (is_deleted === 1) {
            sql = `UPDATE user SET (password, salt, is_deleted) VALUES ?, ?, '0') WHERE phone = ?`
        } else {
            // 用户从未注册过
            sql = `INSERT INTO user (phone, password, salt, is_deleted) VALUES (?, ?, ?, '0')`
        }
        const sqlArr = is_deleted === 1 ? [hash_password, salt, phone] : [phone, hash_password, salt]
        db.query(sql, sqlArr, (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            if (results.affectedRows === 1) {
                // 查询注册成功过后的 user_id
                sql = `SELECT user_id FROM user WHERE phone = ?`
                let user_id = ''
                db.query(sql, phone, (err, results) => {
                    if (err) {
                        db_error(res, err)
                        return
                    }
                    if (results.length > 0) {
                        // 注册成功
                        user_id = results[0].user_id
                    }
                })
                logger.info(`用户 ${phone} 注册成功`)
                send(res, 2000, '注册成功')
            }
        })
    })
}

/**
 * 处理短信验证码登录
 */
const loginBySMSCode = async (req, res) => {
    const { phone, sms_code } = req.body
    // 获取redis中存储的验证码
    const sms_code_redis = await redis.get(phone)
    console.log(sms_code_redis)
    if (sms_code_redis !== sms_code) {
        send(res, 4002, '验证码错误')
        return
    }
    try {
        // 查询数据库中是否已经存在该用户
        let payload = {}
        let sql = `SELECT * FROM user WHERE phone = ?`
        const results = await db.promise().query(sql, phone)

        // 用户不存在
        if (results.length === 0) {
            send(res, 1001, '用户不存在')
            return
        }
        // 用户存在，可以登录
        payload = { ...results[0]['0'], password: '', salt: '', avatar: '' }
        console.log(payload)
        // 生成token并存储进redis
        try {
            const tokenManager = new TokenManager()
            const token = await tokenManager.generateToken(payload)
            tokenManager.storeToken(token, payload.user_id)
            // logger.info(`用户 ${phone} 登录成功`)
            send(res, 2000, '登录成功', { user_id: payload.user_id, token })
        } catch (error) {
            db_error(res, error)
        }
    } catch (error) {
        // 处理其他可能的异常
        console.error('An unexpected error occurred:', error)
        send(res, 500, '服务器内部错误')
    }
}

/**
 * 处理邮箱验证码登录
 */
const loginByEmailCode = (req, res) => {
    const { email, email_code } = req.body
    // TODO 判断验证码是否正确
    if (!email_code) {
        send(res, 4002, '验证码错误')
        return
    }
    let payload = {}
    let sql = `SELECT * FROM user WHERE email = ?`
    // 查询数据库中是否已经存在该用户
    db.query(sql, email, (err, results) => {
        if (err) {
            db_error(res, err)
            return
        }
        // 用户不存在
        if (results.length === 0) {
            send(res, 1001, '用户不存在')
            return
        }
        payload = { ...results[0], password: '', salt: '', avatar: '' }
        // 生成token
        const tokenManager = new TokenManager()
        const token = tokenManager.generateToken(payload)
        // 存储进redis
        tokenManager.storeToken(token, payload.user_id)
        send(res, 2000, '登录成功', { user_id: payload.user_id, token })
        return
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
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
    const account = req.body.phone ? req.body.phone : req.body.email
    const password = req.body.password

    try {
        // 查询数据库中是否已经存在该用户
        let payload = {}
        let sql = `SELECT * FROM user WHERE phone = ? OR email = ?`
        const results = await db
            .promise()
            .query(sql, [account, account])
            .then((results) => {
                return results[0]
            })

        // 用户不存在
        if (results.length === 0) {
            send(res, 1001, '用户不存在')
            return
        }

        // 获取用户密码和盐
        const { password: hash_password, salt } = results[0]
        // 加密用户密码
        const salt_password = bcryptjs.hashSync(password, salt)
        // 比对密码
        if (salt_password !== hash_password) {
            send(res, 4003, '密码错误')
            return
        }

        payload = { ...results[0], password: '', salt: '', avatar: '' }

        // 生成token
        const tokenManager = new TokenManager()
        const token = await tokenManager.generateToken(payload)

        // 存储进redis
        try {
            await tokenManager.storeToken(token, payload.user_id)
            send(res, 2000, '登录成功', { user_id: payload.user_id, token })
        } catch (err) {
            db_error(res, err)
        }
    } catch (err) {
        sendError(err, res, req)
    }
}

/**
 * 处理绑定邮箱号
 */
const bindEmail = (req, res) => {
    const { user_id, email, email_code } = req.body
    // TODO 判断验证码是否正确
    if (!email_code) {
        send(res, 4002, '验证码错误')
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
            send(res, 4004, '该邮箱已绑定其他账号')
            return
        }
        // 用户存在，可以绑定邮箱
        sql = `UPDATE user SET email = ? WHERE user_id = ?`
        db.query(sql, [email, user_id], (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            if (results.affectedRows === 1) {
                // 绑定邮箱成功
                logger.info(`用户 ${user_id} 绑定邮箱成功, 成功修改 1 条数据`)
                send(res, 2000, '绑定邮箱成功')
                return
            }
        })
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
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
const changeUsername = (req, res) => {
    const { user_id, username } = req.body
    if (!username) {
        send(res, 4002, '昵称不能为空')
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
        // 用户存在，可以修改昵称
        sql = `UPDATE user SET username = ? WHERE user_id = `
        db.query(sql, [username, user_id], (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            if (results.affectedRows === 1) {
                // 修改昵称成功
                logger.info(`用户 ${user_id} 修改昵称成功, 成功修改 1 条数据`)
                send(res, 2000, '修改昵称成功')
                return
            }
        })
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
}

/**
 * 处理修改头像
 */
const changeAvatar = (req, res) => {
    const { user_id, avatar } = req.body
    if (!avatar) {
        send(res, 4002, '头像不能为空')
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
        // 用户存在，可以修改头像
        sql = `UPDATE user SET avatar = ? WHERE user_id = ?`
        db.query(sql, [avatar, user_id], (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            if (results.affectedRows === 1) {
                // 修改头像成功
                logger.info(`用户 ${user_id} 修改头像成功, 成功修改 1 条数据`)
                send(res, 2000, '修改头像成功', { avatar })
                return
            }
        })
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
}

/**
 * 处理修改密码
 */
const changePassword = (req, res) => {
    const { user_id, old_password, new_password, phone, sms_code } = req.body
    // TODO 判断验证码是否正确
    if (!sms_code) {
        send(res, 4002, '验证码错误')
        return
    }
    // 查询数据库中是否已经存在该用户
    let sql = `SELECT * FROM user WHERE user_id = ?`
    db.query(sql, user_id, (err, results) => {
        if (err) {
            db_error(res, err)
            return
        }
    })
    // 用户不存在
    if (results.length === 0) {
        send(res, 4003, '用户不存在')
        return
    }
    // 获取用户密码和盐
    const { password: hash_password, salt } = results[0]
    // 加密用户密码
    const old_salt_password = bcryptjs.hashSync(old_password, salt)
    // 比对密码
    if (!bcryptjs.compareSync(old_salt_password, hash_password)) {
        send(res, 4003, '旧密码错误')
        return
    }
    const new_salt = bcryptjs.genSaltSync(10)
    const new_salt_password = bcryptjs.hashSync(new_password, new_salt)
    // 更新数据库中的密码
    sql = `UPDATE user SET password = ?, salt = ? WHERE user_id = ?`
    db.query(sql, [new_salt_password, salt, user_id], (err, results) => {
        if (err) {
            db_error(res, err)
            return
        }
        if (results.affectedRows === 1) {
            // 修改密码成功
            logger.info(`用户 ${user_id} 修改密码成功, 成功修改 1 条数据`)
            send(res, 2000, '修改密码成功')
            return
        }
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
}

/**
 * 处理退出登录
 */
const logout = (req, res) => {
    const token = req.headers.authorization || req.headers.token
    const tokenManager = new TokenManager()
    tokenManager.removeToken(token)
    send(res, 2000, '退出登录成功')
    return
}

/**
 * 处理注销账户
 */
const deleteUser = (req, res) => {
    const { user_id, phone, sms_code } = req.body
    const token = req.headers.authorization || req.headers.token
    // TODO 判断验证码是否正确
    if (!sms_code) {
        send(res, 4002, '验证码错误')
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
        // 用户存在，可以注销账户
        sql = `UPDATE user SET is_deleted = '1' WHERE user_id = ?`
        db.query(sql, user_id, (err, results) => {
            if (err) {
                db_error(res, err)
                return
            }
            if (results.affectedRows === 1) {
                // 注销账户成功
                // 删除redis中的用户信息
                const tokenManager = new TokenManager()
                tokenManager.removeToken(token)
                logger.info(`用户 ${user_id} 注销账户成功, 成功修改 1 条数据`)
                send(res, 2000, '注销账户成功')
                return
            }
        })
    })
    // 发生其他错误
    send(res, 5000, '服务器内部错误')
    return
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
