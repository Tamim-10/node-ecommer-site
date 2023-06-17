const Product = require('../models/product');   
const Order = require('../models/order'); 
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const session = require('express-session');
const stripe = require('stripe')('sk_test_51Mqif0SHhN8CXYFA3LdYUPeK1ylMLbNjwo6cYX5p0CUmxjatUnJJAnHEtxCa5hItz6m0IRgvkT7Cckt57TNoe6Yz00dpvFVenx');
const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};   

exports.getProduct = (req, res, next) => {
  console.log('shop req.session.isLoggedIn:'+req.session.isLoggedIn);
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};    


// exports.getIndex = (req, res, next) => {
//   const page = +req.query.page || 1;    
//   let totalItems;     
     
//   Product.find()
//   .countDocuments()  
//   .then(numProducts => {
//     totalItems = numProducts;
//     return Product.find()
//     .skip((page -1) * ITEMS_PER_PAGE)
//     .limit(ITEMS_PER_PAGE);
//   })  
//   .then(products => {
//       res.render('shop/index', {
//         prods: products,
//         pageTitle: 'Shop',
//         path: '/',
//         currentPage : page,     
//         hasNextPage : ITEMS_PER_PAGE * page < totalItems,
//         hasPreviousPage : page > 1,
//         nextPage : page + 1,
//         previousPage : page - 1,
//         lastPage : Math.ceil(totalItems / ITEMS_PER_PAGE)    
//       }); 
//   })
//   .catch(err => {
//     console.log(err);
//   });
// };  

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};  

//Displaying the Cart Items
exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')   
    // .execPopulate()   
    .then(user => {
      const products = user.cart.items;        
      console.log(products);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products:products
      });
    })
    .catch(err => console.log(err));
};  

//AddToCart Functionality
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)//Fetching a Single Prodiuct Through Mongoose save  method
    .then(product => {
      return req.user.addToCart(product);//Calling the addToCart function and passing product data
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

//Delete Items From Cart
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
}; 

exports.getCheckout = (req, res, next) => {
  let products;
  let total;
  req.user
  .populate('cart.items.productId')   
  // .execPopulate()   
  .then(user => {
      products = user.cart.items;
      total = 0; 
      products.forEach(p =>{
        total += p.productId.price;
      });      
    console.log(total);

    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map(p => {
        return {
          // name: p.productId.title,
          // description: p.productId.description,
          price_data:{
            currency: 'usd',
            product_data:{
              name : p.productId.title,
            },
            unit_amount : p.productId.price * 100  
          },
          quantity: p.quantity
        };
      }),
      mode: 'payment',
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    });
  })
  .then(data => {
    console.log(total);
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Your Checkout',
      products:products,
      totalSum :total,
      sessisonId : data.id
    });
  }) 
  .catch(err => console.log(err));
}
//Adding an Order
// exports.postOrder =(req, res, next)=>{
exports.getCheckoutSuccess =(req, res, next)=>{
  req.user
    .populate('cart.items.productId')
    .then(user=>{
      const products = user.cart.items.map(i=>{
        return {quantity:i.quantity,product:{...i.productId._doc}};//{...i.productId._doc} Storing All Order Related Data
      });
      console.log(`cart.items.productId : ${products}`);  
      const order = new Order({
        products:products,
        user:{
          email:req.user.email,   
          userId:req.user
        }
      });
      console.log(`order Data: ${order}`);
      return order.save();//Save this data to database      
    })
    .then(result => {
        //Clearing the Cart After Storing an Order
        return req.user.clearCart();
    })    
    .then(() => {    
      res.redirect('/orders');
    })      
    .catch(err =>console.log(err));
}

//Getting Order data 
exports.getOrders = (req, res, next) => {
  Order.find({"user.userId":req.user._id})
    .then(orders => {
      console.log('getOrders');
      console.log(orders);
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated : req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};       


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;                           
  Order.findById(orderId)
  .then(order => {
    //Start Of Restricting File Access
    if(!order){
      return next(new Error('No Order Found'));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }
    //End Of Restricting File Access 
    const invoiceName = 'invoice-'+orderId+'.pdf';
    const invoicePath = path.join('data','invoice',invoiceName);
    //Start Of Downloading Invoice Files with Authentication

    //Start Of PDFKit for .pdf Generation
      const pdfDoc = new PDFDocument(); // Create a document
      res.setHeader('Content-Type','application/pdf');   
      res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"'); //To open file in your system
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text('Invoice');
      pdfDoc.text('-------');
      pdfDoc.fontSize(14).text(`Product Name             Quantity               Price                    Total`);
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        let productTotal =  prod.quantity * prod.product.price;
        pdfDoc.fontSize(12).text(`${prod.product.title}                          ${prod.quantity}    x               $${prod.product.price}                        $${productTotal}`);
      });
      pdfDoc.fontSize(12).text(`Grand Total : $${totalPrice}`);    
      pdfDoc.end(); 
    //End Of PDFKit for .pdf Generation

    //Readfile is recommned for smaller files
    // fs.readFile(invoicePath,(err,data) => {
    //     if(err){
    //       console.log(err);
    //       return next(err);   
    //     }
    //     res.setHeader('Content-Type','application/pdf');   
    //     // res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"'); //To open file in browser
    //     res.setHeader('Content-Disposition','attachement; filename="' + invoiceName + '"'); //To open file in your system
    //     res.send(data); 
    // });

    //For larger files stream and pipe is recommended
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type','application/pdf');   
    // res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"'); //To open file in your system
    // file.pipe(res);

    //End Of Downloading Invoice Files with Authentication            
  }) 
  .catch(err => console.log(err));     
};  
