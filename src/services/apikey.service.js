"use strict";

const apikeyModel = require("../models/apikey.model");
const crypto = require("crypto");
const { convertToObjectIdMongodb } = require("../utils");

const findById = async (key) => {
  //   console.log("key", key);
  //   const newkey = await apikeyModel.create({
  //     key: crypto.randomBytes(64).toString("hex"),
  //     permissions: ["0000"],
  //   });
  //   console.log("new", newkey);

  const objKey = await apikeyModel.findOne({ key, status: true }).lean();
  return objKey;
};

const createNewApiKey = async (userId, permission = "0000") => {
  const filter = { user: userId },
    update = {
      key: crypto.randomBytes(64).toString("hex"),
      permissions: permission,
    },
    options = { upsert: true, new: true };

  const objKey = await apikeyModel.findOneAndUpdate(filter, update, options);

  return objKey;
};

module.exports = { findById, createNewApiKey };
