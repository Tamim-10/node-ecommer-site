const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const sendgridTranspoter = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const {validationResult} = require('express-validator/check');
const User = require("../models/user");

const transporter = nodemailer.createTransport(sendgridTranspoter({
  auth:{
    api_key:'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'
  }
}));

exports.getLogin = (req, res, next) => { 
  // console.log(req.get('cookie').split('=')[3]);
  // const isLoggedIn = req.get('cookie').split('=')[3];
  // console.log('req.session.isLoggedIn:' + req.session.isLoggedIn);
  
  //Note : Don't call req.flash two times it will result in undefined 
  const errorMessage = req.flash('error')[0] || null;//Get an array of flash messages by passing the key to req.flash()
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login", 
    errorMessage : errorMessage,
    oldInput : {
      email : '',
      password : ''
    }, 
    validationErrors : []
  });
};

exports.postLogin = (req, res, next) => {
  //Setting a cookie
  // res.setHeader('Set-Cookie','isLoggedIn=true');
  // req.isLoggedIn = true;       //Adding the Request Driven Login Solution
  const email = req.body.email;
  const password = req.body.password;

    //Server side basic validation
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      console.log(errors.array());
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "login",
        errorMessage:errors.array()[0].msg, //Using Validation Error Messages
        oldInput : {
          email : email,
          password : password
        }, 
        validationErrors : errors.array()
      }); 
    } 
   //Server side basic validation
  
  User.findOne({ email: email })//Find User by email
    .then((user) => {
      if (!user) {
        // req.flash('error', 'Invalid email or username');// Set a flash message by passing the key, followed by the value, to req.flash().
        // return res.redirect("/login");
        //Start of Adding validation
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "login",
          errorMessage:'Invalid email or username', //Using Validation Error Messages
          oldInput : {
            email : email,
            password : password
          }, 
          validationErrors : []
        }); 
        //End of Adding validation  
      }
      bcrypt
        .compare(password, user.password) //Matching password
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true; //Using the Session Middleware
            console.log("password matched");
            req.session.user = user;  
            console.log(`Session Data: ${req.session.user}`);
            console.log(`User Id : ${req.session.user._id}`);
            return req.session.save((err) => {
              res.redirect("/");
            });
          }
          console.log("password not matched");
          // req.flash('error', 'You enetered the wrong credential');
          // res.redirect("/login");
          //Start of Adding validation
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "login",
            errorMessage:'You enetered the wrong credential', //Using Validation Error Messages
            oldInput : {
              email : email,
              password : password
            }, 
            validationErrors : []
          }); 
          //End of Adding validation
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch(err => {
      console.log(`User with this email ${email} don't exist`);
      console.log(err);
      //Error Handling 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // passing error to centralized express error handling middleware
      //Error Handling 
    });
};

//Deleting a cookie
exports.postLogout = (req, res, next) => {
  //Deletes the stored session in DB
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

//Implementing an Authentication Flow
exports.getSignup = (req, res, next) => {
  const errorMessage = req.flash('error')[0] || null;
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage:errorMessage,
    oldInput : {
      email:'',
      password:'',
      confirmPassword:''
    },
    validationErrors : []
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  //Server side basic validation
  const errors = validationResult(req);
  if (!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage:errors.array()[0].msg ,//Using Validation Error Messages
      oldInput : {email:email,password:password,confirmPassword:confirmPassword},//Keeping Old User Input for better user experience
      validationErrors : errors.array()
    });  
  } 
 //Server side basic validation

      bcrypt
        .hash(password, 12)
        .then((hassPassword) => {
          const user = new User({
            email: email,
            password: hassPassword,
            cart: { items: [] },
          });
          return user.save(); //Saving data to DB
        })
        .then((result) => {
          res.redirect("/login");
          //Sending Emails
          return transporter.sendMail({
            to:email,
            from:'info@monermandi.com',
            subject:'Signup Succeeded',
            html:'<h1>You have successfully signed up!</h1>'
          });
          //Sending Emails
        })
        .catch((err) => {
          console.log(err);
        //Error Handling 
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error); // passing error to centralized express error handling middleware
        //Error Handling 
        });
};    

//Start Of Resetting Passwords
exports.getReset = (req, res, next) => {
  const errorMessage = req.flash('error')[0] || null;
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Pasword",
    errorMessage:errorMessage 
  });
};

exports.postReset = (req, res, next) => {
  //Implementing the Token Logic
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({
      email:req.body.email
    })
    .then(user=>{
        if(!user){
          console.log('No user with this mail');
          req.flash('error','No account with that mail');
          console.log(req.flash());
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration= Date.now() + 3600000;
        return user.save();
    })
    .then(result=>{
      // res.redirect('/');
       //Sending Emails
      transporter.sendMail({
        to:req.body.email,
        from:'info@monermandi.com',
        subject:'Password Reset',
        html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
      `
      });
      //Sending Emails
    }) 
    .catch(err=>{
      console.log(err);
      //Error Handling 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // passing error to centralized express error handling middleware
      //Error Handling 
    });
  });     
};  
     
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      console.log(err);
      //Error Handling 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // passing error to centralized express error handling middleware
      //Error Handling 
    });
};  
  
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
      //Error Handling 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // passing error to centralized express error handling middleware
      //Error Handling 
    });
};  
//End Of Resetting Passwords    

















//Cookie is used to identify a user
//cookie  client side
//session server side
