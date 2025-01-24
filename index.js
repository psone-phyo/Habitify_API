require('dotenv').config();
const express = require('express');
const app = express();
const Auth = require('./routes/auth-route')
const port = process.env.PORT

//db
const mongoose = require('mongoose');
const User = require('./models/UserModel');
mongoose.connect(process.env.CONNECTION_STRING)
//custom
const {authenticateToken} = require('./utils/AuthenticateToken');

const passport = require("passport");
const session = require("express-session");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: true
  }));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {done(null, user)});
passport.deserializeUser((user, done) => {done(null, user)});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, email, done) {
      console.log(profile, email);
      return done(null, profile);
    }
  )
);

app.get('/auth/google',passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/success');
    });

app.get('/', (req,res) => {
    res.send("This is Habitify APP API")
})

app.get('/success', (req,res) => {
    res.send("Success google login")
})

app.use('/api/auth',Auth);



app.listen(port, ()=>console.log(`Server is running on port ${port}`));