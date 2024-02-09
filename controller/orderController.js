const orderModel = require("../model/order-model");
const userModel = require("../model/user-model");
const Product = require('../model/addproduct_model')

const loadOrders = async (req, res) => {
    try {
        const adminData = await userModel.findById({ _id: req.session.admin_id });
        // const orders = await orderModel.find().populate('user').populate('items.product');
        const orders = await orderModel.find()
            .sort({ createdAt: -1 }) // Sort by descending order of creation date
            .populate('user')
            .populate('items.product');

        res.render('admin/orders', { user: adminData, orders })
    } catch (error) {
        console.log(error.message);
    }
}

const loadOrderedItems = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const adminData = await userModel.findById({ _id: req.session.admin_id });
        const order = await orderModel.findOne({ _id: orderId }).populate('user').populate('items.product');
        res.render('admin/ordered-items', { user: adminData, order })
    } catch (error) {
        console.log(error.message);
    }
}

const changeOrderStatus = async (req, res) => {
    try {
        const newStatus = req.body.orderStatus;
        const orderId = req.body.orderId;
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
        if (updatedOrder) {
            res.redirect('/admin/orders')
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error changing order status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const acceptRetrun = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Step 1: Find the order
        const order = await orderModel.findById(orderId);

        // Step 2: Retrieve the items in the order
        const orderItems = order.items;

        // Step 3: Update product quantities
        for (const orderItem of orderItems) {
            const productId = orderItem.product;
            const quantity = orderItem.quantity;

            // Step 3a: Find the product
            const product = await Product.findById(productId);

            // Step 3b: Update the product quantity
            if (product) {
                product.quantity += quantity;
                await product.save();
            }
        }

        // Step 4: Remove the order
        await orderModel.findByIdAndDelete(orderId);
        res.redirect('/admin/orders')
    } catch (error) {
        console.error('accept return order error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = {
    loadOrders,
    loadOrderedItems,
    changeOrderStatus,
    acceptRetrun,
}
