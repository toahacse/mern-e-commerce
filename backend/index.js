const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const dotenv = require("dotenv").config();
const colors = require("colors");

app.use(express.json());
app.use(cors());

// database connection
mongoose.connect(process.env.DATABASE_LOCAL,{
    dbName: 'e-commerce',
}).then(()=>{
    console.log("Database connection is successful " .red.bold);
});

app.get('/',(req, res)=>{
    res.send("Express app is running")
})  

    //Image storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req, file, cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});

const upload = multer({storage:storage});

    //Creating upload endpoint for images
app.use('/images', express.static('upload/images'));

app.post("/upload", upload.single('product'), (req, res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    });
});

    // Schema for Creating products
const Product = mongoose.model('Product', {
    id: {
        type: Number,
        required: true,
    },
    name:{
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },
    available:{
        type: Boolean,
        default: true,
    }
})

app.post('/add-product', async (req, res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }else{
        id = 1;
    }
    const product = new Product({
        id:id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    })
    console.log(product);
    await product.save();
    console.log('Saved');
    res.json({
        success: true,
        name: req.body.name
    })
})

//creating api for deleting product
app.post('/remove-product', async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    res.json({
        success: true,
        name: req.body.name
    })
})

//creating api for getting all product
app.get('/all-products', async (req, res)=>{
    let products = await Product.find({});
    res.send(products)
})


    // Schema Creating for user
const Users = mongoose.model('Users', {
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData:{
        type: Object,
    },
    date:{
        type: Date,
        default: Date.now,
    },
})

app.post('/signup', async (req, res)=>{
    let check = await Users.findOne({email: req.body.email});
    if(check){
        return res.status(400).json({success: false, errors: "Existing user found with same email address" })
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i]=0
    }

    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });
    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom')
    res.json({
        success: true,
        token
    })
})

app.post('/login', async (req, res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({
                success: true,
                token
            });
        }else{
            res.json({success:false, errors: "Wrong Password"})
        }
    }else{
        res.json({success:false, errors: "Wrong Email Id"})
    }
})


//creating api for getting new product
app.get('/new-collections', async (req, res)=>{
    let products = await Product.find({});
    let newCollections = products.slice(1).slice(-8);
    res.send(newCollections)
})

//creating api for getting popular in women
app.get('/popular-in-women', async (req, res)=>{
    let products = await Product.find({category:"women"});
    let popularInWomen = products.slice(0, 4);
    res.send(popularInWomen)
})

    // server
const port = process.env.PORT || 4000;
  
app.listen(port, () => {
    console.log(`App is running on port ${port}`.yellow.bold);
});