const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true
    },
    couponCode: {
        type: String,
        required: true,
        unique: true,
    },
    discountAmount: {
        type: Number,
        required: true
    },
    // minAmount: {
    //     type: Number,
    //     required: true
    // },
    couponDescription: {
        type: String,
        required: true
    },
    // Availability: {
    //     type: Number,
    //     required: true
    // },
    expiryDate: {
        type: Date,
    },
    status: {
        type: String,   
        default: 'Active',
    },
    usersUsed: [{
        user_id: {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        }
    }],
}, { timestamps: true })

module.exports = mongoose.model('Coupon', couponSchema)