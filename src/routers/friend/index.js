'use strict';

const express = require('express');
const friendController = require('../../controllers/friend.controller');
const {asyncHandler} = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const { apiKey, permission } = require('../../auth/checkAuth');

const router =  express.Router()

//check apikey
router.use(apiKey)
//check pemission
router.use(permission('0000'))
// check access token
router.use(authentication)

router.get('/list-friend', asyncHandler(friendController.getListFriend))
router.post('/add-friend', asyncHandler(friendController.addFriend))
router.put('/accept-friend', asyncHandler(friendController.acceptFriend))
router.put('/unfriend', asyncHandler(friendController.unfriend))
router.delete('/decline-friend', asyncHandler(friendController.declineFriend))


module.exports = router
