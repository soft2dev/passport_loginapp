const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', ensureAuthentificated, function(req, res) {
  res.render('index');
});

function ensureAuthentificated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('error_msg', 'You are not logged in');
    res.redirect('/users/login');
  }
}

module.exports = router;
