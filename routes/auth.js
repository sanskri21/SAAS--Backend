const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users/signup
router.post('/signup', async (req, res) => {
  const { name, email, phone, age, weight,username, gender, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ name, email, phone, age, weight,username, gender, password, activity: 1 });
    const today = new Date().toLocaleDateString('en-CA');
    newUser.calendarData = { [today]: 'visited' };
    await newUser.save();

    res.status(201).json({ message: 'Signup successful', user: newUser });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.comparePassword(password, async (err, isMatch) => {
      if (err) throw err;
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const today = new Date().toLocaleDateString('en-CA');
      if (!user.calendarData) {
        user.calendarData = {};
      }
      if (!user.calendarData[today]) {
        user.calendarData[today] = 'visited';
        user.activity += 1;
        await user.save();
      }

      res.status(200).json({ id: user._id, name: user.name, email: user.email });
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to track user activity
router.post('/activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log('Activity recording for user:', userId);

    // Fetch the user by ID
    const user = await User.findById(userId);
    // console.log('User found:', user);

    // Check if user exists
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];
    // console.log('Today:', today);

    // Initialize calendarData if it doesn't exist
    if (!user.calendarData || !(user.calendarData instanceof Object)) {
      user.calendarData = {};
    }

    // Check if the user has already been recorded as active today
    if (!user.calendarData[today]) {
      user.calendarData[today] = 'visited'; // Mark the user as visited today
      user.activity += 1; // Increment activity count
      // console.log('Updating user with new activity data:', user.calendarData, user.activity);
      await user.save(); // Save the user data
      // console.log('User activity updated:', user);
    } else {
      // console.log('User already recorded as active today.');
    }

    // Respond with the updated activity data
    res.status(200).json({ message: 'Activity recorded', activityData: user.calendarData });
  } catch (error) {
    console.error('Failed to record activity:', error);
    res.status(500).json({ message: 'Failed to record activity', error: error.message });
  }
});

module.exports = router;
