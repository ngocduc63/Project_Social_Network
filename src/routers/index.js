'use strict';

const express = require('express');

const { apiKey, permission } = require('../auth/checkAuth');

const router =  express.Router()

//  check apikey
// router.use(apiKey)
//check pemission
// router.use(permission('0000'))
router.use('/api',require('./access'))
router.use('/user',require('./user'))


module.exports = router




