const express = require('express');
const { signup, login, sendOTP, verifyOTP } = require('../controllers/auth.controller');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);

module.exports = router;
