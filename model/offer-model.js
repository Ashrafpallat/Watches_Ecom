const mongoose=require('mongoose')


const offerSchema=new mongoose.Schema({
    title : {
        type : String,
        required : true
    },

    startingDate : {
        type : Date,
        required : true
    },

    expiryDate : {
        type : Date,
        required : true
    },

    percentage : {
        type : Number,
        required : true
    },
    status : {
        type : String, 
        default : 'Active'
    }

})

module.exports=mongoose.model('Offer',offerSchema)