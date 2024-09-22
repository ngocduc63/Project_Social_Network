'use strict';
const JWT = require('jsonwebtoken') 
const asyncHandler = require('../helpers/asyncHandler')
const { AuthFailureError, NotFoundError} = require('../core/error.response')
const { findByUserId } =require('../services/keyToken.service')

const HEADER = {
    API_KEY : 'x-api-key',
    CLIENT_ID : 'x-client-id',
    AUTHORIZATION : 'authorization',
}

const createTokenPair = async (payload, publicKey, privateKey) => {
 
    try {
        const  accessTocken = await JWT.sign(payload, publicKey, {
            // algorithm: 'RS256',
            expiresIn: '1 days'
        })
        const refreshToken = await JWT.sign(payload, privateKey, {
            // algorithm: 'RS256',
            expiresIn: '14 days'
        })  
        
        JWT.verify(accessTocken, publicKey, (err, decode) => {
            if (err) 
                console.log('err verify', err) 
            else
                console.log('decode verify', decode)
        })
      
        return { accessTocken, refreshToken }

    } catch (error) {
        console.log('auth_create token',error);
    }
}

const  authentication = asyncHandler(async(req, res, next)=>{
    
    // 1-Check userId missing?
    const userId = req.headers[HEADER.CLIENT_ID]
    if(!userId) throw new AuthFailureError('Invalid Request')

    // 2- get accessToken
    const keyStore = await findByUserId(userId)
    if(!keyStore) throw new NotFoundError('Not found keyStore')

    // 3- verify token
    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if(!accessToken) throw new AuthFailureError('Invalid Request')
        
    try {
      
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
        if(userId !== decodeUser.userId) throw new AuthFailureError('Invalid UserId')
            req.keyStore = keyStore
        return next()
        
    } catch (error) {
        throw error
    }
    // 4- check user in db
    // 5- check key store with this userId
    // 6- OK all => return next()
     
})

const  verifyJWT = async (token, keySecret) => await JWT.verify(token, keySecret)

module.exports = { 
    createTokenPair,
    authentication,
    verifyJWT
}