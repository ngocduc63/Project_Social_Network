"user stricy";

const { getInfoData, convertToObjectIdMongodb } = require("../utils");
const post = require("../models/post.model");
const User = require("../models/user.model");

class CommonService {
  static getUserInfo = async (userId) => {
    const userInfo = await User.findById(userId);
    return getInfoData({
      fileds: ["_id", "name", "avatar"],
      object: userInfo,
    });
  };

  static getUserIdByKeyStore = async (keyStore) => {
    return await keyStore.user.toString();
  };
}

module.exports = CommonService
