const { connectDB, configureMulter }= require('./config/config');
const { resizeImages } = require('./controller/productController');

//-------------------
const nocache= require('nocache');
const express= require('express');
const app= express();
const path= require('path');
const dotenv= require('dotenv');

require('dotenv').config();

const PORT = process.env.PORT || 8080;

// ----multer setting 
const multer = require('multer'); 
app.use(express.static(path.join(__dirname, 'assets')));
app.use('/productsImages', express.static(path.join(__dirname,'productsImages')))

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => {
        cb(null, 'productsImages');
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalname = file.originalname;
        const filenameWithTimestamp = `${originalname}_${timestamp}${path.extname(originalname)}`;
        cb(null, filenameWithTimestamp);
    }
});
 

app.use(multer({ storage: storage }).array('images', 5));   



connectDB();

app.set('view engine', 'ejs');
app.use(nocache())


//for user routes   
const userRouter = require('./routes/userRouter');
const adminRouter= require('./routes/adminRouter');
// const { config } = require('process');

app.use('/', userRouter);
app.use('/admin/', adminRouter);


// app.use((req, res, next) => {
//     res.set('Cache-control', 'no-store,no-cache', 'must - revalidate', 'private ')
//     next()
// })

app.listen(PORT, ()=>{
    console.log(`Server is running at PORT http://localhost:${PORT}`);
});