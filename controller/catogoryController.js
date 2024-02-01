const Category = require('../model/category_model');
const User = require('../model/user-model');



const loadAddCategory = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.admin_id });
        // console.log('userData line 7 ', userData);
        const category = await Category.find(); 
        
        res.render('admin/add-category', { category:category, user: userData,  errorMessages: req.flash('error') })

    } catch (error) {
        console.log(error.message);
    }
 
}
 
// const addCategory = async (req, res) => {
//     try {
//         const { name, description } = req.body;
//         const category = new Category({ name, description });
//         await category.save();
//         res.redirect('/admin/addcategory'); 
//     } catch (error) {
//         if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
//             req.flash('error', 'Category with this name already exists.');
//             res.redirect('/admin/addcategory'); 
//         }
//         console.error(error.message);
//     }
// };

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if a category with the same name (case-sensitive) already exists
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });

        if (existingCategory) {
            req.flash('error', 'Category with this name already exists.');
            res.redirect('/admin/addcategory');
            return;
        }

        const category = new Category({ name, description });
        await category.save();
        res.redirect('/admin/addcategory');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndDelete(categoryId);
        res.redirect('/admin/addcategory'); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Load the edit category form
const loadEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);
        const userData = await User.findById({ _id: req.session.admin_id });

        if (!category) {
            return res.status(404).send('Category not found');
        }

        res.render('admin/edit-category', { category:category, user:userData });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { newName, newDescription } = req.body;
        // await Category.findByIdAndUpdate(categoryId, { name: newName, description: newDescription });
        await Category.findByIdAndUpdate(categoryId, { $set: { name: newName, description: newDescription } });


        res.redirect('/admin/addcategory'); // Redirect to the product page or category page
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const unlistCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndUpdate(categoryId, { status: 'unlisted' }, { new: true });
        res.redirect('/admin/addcategory');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const listCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        await Category.findByIdAndUpdate(categoryId, { status: 'listed' }, { new: true });
        res.redirect('/admin/addcategory')
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadAddCategory,
    addCategory,
    deleteCategory,
    editCategory,
    loadEditCategory,
    unlistCategory,
    listCategory,
};