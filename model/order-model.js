const mongoose = require('mongoose');
const orderid = require('order-id')('key');
const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
    },
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
    selectedAddress: {
        type: String,
    },

    paymentMethod: {
        type: String,
        enum: ['online', 'COD', 'wallet'],
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

orderSchema.pre('save', async function (next) {
    try {
        this.orderId = orderid.generate();
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Order', orderSchema);
