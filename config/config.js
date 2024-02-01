const { v4: uuidv4 }= require('uuid');
const sessionSecret= uuidv4();

const mongoose= require('mongoose');

function connectDB(){
const { v4: uuidv4 } = require('uuid');
    mongoose.connect    ('mongodb://127.0.0.1:27017/watches')
        .then(()=>{
            console.log('Connected to MongoDB');
        })
        .catch((error)=>{
            console.error('Error connecting to MongoDB:', error.message);
        });
};
//----------- multer

// const multer = require('multer');
// const path = require('path');

// function configureMulter() {
//     return multer.diskStorage({
//         destination: (req, file, cb) => {
//             cb(null, path.join(__dirname, 'assets', 'proImages'));
//         },
//         filename: (req, file, cb) => {
//             cb(null, Date.now() + '-' + file.originalname);
//         }
//     });
// }

module.exports= { sessionSecret ,connectDB};