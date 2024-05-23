const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({

  purchase: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  userId: {
    type: String,
    required: true
  }

})

module.exports = mongoose.model('Purchase', PurchaseSchema)