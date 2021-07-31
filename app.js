//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
 extended: true
 }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/Secrets",{useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

//using new mongoose.Schema method for encryption purposes else we can simple use const secasfdsdf={useremail:String,pass:String};
const secretschema=new mongoose.Schema({
  useremail: String,
  userpassword: String
});

secretschema.plugin(encrypt,{secret:process.env.SECRET,excludeFromEncryption: ['useremail']});
const secretModel=mongoose.model("Credential",secretschema);

app.get("/",function(req,res){
  res.render("home",{});
});
app.get("/register",function(req,res){
  res.render("register",{});
});
app.get("/login",function(req,res){
  res.render("login",{});
});
app.get("/submit",function(req,res){
  res.render("submit",{});
});
// app.get("/secrets/",function(req,res){
//   // secretModel.findOne({useremail:req.params.user},function(err,founduser){
//   //     if(err){
//   //       console.log(err);
//   //     }
//   //     else{
//   //       res.render("secrets",{founduser.secret});
//   //     }
//   // })
//   res.render("secrets",{});
//
// });
app.get("/logout",function(req,res){
  res.render("home",{});
});

app.post("/login",function(req,res){
  const emailid=req.body.username;
  const password=req.body.password;
  console.log(emailid);
  console.log(password);
  secretModel.findOne({useremail:emailid},function(err,founduser){
      if(err){
        console.log(err);
      }
      else{
        if(!founduser){
          console.log("no user found");
        }
        else{
          if(founduser.userpassword===password){
            res.render("secrets");
          }
          else{
            console.log("password wrong");
          }

        }
      }
  })

});
app.post("/register",function(req,res){
  const emailid=req.body.username;
  const password=req.body.password;
  console.log(emailid);
  console.log(password);
  const user=new secretModel({
    useremail: emailid,
    userpassword:password
  });
  user.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("user signed up successfully");
    }
  });
  res.render("secrets");
});
app.post("/submit",function(req,res){
  const secret=req.body.secret;
  console.log(secret);
  res.render("secrets");
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
