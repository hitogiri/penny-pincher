const { CommandFailedEvent } = require('mongodb');
const Purchase = require('../models/Purchase.Model')
const User = require('../models/User.Model')

module.exports = {
  getPurchases: async (req, res) => {  //declare an asynchronous method 'getPurchases'
    console.log(req.user); // log the user attached to the request object (t)
    try { //declare a try catch block
      const purchaseItems = await Purchase.find({ userId: req.user.id }); //use the find method to retrieve the the user who's userId property matches the id attached to the user object on the request body. 

      const user = await User.findOne({ _id: req.user.id }, "goal");  //find one user who's unique ID matches the user id attached to the request body, then select that user's "goal" property.

      const userGoal = user ? user.goal : 0; //if the goal of that user exists, set a constant named userGoal to user.goal otherwise set it to 0.

      res.render("purchases.ejs", { //render the purchases.ejs file
        purchases: purchaseItems, // pass purchaseItems into variable named "purchases" within the file
        userGoal: userGoal, // pass the userGoal into a variable "userGoal"
        user: req.user, //pass the user object on the request body into a variable named "user"

        themeClickHandler: "themeSwitch()"
      });
    } catch (err) {
      console.log(err);
    }
  },

  makePurchase: async (req, res) => {
    try {
      await Purchase.create({ //mongoose method for creating a document, returns a promise
        purchase: req.body.purchaseItem, // "purchaseItem" is attached to the request body via a post request sent from a form. Take the value of purchaseItem and assign it to the purchase property of this document. 
        price: req.body.price, //req.body.price sent via post, assign its value to price property
        userId: req.user.id, //passport gives us a user. Assign its id to this documents userId property
      });
      console.log("Purchase has been added!");
      res.redirect("/purchases");
    } catch (err) {
      console.log(err);
    }
  },
  removePurchase: async (req, res) => {
    console.log(req.params.id); //log the id of item to be removed
    try {
      await Purchase.findOneAndDelete({ _id: req.params.id }); //
      console.log("Removed Purchase");
      res.redirect("/purchases");
    } catch (err) {
      console.log(err);
    }

  },
  removeAllPurchases: async (req, res) => {
    try {
      const { purchaseIDsFromJSFile } = req.body //destructure purchaseIDs from the request body
      await Purchase.deleteMany({ userId: { $in: req.params.id } }) //delete documents "in" the purchaseIDs array with the matching unique _id
      console.log("All purchases deleted");
      res.redirect("/purchases");
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to delete all purchases" });
    }

  },
  editGoal: async (req, res) => {
    try {
      const { newGoal } = req.body
      const user = await User.findOne({ _id: req.user.id })
      user.goal = newGoal
      await user.save()
      res.redirect("/purchases")
    } catch (err) {
      console.log(err);
    }
  },
}