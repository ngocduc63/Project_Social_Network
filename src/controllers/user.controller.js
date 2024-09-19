'use strict'

const {OK,CREATED,SuccessResponse} = require('../core/success.response')
const userService = require('../services/user.service')

class UserController {

    updateAvatar = async (req, res, next) => {

        new SuccessResponse({
            message: 'update avatar success',
            metadata: await userService.updateAvatar(req.file, req.keyStore)
        }).send(res)
        
    }

    getImageUrl = async (req, res, next) => {
        const imageStream = await userService.getImageUrl(req.params)

        res.contentType('image/png')
        
        imageStream.pipe(res)
    }

}

module.exports = new UserController()