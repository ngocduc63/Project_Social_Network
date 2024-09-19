'use strict';

const shopModel = require("../models/shop.model");
const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const {createTokenPair,verifyJWT} = require('../auth/authUtils')
const { getInfoData } = require('../utils');
const {findByEmail}= require('./shop.service')
const { BadRequestError, ConflictError, ForbiddenError, AuthFailureError } = require("../core/error.response");
const KeyTokenService = require("./keyToken.service");

const RoleShop ={
    SHOP:'SHOP',
    WRITER:'WRITER',
    EDITOR:'EDITOR',
    ADMIN:'ADMIN'
}

class AccessService { 

    static handlerRefreshToken = async(refreshToken) => {
        // check token da duocwj su dung chauw
        const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)
        //neu co
        if(foundToken){
            //decode  xem ai 
            const {userId, email} =  await verifyJWT(refreshToken,foundToken.privateKey)
            //xoa tat ca token trong keystore
            await KeyTokenService.deleteKeyById(userId)
            throw new ForbiddenError('Something wrng happend !! Pls relogin' )
        }
        //neu ko co
        const holderToken =await KeyTokenService.findByRefreshToken(refreshToken)
        if(!holderToken) throw new AuthFailureError('Shop not registered')

        //veryfyToken
        const {userId, email} = await verifyJWT(refreshToken, holderToken.privateKey)

        //check userid
        const  foundShop = await findByEmail({email})
        if(!foundShop) throw new AuthFailureError('Shop not registered!')

        //create  cap token moi
        const tokens = await createTokenPair({userId, email},holderToken.publicKey,holderToken.privateKey)
        //update  token
        await holderToken.updateOne({
            $set :{
                refreshToken :tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed : refreshToken //da duoc su dung de lay token moi
            }
        })
        return {
            user: { userId, email },
            tokens
        }
    }   

    static logout = async (keyStore) => {
    //1- check refreshToken used
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        console.log({delKey});
        return delKey
    }

    static login = async({email, password, refreshToken = null}) => {
        
    //1- check email in dbs
    const foundShop = await findByEmail({email})
    if(!foundShop) throw new BadRequestError('Shop not registered!')
    
    //2- match password
    const match = bcrypt.compare(password, foundShop.password)
    if(!match) throw new AuthFailureError('Authentication error!')

    // 3- create AT vs RT and save RT
    const privateKey = crypto.randomBytes(64).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');
    
    //4- generate tokens
    const{_id: userId} = foundShop
    const tokens = await createTokenPair({ userId: foundShop._id, email },  publicKey, privateKey)

    await KeyTokenService.createKeyToken({
        refreshToken: tokens.refreshToken,
        privateKey, publicKey,userId

    })

        return{
            shop :getInfoData({fileds:['_id','name','email'], object: foundShop}),
            tokens
        }
        // 5- get data return login
        
    }

    static signUp = async ({name , email, password}) => { 
        // try { 
        //step 1 check gamil
        const holedShop = await shopModel.findOne({ email }).lean()

        if (holedShop) { 

                throw new BadRequestError('Error: Shop already registered!')
        }
        console.log('newshop:', { name, email, password, roles:[RoleShop.SHOP]});

        const passwordHash = await bcrypt.hash(password, 10)
        

        const  newShop = await shopModel.create({

            name, email, password: passwordHash, roles:[RoleShop.SHOP]
        })

        if(newShop) {
                const privateKey = crypto.randomBytes(64).toString('hex');
                const publicKey = crypto.randomBytes(64).toString('hex');

            console.log({ privateKey, publicKey })  

                const   keyStore = await  KeyTokenService.createKeyToken({ 
                    userId: newShop._id, 
                    publicKey ,
                    privateKey
                })
                    if(!keyStore) {
                        return  {
                            code: 'xxx',
                            message: 'keyStore error!',
                            status: 'error'
                    }
                }

                    const tokens = await createTokenPair({ userId: newShop._id, email },  publicKey, privateKey)
                    console.log(`Created Token Success::`, tokens)
                    return{
                    metadata :{
                        shop :getInfoData({fileds:['_id','name','email'], object: newShop}),
                        tokens
                    }
                    }
        }
        
        return {
            code :200,
            metadata :null
        }
    }
}

module.exports = AccessService