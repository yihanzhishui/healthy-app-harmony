// 导入express
const express = require('express')
const router = express.Router()
const {
    getMusicInfoByCategorySchema,
    getMusicSchema,
    handleFavoriteMusicSchema,
    getFavoriteMusicSchema,
    joiValidator,
} = require('../../middleware/form_validate')
const {
    getMusicCategoryList,
    getAllMusicInfo,
    getMusicInfoByCategory,
    getMusic,
    handleFavoriteMusic,
    getFavoriteMusicListByUserId,
} = require('../../controllers/music_controller')

/**
 * 获取音乐所有分类列表
 */
router.get('/get_music_category_list', getMusicCategoryList)

/**
 * 获取全部音乐信息
 */
router.get('/get_all_music_info', getAllMusicInfo)

/**
 * 根据音乐分类获取音乐基本信息
 */
router.get('/get_music_info_by_category', joiValidator(getMusicInfoByCategorySchema), getMusicInfoByCategory)

/**
 * 获取音乐具体信息
 */
router.get('/get_music', joiValidator(getMusicSchema), getMusic)

/**
 * 添加音乐到收藏夹
 */
router.put('/handle_favorite_music', joiValidator(handleFavoriteMusicSchema), handleFavoriteMusic)

/**
 * 根据用户ID获取收藏夹音乐列表
 */
router.get('/get_favorite_music_list_by_user_id', joiValidator(getFavoriteMusicSchema), getFavoriteMusicListByUserId)

// 导出路由实例
module.exports = router
