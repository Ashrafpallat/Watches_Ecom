const User = require('../model/user-model');
const Products = require('../model/addproduct_model')
const bcrypt = require('bcrypt');
const { use } = require('../routes/userRouter');
const Category = require('../model/category_model');
const Coupon = require('../model/coupon-model');
const orderModel = require('../model/order-model');
const offer = require('../model/offer-model')

const loadlogin = (req, res) => {
    try {
        res.render('admin/adminlogin', { message: req.flash('error') });

    } catch (error) {
        console.log(error.message);
    }
};

//verify Login-----------------------------------------------------------------------------
const verifyLogin = async (req, res) => {
    try {
        const adminData = await User.findOne({ fname: req.body.fname })
        if (adminData) {
            const passwordMatch = await bcrypt.compare(req.body.password, adminData.password)
            
            if (passwordMatch && adminData.role == 'admin') {
                req.session.admin_id = adminData._id;
                res.redirect('/admin/dashboard');
            } else {
                req.flash('error', 'Email or Password is incorrect');
                res.redirect('/admin')
            }
        } else {
            req.flash('error', 'User not found');
            res.redirect('/admin')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const loadDashboard = async (req, res) => {
    try {

        const adminData = await User.findById({ _id: req.session.admin_id });
        res.render('admin/dashboard', { user: adminData });

    } catch (error) {

        console.log(error.message);
    }
};

const loadLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log("logout error", error.message)
    }
};

const loadProducts = async (req, res) => {
    try {
        const adminData = await User.findById({ _id: req.session.admin_id });
        const products = await Products.find().populate([
            { path: 'category' },
            { path: 'offer' }
        ]);
        res.render('admin/adminproducts', { user: adminData, products: products }); // Pass products to the view
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin')
    }
};

const loadaddProducts = async (req, res) => {
    try {
        const categories = await Category.find();
        const adminData = await User.findById({ _id: req.session.admin_id });
        res.render('admin/addproducts', { user: adminData, categories: categories });

    } catch (error) {
        console.log(error.message);
    }
};


const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const categories = await Category.find();
        const adminData = await User.findById({ _id: req.session.admin_id });
        // const product = await Products.findById(productId);
        const product = await Products.findById(productId).populate('category');


        if (!product) {
            // Handle product not found
            res.status(404).send('Product not found');
            return;
        }

        res.render('admin/edit-product', { product: product, user: adminData, categories });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadUsers = async (req, res) => {
    try {

        const allusers = await User.find(); // Fetch products from MongoDB
        const adminData = await User.findById({ _id: req.session.admin_id });
        res.render('admin/allusers', { allusers: allusers, user: adminData });
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin')
    }
};

const loadEditUser = async (req, res) => {
    try {

        const userid = req.params.userid;
        const edituser = await User.findById(userid);
        const userData = await User.findById({ _id: req.session.admin_id });


        res.render('admin/edituser', { edituser: edituser, user: userData })
    } catch (error) {
        console.log(error.message);
    }
};

const blockUser = async (req, res) => {
    // const userId = req.params.userId;

    try {
        console.log('userid ', req.body.userId); 
        const userId= req.body.userId
        await User.findByIdAndUpdate(userId, { status: 'Inactive' });
        res.json({success:true})
        // res.redirect('/allusers');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const unblockUser = async (req, res) => {
    // const userId = req.params.userId;

    try {
        const userId= req.body.userId
        await User.findByIdAndUpdate(userId, { status: 'Active' });
        res.json({success:true})
        // res.redirect('/allusers');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const loadCoupons = async(req, res)=>{
    try {
        const coupon = await Coupon.find();
        const adminData = await User.findById({ _id: req.session.admin_id });
        res.render('admin/coupons', { user: adminData, coupon });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadlogin,
    verifyLogin,
    loadDashboard,
    loadLogout,
    loadProducts,
    loadaddProducts,
    loadEditProduct,
    loadUsers,
    loadEditUser,
    blockUser,
    unblockUser,
    loadCoupons,
}

