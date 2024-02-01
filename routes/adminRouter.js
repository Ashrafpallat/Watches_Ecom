const express = require('express');
const adminRouter = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const config = require('../config/config');
const auth = require('../middlewares/adminAuth');
const adminController = require('../controller/adminController');
const categoryController = require('../controller/catogoryController')
const productController = require('../controller/productController');
const couponController = require('../controller/couponController');
const orderController = require('../controller/orderController');
const multer = require('multer');
// adminRouter.use(express.static(path.join(__dirname, 'assets', 'productImages'))) // destination for file uploads

const storage = config.configureMulter;
const upload = multer({ storage: storage });

adminRouter.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}))


adminRouter.use(bodyParser.json())
adminRouter.use(bodyParser.urlencoded({ extended: true }))
adminRouter.use(flash());



adminRouter.route('/')
  .get(auth.isAdminLogout, adminController.loadlogin)
  .post(adminController.verifyLogin);
adminRouter.get('/dashboard', auth.isAdminLogin, adminController.loadDashboard);
// Product managememnt
adminRouter.get('/adminproducts', auth.isAdminLogin, adminController.loadProducts);
adminRouter.route('/addproducts')
  .get(auth.isAdminLogin, adminController.loadaddProducts)
  .post(auth.isAdminLogin, productController.addproducts);
adminRouter.route('/edit-product/:productId')
  .get(auth.isAdminLogin, adminController.loadEditProduct)
  .post(auth.isAdminLogin,  productController.editProduct);
adminRouter.post('/listproduct', auth.isAdminLogin,  productController.listProduct);
adminRouter.post('/unlistproduct', auth.isAdminLogin,  productController.unlistProduct);
//  User management
adminRouter.get('/allusers', auth.isAdminLogin, adminController.loadUsers)
adminRouter.post('/block-user', auth.isAdminLogin, adminController.blockUser);
adminRouter.post('/unblock-user', auth.isAdminLogin, adminController.unblockUser);
// Category management
adminRouter.route('/addcategory')
  .get(categoryController.loadAddCategory)
  .post(categoryController.addCategory);
adminRouter.get('/deletecategory/:categoryId', categoryController.deleteCategory);
adminRouter.route('/editcategory/:categoryId')
  .get(categoryController.loadEditCategory)
  .post(categoryController.editCategory);
adminRouter.get('/unlistcategory/:categoryId', auth.isAdminLogin, categoryController.unlistCategory);
adminRouter.get('/listcategory/:categoryId', auth.isAdminLogin, categoryController.listCategory);
// Coupon management
adminRouter.get('/coupons', auth.isAdminLogin, adminController.loadCoupons);
adminRouter.get('/addcoupon', auth.isAdminLogin, couponController.loadAddCoupons)
adminRouter.post("/addcoupon", couponController.addCoupon) 
adminRouter.post('/listcoupon', couponController.listCoupon)
adminRouter.post('/unlistcoupon', couponController.unlistCoupon)
// Order management
adminRouter.get('/orders', auth.isAdminLogin,orderController.loadOrders)
adminRouter.get('/ordered-items/:orderId', auth.isAdminLogin, orderController.loadOrderedItems)
adminRouter.post('/change-order-status', orderController.changeOrderStatus)
adminRouter.get('/accept-return/:orderId', orderController.acceptRetrun)
adminRouter.get('/adminlogout', auth.isAdminLogout, adminController.loadLogout)
module.exports = adminRouter;

