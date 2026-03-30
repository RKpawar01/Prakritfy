const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  // User location for region-based food suggestions
  region: {
    country: {
      type: String,
      default: 'India',
    },
    state: {
      type: String,
      enum: [
        'punjab', 'haryana', 'delhi', 'uttar pradesh', 'rajasthan',
        'himachal pradesh', 'uttarakhand', 'jammu and kashmir',
        'karnataka', 'tamil nadu', 'telangana', 'andhra pradesh', 'kerala',
        'west bengal', 'bihar', 'jharkhand', 'odisha', 'assam',
        'maharashtra', 'gujarat', 'goa',
      ],
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
  },
});

module.exports = mongoose.model("User", userSchema);
