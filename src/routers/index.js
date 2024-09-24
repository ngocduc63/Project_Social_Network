'use strict';

const express = require('express');
const router =  express.Router()

router.use('/api',require('./access'))
router.use('/user',require('./user'))
router.use('/post',require('./post'))


module.exports = router




