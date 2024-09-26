'use strict';

const express = require('express');
const postController = require('../../controllers/post.controller');
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

router.post('/create-post', asyncHandler(postController.createPost))

module.exports = router