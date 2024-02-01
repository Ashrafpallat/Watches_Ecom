const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            // status: {
            //     type: String,
            //     // enum: ['pending', 'confirmed', 'shipped', 'delivered'],
            //     default: 'pending',
            // },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    selectedAddress:{
        type: String,
    },

    paymentMethod: {
        type: String,
        enum: ['online', 'COD'],
        required: true,
    },
    status: {
        type: String,
        // enum: ['pending', 'confirmed', 'shipped', 'delivered'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Order', orderSchema);
