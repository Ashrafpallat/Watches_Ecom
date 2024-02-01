const User = require('../model/user-model');
const bcrypt = require('bcrypt');
const Products = require('../model/addproduct_model')
const Category = require('../model/category_model');
const Cart = require('../model/cart-model');
const userOTPVerification = require('../model/userOTPVerification');
const Wishlist = require('../model/wishlist-model');
const couponModel = require('../model/coupon-model');
const orderModel = require('../model/order-model');

const dotenv = require('dotenv');
require('dotenv').config();

const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_WMFGNMq1lP6s4b',
    key_secret: 'f8OZaeUgk7Yo8Ufa8qK5L1qF',
});

// otp---------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }

}

const loadRegister = async (req, res) => {

    try {
        if (req.session.user_id) {
            res.redirect('/home')
        } else {
            res.render('user/registration', { message: req.flash('error'), user: null, cartItemsLength: null })
        }

    } catch (error) {
        console.log(error.message)
    }
}

const insertUser = async (req, res) => {
    console.log(process.env.EMAIL_PASSWORD);
    console.log(process.env.EMAIL_USER);

    try {
        const sPassword = await securePassword(req.body.password);
        const user = User({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            phone: req.body.phone,
            // image: req.file.filename,
            password: sPassword,
            verified: false,
        })

        const userData = await user.save();
        sendOTPVerificationEmail(user, res);

        if (userData) {
            console.log('registraion success');
            res.redirect(`/verifyOTP?email=${userData.email}`);
        } else {
            console.log('registraion failed');
            req.flash('error', 'Registration failed. Please try again.');
            res.redirect('/register')
        }
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // Duplicate key error for the email field
            console.log('Registration failed: Email already in use');
            req.flash('error', 'Email already in use.');
            res.redirect('/register')
        } else {
            // Other errors
            console.error('Registration failed:', error.message);
            req.flash('error', 'Registration failed');
            res.redirect('/register')
        }
    }
};
//login user methods
const loadlogin = async (req, res) => {
    try {
        if (req.session.user_id) {
            res.redirect('/home')
        } else {
            res.render('user/login', { errorMessages: req.flash('error'), successMessages: req.flash('success'), user: null, cartItemsLength: null })
        }
    } catch (error) {
        console.log(error.message)
    }
}
//verify Login-----------------------------------------------------------------------------
const verifyLogin = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.body.email })
        if (userData) {
            const passwordMatch = await bcrypt.compare(req.body.password, userData.password)
            if (passwordMatch && userData.verified == true) {
                if (userData.status == 'Active') {
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                } else {
                    req.flash('error', 'User has been blocked');
                    res.redirect('/login')
                }
            } else {
                req.flash('error', 'Invalid email or password');
                res.redirect('/login')
            }
        } else {
            req.flash('error', 'User not found');
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
    }
}
const loadVerifyOTP = (req, res) => {
    try {
        const email = req.query.email
        res.render('user/verifyOTP', { email: email, user: null, error: req.flash('error') })
    } catch (error) {
        console.log(error.message);
    }
}

//load home---------------------------------------------------------------------------------
const loadHome = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findById({ _id: req.session.user_id });
            const userId = userData._id;
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (userData && userData.status === 'Active') {
                res.render('user/home', { user: userData, cart: cart });
            } else {
                res.render('user/home', { user: null, cart: null });
            }
        } else {
            res.render('user/home', { user: null, cart: null });
        }

    } catch (error) {
        res.render('user/home', { user: null, cart: null });
        console.log(error.message);
    }
};
// const loadProducts = async (req, res) => {
//     if (req.session.user_id) {
//         const userData = await User.findById({ _id: req.session.user_id });
//         if (userData && userData.status === 'Active') {
//             try {
//                 const userId = userData._id;
//                 const cart = await Cart.findOne({ userId }).populate('items.productId');
//                 const categories = await Category.find();
//                 const products = await Products.find();
//                 res.render('user/products', { products, user: userData, categories: categories, cart: cart });
//             } catch (error) {
//                 res.status(500).send('Internal Server Error');
//             }
//         } else {
//             const categories = await Category.find();
//             const products = await Products.find(); // Fetch products from MongoDB
//             res.render('user/products', { products, user: null, categories, cart: null });
//         }
//     } else {
//         const categories = await Category.find();
//         const products = await Products.find(); // Fetch products from MongoDB
//         res.render('user/products', { products, user: null, categories, cart: null });
//     }
// };


const loadProducts = async (req, res) => {
    if (req.session.user_id) {
        const userData = await User.findById({ _id: req.session.user_id });
        if (userData && userData.status === 'Active') {
            try {
                const userId = userData._id;
                const cart = await Cart.findOne({ userId }).populate('items.productId');
                const categories = await Category.find();

                const PAGE_SIZE = 3; // Number of products per page
                // Get the current page from the query parameter, default to 1
                const page = parseInt(req.query.page) || 1;
                const skip = (page - 1) * PAGE_SIZE;
                const searchText = req.query.search;
                // Initialize an empty query object
                const query = {};

                // If search text is provided, add a filter for the 'name' field
                if (searchText) {
                    // Use $regex for a case-insensitive search on the 'name' field
                    query.title = { $regex: searchText, $options: 'i' };
                }

                // Fetch paginated products and total count from MongoDB using the query
                const products = await Products.find(query).skip(skip).limit(PAGE_SIZE).populate('category');
                const totalCount = await Products.countDocuments(query);
                const totalPages = Math.ceil(totalCount / PAGE_SIZE);

                res.render('user/products', { products, user: userData, categories, cart, currentPage: page, totalPages });
            } catch (error) {
                res.status(500).send('Internal Server Error');
            }
        } else {
            const categories = await Category.find();
            const products = await Products.find().populate('category');
            res.render('user/products', { products, user: null, categories, cart: null, totalPages: null });
        }
    } else {
        const categories = await Category.find();
        const products = await Products.find().populate('category');
        res.render('user/products', { products, user: null, categories, cart: null, totalPages: null });
    }
};

const loadProductDetails = async (req, res) => {
    const productId = req.params.productId;
    const product = await Products.findById(productId); // Fetch the details of the specific product

    if (req.session.user_id) {
        const userData = await User.findById({ _id: req.session.user_id });
        if (userData && userData.status === 'Active') {
            try {
                const userId = userData._id;
                const cart = await Cart.findOne({ userId }).populate('items.productId');
                // const userData = await User.findById({ _id: req.session.user_id });
                res.render('user/productsDetails', { product: product, user: userData, cart: cart });
            } catch (error) {
                console.log(error.message);
            }
        } else {
            try {
                const products = await Products.find(); // Fetch products from MongoDB
                res.render('user/productsDetails', { products, user: null, cart: null });
            } catch (error) {
                console.log(error.message);
            }
        }
    } else {
        try {
            res.render('user/productsDetails', { product: product, user: null, cart: null });
        } catch (error) {
            console.log(error.message);
        }
    }

};
// send otp verification mail
const sendOTPVerificationEmail = async ({ _id, email }, res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("Generated ", otp);
        // mail options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify you email",
            // html: otp
            html:

                `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #F9D9BE">
                    <a href="" style="background-color: black; font-size:1.4em;color: #F9D9BE;text-decoration:none;font-weight:600">W<span style="color: white;">atches</span></a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Thank you for choosing Watches. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
                <h2 style="background: #F9D9BE;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                <p style="font-size:0.9em;">Regards,<br />Watches</p>
                <hr style="border:none;border-top:1px solid #F9D9BE" />
                <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                    <p> Watches Inc</p>
                     <!-- <p>1600 Amphitheatre Parkway</p>
                    <p>California</p>  -->
                </div>
            </div>
        </div> `
        }
        // hash the otp
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        console.log('email', email);
        const newOTPVerification = await new userOTPVerification({
            userId: _id,
            otp: hashedOTP,
            recipient_email: email,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000
        });
        // save otp record
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);
        console.log("userid:", _id);
        console.log("line 278 ", email);
    } catch (error) {
        console.log('generate otp err ', error.message);
    }
}
// verifying OTP 
const verifyOTP = async (req, res) => {
    try {
        let { otp, email } = req.body;
        // const email = req.query.email;
        console.log('entered otp', otp);
        console.log('query email', email);
        if (!email || !otp) {
            throw Error('Empty otp details are not allowed');
        } else {
            const userOTPVerificationRecords = await userOTPVerification.findOne({
                recipient_email: email
            })
            // if (userOTPVerificationRecords.length <= 0) {
            //     // no record found
            //     throw new Error("Account record doesn't exist or verified already");
            // } else {
            // user otp record exist
            const { expiresAt } = userOTPVerificationRecords;
            const hashedOTP = userOTPVerificationRecords.otp;
            if (expiresAt < Date.now()) {
                // user otp record has expired
                await userOTPVerification.deleteMany({ recipient_email: email });
                req.flash('error', 'Time out.');
                res.redirect(`/verifyOTP?email=${email}`);

                throw new Error("Code has expired. Please request again ");
            } else {
                const validOTP = await bcrypt.compare(otp, hashedOTP);
                if (!validOTP) {
                    // Invalid OTP
                    req.flash('error', 'Invalid OTP.');
                    res.redirect(`/verifyOTP?email=${email}`);

                    throw new Error('Invalid OTP')
                } else {
                    // seccess
                    await User.updateOne({ email: email }, { $set: { verified: true } });
                    // await userOTPVerification.deleteMany({ userId });
                    await userOTPVerification.deleteMany({ recipient_email: email });
                    console.log("email verified successfully");
                    req.flash('success', 'Your registration is successful, please login now');
                    res.redirect('/login')
                }
            }
        }
        // }
    } catch (error) {
        console.log(error.message);
    }
}

const loadCart = async (req, res) => {
    try {
        if (req.session.user_id) {
            const couponDiscount = req.session.discountAmount || 0;
            const userId = req.session.user_id;
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            const userData = await User.findById(req.session.user_id);
            const unusedCoupons = await couponModel.find({
                usersUsed: { $not: { $elemMatch: { user_id: userId } } },
                expiryDate: { $gt: new Date() } // Check if expiryDate is greater than the current date
            });


            res.render('user/cart', { user: userData, cart, coupons: unusedCoupons, couponDiscount })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}


const loadWishlist = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userId = req.session.user_id; // Assuming you have a user session
            // Find the user's wishlist items
            const wishlistItems = await Wishlist.find({ userId }).populate('productId');
            const userData = await User.findById(req.session.user_id);

            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/wishlist', { user: userData, wishlistItems, cart: cart })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const loadMyProfile = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userId = req.session.user_id; // Assuming you have a user session
            const userData = await User.findById(req.session.user_id);
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/myProfile', { user: userData, cart: cart })
        }
    } catch (error) {
        console.log(error.message);
    }
};

const loadEditProfile = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userId = req.session.user_id; // Assuming you have a user session
            const userData = await User.findById(req.session.user_id);
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/editProfile', { user: userData, cart: cart })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editProfile = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const existingUser = await User.findById(userId);

        existingUser.fname = req.body.fname;
        existingUser.phone = req.body.phone;
        const updatedUser = await existingUser.save();
        res.redirect('/myprofile')
    } catch (error) {
        console.error('Error updating profile:', error.message)
    }
};


const loadLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log("logout error", error.message)
    }
};

const loadManageAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.render('user/manageAddress', { user: userData, addresses: userData.addresses, cart: cart });
    } catch (error) {
        console.error(error.message);
    }
};

const loadAddAddress = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userId = req.session.user_id; // Assuming you have a user session
            const userData = await User.findById(req.session.user_id);
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/add-address', { user: userData, cart: cart })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const addAddress = async (req, res) => {
    try {
        const { addressName, addressPhone, locality, city, state, pincode, address } = req.body;

        const userId = req.session.user_id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Add the new address to the user's addresses array
        user.addresses.push({
            addressName,
            addressPhone,
            locality,
            city,
            state,
            pincode,
            address,
        });

        // Save the updated user document
        await user.save();
        res.redirect('/manage-address')

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteAdress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressIdToDelete = req.params.addressId;
        const user = await User.findByIdAndUpdate(userId, {
            $pull: { addresses: { _id: addressIdToDelete } }
        }, { new: true });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.addresses.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.redirect("/manage-Address")
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const loadeditAddress = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userId = req.session.user_id;
            const addressId = req.params.addressId
            const userData = await User.findById(req.session.user_id);
            const address = userData.addresses.find(address => address._id.equals(addressId));
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/edit-address', { user: userData, cart: cart, address })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editAddress = async (req, res) => {
    try {
        const addressIdToUpdate = req.params.addressId;
        const updatedAddress = {
            addressName: req.body.addressName,
            addressPhone: req.body.addressPhone,
            locality: req.body.locality,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            address: req.body.address,
        };
        const user = await User.findOneAndUpdate(
            { 'addresses._id': addressIdToUpdate },
            { $set: { 'addresses.$': updatedAddress } },
            { new: true }
        );
        if (user) {
            res.redirect('/manage-address');
        } else {
            res.status(404).send('Address not found');
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadCheckout = async (req, res) => {
    try {
        if (req.session.user_id) {
            const discountAmount = req.session.discountAmount || 0;
            const userId = req.session.user_id;
            const userData = await User.findById(req.session.user_id);
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/checkout', { user: userData, cart: cart, addresses: userData.addresses, discountAmount })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const addAddressFromCheckout = async (req, res) => {
    try {
        const { addressName, addressPhone, locality, city, state, pincode, address } = req.body;

        const userId = req.session.user_id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Add the new address to the user's addresses array
        user.addresses.push({
            addressName,
            addressPhone,
            locality,
            city,
            state,
            pincode,
            address,
        });

        // Save the updated user document
        await user.save();
        res.redirect('/checkout')

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const newOrder = {
            user: userId,
            items: cart.items.map(items => ({
                product: items.productId,
                quantity: items.quantity,
                price: items.productId.price,
                // status: 'Order placed',
            })),
            totalAmount: req.body.totalAmount || 0,
            selectedAddress: req.body.selectedAddress,
            paymentMethod: req.body.paymentMethod || '',
            status: 'Payment Pending', // Updated status
        };
        const order = await orderModel.create(newOrder);
        const paymentMethod = req.body.paymentMethod;
        req.session.orderId = order._id

        if (paymentMethod === 'COD') {
            await orderModel.updateOne({ _id: order._id }, { $set: { status: "order placed" } });

            // Update product quantities
            for (const item of cart.items) {
                const productId = item.productId._id;
                const quantityToSubtract = item.quantity;
                // Subtract the quantity from the product in the database
                await Products.findByIdAndUpdate(productId, { $inc: { quantity: -quantityToSubtract } });
                console.log('quantiy decreased');
            }
            delete req.session.discountAmount;
            await Cart.findOneAndDelete({ userId });
            console.log('cart items deleted');
            // res.status(201).json(order); // Sending the created order as a response
            res.json({ codSuccess: true })
        } else {
            var options = {
                amount: parseInt(req.body.totalAmount) * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: order._id
            };
            instance.orders.create(options, function (err, razorpayOrder) {
                if (err) {
                    console.log(err);
                } else {
                    // res.status(201).json(razorpayOrder); // Sending the created order as a response
                    res.json({ razorpayOrder });

                    console.log('razorpay order ', razorpayOrder);
                }

            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        console.log('verify pymnt ', req.body);
        const response = req.body.response
        const bodyOrder = req.body.order
        var crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', 'f8OZaeUgk7Yo8Ufa8qK5L1qF')
        hmac.update(response.razorpay_order_id + '|' + response.razorpay_payment_id)
        hmac = hmac.digest('hex')
        if (hmac == response.razorpay_signature) {
            //change order status
            await orderModel.updateOne({ _id: bodyOrder.receipt }, { $set: { status: "order placed" } });
            // Update product quantities
            for (const item of cart.items) {
                const productId = item.productId._id;
                const quantityToSubtract = item.quantity;
                // Subtract the quantity from the product in the database
                await Products.findByIdAndUpdate(productId, { $inc: { quantity: -quantityToSubtract } });
                console.log('quantiy decreased');
            }
            delete req.session.discountAmount;
            await Cart.findOneAndDelete({ userId });
            console.log('cart items deleted');
            res.json({status:true})
        }
    } catch (error) {
        console.log('verify err ',error.message);
    }

}

const loadOrderPlaced = async (req, res) => {
    try {
        const orderId = req.session.orderId;
        const userId = req.session.user_id
        const userData = await User.findById(req.session.user_id);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const order = await orderModel.findById(orderId).populate('items.product', 'title');
        res.render('user/order-placed', { user: userData, cart: cart, order: order })
    } catch (error) {
        console.log(error.message);
    }
}

const loadMyorders = async (req, res) => {
    try {
        const orderId = req.session.orderId;
        const userId = req.session.user_id
        const userData = await User.findById(req.session.user_id);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        // Fetch orders for the specific user and populate the 'user' and 'items.product' fields
        const order = await orderModel.find({ user: userId }).populate('user').populate('items.product');
        res.render('user/my-orders', { user: userData, cart, order })
    } catch (error) {
        console.log(error.message);
    }
}

const loadOrderDetails = async (req, res) => {
    try {
        // const orderId = req.session.orderId;
        const orderId = req.params.id
        const userId = req.session.user_id
        const userData = await User.findById(req.session.user_id);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        // const order = await orderModel.findById(orderId).populate('items.productId');
        const order = await orderModel
            .findById(orderId)
            .populate('user')
            .populate({
                path: 'items.product',
                populate: { path: 'category' } // Assuming 'category' is a field in the 'items.product' schema
            });
        res.render('user/order-details', { user: userData, cart, order })
    } catch (error) {
        console.log(error.message);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        console.log('orderid ', orderId);
        // Step 1: Find the order
        const order = await orderModel.findById(orderId);

        // Step 2: Retrieve the items in the order
        const orderItems = order.items;

        // Step 3: Update product quantities
        for (const orderItem of orderItems) {
            const productId = orderItem.product;
            const quantity = orderItem.quantity;

            // Step 3a: Find the product
            const product = await Products.findById(productId);

            // Step 3b: Update the product quantity
            if (product) {
                product.quantity += quantity;
                await product.save();
            }
        }

        // Step 4: Remove the order
        await orderModel.findByIdAndDelete(orderId);
        // res.redirect('/my-orders')
        res.json({ success: true })

    } catch (error) {
        console.error('Cancel order error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const sendReturnRequest = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        console.log('jjjj ', orderId);
        const sendReturnRequest = await orderModel.findByIdAndUpdate(orderId, { status: 'Pending' }, { new: true });
        if (sendReturnRequest) {
            // res.redirect('/my-orders')
            res.json({ success: true })
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const cancelReturnRequest = async (req, res) => {
    try {
        const orderId = req.body.orderId
        const cancelReturnRequest = await orderModel.findByIdAndUpdate(orderId, { status: 'Delivered' }, { new: true });
        if (cancelReturnRequest) {
            // res.redirect('/my-orders')
            res.json({ success: true })
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const sendOTP = async (req, res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("Generated ", otp);
        // mail options
        const { email } = req.body;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password reset request",
            // html: otp
            html:

                `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #F9D9BE">
                    <a href="" style="background-color: black; font-size:1.4em;color: #F9D9BE;text-decoration:none;font-weight:600">W<span style="color: white;">atches</span></a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Thank you for choosing Watches. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
                <h2 style="background: #F9D9BE;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                <p style="font-size:0.9em;">Regards,<br />Watches</p>
                <hr style="border:none;border-top:1px solid #F9D9BE" />
                <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                    <p> Watches Inc</p>
                     <!-- <p>1600 Amphitheatre Parkway</p>
                    <p>California</p>  -->
                </div>
            </div>
        </div> `
        }
        // hash the otp
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        console.log('email', email);
        const newOTPVerification = await new userOTPVerification({
            userId: null,
            otp: hashedOTP,
            recipient_email: email,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000
        });
        // save otp record
        console.log('saving otp...');
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);
        console.log('saved');
        res.redirect(`/verifyOTP2?email=${email}`);
        console.log("userid:", _id);
        console.log("line 278 ", email);
    } catch (error) {
        console.log('generate otp err ', error.message);
    }
}

const loadVerifyOTP2 = (req, res) => {
    try {
        const email = req.query.email
        res.render('user/verifyOTP2', { email: email, user: null, error: req.flash('error') })
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOTP2 = async (req, res) => {
    try {
        let { otp, email } = req.body;
        // const email = req.query.email;
        console.log('entered otp', otp);
        console.log('query email', email);
        if (!email || !otp) {
            throw Error('Empty otp details are not allowed');
        } else {
            const userOTPVerificationRecords = await userOTPVerification.findOne({
                recipient_email: email
            })
            // if (userOTPVerificationRecords.length <= 0) {
            //     // no record found
            //     throw new Error("Account record doesn't exist or verified already");
            // } else {
            // user otp record exist
            const { expiresAt } = userOTPVerificationRecords;
            const hashedOTP = userOTPVerificationRecords.otp;
            if (expiresAt < Date.now()) {
                // user otp record has expired
                await userOTPVerification.deleteMany({ recipient_email: email });
                req.flash('error', 'Time out.');
                res.redirect(`/verifyOTP?email=${email}`);

                throw new Error("Code has expired. Please request again ");
            } else {
                const validOTP = await bcrypt.compare(otp, hashedOTP);
                if (!validOTP) {
                    // Invalid OTP
                    req.flash('error', 'Invalid OTP.');
                    res.redirect(`/verifyOTP?email=${email}`);

                    throw new Error('Invalid OTP')
                } else {
                    // seccess
                    await User.updateOne({ email: email }, { $set: { verified: true } });
                    // await userOTPVerification.deleteMany({ userId });
                    await userOTPVerification.deleteMany({ recipient_email: email });
                    console.log("email verified successfully");
                    req.flash('success', 'Reset Password now');
                    res.redirect(`/reset-password?email=${email}`)
                }
            }
        }
        // }
    } catch (error) {
        console.log(error.message);
    }
}

const loadResetPassword = async (req, res) => {
    try {
        const email = req.query.email
        res.render('user/reset-password', { errorMessages: req.flash('error'), successMessages: req.flash('success'), user: null, cartItemsLength: null, email })
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        const email = req.body.email
        console.log('reset emai ', email);
        const newPassword = await bcrypt.hash(req.body.password, 10)

        const user = await User.findOne({ email });

        if (!user) {
            // User not found
            return res.status(404).json({ message: 'User not found for the provided email.' });
        }

        // Update the user's password
        // user.password = newPassword;

        // Save the changes to the database
        const result = await User.updateOne({ email }, { $set: { password: newPassword } });
        console.log('password changed');
        res.redirect('/login')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadRegister,
    insertUser,
    loadlogin,
    verifyLogin,
    loadHome,
    loadLogout,
    loadProducts,
    loadVerifyOTP,
    verifyOTP,
    loadProductDetails,
    loadCart,
    loadWishlist,
    loadMyProfile,
    loadEditProfile,
    editProfile,
    loadAddAddress,
    addAddress,
    loadManageAddress,
    deleteAdress,
    loadeditAddress,
    editAddress,
    loadCheckout,
    addAddressFromCheckout,
    placeOrder,
    loadOrderPlaced,
    loadMyorders,
    loadOrderDetails,
    cancelOrder,
    sendReturnRequest,
    cancelReturnRequest,
    sendOTP,
    loadVerifyOTP2,
    verifyOTP2,
    loadResetPassword,
    resetPassword,
    verifyPayment,

}