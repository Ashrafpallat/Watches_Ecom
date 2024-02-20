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
        const allUsers = await User.find()
        const adminData = await User.findById({ _id: req.session.admin_id });
        const totalProducts = await Products.countDocuments()
        const allOrders = await orderModel.find();
        const totalOrders = await orderModel.countDocuments()
        const totalUsers = await User.countDocuments()
        const totalRevenue = allOrders.reduce((total, order) => total + order.totalAmount, 0);
        const orders = await orderModel.find({}, 'createdAt');
        const users = await User.find({}, 'createdAt')

        // Group orders by year and count the number of orders for each year
        const yearlyOrders = orders.reduce((accumulator, order) => {
            const year = order.createdAt.getFullYear().toString();
            accumulator[year] = (accumulator[year] || 0) + 1;
            return accumulator;
        }, {});

        // Extract years and order counts for the specified years
        const years = ["2024", "2025", "2026", "2027"];
        const orderCounts = years.map(year => yearlyOrders[year] || 0);

        // Group users by year and count the number of users for each year
        const yearlyUsers = users.reduce((accumulator, user) => {
            const year = user.createdAt.getFullYear().toString();
            accumulator[year] = (accumulator[year] || 0) + 1;
            return accumulator;
        }, {});

        // Extract years and user counts for the specified years
        const userCounts = years.map(year => yearlyUsers[year] || 0);

        // Monthly data

        const currentYear = new Date().getFullYear();
        // Filter orders for the current year
        const usersThisYear = users.filter(user => user.createdAt.getFullYear() === currentYear);

        // Group orders by month and count the number of orders for each month
        const usersByMonth = usersThisYear.reduce((accumulator, user) => {
            const month = user.createdAt.getMonth(); // Get the month index (0-11)
            accumulator[month] = (accumulator[month] || 0) + 1;
            return accumulator;
        }, {});
        const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        // Map order counts by month to corresponding labels
        const userCountsByMonth = monthLabels.map((label, index) => usersByMonth[index] || 0);

        // Monthly orders
        // Filter orders for the current year
        const ordersThisYear = orders.filter(order => order.createdAt.getFullYear() === currentYear);

        // Group orders by month and count the number of orders for each month
        const ordersByMonth = ordersThisYear.reduce((accumulator, order) => {
            const month = order.createdAt.getMonth(); // Get the month index (0-11)
            accumulator[month] = (accumulator[month] || 0) + 1;
            return accumulator;
        }, {});
        // Map order counts by month to corresponding labels
        const orderCountsByMonth = monthLabels.map((label, index) => ordersByMonth[index] || 0);


        const totalNonDeliveredOrdersResult = await orderModel.aggregate([
            {
                $match: {
                    status: { $ne: 'delivered' } // Filter out documents with status 'delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    totalNonDeliveredOrders: { $sum: 1 } // Count the remaining documents
                }
            }
        ]);
        if (totalNonDeliveredOrdersResult.length > 0) {
            // Extract the totalNonDeliveredOrders value from the first element of the array
            var totalNonDeliveredOrders = totalNonDeliveredOrdersResult[0].totalNonDeliveredOrders;
        } else {
            console.log('No non-delivered orders found.');
        }
        console.log('by month ', orderCountsByMonth);
        res.render('admin/dashboard', {
            user: adminData, totalRevenue, totalNonDeliveredOrders, totalOrders, totalUsers, totalProducts, orderCounts, userCounts,
            orderCountsByMonth, userCountsByMonth, allUsers,
        });
    } catch (error) {
        console.log(error.message);
    }
};


const loadSalesReport = async (req, res) => {
    try {
        const adminData = await User.findById({ _id: req.session.admin_id });
        const orders = await orderModel.find({ status: 'Delivered' })
            .sort({ createdAt: -1 }) // Sort by descending order of creation date
            .populate('user')
            .populate('items.product');
        let totalAmount = 0;

        // Iterate through each order
        for (const order of orders) {
            // Calculate the total amount for each order
            let orderTotal = 0;
            for (const item of order.items) {
                orderTotal += item.quantity * item.product.price; // Assuming each item has a 'quantity' and 'product' field with 'price'
            }
            totalAmount += orderTotal;
        }

        res.render('admin/sales-report', { user: adminData, orders, totalAmount })
    } catch (error) {
        console.log(error.message);
    }
}

const generateSalesReport = async (req, res) => {
    try {
        console.log(req.body);
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        const orders = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    status: "Delivered" // Assuming "Delivered" is the status for delivered orders
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalamount" }
                }
            }
        ]);
        const totalDeliveredAmount = orders.length > 0 ? orders[0].totalAmount : 0;
        res.render('admin/sales-report', { user: adminData, orders, totalDeliveredAmount })
    } catch (error) {
        console.log(error.message);
    }
}


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
        const userId = req.body.userId
        await User.findByIdAndUpdate(userId, { status: 'Inactive' });
        res.json({ success: true })
        // res.redirect('/allusers');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const unblockUser = async (req, res) => {
    // const userId = req.params.userId;

    try {
        const userId = req.body.userId
        await User.findByIdAndUpdate(userId, { status: 'Active' });
        res.json({ success: true })
        // res.redirect('/allusers');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const loadCoupons = async (req, res) => {
    try {
        const coupon = await Coupon.find();
        const adminData = await User.findById({ _id: req.session.admin_id });
        res.render('admin/coupons', { user: adminData, coupon });
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log("logout error", error.message)
    }
};

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
    loadSalesReport,
    generateSalesReport,

}

