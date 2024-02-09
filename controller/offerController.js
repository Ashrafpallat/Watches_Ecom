const userModel = require("../model/user-model");
const offerModel = require('../model/offer-model')
const Products = require('../model/addproduct_model')
const Category = require('../model/category_model');


const loadOffers = async (req, res) => {
    try {
        const offers = await offerModel.find()
        const adminData = await userModel.findById({ _id: req.session.admin_id });
        res.render('admin/offers', { user: adminData, offers })
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddOffer = async (req, res) => {
    try {
        const categories = await Category.find()
        const products = await Products.find()
        const adminData = await userModel.findById({ _id: req.session.admin_id });
        res.render('admin/add-offer', { user: adminData, products, categories })
    } catch (error) {
        console.log(error.message);
    }
}

const addOffer = async (req, res) => {
    try {
        const { title, startingDate, expiryDate, percentage, applyFor } = req.body;
        const newOffer = new offerModel({
            title,
            startingDate,
            expiryDate,
            percentage,
            applyFor,
        });
        // Save the new offer
        const savedOffer = await newOffer.save();
        // Find the selected product or category by ID
        let applyForObject;
        if (applyFor) {
            applyForObject = await Products.findById(applyFor);
            if (!applyForObject) {
                applyForObject = await Category.findById(applyFor);
            }
        }
        // If the selected product or category is found, add the offer to it
        if (applyForObject) {
            applyForObject.offer = savedOffer._id;
            await applyForObject.save();
        }
        res.redirect('/admin/offers')
    } catch (error) {
        console.error(error.message);
    }
};

// const listOffer = async (req, res) => {
//     try {
//         const offerId = req.body.offerId
//         await offerModel.findByIdAndUpdate(offerId, { status: 'Active' });
//         res.json({ success: true })
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// const deleteOffer = async (req, res) => {
//     try {
//         const offerId = req.body.offerId;
//         // Find the offer to get details
//         const offer = await offerModel.findById(offerId);

//         // If the offer is found, update associated products or categories
//         if (offer) {
//             // Check if the offer is associated with products
//             if (offer.products && offer.products.length > 0) {
//                 // Update each associated product
//                 for (const productId of offer.products) {
//                     const product = await Products.findById(productId);
//                     if (product) {
//                         // Remove the offer association from the product
//                         product.offer = null;
//                         await product.save();
//                     }
//                 }
//             }

//             // Check if the offer is associated with categories
//             if (offer.categories && offer.categories.length > 0) {
//                 // Update each associated category
//                 for (const categoryId of offer.categories) {
//                     const category = await Category.findById(categoryId);
//                     if (category) {
//                         // Remove the offer association from the category
//                         category.offer = null;
//                         await category.save();
//                     }
//                 }
//             }
//         }

//         // Delete the offer
//         await offerModel.findByIdAndDelete(offerId);

//         res.json({ success: true });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId;

        // Delete the offer
        await offerModel.findByIdAndDelete(offerId);

        res.json({ success: true });
    } catch (error) {
        console.error(error.message);
    }
};



module.exports = {
    loadOffers,
    loadAddOffer,
    addOffer,
    // listOffer,
    // unlistOffer,
    deleteOffer,
}