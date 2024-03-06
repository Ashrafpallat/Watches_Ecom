const express = require('express');
const userRouter = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const config = require('../config/config');
const userController = require('../controller/userController');
const auth = require('../middlewares/userAuth');
const path = require('path');
const flash = require('connect-flash');
const { filterByCategory, filter, sort, addtoCart, productCartDelete, deleteFromCart, addToWishlist, deleteFromWishlist, changeProductQuantity } = require('../controller/productController');
const { loadAddCoupons, addCoupon, applyCoupon } = require('../controller/couponController');
const { get } = require('http');



// userRouter.use(express.static(path.join(__dirname, '..', 'public', 'userImages')))
// userRouter.set('view engine', 'ejs')
// userRouter.set('views', path.join(__dirname, '..', 'views', 'users'))

userRouter.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
}))
userRouter.use(bodyParser.json())
userRouter.use(bodyParser.urlencoded({ extended: true }))
userRouter.use(flash());
// const storage = config.configureMulter(); 
// const upload = multer({ storage: storage });

userRouter.get('/', userController.loadHome);

userRouter.route('/register')
    .get(auth.isUserLogout, userController.loadRegister)
    .post(userController.insertUser);

userRouter.route('/login')
    .get(auth.isUserLogout, userController.loadlogin)
    .post(userController.verifyLogin);

userRouter.route('/verifyOTP')
    .get(auth.isUserLogout, userController.loadVerifyOTP)
    .post(userController.verifyOTP)
// Resend OTP
userRouter.get('/resendOTP', userController.resendOTP)

userRouter.get('/home', userController.loadHome)
userRouter.get('/products', userController.loadProducts)
//filter 
userRouter.get('/product/filter', filter)

// Product detailes view
userRouter.get('/productsDetails/:productId', userController.loadProductDetails);
// Cart managment
userRouter.get('/cart', auth.isUserLogin, userController.loadCart)
userRouter.get('/add-to-cart/:productId', addtoCart)
userRouter.post('/add-to-cart/:productId', addtoCart)
userRouter.post("/change-product-quantity", changeProductQuantity)
userRouter.get('/delete-from-cart/:productId', deleteFromCart)
//  wishlist
userRouter.get('/wishlist',auth.isUserLogin, userController.loadWishlist)
userRouter.post('/wishlist/add/:productId',auth.isUserLogin, addToWishlist);
userRouter.get('/delete-from-wishlist/:wishlistItemId', deleteFromWishlist)
// Coupon management
userRouter.post('/apply-coupon', applyCoupon)

// User profile
userRouter.get('/myprofile', auth.isUserLogin, userController.loadMyProfile)
userRouter.route('/edit-profile')
    .get(auth.isUserLogin, userController.loadEditProfile)
    .post(userController.editProfile)
// Adress management
userRouter.get('/manage-address', auth.isUserLogin, userController.loadManageAddress)
userRouter.route('/add-address')
    .get(auth.isUserLogin, userController.loadAddAddress)
    .post(userController.addAddress)
userRouter.get('/delete-address/:addressId', userController.deleteAdress);
userRouter.route('/edit-address/:addressId')
    .get(auth.isUserLogin, userController.loadeditAddress)
    .post(userController.editAddress)
// Order management
userRouter.route('/checkout')
    .get(auth.isUserLogin, userController.loadCheckout)
    .post(userController.addAddressFromCheckout)
userRouter.post('/place-order', userController.placeOrder)
userRouter.post('/verifyPayment', userController.verifyPayment)
userRouter.get('/order-placed', auth.isUserLogin, userController.loadOrderPlaced)
userRouter.get('/my-orders', auth.isUserLogin, userController.loadMyorders)
userRouter.get('/order-details/:id', auth.isUserLogin, userController.loadOrderDetails)
userRouter.post('/cancel-order', userController.cancelOrder)
userRouter.post('/return-order', userController.sendReturnRequest)
userRouter.post('/cancel-return', userController.cancelReturnRequest)
// Continue payment
userRouter.post('/continue-payment', userController.continuePayment)
// Forgot password
userRouter.post('/forgot-password', userController.sendOTP)
userRouter.route('/verifyOTP2')
    .get(auth.isUserLogout, userController.loadVerifyOTP2)
    .post(userController.verifyOTP2)
userRouter.route('/reset-password')
    .get(userController.loadResetPassword)
    .post(userController.resetPassword)
// Invoice 
userRouter.get('/generateInvoice/:orderId', auth.isUserLogin, userController.generateInvoicePDF)
// Wallet
userRouter.get('/wallet', auth.isUserLogin, userController.loadWallet)
// Referal
userRouter.get('/referal-link', userController.loadReferralCode)
// Add review
userRouter.route('/rate-product/:productId')
    .get(auth.isUserLogin, userController.loadAddReview)
    .post(userController.addReview)

userRouter.get('/logout', userController.loadLogout)
module.exports = userRouter; 