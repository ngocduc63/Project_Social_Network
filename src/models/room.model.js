"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Room"; // The name of the collection
const COLLECTION_NAME = "Rooms"; // The name of the collection

// Declare the Schema of the Mongo model
var roomSchema = new Schema(
  {
    created_by_user: { type: Schema.Types.ObjectId, ref: "User" },
    room_name: { type: String, trim: true },
    room_members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    last_message: {type: Schema.Types.ObjectId, ref: "Message"},
    sender_by_user: { type: Schema.Types.ObjectId, ref: "User" },
    watched: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, roomSchema);
