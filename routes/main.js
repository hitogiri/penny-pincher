const express = require('express')
const passport = require('passport')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const homeController = require('../controllers/home.controller')

router.get('/', homeController.getIndex)

router.get('/signup', authController.getSignup)
router.post('/signup', authController.postSignup)

router.get('/login', authController.getLogin)
router.post('/login', authController.postLogin)

router.get('/logout', authController.logout)

router.get('/google', passport.authenticate('google', { scope: ['profile'] }))

router.get("/auth/google/callback", passport.authenticate('google', {
  failureRedirect: "/",
}), authController.googleLogin)

module.exports = router;



