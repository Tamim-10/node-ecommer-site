const express = require('express');
const router  = express.Router();
const authController = require('../controllers/auth');
const {check,body} = require('express-validator/check');
const User = require("../models/user");

const isAuth = require('../middleware/is-auth');
const { Promise } = require('mongoose');

router.get('/login',authController.getLogin);

router.get('/signup',authController.getSignup);   

router.post('/login',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            // .normalizeEmail()////Sanitizing Data : normalizeEmail method converts  entered email to lowercase
            //Start Of Built-In & Custom Validators
            .custom((value,{req}) => {
                if(value === 'test@test.com'){
                    throw new Error('This email address is forbidden!');
                }
                return true;
            }), 
            //End Of Built-In & Custom Validators
        body('password',
            'Please enter a password with number and text with at least 8 character')
            .isLength({min:8})
            // .isAlphanumeric()
            .trim()
    ]
,authController.postLogin);

router.post('/logout',authController.postLogout);  

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            // .normalizeEmail()////Sanitizing Data : normalizeEmail method converts  entered email to lowercase
            //Start Of Built-In & Custom Validators
            .custom((value,{req}) => {
                // if(value === 'test@test.com'){
                //     throw new Error('This email address is forbidden!');
                // }
                // return true;
                //Added Async Validation
                return User.findOne({ email: value }) //Checks if a user exist by email
                    .then((userDoc) => {
                        console.log(userDoc);
                        if (userDoc) {
                            // if user exist
                            return Promise.reject('Entered Email Already Exist');
                        }
                })
                //Added Async Validation
            }),
            //End Of Built-In & Custom Validators
        body('password',
            'Please enter a password with number and text with at least 8 character')
            .isLength({min:8})
            .isAlphanumeric()
            .trim(),//Sanitizing Data : trim method removes white spaces
        body('confirmPassword')
            .trim()//Sanitizing Data : trim method removes white spaces
            .custom((value,{req}) => {
                if(value != req.body.password){
                    throw new Error('Password does not match!');
                }
                return true;
            })
    ]
,authController.postSignup);   

router.get('/reset',authController.getReset); 

router.post('/reset',authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;     