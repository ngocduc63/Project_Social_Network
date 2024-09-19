'use strict';

const express = require('express');
const userController = require('../../controllers/user.controller');
const {asyncHandler} = require('../../auth/checkAuth');
const { uploadFileHandler } = require('../../helpers/uploadFIleHandler');
const { authentication } = require('../../auth/authUtils');

const upload = uploadFileHandler()
const router =  express.Router()

router.get('/image/:filename', asyncHandler(userController.getImageUrl))

router.use(authentication)
router.post('/update-avatar', upload.single('avatar'), asyncHandler(userController.updateAvatar))

module.exports = router
