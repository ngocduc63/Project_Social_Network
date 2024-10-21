"use strict";

const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const userService = require("./user.service");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");
const KeyTokenService = require("./keyToken.service");
const { createNewApiKey } = require("./apikey.service");
const { ROLE_USER } = require("../utils/const.user");


class AccessService {
  static handlerRefreshToken = async (refreshToken) => {
    // check token da duocwj su dung chua
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );

    //neu co
    if (foundToken) {
      //decode  xem ai
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );
      //xoa tat ca token trong keystore
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrng happend !! Pls relogin");
    }

    //neu ko co
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);
    if (!holderToken) throw new AuthFailureError("User not registered");

    //veryfyToken
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );

    //check userid
    const foundUser = await userService.findByEmail({ email });
    if (!foundUser) throw new AuthFailureError("User not registered!");

    //create  cap token moi
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    //update  token
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, //da duoc su dung de lay token moi
      },
    });

    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    //1- check refreshToken used
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    console.log({ delKey });
    return delKey;
  };

  static login = async ({ email, password, refreshToken = null }) => {
    //1- check email in dbs
    const foundUser = await userService.findByEmail({ email });
    if (!foundUser) throw new BadRequestError("Shop not registered!");

    //2- match password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) throw new BadRequestError("Authentication error!");

    // 3- create AT vs RT and save RT
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    //4- generate tokens
    const { _id: userId } = foundUser;
    const tokens = await createTokenPair(
      { userId: foundUser._id, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    });

    // create permission key
    const apiKey = await createNewApiKey(userId);

    return {
      user: getInfoData({
        fileds: ["_id", "name", "email", "avatar"],
        object: foundUser,
      }),
      tokens,
      apikey: getInfoData({ fileds: ["key"], object: apiKey }),
    };
    // 5- get data return login
  };

  static signUp = async ({ name, email, password }) => {
    const holedUser = await userModel.findOne({ email }).lean();

    if (holedUser) throw new BadRequestError("Error: Shop already registered!");

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      name,
      email,
      password: passwordHash,
      roles: [ROLE_USER.USER],
    });
    if (!newUser) throw new BadRequestError("Error: cannot create user!");

    if (newUser) {
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newUser._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) throw new BadRequestError("key store error");

      const tokens = await createTokenPair(
        { userId: newUser._id, email },
        publicKey,
        privateKey
      );

      return {
        metadata: {
          user: getInfoData({
            fileds: ["_id", "name", "email"],
            object: newUser,
          }),
          tokens,
        },
      };
    }
  };
}

module.exports = AccessService;
