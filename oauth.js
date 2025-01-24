const express = require("express");
const app = express();
const router = express.Router();

const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user); // Here, we're storing the whole user object in the session
});

passport.deserializeUser((user, done) => {
  done(null, user); // Retrieve the user from the session
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      return done(null, profile);
    }
  )
);

router.get('/auth/google',passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/success');
    });
