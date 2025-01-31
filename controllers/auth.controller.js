const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const { sendEmail } = require('../utils/otp.util');

const signup = async (req, res) => {
    try {
      const { username, email, phone, password} = req.body;  
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists." });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = await bcrypt.hash(otp, 10); // Encrypt the OTP
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now
  
      const newUser = new User({
        username,
        email,
        phone,
        password: hashedPassword,
        otp: hashedOtp,
        otpExpiresAt: expiresAt,
      });
      await newUser.save();
  
      // console.log(`User registered: ${newUser}`);
  
      // console.log(`Sending OTP to ${email}`);
      await sendEmail(
        email,
        "OTP for Registration",
        `Hello ${username},\n\n Welcome to Ride Evee.\n We are excited to have you \n Your OTP for registration is: ${otp}\n\nThank you!`
      );
  
      res.status(201).json({ message: "User registered successfully. Check your email for OTP." });
    } catch (error) {
      console.error("Error occurred during registration:", error);
      res.status(500).json({ message: "Error occurred while registering.", error });
    }
  };


  const verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!otp || (typeof otp !== 'string' && typeof otp !== 'number')) {
        return res.status(400).json({ message: "OTP must be a valid number or string." });
      }
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid email or OTP." });
      }
  
      if (!user.otp || Date.now() > user.otpExpiresAt) {
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }
  
      // Convert OTP to string before comparison
      const isOtpValid = await bcrypt.compare(otp.toString(), user.otp);
      if (!isOtpValid) {
        return res.status(400).json({ message: "Invalid OTP." });
      }
  
      user.isVerified = true;
      user.otp = null; // Clear the OTP after verification
      user.otpExpiresAt = null; // Clear the expiration time

      await user.save();
  
      res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
      console.error("Error occurred while verifying OTP:", error);
      res.status(500).json({ message: "Error occurred while verifying OTP.", error });
    }
  };



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email }] });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: "User not found or not verified." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error occurred during login:", error);
    res.status(500).json({ message: "Error occurred during login.", error });
  }
};

module.exports = { signup, verifyOTP, login };