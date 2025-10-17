const mongoose = require('mongoose');

// Schema for the user's detailed health profile information
const ProfileSchema = new mongoose.Schema({
    weight: { type: Number }, // Current weight in kg
    height: { type: Number }, // Height in cm
    age: { type: Number },
    gender: { type: String },
    region: { type: String }, // e.g., North India, South India (for regional dietary recommendations)
    healthIssues: { type: [String], default: [] }, // array of chronic conditions or concerns
    goal: { type: String }, // e.g., 'Weight Loss', 'Muscle Gain', 'Maintenance'
    targetWeight: { type: Number }, // Goal weight in kg
    activityLevel: { type: String }, // e.g., 'Sedentary', 'Moderate', 'Active'
    dietPreference: { type: String }, // e.g., 'Vegetarian', 'Vegan', 'Non-Vegetarian'
    allergies: { type: [String], default: [] }, // array of food allergies
});

// Main User Schema for authentication credentials and profile link
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    // Stored as a hashed value using bcrypt
    password: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    // Embeds the ProfileSchema as a sub-document
    profile: {
        type: ProfileSchema,
        // CRITICAL: Initialize profile as an empty object by default
        default: () => ({}), 
    },
});

// Export the Mongoose model for use in controllers/routes
module.exports = mongoose.model('User', UserSchema);
