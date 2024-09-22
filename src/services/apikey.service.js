"use strict";

const apikeyModel = require("../models/apikey.model");
const crypto = require("crypto");

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

const createNewApiKey = async (permission = '0000') => {
  return await apikeyModel.create({
        key: crypto.randomBytes(64).toString("hex"),
        permissions: permission
      });
}

module.exports = { findById, createNewApiKey };
