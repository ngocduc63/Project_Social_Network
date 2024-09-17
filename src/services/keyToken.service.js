'use strict';
const keytokenModel = require('../models/keytoken.model')
const  { ObjectId }  = require('mongodb')

// const { Types: { ObjectId } } = require('mongoose')
class KeyTokenService{
    static createKeyToken = async ({ userId, publicKey,privateKey,refreshToken }) => {
        
        try {
            //lv0
            // const tokens = await keytokenModel.create({
            //         user: userId,
            //         // publicKey: publicKeyString
            //         publicKey,
            //          privateKey
            // })
            //lvxx
            const filter ={user:userId },update ={
                publicKey,privateKey,refreshTokensUsed: [],refreshToken
            },opstions = {upsert:true,new:true}

            const tokens = await keytokenModel.findOneAndUpdate(filter,update,opstions)
                return tokens ? tokens.publicKey : null

        }catch (error) {
            return error
        }
    }

    static findByUserId = async (userId) => {
        
        const objectId =  ObjectId.createFromHexString(userId)
        
        return await keytokenModel.findOne({ user: objectId }).lean();
    }
    
    static removeKeyById = async (id) => {
        return await keytokenModel.deleteOne({ _id: id });
    }

    static findByRefreshTokenUsed = async (refreshToken) => {
        return await keytokenModel.findOne({ refreshTokensUsed : refreshToken}).lean();
    }

    static findByRefreshToken = async (refreshToken) => {
        return await keytokenModel.findOne({  refreshToken });
    }

    static deleteKeyById = async (userId) => {
        return await keytokenModel.findByIdAndDelete({ user: userId })
    }
}

module.exports = KeyTokenService