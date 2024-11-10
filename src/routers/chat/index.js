'use strict';

const express = require('express');
const {asyncHandler} = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const { apiKey, permission } = require('../../auth/checkAuth');
const chatController = require('../../controllers/chat.controller');

const router =  express.Router()

//check apikey
router.use(apiKey)
//check pemission
router.use(permission('0000'))
// check access token
router.use(authentication)

router.get('/list-room', asyncHandler(chatController.getListRoom))
router.get('/list-mess', asyncHandler(chatController.getListMess))


module.exports = router
