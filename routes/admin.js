const path = require('path');  
 
const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth'); 

const router = express.Router();

const {body} = require('express-validator');

// /admin/add-product => GET
router.get('/add-product', isAuth,adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth,adminController.getProducts);

// // /admin/add-product => POST  
router.post('/add-product',
[
    body('title').isString().isLength({min:3,max:20}).trim().withMessage('Please enter a valid title'),
    body('price').isFloat().withMessage('Please enter a valid price'),
    body('description').isLength({min:5,max:200}).withMessage('Please enter a valid description')
]
,isAuth,adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);  

router.post('/edit-product', 
[
    body('title').isString().isLength({min:3,max:20}).trim().withMessage('Please enter a valid title'),
    body('price').isFloat().withMessage('Please enter a valid price'),
    body('description').isString().isLength({min:5,max:200}).withMessage('Please enter a valid description')
]  
,isAuth,adminController.postEditProduct);

// router.post('/delete-product', isAuth,adminController.postDeleteProduct);

router.delete('/product/:productId', isAuth,adminController.deleteProduct);

module.exports = router;
 