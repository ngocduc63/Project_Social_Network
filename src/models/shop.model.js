'use strict';
const {model , Schema, Types}=require('mongoose');
const mongoose = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Shop'; // The name of the collection
const COLLECTION_NAME = 'Shops'; // The name of the collection

// Declare the Schema of the Mongo model
var shopSchema = new Schema({
    name:{
        type:String,
        trim:true,
        maxLenght:150
    },
    email:{
        type:String,
        trim:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    Status:{
        type:String,
        enum:['active', 'inactive'],
        default: 'inactive',
    },
    verfify:{
        type: mongoose.Schema.Types.Boolean,
        default: false  
    },
    roles:{
        type: Array,  
        default: []
    },
    


}, {
    timestamps: true,  
    collection: COLLECTION_NAME
} );


//Export the model
module.exports = mongoose.model(DOCUMENT_NAME, shopSchema);