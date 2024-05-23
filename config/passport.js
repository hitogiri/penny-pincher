const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const User = require("../models/User.Model");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      async (username, password, done) => {
        try {
          const user = await User.findOne({
            $or: [
              { 'local.email': username.toLowerCase() },
              { 'local.userName': username.toLowerCase() },
            ],
          });

          if (!user) {
            return done(null, false, { msg: "Invalid username or email" });
          }

          const isMatch = await user.comparePassword(password);

          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { msg: "Invalid password" });
          }
        } catch (err) {
          return done(err);
        }

      })
  );

  passport.use('signup', new LocalStrategy({
    usernameField: 'username',
    emailField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
    async function (req, username, email, password, done) {
      try {
        // Whether we're signing up or connecting an account, we'll need
        // to know if the email address is in use.
        const existingUser = await User.findOne({ email: email });

        // Check if there's already a user with that email
        if (existingUser) {
          return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
        }
        // We're not logged in, so we're creating a brand new user.
        else {
          // Create the user
          let newUser = new User();
          newUser.local.username = username;
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);
          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        // Handle any errors
        return done(err);
      }
    }
  ));


  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
    async function (req, token, refreshToken, profile, done) {
      try {
        // check if the user is already logged in
        let user = await User.findOne({ 'google.googleId': profile.id });
        if (user) {
          return done(null, user);
        } else {
          let newUser = new User();
          newUser.google.googleId = profile.id;
          newUser.google.token = token;
          newUser.google.displayName = profile.displayName;
          newUser.google.firstName = profile.name.givenName;
          newUser.google.lastName = profile.name.familyName;
          await newUser.save();
          return done(null, newUser);
        }

      } catch (err) {
        return done(err);
      }
    }));




  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

};
