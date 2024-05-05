// const cryptojs = require('crypto-js')
// const { logger_info: logger } = require('../utils/logger')
// require('dotenv').config()

// const decrypt = (req, res, next) => {
//     // 解密逻辑
//     let { password, old_password, new_password, confirm_password } = req.body
//     const key = process.env.secret
//     logger.info('decrypt: ' + key) // decrypt: e3bd6d6ebb3bb511b9aeefacbf503d18aa3f5af458f89f2fafd14aaef3977960
//     if (!password) {
//         password = cryptojs.AES.decrypt(password, key).toString()
//         req.body.password = password
//     }
//     if (!old_password) {
//         old_password = cryptojs.AES.decrypt(old_password, key).toString()
//         req.body.old_password = old_password
//     }
//     if (!new_password) {
//         new_password = cryptojs.AES.decrypt(new_password, key).toString()
//         req.body.new_password = new_password
//     }
//     if (!confirm_password) {
//         confirm_password = cryptojs.AES.decrypt(confirm_password, key).toString()
//         req.body.confirm_password = confirm_password
//     }
//     logger.info(password, old_password, new_password, confirm_password)
//     next()
// }

// module.exports = { decrypt }
const CryptoJS = require('crypto-js')
const { logger_info: logger } = require('../utils/logger')
require('dotenv').config()
const { send } = require('../middleware/response_handler')

const key = process.env.secret

const decrypt = (req, res, next) => {
    try {
        const { password, old_password, new_password, confirm_password } = req.body
        if (password !== undefined) {
            const encryptedData = decryptfn(password, key)
            req.body.password = encryptedData
        }
        if (old_password !== undefined) {
            const encryptedData = decryptfn(old_password, key)
            req.body.old_password = encryptedData
        }
        if (new_password !== undefined) {
            const encryptedData = decryptfn(new_password, key)
            req.body.new_password = encryptedData
        }
        if (confirm_password !== undefined) {
            const encryptedData = decryptfn(confirm_password, key)
            req.body.confirm_password = encryptedData
        }
        next()
    } catch (error) {
        logger.info(error)
        send(res, 4000, '解密失败')
    }
}

// 解密函数 (保持与之前相同)
function decryptfn(ciphertext, secretKey) {
    const key = CryptoJS.enc.Utf8.parse(secretKey)
    const bytes = CryptoJS.AES.decrypt(ciphertext, key, { mode: CryptoJS.mode.ECB })
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    return originalText
}

module.exports = { decrypt }
