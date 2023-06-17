module.exports = (req,res,next) => {
    if(!req.session.isLoggedIn){
        console.log('No Auth');
        res.redirect('/login');
    }
    next();
};