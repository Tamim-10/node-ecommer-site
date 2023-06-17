const path = require("path");
const fs = require("fs");       
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csurf = require("csurf");
const flash = require("connect-flash");
const multer = require('multer'); //Handling File Uploads with Multer
const helmet = require('helmet'); //Setting Secure Response Headers with Helmet
const compression = require('compression');//Node Compressing Assets
// const morgan = require('morgan');//Used for logging HTTP requests 

const errorController = require("./controllers/error");
const mongoose = require("mongoose");
// const mongoConnect = require('./util/database').mongoConnect;
const User = require("./models/user");

console.log(process.env.NODE_ENV); //Environment Vairables  

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ey6uzuo.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();

//Using MongoDB to Store Sessions
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session",
});
const csrfProtection = csurf();

//Configuring Multer to adjust filename & filepath
const fileStorage = multer.diskStorage({
  destination:(req,file,cb) => {
    cb(null,'images')
  },
  filename:(req,file,cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
  }
});

//Filtering Files by mimetype
const fileFilter = (req,file,cb) => {
  if(
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ){
    cb(null,true);
  }else{
    cb(null,false);
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes  = require("./routes/shop");
const authRoutes  = require("./routes/auth");

// const accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});

app.use(helmet());// Use Helmet!
app.use(compression());//In Node.js, you can use the compression middleware to enable gzip compression for your HTTP responses. Gzip compression reduces the size of the response body before sending it over the network, resulting in faster transmission and reduced bandwidth usage. 
// app.use(morgan('combined',{stream:accessLogStream})); //The 'combined' format is a commonly used format that includes detailed information about each request. 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage,fileFilter: fileFilter}).single('image')); 
app.use(express.static(path.join(__dirname, "public")));
app.use("/images",express.static(path.join(__dirname, "images"))); //Serving Images Statically

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

//Adding csrf Protection
app.use((req, res, next) => {
  //Below locals are accessable in all views
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  // console.log(res.locals);//The res.locals property is an object that contains response local variables scoped to the request and because of this, it is only available to the view(s) rendered during that request/response cycle (if any).
  // console.log(`isAuthenticated : ${req.session.isLoggedIn} , Filename : app.js`);
  // console.log(`csrfToken : ${req.csrfToken()} , Filename : app.js`); 
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
app.use((error, req, res, next) => {
  console.log(error);
  // res.redirect('/500');
  res.status(500).render("500", { 
    pageTitle: "Error", 
    path: "/500" ,
    isAuthenticated: req.session.isLoggedIn
  });
});  

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
  //In aysn then catch next() is used to pass error that leads to express error handling middleware
  