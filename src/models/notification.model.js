"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Notification"; // The name of the collection
const COLLECTION_NAME = "Notifications"; // The name of the collection

// POST-001: create post,
// POST-002: like post,
// POST-003: comment post,
// POST-004: share post,
// FRIEND-001: add friend,
// FRIEND-002: accept friend

// Declare the Schema of the Mongo model
var NotificationSchema = new Schema(
  {
    noti_type: {
      type: "string",
      enum: [
        "POST-001",
        "POST-002",
        "POST-003",
        "POST-004",
        "FRIEND-001",
        "FRIEND-002",
      ],
    },
    noti_senderId: {type: Schema.Types.ObjectId, required: true, ref:'User'},
    noti_receivedId: {type: Schema.Types.ObjectId, required: true, ref:'User'},
    noti_content: {type: String, required: true},
    noti_options: {type: Object, default: {}}, // neu co them tt gi thi cho vao day
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, NotificationSchema);
