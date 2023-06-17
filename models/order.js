const mongoose = require('mongoose');   
const Schema   = mongoose.Schema;

//Creating the Order Schema
const OrderSchema = new Schema({
    products:[{
            product:{
                type:Object,
                required:true
            },
            quantity:{
                type:Number,
                required:true
            }
    }],
    user:{
        email:{
            type:String,
            required:true
        },
        userId:{
            type:Schema.Types.ObjectId,
            required: true,
            ref:'User'
        }
    }
    
});    
  
//A model is a class with which we construct documents
module.exports = mongoose.model('Order',OrderSchema); 

