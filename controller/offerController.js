const userModel = require("../model/user-model");
const offerModel = require('../model/offer-model')

const loadOffers = async (req, res) => {
    try {
        const offers = await offerModel.find()
        const adminData = await userModel.findById({ _id: req.session.admin_id });
        res.render('admin/offers', {user:adminData, offers})
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddOffer = async (req, res) => {
    try {

        const adminData = await userModel.findById({ _id: req.session.admin_id });
        res.render('admin/add-offer', {user:adminData})
    } catch (error) {
        console.log(error.message);
    }
}

const addOffer = async (req, res) => {
    try {
        const { title, startingDate, expiryDate, percentage, status } = req.body;
        const newOffer = new offerModel({
            title,
            startingDate,
            expiryDate,
            percentage,
        });
         await newOffer.save();
         res.redirect('/admin/offers')
    } catch (error) {
        console.error(error.message);
    }
};

const listOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId
        await offerModel.findByIdAndUpdate(offerId, { status: 'Active' });
        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
    }
}

const unlistOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId
        await offerModel.findByIdAndUpdate(offerId, { status: 'Inactive' });
        res.json({ success: true })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadOffers,
    loadAddOffer,
    addOffer,
    listOffer,
    unlistOffer,
}