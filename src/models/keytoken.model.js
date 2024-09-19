'use strict';
const {Schema, model, default: mongoose} = require('mongoose'); // Erase if already required


const DOCUMENT_NAME = 'Key'; // The name of the collection
const COLLECTION_NAME = 'Keys'; // The name of the collection
// Declare the Schema of the Mongo model
var keyTokenSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    privateKey:{
        type:String,
        required:true  
    },
    publicKey:{
        type:String,
        required:true  
    },
    refreshTokensUsed:{
        type:Array, default:[], // nhung RT da duoc su dung
    },
    refreshToken: {
        type:String,
        required:true
    }
},{
    collection: COLLECTION_NAME,
    timestamps: true
});

//Export the model
module.exports = model(DOCUMENT_NAME, keyTokenSchema);