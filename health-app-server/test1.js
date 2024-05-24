let url = 'http://v0.yiketianqi.com/api'

let appid = '92156384'
let appsecret = 'u5oZ2wmr'

const axios = require('axios')

axios
    .get(url, {
        params: {
            version: 'v63',
            appid,
            appsecret,
        },
    })
    .then((res) => {
        console.log(res.data)
    })
    .catch((err) => {
        console.log(err)
    })
