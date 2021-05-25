//requiring modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//setting up various app functions
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

//connecting to mongoose database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true});

//making userSchema for mongoose
const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

//mongoose model using schema
const User = mongoose.model("User",userSchema);

//simple app.get routes for various pages
app.get("/",function(req,res){
  res.render("home");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/logout",function(req,res){
  res.redirect("/");
});

//setting up the no of salting rounds for hashing
const saltRounds = 10;

//setting up post route for the register page
app.post("/register",function(req,res){

  //bycrypt uses hash function to hash the password entered by the user
  bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    const newUser = new User({
      email:req.body.username,
      password:hash
    });

    newUser.save(function(err){
      if(err){
        console.log(err);
      }else{
        res.redirect("/login");
      }
    });
  });

});

//post route for the login page
app.post("/login",function(req,res){

  //finding the emailid entered by the user in the database
  User.findOne({email:req.body.username},function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        //comparing the password entered by the user and the hashed password from the database to gain access to the user
        bcrypt.compare(req.body.password,foundUser.password,function(err,result){
          if(result === true){
            res.render("secrets");
          }
        });
    }
  }
  });
});

//listening to the port 3000
app.listen(3000,function(){
  console.log("Server started at port 3000");
});
