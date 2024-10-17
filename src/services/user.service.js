"user strict";

const { BadRequestError } = require("../core/error.response");
const userModel = require("../models/user.model");
const path = require("path");
const fs = require("fs");
const { getInfoData, convertToObjectIdMongodb } = require("../utils");

class UserService {
  static findByEmail = async ({
    email,
    select = { email: 1, password: 2, name: 1, status: 1, roles: 1 },
  }) => {
    return await userModel.findOne({ email }).select(select).lean();
  };

  static findById = async (id) => await userModel.findById(id).lean();

  static getUserInfo = async (userId) => {
    const userInfo = await this.findById(userId);
    return getInfoData({
      fileds: ["_id", "name", "avatar"],
      object: userInfo,
    });
  };

  static async getUserIdByKeyStore(keyStore) {
    return await keyStore.user.toString();
  }

  static updateAvatarService = async (file, keyStore) => {
    if (!file) throw new BadRequestError("file not found");
    const userId = await this.getUserIdByKeyStore(keyStore);

    const user = await this.findById(userId);

    if (!user) throw new BadRequestError("user not found");

    const rs = await userModel.updateOne(
      { _id: userId },
      { $set: { avatar: file.filename } }
    );

    // check update success
    if (!rs.acknowledged) throw new BadRequestError("update avatar error");

    const userResult = await this.findById(userId);

    // create post avatar

    return {
      user: getInfoData({
        fileds: ["_id", "name", "avatar"],
        object: userResult,
      }),
    };
  };

  static getImageUrl = async ({ filename }) => {
    const filepath = path.join(__dirname, "../../uploads", filename);

    // Kiểm tra file có tồn tại không
    if (fs.existsSync(filepath)) return fs.createReadStream(filepath);
    else throw new BadRequestError("file not found");
  };

  static updateProfile = async (body) => {
    return true;
  };

  static changePassword = async (body) => {
    return true;
  };
}

module.exports = UserService;
