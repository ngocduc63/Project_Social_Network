"use strict";
const keytokenModel = require("../models/keytoken.model");
const { convertToObjectIdMongodb } = require("../utils");

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }) => {
    try {
      const filter = { user: userId };
      const update = {
        $set: {
          publicKey,
          privateKey,
          refreshToken,
        },
        $push: { refreshTokensUsed: { $each: [] } }, // If you want an array, ensure push format
      };
      const options = { upsert: true, new: true };
    
      const tokens = await keytokenModel.findOneAndUpdate(filter, update, options);
      
      return tokens ? tokens.publicKey : null;
    } catch (error) {
      console.error("Error updating refresh token:", error); // Better error logging
      return error;
    }
    
  };

  static findByUserId = async (userId) => {
    return await keytokenModel.findOne({ user: convertToObjectIdMongodb(userId) }).lean();
  };

  static removeKeyById = async (id) => {
    return await keytokenModel.deleteOne({ _id: id });
  };

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keytokenModel
      .findOne({ refreshTokensUsed: refreshToken })
      .lean();
  };

  static findByRefreshToken = async (refreshToken) => {
    return await keytokenModel.findOne({ refreshToken });
  };

  static deleteKeyById = async (userId) => {
    return await keytokenModel.findOneAndDelete({ user: userId });
  };
}

module.exports = KeyTokenService;
