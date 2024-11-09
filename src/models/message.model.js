"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Message"; // The name of the collection
const COLLECTION_NAME = "Messages"; // The name of the collection

// Declare the Schema of the Mongo model
var messageSchema = new Schema(
  {
    room_id: {type: Schema.Types.ObjectId, ref: "Room"},
    created_by_user: { type: Schema.Types.ObjectId, ref: "User" },
    data: {
      content: { type: String, trim: true },
      type: {
        type: String,
        enum: ["text", "image", "video", "audio"],
        default: "text",
      },
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, messageSchema);
