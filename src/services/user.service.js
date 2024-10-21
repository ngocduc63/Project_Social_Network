"user strict";

const { BadRequestError } = require("../core/error.response");
const userModel = require("../models/user.model");
const path = require("path");
const fs = require("fs");
const { getInfoData, convertToObjectIdMongodb, decodePathFile, encodePathFile } = require("../utils");
const PostService = require("./post.service");
const CommonService = require("./common.service");

class UserService {
  static findByEmail = async ({
    email,
    select = { email: 1, password: 2, name: 1, status: 1, roles: 1, avatar: 1 },
  }) => {
    return await userModel.findOne({ email }).select(select).lean();
  };

  static findById = async (id) => await userModel.findById(id).lean();

  static updateAvatarService = async (file, keyStore) => {
    if (!file) throw new BadRequestError("file not found");
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const user = await this.findById(userId);

    if (!user) throw new BadRequestError("user not found");

    const imagePath = encodePathFile(file.path)
    const rs = await userModel.updateOne(
      { _id: userId },
      { $set: { avatar: imagePath } }
    );

    // check update success
    if (!rs.acknowledged) throw new BadRequestError("update avatar error");

    const userResult = await this.findById(userId);

    // create post avatar
    const postUpdateAvatar = await PostService.createPostImage(
      imagePath,
      userResult
    );

    return {
      user: getInfoData({
        fileds: ["_id", "name", "avatar"],
        object: userResult,
      }),
      post: getInfoData({
        fileds: [
          "_id",
          "post_title",
          "post_image",
          "image_category",
          "createdAt",
        ],
        object: postUpdateAvatar,
      }),
    };
  };

  static updateCoverService = async (file, keyStore) => {
    if (!file) throw new BadRequestError("file not found");
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const user = await this.findById(userId);

    if (!user) throw new BadRequestError("user not found");

    const imagePath = encodePathFile(file.path)
    const rs = await userModel.updateOne(
      { _id: userId },
      { $set: { cover: imagePath } }
    );

    // check update success
    if (!rs.acknowledged) throw new BadRequestError("update avatar error");

    const userResult = await this.findById(userId);

    // create post cover
    const postUpdateCover = await PostService.createPostImage(
      imagePath,
      userResult,
      false
    );

    return {
      user: getInfoData({
        fileds: ["_id", "name", "cover"],
        object: userResult,
      }),
      post: getInfoData({
        fileds: [
          "_id",
          "post_title",
          "post_image",
          "image_category",
          "createdAt",
        ],
        object: postUpdateCover,
      }),
    };
  };

  static getImageUrl = async ({ filename }) => {
    const pathImage = decodePathFile(filename);
    const filepath = path.join(__dirname, "../../uploads", pathImage);

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
