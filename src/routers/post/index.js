'use strict';

const express = require('express');
const postController = require('../../controllers/post.controller');
const commentController  = require('../../controllers/comment.controller')
const {asyncHandler} = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const { apiKey, permission } = require('../../auth/checkAuth');
const likeController = require('../../controllers/like.controller');
const { uploadFileHandler } = require('../../helpers/uploadFIleHandler');

const upload = uploadFileHandler()
const router =  express.Router()

//check apikey
router.use(apiKey)
//check pemission
router.use(permission('0000'))
// check access token
router.use(authentication)

router.get('/list-comments-by-parent-id', asyncHandler(commentController.getCommentsByParentId))
router.get('/list-likes', asyncHandler(likeController.getListLike))

router.post('/create-post', upload.array('post', 10), asyncHandler(postController.createPost))
router.post('/create-comment', asyncHandler(commentController.createComment))
router.post('/create-like', asyncHandler(likeController.createLike))
router.post('/share-post', asyncHandler(postController.sharePost))

router.put('/update-post', asyncHandler(postController.updatePost))
router.put('/update-comment', asyncHandler(commentController.updateComment))

router.delete('/delete-post', asyncHandler(postController.deletePost))
router.delete('/delete-comment', asyncHandler(commentController.deleteComment))
router.delete('/delete-like', asyncHandler(likeController.deleteLike))

module.exports = router
