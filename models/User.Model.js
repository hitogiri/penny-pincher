const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//Schema
const UserSchema = new mongoose.Schema({
  local: {
    userName: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
  },
  google: {
    googleId: String,
    token: String,
    firstName: String,
    lastName: String,
    displayName: String,
  },
  goal: {
    type: Number,
    default: 0
  }
})

//Hash & Salt password with bcrypt
UserSchema.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("local.password")) {
    return next();
  }
  bcrypt.genSalt(13, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.local.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.local.password = hash;
      next();
    });
  });
});

// Helper method for validating user's password.


UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.local.password)
    return isMatch
  } catch (err) {
    throw err;
  }
};

module.exports = mongoose.model("User", UserSchema)