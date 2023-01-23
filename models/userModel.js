const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    trim: true,
    minlength: [5, 'User name must have more or equal 5 chars'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please input valid email address'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //prevent to show this field if get users
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This validator works only on create() AND save()!!!
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords mismatch',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //time whne changed password can be newer then in jwt, so we need to
  //minus 1000ms to be sure that token valid and log in user
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPaswword
) {
  return await bcrypt.compare(candidatePassword, userPaswword);
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return false;

  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );

  return JWTTimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
