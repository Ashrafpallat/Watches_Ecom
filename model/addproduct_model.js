const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageURL: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
    quantity: {
        type: Number,
        default: 0
    },
    imageURL: {
        type: String
    },
    imageURLs: [{ type: String }],  // Array to store multiple image URLs

    status: {
        type: String,
        enum: ['listed', 'unlisted'],
        default: 'listed'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Products', productSchema)

