const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const app = express();

app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
