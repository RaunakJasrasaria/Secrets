//requiring modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//setting up various app functions
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

//setting up session
app.use(session({
  secret:"viratkohliisthebest",
  resave:false,
  saveuninitialized:false
}));

app.use(passport.initialize());       //setting up passport
app.use(passport.session());          //making passport manage all the session

//connecting to mongoose database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set("useCreateIndex",true);

//making userSchema for mongoose
const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);       //plugging in PLM to the Schema

//mongoose model using schema
const User = mongoose.model("User",userSchema);

//setting up passport-local for serializing and deserializing the users
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

//get route for secrets page
app.get("/secrets",function(req,res){
if(req.isAuthenticated()){
  res.render("secrets");
}else{
  res.redirect("/login");
}
});

app.get("/logout",function(req,res){
});


//setting up post route for the register page
app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){      //registering the user with email and password
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){              //if no error then authenticate the user
        res.redirect("/login");
      });
    }
  });
});

//post route for the login page
app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});

//listening to the port 3000
app.listen(3000,function(){
  console.log("Server started at port 3000");
});
