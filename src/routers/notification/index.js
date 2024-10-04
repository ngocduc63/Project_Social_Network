'use strict';

const express = require('express');
const notificationController = require('../../controllers/notification.controller');
const {asyncHandler} = require('../../auth/checkAuth');
// const { uploadFileHandler } = require('../../helpers/uploadFIleHandler');
const { authentication } = require('../../auth/authUtils');
const { apiKey, permission } = require('../../auth/checkAuth');

// const upload = uploadFileHandler()
const router =  express.Router()


//check apikey
router.use(apiKey)
//check pemission
router.use(permission('0000'))
// check access token
router.use(authentication)

router.get('/get-notifications', asyncHandler(notificationController.getListNotiByUser))

module.exports = router
