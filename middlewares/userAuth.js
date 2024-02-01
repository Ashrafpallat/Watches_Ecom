const userModel = require("../model/user-model");

const isUserLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const userData = await userModel.findById({ _id: req.session.user_id });
            if (userData && userData.status == 'Active') {
                next();
            } else {
                res.redirect('/login')
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
    }
}
//----------------------
const isUserLogout = async (req, res, next) => {
    try {

        if (req.session.user_id) {
            res.redirect('/home')
        }

        next();
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = { isUserLogin, isUserLogout };