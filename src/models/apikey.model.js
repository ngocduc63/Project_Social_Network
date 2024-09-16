'use strict';
 const  {model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Apikey'
const COLLECTION_NAME = 'Apikeys'

// {
//     "_id": {
//       "$oid": "66dda07756dc89b5947b5836"
//     },
//     "key": "71257407c3d58511e01c39b1ddcf0b844d1d104743510596f7b8332ef2a535d5e243b27d9d11192046807a75dadff45f50d6aa90c29d571108004aff69f8683b",
//     "status": true,
//     "permissions": [
//       "0000"
//     ],
//     "createdAt": {
//       "$date": "2024-09-08T13:02:47.342Z"
//     },
//     "updatedAt": {
//       "$date": "2024-09-08T13:02:47.342Z"
//     },
//     "__v": 0
// }


const apiKeySchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: Boolean,
        default: true
    },
    permissions:
        {
            type: [String],
            required: true,
            enum: ['0000', '1111', '2222'],
            // default: '0000'
        }
},{
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, apiKeySchema);