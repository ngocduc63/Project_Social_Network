'use strict';
const _ = require('lodash');
const { ObjectId } = require("mongodb");

const convertToObjectIdMongodb = id => ObjectId.createFromHexString(id)

const  getInfoData =({ fileds = [], object ={}})=>
{
   return _.pick(object, fileds)
}

module.exports = { getInfoData, convertToObjectIdMongodb }