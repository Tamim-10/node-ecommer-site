const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csurf = require("csurf");
const flash = require("connect-flash");
const multer = require('multer'); //Handling File Uploads with Multer

const errorController = require("./controllers/error");
const mongoose = require("mongoose");
// const mongoConnect = require('./util/database').mongoConnect;
const User = require("./models/user");
const MONGODB_URI =
  "mongodb+srv://tamim:jwyn0oloatQFaedn@cluster0.ey6uzuo.mongodb.net/shopDB";
const app = express();

//Using MongoDB to Store Sessions
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session",
});
const csrfProtection = csurf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes  = require("./routes/shop");
const authRoutes  = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

//Initializing the Session Middleware
app.use(
  session({
    secret: "My secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use(flash()); 
app.use(multer({dest:'images'}).single('image'));

//Adding csrf Protection
app.use((req, res, next) => {
  //Below locals are accessable in all views
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  console.log(res.locals); //The res.locals property is an object that contains response local variables scoped to the request and because of this, it is only available to the view(s) rendered during that request/response cycle (if any).
  next();
});

//Middleware function
app.use((req, res, next) => {
  //  throw new Error('Testing error thrown via catch block');
  if (!req.session.user) {
    console.log(`User Session Not Exist`);
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      // throw new Error('Testing error thrown via catch block');
      if(!user){ //Adding extra check for proper error handling
        return next();
      }
      req.user = user;
      console.log(`User Session Data: ${req.session.user.email}`);
      next();
    })
    .catch((err) => {
      next(new Error(err)); //It leads to express error handling middleware
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500',errorController.get500);  

app.use(errorController.get404);

// Express Error Handling Centralized  Middleware  
app.use((error,req,res,next) => {
  // res.redirect('/500');
  res.status(500).render("500", { 
    pageTitle: "Error", 
    path: "/500" 
    // isAuthenticated : req.session.isLoggedIn,
    // csrfToken : req.csrfToken() 
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
  //In aysn then catch next() is used to pass error that leads to express error handling middleware
  