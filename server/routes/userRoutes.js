const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const auth = require('../middleware/auth'); 

// @route   GET api/user/profile
// @desc    Fetches the user's profile data
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user.id is available from the auth middleware
    // We select('-password') to exclude the password hash
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Send back the user object 
    res.json(user);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PUT api/user/profile
// @desc    Updates the user's profile data
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, weight, height, age, gender, region, healthIssues, goal, targetWeight, activityLevel, dietPreference, allergies } = req.body;
  
  // Build the profile fields object based on input
  const profileFields = {};
  if (weight !== undefined) profileFields.weight = weight;
  if (height !== undefined) profileFields.height = height;
  if (age !== undefined) profileFields.age = age;
  if (gender) profileFields.gender = gender;
  if (region) profileFields.region = region;
  if (healthIssues) profileFields.healthIssues = healthIssues;
  if (goal) profileFields.goal = goal;
  if (targetWeight !== undefined) profileFields.targetWeight = targetWeight;
  if (activityLevel) profileFields.activityLevel = activityLevel;
  if (dietPreference) profileFields.dietPreference = dietPreference;
  if (allergies) profileFields.allergies = allergies;
  
  try {
    let user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }

    // Update the profile sub-document fields using the spread operator
    user.profile = { ...user.profile.toObject(), ...profileFields };
    
    // Update the user's main name field if provided
    if (name) {
        user.name = name;
    }

    await user.save();
    
    // Return the updated user object (excluding the password)
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
