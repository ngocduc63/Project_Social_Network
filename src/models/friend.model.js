"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Friend"; // The name of the collection
const COLLECTION_NAME = "Friends"; // The name of the collection

// Declare the Schema of the Mongo model
var friendSchema = new Schema(
  {
    created_by_user: { type: Schema.Types.ObjectId, ref: "User" },
    friend_userId: { type: Schema.Types.ObjectId, ref: "User" },
    friend_status: {
        type: String,
        enum: ["FOLLOW", "FRIEND", "UNFRIEND"],
        default: "FOLLOW",
      },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, friendSchema);
