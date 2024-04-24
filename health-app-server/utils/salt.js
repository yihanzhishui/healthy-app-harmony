// 生成随机盐
const salt = Math.random().toString(36).substring(2, 12)
module.exports = salt
