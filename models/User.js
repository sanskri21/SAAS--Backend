const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true },
  gender: { type: String, required: true },
  password: { type: String, required: true },
  activity: { type: Number, default: 0 }, // Track activity level for the user
  calendarData: { type: Object, default: {} } // Store activity data as plain object
});

UserSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified('password')) return next();

  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

UserSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
