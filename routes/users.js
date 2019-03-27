const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
let User = require('../models/user');
const {
  MAIL_USERNAME: mail_username,
  MAIL_PASSWORD: mail_password,
} = process.env;

// Register
router.get('/register', function(req, res) {
  res.render('register');
});

// Login
router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/register', function(req, res) {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let password2 = req.body.password2;

  // Validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors) {
    res.render('register', {
      errors: errors
    });
  } else {
      User.getUserByEmail(email,function(err, user){
        if(err) throw err;
        if(user){
          req.flash('error_msg', 'Email is invalid or already taken.');
          res.redirect('/users/register');
        } else {
          let token =  jwt.sign({user}, 'secretkey')
          let newUser = new User({
            name,
            email,
            password,
            token,
            authorized:false
          });

          User.createUser(newUser, function(err, user){
            if(err) throw err;
            const output = `
              <h3>Verify your email address to complete registration</h3>
              <br>
              <br>
              <h6>Hi ${user.name}</h6>
              <h6>Thanks for joining us! To complete your registration, we need you to verify your email address.</h6>
              <a class="btn btn-success" href="http://localhost:3000/users/auth?token=${token}&email=${user.email}">Verify Email</a>
          `;
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: mail_username, // generated ethereal user
                    pass: mail_password // generated ethereal password
                }
            });

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"soft2dev" smtp.mailtrap.io', // sender address
                to: user.email, // list of receivers
                subject: "Node Contact Request", // Subject line
                text: "Hello world?", // plain text body
                html: output // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (err,info) => {
                if (err) {
                    return err;
                }
                console.log("Message sent: %s", info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                req.flash('success_msg', 'Verify your email address to complete registration.');
                //req.flash('success_msg', 'You are registered and can now login');
                res.redirect('/users/register');
            })
          })
        }
      })
  }
});

passport.use(new LocalStrategy({ 
    usernameField: 'email', 
    passwordField: 'password'
  },
  function(username, password, done) {
    User.getUserByEmail(username,function(err, user){
      if(err) throw err;
      if(!user){
        return done(null,false, {message: 'Unkown User'})
      }
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null,user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      })
    })
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', 
    {
        successRedirect:'/',
        failureRedirect: '/users/login',
        failureFlash: true
      }),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res) {
    req.logOut();
    req.flash('success_msg', 'You are logged out.');
    res.redirect('/users/login');
  });
router.get('/auth', function(req, res) {
  User.getUserByEmail(req.query.email,function(err, user){
    if(err) throw err;
    try{
      if(user.token == req.query.token){
        req.flash('success_msg', 'You are registered and can now login');
        res.redirect('/users/login');
      } else {
        req.flash('error_msg', 'You are not athorized');
        res.redirect('/users/register');
      }
    } catch(err){
      return err;
    }

  });
});

module.exports = router;
