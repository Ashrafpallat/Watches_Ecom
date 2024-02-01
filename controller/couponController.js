const Cart = require("../model/cart-model");
const Coupon = require("../model/coupon-model");
const userModel = require("../model/user-model");

const loadAddCoupons = async (req, res) => {
    try {
        const adminData = await userModel.findById({ _id: req.session.admin_id });
        res.render('admin/add-coupon', { user: adminData });
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin')
    }
};

const addCoupon = async (req, res) => {
    try {
        const newCoupon = new Coupon({
            couponName: req.body.couponName,
            couponCode: req.body.couponCode,
            discountAmount: req.body.discountAmount,
            minAmount: req.body.minAmount,
            couponDescription: req.body.couponDescription,
            availability: req.body.availability,
            expiryDate: req.body.expiryDate,
            status: 'Active',
        });
        await newCoupon.save();
        res.redirect('/admin/coupons')
    } catch (error) {
        console.log(error.message);
    }
}

const listCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId
        await Coupon.findByIdAndUpdate(couponId, { status: 'Active' });
        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
    }
}

const unlistCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId
        await Coupon.findByIdAndUpdate(couponId, { status: 'Inactive' });
        res.json({ success: true })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const couponCode = req.body.couponCode;

        // Check if the coupon is valid and not used by the user
        const coupon = await Coupon.findOne({
            couponCode: couponCode,
            usersUsed: { $not: { $elemMatch: { user_id: userId } } }
        });

        if (coupon) {
            // Apply the coupon discount to the cart
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            const discountAmount = coupon.discountAmount;
            req.session.discountAmount= discountAmount
            // res.redirect('/cart')
            console.log('coupon applied');
            coupon.usersUsed.push({ user_id: userId });
            await coupon.save();
            res.json({success:true})
        } else {
            // res.redirect('/cart?error=coupon'); // Redirect with an error parameter
            res.json({success:false})
        }
    } catch (error) {
        console.log('apply coupon error ',error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// const applyCoupon = async (req, res) => {
//     try {
//         const userId = req.session.user_id;
//         const couponCode = req.body.couponCode;

//         // Check if the coupon is valid and not used by the user
//         const coupon = await Coupon.findOne({
//             couponCode: couponCode,
//             userUsed: { $not: { $elemMatch: { user_id: userId } } }
//         });

//         if (coupon) {
//             const discountAmount = coupon.discountAmount;
//             req.session.discountAmount = discountAmount;

//             // Mark coupon as used by the user
//             coupon.usersUsed.push({ user_id: userId });
//             await coupon.save();

//             // Respond with a JSON success message
//             res.json({ success: true, message: 'Coupon applied successfully', discountAmount });
//         } else {
//             // Respond with a JSON error message
//             res.status(400).json({ success: false, message: 'Invalid coupon code or already used' });
//         }
//     } catch (error) {
//         console.error('apply coupon error ', error.message);
//         // Respond with a JSON error message
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// };



module.exports = {
    loadAddCoupons,
    addCoupon,
    listCoupon,
    unlistCoupon,
    applyCoupon,
}