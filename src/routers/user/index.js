'use strict';

const express = require('express');
const userController = require('../../controllers/user.controller');
const {asyncHandler} = require('../../auth/checkAuth');
const { uploadFileHandler } = require('../../helpers/uploadFIleHandler');
const { authentication } = require('../../auth/authUtils');
const { apiKey, permission } = require('../../auth/checkAuth');

const upload = uploadFileHandler()
const router =  express.Router()

router.get('/image/:filename', asyncHandler(userController.getImageUrl))
router.get('/video/:filename', asyncHandler(userController.getVideoUrl))

//check apikey
router.use(apiKey)
//check pemission
router.use(permission('0000'))
// check access token
router.use(authentication)

router.get('/get-user-info', asyncHandler(userController.getUserInfo))
router.get('/get-post-of-user', asyncHandler(userController.getPostOfUser))

router.put('/update-avatar', upload.single('avatar'), asyncHandler(userController.updateAvatar))
router.put('/update-cover', upload.single('cover'), asyncHandler(userController.updateCover))

module.exports = router
