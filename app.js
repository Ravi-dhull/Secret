//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
//to use below when encrypting using AES algorithm
//var encrypt = require('mongoose-encryption');
//use below when using plain hashin
//const md5=require("md5");
//use belwo when using hashing and salting -- bcrypt
//const bcrypt = require("bcrypt");
//const saltRounds=10;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//below code is for sessions and cookies make sure to paste it between all above app.use() and db connect
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/Secrets", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
});

// const secretschema = {
//   useremail: String,
//   userpassword: String
// };


//using new mongoose.Schema method for encryption purposes else we can simple use const secasfdsdf={useremail:String,pass:String};
const secretschema=new mongoose.Schema({
  useremail: String,
  userpassword: String,
  googleId: String
});

//use below plugin to use passportLocalMongoose
secretschema.plugin(passportLocalMongoose);
//use below plugin for findOrCreate functionality which is made up function for google oauth20 to store the google's provided details in our db
secretschema.plugin(findOrCreate);

//use encrypt plugin to encrypt password
//secretschema.plugin(encrypt,{secret:process.env.SECRET,excludeFromEncryption: ['useremail']});
const secretModel = new mongoose.model("Credential", secretschema);

//use below passport methods after creation of model
passport.use(secretModel.createStrategy());

// passport.serializeUser(secretModel.serializeUser());
// passport.deserializeUser(secretModel.deserializeUser());
//we are using more simplified verison of serialize and deserialize from passport package
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  secretModel.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    secretModel.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home", {});
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/register", function(req, res) {
  res.render("register", {});
});
app.get("/login", function(req, res) {
  res.render("login", {});
});
app.get("/submit", function(req, res) {
  res.render("submit", {});
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/login",function(req,res){
  const user=new secretModel({
    username:req.body.username,
    userpassword:req.body.password
  });
  //below login method is used to authenticate user thorugh passport method login()
  req.login(user,function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
    });
  }
});
});

app.post("/register",function(req,res){
  //register() here is function from passport-local-mongoose which will replace our main creating a javascript object and saving it to db
  secretModel.register({username:req.body.username}, req.body.password, function(err, user) {
    if (err) {
    console.log(err);
    res.redirect("/register");
   }
   else{
     passport.authenticate("local")(req,res,function(){
       res.redirect("/secrets");
     });
   }
});
});
app.post("/submit", function(req, res) {
  const secret = req.body.secret;
  console.log(secret);
  res.render("secrets");
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});



//login and registration using bcrypt,hashing below
// app.post("/login", function(req, res) {
//   const emailid = req.body.username;
//   const password = req.body.password;
//   //const password=md5(req.body.password);
//   // console.log(emailid);
//   // console.log(password);
//   secretModel.findOne({
//     useremail: emailid
//   }, function(err, founduser) {
//     if (err) {
//       console.log(err);
//     } else {
//       if (!founduser) {
//         console.log("no user found");
//       } else {
//         bcrypt.compare(password, founduser.userpassword, function(err, result) {
//           if (result == true) {
//             res.render("secrets");
//           }
//           else {
//             console.log("password wrong");
//           }
//         });
//
//
//
//
//       }
//     }
//   })
//
// });
// app.post("/register", function(req, res) {
//   const emailid = req.body.username;
//   //const password=md5(req.body.password);
//   const password = req.body.password;
//   bcrypt.hash(password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//     const user = new secretModel({
//       useremail: emailid,
//       userpassword: hash
//     });
//     user.save(function(err) {
//       if (err) {
//         console.log(err);
//       } else {
//         res.render("secrets");
//       }
//     });
//   });
//
//
// });
