'use strict';

const express = require('express');
const {asyncHandler} = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const { apiKey, permission } = require('../../auth/checkAuth');
const { uploadFileHandler } = require('../../helpers/uploadFIleHandler');
const storyController = require('../../controllers/story.controller');

const upload = uploadFileHandler()
const router =  express.Router()

//check apikey
router.use(apiKey)
//check pemission
router.use(permission('0000'))
// check access token
router.use(authentication)

router.get('/get-story', asyncHandler(storyController.getStoryForUser))
router.post('/create-story', upload.array('post', 1), asyncHandler(storyController.createStory))

module.exports = router
