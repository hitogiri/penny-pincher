const passport = require("passport")
require("dotenv").config({ path: "../config/.env" });
const validator = require("validator");
const User = require("../models/User.Model");
const Recaptcha = require("express-recaptcha").RecaptchaV2;
const recaptcha = new Recaptcha(
  process.env.RECAPTCHA_SITE_KEY,
  process.env.RECAPTCHA_SECRET_KEY,
);

module.exports = {
  getLogin: (req, res) => {
    if (req.user) {
      res.redirect("/purchases")
    }
    res.render("login", {
      title: "Login",
      themeClickHandler: "themeSwitch()"
    });
  },

  postLogin: async (req, res, next) => {
    const validationErrors = [];
    // Validate if either email or username field is empty
    if (validator.isEmpty(req.body.emailOrUsername)) {
      validationErrors.push({ msg: "Username or email cannot be blank." });
    }
    if (validator.isEmpty(req.body.password)) {
      validationErrors.push({ msg: "Password cannot be blank." });
    }

    if (validationErrors.length) { //if there are are errors
      req.flash("errors", validationErrors); // show them to the user using flash
      return res.redirect("/login"); // redirect them to the login page
    }

    const { emailOrUsername, password } = req.body; //destructure email and password from request body

    try {
      const user = await User.findOne({
        $or: [
          { "local.email": emailOrUsername.toLowerCase() },
          { "local.userName": emailOrUsername.toLowerCase() },
        ],
      });

      if (!user) {
        req.flash("errors", { msg: "Invalid username or email" });
        return res.redirect("/login");
      }

      const isMatch = await user.comparePassword(password);

      if (isMatch) {
        req.logIn(user, (err) => {
          if (err) {
            throw err;
          }
          req.flash("success", { msg: "Successfully logged in." });
          res.redirect(req.session.returnTo || "/purchases");
        });
      } else {
        req.flash("errors", { msg: "Invalid password" });
        res.redirect("/login");
      }
    } catch (err) {
      next(err);
    }

  },

  googleLogin: async (req, res) => {
    res.redirect('/purchases')
  },

  logout: async (req, res, next) => {
    req.logout((err) => { //req.logout method exposed by passport 
      if (err) { return next(err) };
      console.log("User has logged out.");
    });
    req.session.destroy((err) => {
      if (err)
        console.log("Error: Failed to destroy session on logout.", err);
      req.user = null;
      res.redirect("/");
    });
  },

  getSignup: (req, res) => {
    if (req.user) {
      return res.redirect("/purchases");
    }
    res.render("signup", {
      title: "Create Account",
      themeClickHandler: "themeSwitch()"
    });
  },

  postSignup: async (req, res, next) => {
    const validationErrors = [];
    if (!validator.isEmail(req.body.email))
      validationErrors.push({ msg: "Please enter a valid email address." });
    if (!validator.isLength(req.body.password, { min: 8 }))
      validationErrors.push({
        msg: "Password must be at least 8 characters long",
      });
    if (req.body.password !== req.body.confirmPassword)
      validationErrors.push({ msg: "Passwords do not match" });

    //Add validation for spending goal
    const goalRegex = /^(?:\d+(\.\d{1,2})?|\.\d{1,2})$/;
    if (!goalRegex.test(req.body.goal)) {
      validationErrors.push({ msg: "Spending goal should contain only numbers" });
    }

    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("../signup");
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });

    try {
      const recaptchaResponse = await new Promise((resolve, reject) => {
        recaptcha.verify(req, (error, data) => {
          if (error) {
            console.log(error)
            validationErrors.push({ msg: "reCAPTCHA verification failed" });
            req.flash("errors", validationErrors);
            reject(error);
            return res.redirect("/signup");
          } else {
            resolve(data);
          }
        });
      });


      const user = new User({
        "local.userName": req.body.userName,
        "local.email": req.body.email,
        "local.password": req.body.password,
        goal: req.body.goal,
      });

      const existingUser = await User.findOne({ $or: [{ "local.email": req.body.email }, { "local.userName": req.body.userName }] });
      if (existingUser) {
        req.flash("errors", {
          msg: "Account with that email address or username already exists.",
        });
        return res.redirect("../signup");
      }

      await user.save();
      await new Promise((resolve, reject) => {
        req.logIn(user, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      res.redirect("/purchases");
    } catch (error) {
      next(error);
    }

  },
};