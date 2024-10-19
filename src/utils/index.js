'use strict';
const _ = require('lodash');
const { ObjectId } = require("mongodb");
const path = require("path");

const convertToObjectIdMongodb = id => ObjectId.createFromHexString(id)

const encodePathFile = pathFile => encodeURIComponent(path.relative('uploads', pathFile))
const decodePathFile = fileName => decodeURIComponent(fileName)

const  getInfoData =({ fileds = [], object ={}})=>
{
   return _.pick(object, fileds)
}

module.exports = { getInfoData, convertToObjectIdMongodb, encodePathFile, decodePathFile }