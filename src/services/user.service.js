"user strict";

const { BadRequestError } = require("../core/error.response");
const userModel = require("../models/user.model");
const path = require("path");
const fs = require("fs");
const { getInfoData } = require("../utils");

class UserService {
  static findByEmail = async ({
    email,
    select = { email: 1, password: 2, name: 1, status: 1, roles: 1 },
  }) => {
    return await userModel.findOne({ email }).select(select).lean();
  };

  static findById = async id => userModel.findOne({ _id: id}).lean();

  static updateAvatarService = async (file, keyStore) => {
    if (!file) throw new BadRequestError("file not found");

    const user = await this.findById(keyStore.user)
    if (!user) throw new BadRequestError("user not found");

    const rs = await userModel.updateOne(
      { _id: keyStore.user },
      { avatar: file.filename }
    );

    // check update success
    if (!rs.acknowledged) throw new BadRequestError("update avatar error");

    const userResult = await this.findById(keyStore.user)

    return {
      user: getInfoData({ fileds: ["_id", "name", "avatar"], object: userResult }),
    };
  };

  static getImageUrl = async ({ filename }) => {
    const filepath = path.join(__dirname, "../../uploads", filename);

    // Kiểm tra file có tồn tại không
    if (fs.existsSync(filepath)) return fs.createReadStream(filepath);
    else throw new BadRequestError("file not found");
  };
}

module.exports = UserService;
