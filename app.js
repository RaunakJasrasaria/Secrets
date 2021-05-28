//requiring modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

//setting up various app functions
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

//setting up session
app.use(session({
  secret:"viratkohliisthebest",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());       //setting up passport
app.use(passport.session());          //making passport manage all the session


//connecting to mongoose database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set("useCreateIndex",true);

//making userSchema for mongoose
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose, {usernameUnique: false});       //plugging in PLM to the Schema
userSchema.plugin(findOrCreate);

//mongoose model using schema
const User = mongoose.model("User",userSchema);


passport.use(User.createStrategy());

//setting up passport-local for serializing and deserializing the users
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



//simple app.get routes for various pages
app.get("/",function(req,res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
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
  User.find({secret:{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
      res.render("secrets",{usersWithSecrets:foundUsers});
    }}
  });

}else{
  res.redirect("/login");
}
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

//get route for logout
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
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


app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(err){
        if(err){
          console.log(err);
        }else{
          res.redirect("/secrets");
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
