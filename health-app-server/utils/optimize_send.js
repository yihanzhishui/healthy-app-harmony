/**
 * 响应数据中间件，用于对响应数据进行优化处理
 */

/**
 * 1000  |  Continue               |  请求成功但需要进行操作
 * 1001  |  Other Error            |  请求成功但出现其他错误
 * 2000  |  OK                     |  请求成功并处理
 * 2001  |  Created                |  已创建
 * 4000  |  Bad Request            |  请求语法错误
 * 4001  |  Unauthorized           |  需要用户身份认证
 * 4002  |  Unknown Error          |  出现了未知错误
 * 4003  |  Forbidden              |  用户权限不足
 * 4004  |  Not Found              |  找不到资源
 * 4005  |  Method Not Allowed     |  请求方法不允许
 * 5000  |  Internal Server Error  |  服务器内部错误
 * 5001  |  DataBase Error         |  数据库链接错误
 */

/**
 * 1000、1001
 * Continue
 * 请求成功但需要进行操作
 */

const Continue = () => {}

/**
 * 2000、2001
 * OK、Created
 * 请求成功并处理、已创建
 */
const Success = () => {}

/**
 * 4000、4001、4002、4003、4004、4005
 * Bad Request、Unauthorized、Unknown Error、Forbidden、Not Found、Method Not Allowed
 * 请求语法错误、需要用户身份认证、出现了未知错误、用户权限不足、找不到资源、请求方法不允许
 */
const ClientError = (req, res, next) => {
    res.clientError = (error, code) => {
        res.send({
            code: code || 401,
            message: error.message || error,
        })
    }
}
/**
 * 5000、5001
 * Internal Server Error、DataBase Error
 * 服务器内部错误、数据库链接错误
 */

const InternalServerError = (req, res, next) => {
    res.internalServerError = (error, code) => {
        res.send({
            code: code || 500,
            message: error.message || error,
        })
    }
}
