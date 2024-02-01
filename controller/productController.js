const User = require('../model/user-model');
const Products = require('../model/addproduct_model')
const Category = require('../model/category_model');
const Cart = require('../model/cart-model');
const path = require('path');
const sharp = require('sharp');
const { log } = require('console');
const Wishlist = require('../model/wishlist-model');
const orderModel = require('../model/order-model');


const addproducts = async (req, res) => {
    try {
        const imageUrls = req.files.map(file => ({
            path: file.path,
            originalname: file.originalname
        }));

        // Sort the imageUrls based on the original filename in ascending order
        imageUrls.sort((a, b) => {
            const orderA = extractNumericValue(a.originalname);
            const orderB = extractNumericValue(b.originalname);
            return orderA - orderB;
        });

        // Function to extract a numeric value from a filename
        function extractNumericValue(filename) {
            const match = filename.match(/\d+/);
            return match ? parseInt(match[0]) : 0; // If no numeric value found, default to 0
        }


        const products = new Products({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            quantity: req.body.quantity,
            imageURLs: imageUrls.map(image => image.path),
        });

        console.log('saving product');
        const adminData = await products.save();

        console.log('product saved successfully');
        res.redirect('/admin/adminproducts');
    } catch (error) {
        console.log(error.message);
    }
};

// edit product
// const editProduct = async (req, res) => {
//     try {

//         const imageUrls = req.files.map(file => ({
//             path: file.path,
//             originalname: file.originalname
//         }));

//         const productId = req.params.productId;

//         if (req.files && req.files.length > 0) {
//             await Products.updateOne(
//                 { _id: productId }, 
//                 {
//                     $set: {
//                         title: req.body.title,
//                         description: req.body.description,
//                         price: req.body.price,
//                         imageURLs: imageUrls.map(image => image.path),
//                     },
//                 }
//             );
//             res.redirect('/adminproducts');
//         } else {
//             await Products.updateOne(
//                 { _id: productId }, 
//                 {
//                     $set: {
//                         title: req.body.title,
//                         description: req.body.description,
//                         price: req.body.price,
//                     },
//                 }
//             );
//             res.redirect('/adminproducts');
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

const editProduct = async (req, res) => {
    try {
        const imageUrls = req.files.map(file => ({
            path: file.path,
            originalname: file.originalname
        }));

        const productId = req.params.productId;
        const removedExistingImages = JSON.parse(req.body.removedExistingImages || "[]");

        // Retrieve existing product details
        const existingProduct = await Products.findById(productId);

        // Identify new images added
        const newImagesAdded = imageUrls.filter(newImage => !existingProduct.imageURLs.includes(newImage.path));

        // Identify existing images to be removed
        const existingImagesToRemove = existingProduct.imageURLs.filter(existingImage => removedExistingImages.includes(existingImage));

        // Combine existing images, new images, and updated product details
        const updatedProductDetails = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            quantity: req.body.quantity,
            imageURLs: [...existingProduct.imageURLs.filter(img => !existingImagesToRemove.includes(img)), ...newImagesAdded.map(img => img.path)],
        };

        // Update the product
        await Products.updateOne({ _id: productId }, { $set: updatedProductDetails });

        res.redirect('/admin/adminproducts');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// const editProduct = async (req, res) => {
//     try {
//         const imageUrls = req.files.map(file => ({
//             path: file.path,
//             originalname: file.originalname
//         }));

//         const productId = req.params.productId;
//         const removedExistingImages = JSON.parse(req.body.removedExistingImages || "[]");
//         console.log("removedExistingImages", removedExistingImages);

//         // Retrieve existing product details
//         const existingProduct = await Products.findById(productId);
//         console.log('existingProduct image urls ', existingProduct.imageURLs);

//         // Identify new images added
//         const newImagesAdded = imageUrls.filter(newImage => !existingProduct.imageURLs.some(existingImage => existingImage.path === newImage.path));
//         console.log("newImagesAdded ", newImagesAdded);

//         // Update product details
//         const updatedProductDetails = {
//             title: req.body.title,
//             description: req.body.description,
//             price: req.body.price,
//         };

//         // Use $set to update product details
//         await Products.updateOne({ _id: productId }, { $set: updatedProductDetails });

//         // Use $pull to remove existing images
//         await Products.updateOne(
//             { _id: productId },
//             { $pull: { imageURLs: { $in: removedExistingImages.map(img => img.path) } } }
//         );

//         // Use $push to add new images
//         await Products.updateOne({ _id: productId }, { $push: { imageURLs: { $each: newImagesAdded } } });

//         res.redirect('/adminproducts');
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };






// List a product
const listProduct = async (req, res) => {


    try {
        console.log('bodyyyy', req.body)
        const productId = req.body.productId
        console.log('proodid', productId)

        let proData = await Products.findByIdAndUpdate(productId, { status: 'unlisted' });
        console.log('pros', proData)
        if (proData) {
            res.json({ success: true })
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Unlist a product
const unlistProduct = async (req, res) => {
    const productId = req.body.productId
    console.log('line 205', productId)

    try {
        await Products.findByIdAndUpdate(productId, { status: 'listed' });
        console.log('unlisted');
        res.json({ success: true })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


// const filterByCategory = async (req, res) => {
//     const categoryName = req.params.categoryName;

//     try {
//         // Fetch the category based on the categoryId
//         const categories = await Category.find();


//         if (!categories) {
//             return res.status(404).send('Category not found');
//         }
//         if (req.session.user_id) {
//             const userData = await User.findById({ _id: req.session.user_id });
//             const products = await Products.find({ category: categoryName, status: 'listed' });
//             res.render('user/products', { user: userData, products, categories });
//         } else {
//             const products = await Products.find({ category: categoryName, status: 'listed' });
//             res.render('user/products', { user: null, products, categories });

//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

const filter = async (req, res) => {

    try {
        // Fetch all categories for navigation
        const categories = await Category.find();

        let products;
        const categoryId = req.query.categoryId;
        // Check if a category is selected
        if (categoryId) {
            // Fetch products based on the selected category name
            // products = await Products.find({ category: categoryId, status: 'listed' });
            const baseQuery = { status: 'listed' };

            // Add category condition if categoryId is provided
            const query = categoryId ? { ...baseQuery, category: categoryId } : baseQuery;
            
            const PAGE_SIZE = 3; // Number of products per page
            // Get the current page from the query parameter, default to 1
            var page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * PAGE_SIZE;
            const searchText = req.query.search;
            // Initialize an empty query object
             products = await Products.find(query).skip(skip).limit(PAGE_SIZE).populate('category');
             const totalCount = await Products.countDocuments(query);
                var totalPages = Math.ceil(totalCount / PAGE_SIZE);
        } else {
            // If no category is selected, fetch all listed products
            // products = await Products.find({ status: 'listed' });
             products = await Products.find().populate('category');

        }
        const sortOption = req.query.sortOption;
        // Apply sorting based on the selected option
        switch (sortOption) {
            case 'newest':
                products.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'priceLow':
                console.log('sorted');
                products.sort((a, b) => a.price - b.price);
                break;
            case 'priceHigh':
                products.sort((a, b) => b.price - a.price);
                break;
            // Add more cases for additional sorting options
        }

        // Render your view with sorted products and categories
        if (req.session.user_id) {
            const userData = await User.findById({ _id: req.session.user_id });
            const userId = req.session.user_id;
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            res.render('user/products', { user: userData, products, categories, categoryName: req.query.categoryId, cart, totalPages, currentPage:page });
        } else {
            res.render('user/products', { user: null, products, categories, categoryName: req.query.categoryId, cart: null, totalPages:null });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const addtoCart = async (req, res) => {
    try {
        const quantity = req.body.quantity || 1;
        const userId = req.session.user_id;
        const productId = req.params.productId;
        console.log(productId);
        // Find the user's cart
        let cart = await Cart.findOne({ userId });
        // If the user doesn't have a cart, create one
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Ensure that cart.items is always an array
        if (!cart.items || !Array.isArray(cart.items)) {
            cart.items = [];
        }

        // Check if the product is already in the cart
        const existingProduct = cart.items.find(item => item.productId.equals(productId));

        if (existingProduct) {
            existingProduct.quantity += parseInt(quantity, 10);
        } else {
            console.log('product id ', productId);
            console.log('quantity', quantity);
            cart.items.push({ productId, quantity: parseInt(quantity, 10) });
        }

        // Save the changes to the cart
        await cart.save();

        console.log('Product added to cart successfully');
        res.redirect('/products')
        //   res.status(200).json({ success: true, message: 'Product added to cart successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const changeProductQuantity = async (req, res, next) => {
    const { cartId, proId, count } = req.body;
    const userId = req.session.user_id;
    let cart = await Cart.findOne({ userId });
    const existingProduct = cart.items.find(item => item.productId.equals(proId));
    if (existingProduct) {
        existingProduct.quantity += parseInt(count, 10);
        await cart.save(); // Save the updated cart
        const response = { success: true, newQuantity: existingProduct.quantity };
        res.json(response);
    }
}

const deleteFromCart = async (req, res) => {
    const productId = req.params.productId;
    console.log('deleting product id ', productId);
    const userId = req.session.user_id;
    console.log('user id ', userId);

    try {
        const result = await Cart.updateOne(
            { userId: userId },
            { $pull: { items: { _id: productId } } }
        );
        console.log(result);
        res.redirect('/cart');
        console.log('deleted');
    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.productId;

        // Check if the product is already in the wishlist
        const existingWishlistItem = await Wishlist.findOne({ userId, productId });

        if (existingWishlistItem) {
            return res.status(400).json({ success: false, message: 'Product already in wishlist' });
        }
        // If not, add it to the wishlist
        const wishlistItem = new Wishlist({ userId, productId });
        await wishlistItem.save();
        res.redirect(`/productsDetails/${productId}`);
        console.log('Product added to wishlist successfully');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const deleteFromWishlist = async (req, res) => {
    const wishlistItemId = req.params.wishlistItemId;

    try {
        // Assuming Wishlist model has a method like findByIdAndDelete
        const deletedItem = await Wishlist.findByIdAndDelete(wishlistItemId);

        if (deletedItem) {
            console.log('Item removed from wishlist:', deletedItem);
        } else {
            console.log('Item not found in wishlist');
        }

        res.redirect('/wishlist');
    } catch (error) {
        console.error('Error removing item from wishlist:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    addproducts,
    editProduct,
    listProduct,
    unlistProduct,
    filter,
    addtoCart,
    deleteFromCart,
    addToWishlist,
    deleteFromWishlist,
    changeProductQuantity
}