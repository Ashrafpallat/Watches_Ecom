const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },

    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    verified: {
        type: Boolean,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    addresses: [{
        addressName: String,
        addressPhone: Number,
        locality: String,
        city: String,
        state: String,
        pincode: Number,
        address: String,
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },

})

module.exports = mongoose.model('User', userSchema)