const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport')
const session = require("express-session");
const MongoStore = require("connect-mongo")
const methodOverride = require('method-override')
var Recaptcha = require("express-recaptcha").RecaptchaV2;
const flash = require("express-flash");
const logger = require("morgan");
const connectDB = require('./config/database')
require('dotenv').config({ path: './config/.env' })
const mainRoutes = require('./routes/main')
const purchaseRoutes = require('./routes/purchases')
const app = express();

// Recaptcha initialization
var options = { theme: "dark" };
var recaptcha = new Recaptcha(
  process.env.RECAPTCHA_SITE_KEY,
  process.env.RECAPTCHA_SECRET_KEY,
  options,
);

// Passport config
require("./config/passport")(passport);

connectDB()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  }),
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session(), (request, response, next) => {
  if (request.session && !request.session.regenerate) {
    request.session.regenerate = cb => {
      cb();
    };
  }

  if (request.session && !request.session.save) {
    request.session.save = cb => {
      cb();
    };
  }

  next();
});


app.use(flash());

app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

app.use('/', mainRoutes)
app.use('/purchases', purchaseRoutes)

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const { job } = require("./cron");
job.start();

app.listen(process.env.PORT, () => {
  console.log(`server running on port: ${process.env.PORT}`)
})