const mongoose = require('mongoose');   
const Schema   = mongoose.Schema;

//Creating the Product Schema
const productSchema = new Schema({
    title:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    imageUrl:{
        type:String,
        required: true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required: true
    }
});    
  
//A model is a class with which we construct documents
module.exports = mongoose.model('Product',productSchema); 

