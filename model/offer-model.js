const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    startingDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'Active'
    },
    applyFor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

// Define a pre-hook to remove the offer ID from the associated product or category before deletion
offerSchema.pre('findOneAndDelete', async function(next) {
    const offer = this;

    try {
        // Find the product or category associated with the offer
        let applyForObject;
        if (offer.applyFor) {
            applyForObject = await Products.findById(offer.applyFor);
            if (!applyForObject) {
                applyForObject = await Category.findById(offer.applyFor);
            }
        }

        // If the associated product or category is found, remove the offer ID from it
        if (applyForObject) {
            applyForObject.offer = null; // Remove the offer ID
            await applyForObject.save();
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Offer', offerSchema);
