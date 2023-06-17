const Product = require('../models/product');
const {validationResult} = require('express-validator/check');
const fileHelper = require('../util/file');     
// const mongoose = require('mongoose');// Adding temporarily to check error in catch block
   
exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError : false,
    errorMessage : null,
    validationErrors : []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;       //file picker
  const price = req.body.price;   
  const description = req.body.description;
  console.log('postAddProduct');
  console.log(image);
  // console.log(imageUrl); 

  if(!image){
    return  res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError : true,
      errorMessage:'Attached file is not an image',
      product:{
        title:title,  
        price:price,  
        description:description  
      },
      validationErrors : []
    });
  }

  const imageUrl = image.path;

  //Server side basic validation
  const errors = validationResult(req);
  if (!errors.isEmpty()){
    console.log(errors.array());
    return  res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError : true,
      errorMessage:errors.array()[0].msg,
      product:{
        title:title,  
        imageUrl:imageUrl,   
        price:price,  
        description:description  
      },
      validationErrors : errors.array()
    });
  }  
 //Server side basic validation

  const product = new Product({
    // _id:mongoose.Types.ObjectId('63f0bb44b31164d2b6605b93'),// Testing Purpose : to check error from catch block
    title:title,
    price:price,
    description:description,
    imageUrl:imageUrl,
    userId:req.user._id
  });

  product.save()  //Saving Data Through Mongoose save method
  .then(result=>{
    console.log(result);  
    console.log(`Product Added By User Id : ${req.user._id}`);
    res.redirect('/');
  }).catch(err=>{
    console.log('Product Creation Failed!');  
    // Error Handling 
    const error = new Error(err); 
    error.httpStatusCode = 500;
    return next(error); // passing error to centralized express error handling middleware
    // Error Handling 
  });
}; 

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product => {
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      hasError : false,
      errorMessage : null,
      validationErrors : []
    });
  }).catch(err=>{
    console.log(err);
    //Error Handling 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); // passing error to centralized express error handling middleware
    //Error Handling   
  })
};

exports.postEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  //Server side basic validation
  const errors = validationResult(req);
  if (!errors.isEmpty()){
    console.log(errors.array());
    return  res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing  : true,
      hasError : true,
      errorMessage:errors.array()[0].msg,
      product:{
        title:updatedTitle,  
        price:updatedPrice,  
        description:updatedDesc,
        _id:prodId    
      },
      validationErrors : errors.array()
    });
  }  
  //Server side basic validation

  Product.findById(prodId).then(product =>{
    product.title=updatedTitle;
    product.price=updatedPrice;
    product.description=updatedDesc;
    if(image){
      fileHelper.deleteFile(product.imageUrl);//Deleting the previous Image 
      product.imageUrl=image.path; // Updating Image Path into the Database
    }
   
    return  product.save();
  }).then(result=>{
    // throw new Error('Product Edit Failed!');//Testing purpose:to check catch error that redirect to 500
    // console.log(`Updated Successfull`);  
    // console.log(result);
    res.redirect('/admin/products');
  }).catch(err=>{
    console.log('Product Updation Failed!');
    //Error Handling 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); // passing error to centralized express error handling middleware
    //Error Handling 
  });
};

exports.getProducts = (req, res, next) => {
  Product.find()//Fetching All Products
    // .select('title name')// To fetch only this field
    // .populate('userId')
    .then((product) => {
      console.log(product);
      res.render('admin/products', {
        prods: product,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      console.log(err)
      //Error Handling 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // passing error to centralized express error handling middleware
      //Error Handling 
    });
};  
 
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId; 
    Product.findById(prodId).then(product=>{
      fileHelper.deleteFile(product.imageUrl);   //Deleting File
      return Product.findByIdAndRemove(prodId);
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      // res.redirect('/admin/products');
      res.status(200).json({message : 'Success!'}); //Server sending Background Request 
    })
    .catch(err => {  
      console.log(err)
      //Error Handling 
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error); // passing error to centralized express error handling middleware
      //Error Handling  
      res.status(500).json({message : 'Product Deletion Failed!'}); //Server sending Background Request
    });
};               




  