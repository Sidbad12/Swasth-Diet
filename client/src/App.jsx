import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, MessageCircle, User, Scale, Target, Heart, ChevronRight, Menu, Plus, X, Calendar, TrendingUp, Book, Users, LogOut, Settings, Home, Award, Bell, Clock, Leaf } from 'lucide-react';

// --- Global Configuration ---
// Note: apiKey is deliberately left empty; the Canvas environment will provide it at runtime.
const API_KEY = ""; 
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
const API_URL = 'https://swasth-diet.onrender.com'; 

const indianRegions = [
    'North India', 'South India', 'East India', 'West India', 'Northeast India', 'Central India'
];

// --- Utility Functions for Data Formatting ---
const arrayToString = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    return value || '';
};

// --- GEMINI API SERVICE LOGIC (Separated Function) ---

/**
 * Handles the actual call to the Gemini API, including system prompt context, 
 * grounding, exponential backoff, and response parsing.
 * @param {string} userQuery The text query from the user.
 * @param {object} userData The current user's profile data for context.
 * @returns {Promise<{text: string, sources: Array<{uri: string, title: string}>}>}
 */
const callGeminiApi = async (userQuery, userData) => {
    const profileContext = `
        User Profile Summary:
        Name: ${userData.name || 'N/A'}
        Age: ${userData.age || 'N/A'}
        Weight: ${userData.weight || 'N/A'} kg, Height: ${userData.height || 'N/A'} cm
        Goal: ${userData.goal || 'General Health'}
        Region: ${userData.region || 'All India'}
        Diet Preference: ${userData.dietPreference || 'N/A'}
        Health Issues: ${arrayToString(userData.healthIssues) || 'None'}
        Allergies: ${arrayToString(userData.allergies) || 'None'}
    `;

    const systemPrompt = `
        You are the Swasth Bharat AI Nutrition Assistant. Your primary goal is to provide accurate, safe, and personalized dietary and nutrition advice tailored for the Indian population.

        Knowledge Base: Your advice MUST be grounded in established Indian nutritional science, citing information relevant to the user's region, diet, and health condition. You MUST use the latest ICMR-NIN Dietary Guidelines for Indians (2024) and data from the Indian Food Composition Tables (IFCT 2017) as your foundation.

        Persona: Be helpful, empathetic, and encouraging. Respond concisely and clearly. Incorporate Hindi greetings (like Namaste) or phrases when appropriate.

        Instructions:
        1. Use the provided Google Search tool (grounding) to access current, specific, and external data, especially when discussing specific food items, clinical recommendations, or updated guidelines.
        2. When providing recipe ideas, prioritize ingredients common to the user's specified region (${userData.region || 'India'}).
        3. Always explicitly consider the user's **Health Issues** and **Allergies** in your response.
        4. Provide the answer in rich, conversational text format.

        ${profileContext}
    `;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        // MANDATORY: Use Google Search for grounding in up-to-date info
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    const MAX_RETRIES = 5;
    let botResponse = { 
        text: "Sorry, I encountered a network error and could not reach the AI. Please check your connection and try again.", 
        sources: [] 
    };

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;
                
                // Extracting citation sources from grounding metadata
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title); 
                }
                
                return { text, sources }; // Success, return response
            } else {
                throw new Error('Invalid response structure from API. Response was likely blocked or incomplete.');
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === MAX_RETRIES - 1) {
                return botResponse; // Last attempt failed, return default error
            }
            // Exponential backoff delay
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return botResponse;
};

// --- AUTH SCREEN (Stable) ---

const AuthScreen = ({ currentPage, setCurrentPage, onAuthSuccess, onAuthError }) => {
    
    const [authForm, setAuthForm] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    
    const isRegister = currentPage === 'register';

    const nameInputRef = useRef(null);
    const emailInputRef = useRef(null);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isRegister && nameInputRef.current) {
                nameInputRef.current.focus();
            } else if (!isRegister && emailInputRef.current) {
                emailInputRef.current.focus();
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [currentPage, isRegister]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAuthForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAuth = async (endpoint) => {
        setIsAuthLoading(true);
        setAuthError(''); 

        const payload = authForm; 

        try {
            // --- FIX APPLIED HERE: Added '/api' to the URL ---
            const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.msg || data.errors?.[0]?.msg || `Authentication failed: ${endpoint}`;
                setAuthError(errorMsg);
                // Assuming onAuthError is defined elsewhere
                // onAuthError(errorMsg); 
                setIsAuthLoading(false);
                return;
            }

            // Assuming onAuthSuccess is defined elsewhere
            // onAuthSuccess(data.token); 
            setIsAuthLoading(false);

        } catch (error) {
            console.error(`Error during ${endpoint}:`, error);
            const errorMsg = 'Network error or server unavailable. Please check the backend server.';
            setAuthError(errorMsg);
            // Assuming onAuthError is defined elsewhere
            // onAuthError(errorMsg);
            setIsAuthLoading(false);
        }
    };
    
    const handlePageSwitch = (page) => {
        setCurrentPage(page);
        setAuthError('');
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl">
                <h1 className="text-4xl font-extrabold text-center text-green-700 mb-2">
                    Swasth Bharat
                </h1>
                <p className="text-center text-gray-500 mb-8 text-lg">
                    Your path to wellness.
                </p>

                {authError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium" role="alert">
                        {authError}
                    </div>
                )}

                <div className="space-y-4">
                    {isRegister && (
                        <input
                            ref={nameInputRef} 
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={authForm.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 transition duration-150"
                            disabled={isAuthLoading}
                        />
                    )}
                    <input
                        ref={emailInputRef} 
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={authForm.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 transition duration-150"
                        disabled={isAuthLoading}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={authForm.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 transition duration-150"
                        disabled={isAuthLoading}
                    />
                </div>

                <button
                    onClick={() => handleAuth(isRegister ? 'register' : 'login')}
                    disabled={isAuthLoading || !authForm.email || !authForm.password || (isRegister && !authForm.name)}
                    className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition duration-300 shadow-lg shadow-green-300/50 disabled:bg-gray-400 flex items-center justify-center"
                >
                    {isAuthLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <span>{isRegister ? 'Register' : 'Login'}</span>
                    )}
                </button>

                <p className="mt-6 text-center text-gray-600">
                    {currentPage === 'auth' ? (
                        <>
                            New here?{' '}
                            <button
                                onClick={() => handlePageSwitch('register')}
                                className="text-green-600 font-semibold hover:text-green-800 transition"
                                disabled={isAuthLoading}
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                onClick={() => handlePageSwitch('auth')}
                                className="text-green-600 font-semibold hover:text-green-800 transition"
                                disabled={isAuthLoading}
                            >
                                Login
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

// --- PROFILE SCREEN (Stable) ---

const ProfileScreen = ({ userData, onUpdateSuccess, onUpdateError }) => {
    
    const [localProfileData, setLocalProfileData] = useState(() => ({
        name: userData.name || '',
        email: userData.email || '',
        weight: userData.weight || '',
        height: userData.height || '',
        age: userData.age || '',
        gender: userData.gender || '',
        region: userData.region || '',
        healthIssues: arrayToString(userData.healthIssues),
        goal: userData.goal || '',
        targetWeight: userData.targetWeight || '',
        activityLevel: userData.activityLevel || '',
        dietPreference: userData.dietPreference || '',
        allergies: arrayToString(userData.allergies)
    }));
    
    const [isLoading, setIsLoading] = useState(false);
    
    const handleProfileFormChange = (e) => {
        const { name, value } = e.target;
        setLocalProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('You must be logged in to update your profile.');
            setIsLoading(false);
            return;
        }

        const formattedData = {
            ...localProfileData,
            healthIssues: localProfileData.healthIssues.split(',').map(s => s.trim()).filter(s => s),
            allergies: localProfileData.allergies.split(',').map(s => s.trim()).filter(s => s),
        };

        try {
            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify(formattedData),
            });

            const data = await response.json();

            if (!response.ok) {
                onUpdateError(data.msg || 'Failed to update profile.');
                setIsLoading(false);
                return;
            }

            onUpdateSuccess(formattedData); 
            console.log('Profile updated successfully!'); 

        } catch (error) {
            console.error('Profile update error:', error);
            onUpdateError('Network error during profile update.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
      <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-green-700 mb-6">Complete Your Health Profile</h1>
        <p className="text-gray-600 mb-8">
            Tell us about yourself so we can provide truly personalized nutrition advice.
        </p>

        <form onSubmit={handleProfileUpdate} className="space-y-6 bg-white p-6 rounded-2xl shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                    type="text"
                    name="name"
                    value={localProfileData.name}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Full Name"
                    required
                    disabled={isLoading}
                />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={localProfileData.email}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg"
                    placeholder="Email"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                    type="number"
                    name="age"
                    value={localProfileData.age}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="25"
                    min="1"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                    name="gender"
                    value={localProfileData.gender}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={isLoading}
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                    type="number"
                    name="height"
                    value={localProfileData.height}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="170"
                    min="50"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                    type="number"
                    name="weight"
                    value={localProfileData.weight}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="75"
                    min="10"
                    disabled={isLoading}
                />
            </div>
          </div>
          
          <hr className="my-6 border-gray-100"/>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Goals & Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                    name="activityLevel"
                    value={localProfileData.activityLevel}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={isLoading}
                >
                    <option value="">Select Activity</option>
                    <option value="sedentary">Sedentary (little to no exercise)</option>
                    <option value="light">Lightly Active (1-3 days/week)</option>
                    <option value="moderate">Moderately Active (3-5 days/week)</option>
                    <option value="very">Very Active (6-7 days/week)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Goal</label>
                <select
                    name="goal"
                    value={localProfileData.goal}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={isLoading}
                >
                    <option value="">Select Goal</option>
                    <option value="lose_weight">Weight Loss</option>
                    <option value="gain_muscle">Muscle Gain</option>
                    <option value="maintain">Maintain Current Weight</option>
                    <option value="healthy_eating">General Healthy Eating</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Weight (kg)</label>
                <input
                    type="number"
                    name="targetWeight"
                    value={localProfileData.targetWeight}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="65"
                    min="10"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region of India</label>
                <select
                    name="region"
                    value={localProfileData.region}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={isLoading}
                >
                    <option value="">Select Region</option>
                    {indianRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Diet Preference</label>
                <select
                    name="dietPreference"
                    value={localProfileData.dietPreference}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={isLoading}
                >
                    <option value="">Select Preference</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                    <option value="pescatarian">Pescatarian</option>
                </select>
            </div>
          </div>
            
          <hr className="my-6 border-gray-100"/>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Existing Health Issues (e.g., Diabetes, PCOS, Hypertension)</label>
            <textarea
                name="healthIssues"
                rows="2"
                value={localProfileData.healthIssues}
                onChange={handleProfileFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="List, separated by commas (e.g., Type 2 Diabetes, High Blood Pressure)"
                disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Separate each item with a comma.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Known Food Allergies (e.g., Peanuts, Gluten, Dairy)</label>
            <textarea
                name="allergies"
                rows="2"
                value={localProfileData.allergies}
                onChange={handleProfileFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="List, separated by commas (e.g., Peanuts, Wheat, Shellfish)"
                disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Separate each item with a comma.</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition duration-300 shadow-lg shadow-green-300/50 disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <span>Save Profile & Start Journey</span>
            )}
          </button>
        </form>
      </div>
    );
};

// --- NEW FEATURE SECTIONS (Omitted for brevity, assumed stable) ---

const ProgressSection = ({ weightHistory }) => (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Track My Progress</h1>
      <p className="text-gray-600 mb-8">
        Visualize your health journey, including weight changes, BMI trends, and goal achievements.
      </p>

      <div className="bg-white p-6 rounded-2xl shadow-xl mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><TrendingUp size={20} className="mr-2 text-purple-500"/> Weight Trend</h2>
        <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg border-dashed border-2 border-gray-300">
          <p className="text-gray-500">Weight History Chart Placeholder</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-400">
            <p className="text-sm text-gray-500">Current Weight</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">75 kg</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-orange-400">
            <p className="text-sm text-gray-500">BMI</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">25.9</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-green-400">
            <p className="text-sm text-gray-500">Goal Progress</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">4.5 kg Lost</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-red-400">
            <p className="text-sm text-gray-500">Active Days</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">12</p>
        </div>
      </div>
    </div>
);

const RecipesSection = ({ region, dietPreference }) => (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Regional Recipes</h1>
      <p className="text-gray-600 mb-8">
        Discover personalized, nutritious recipes tailored to your **{region || 'North Indian'}** region and **{dietPreference || 'Vegetarian'}** preference.
      </p>

      <div className="space-y-6">
        <div className="flex space-x-2">
            <input 
                type="text" 
                placeholder="Search recipes (e.g., Dal, Sambar)" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <button className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition">
                <Book size={20} />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { name: 'Palak Paneer', region: 'North', color: 'green' },
                { name: 'Masala Dosa', region: 'South', color: 'red' },
                { name: 'Shorshe Ilish', region: 'East', color: 'yellow' },
                { name: 'Dhokla', region: 'West', color: 'blue' }
            ].map((recipe, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-l-8 border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Leaf size={20} className={`mr-2 text-${recipe.color}-500`}/> {recipe.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Authentic {recipe.region} Indian Dish</p>
                    <div className="mt-3 flex justify-between items-center">
                        <p className="text-xs text-green-600 font-medium">~350 Kcal</p>
                        <button className="text-sm text-blue-500 hover:text-blue-700 transition">View Recipe &gt;</button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
);

const ExpertConsultSection = () => (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl text-center">
            <Users size={64} className="text-yellow-500 mx-auto mb-4"/>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Community & Experts</h1>
            <p className="text-xl font-medium text-red-500 mb-4">Coming Soon!</p>
            <p className="text-gray-600">
                Live chat functionality for connecting with certified nutritionists and other users is under development. Check back soon for this exciting feature.
            </p>
            <button 
                onClick={() => console.log('Sign up for early access to Community chat!')}
                className="mt-6 bg-yellow-500 text-white py-2 px-6 rounded-full font-semibold hover:bg-yellow-600 transition duration-300 shadow-lg"
            >
                Notify Me
            </button>
        </div>
    </div>
);

const SettingsSection = () => (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Settings</h1>
      <p className="text-gray-600 mb-8">
        Manage your account preferences and application configuration.
      </p>
        
      <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Settings size={20} className="mr-2 text-gray-500"/> Account</h2>
        <div className="flex justify-between items-center border-b pb-3">
            <span className="text-gray-700">Change Password</span>
            <ChevronRight size={20} className="text-gray-400 cursor-pointer"/>
        </div>
        <div className="flex justify-between items-center border-b pb-3">
            <span className="text-gray-700">Notification Preferences</span>
            <ChevronRight size={20} className="text-gray-400 cursor-pointer"/>
        </div>
        <button 
            onClick={() => console.log('Feature to delete account')} 
            className="w-full text-red-500 bg-red-50 p-3 rounded-lg hover:bg-red-100 transition font-medium"
        >
            Delete Account
        </button>
      </div>
    </div>
);


// --- MAIN APPLICATION COMPONENT ---

const SwasthBharatApp = () => {
  
  const [currentPage, setCurrentPage] = useState('auth'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    region: '',
    healthIssues: [],
    goal: '',
    targetWeight: '',
    activityLevel: '',
    dietPreference: '',
    allergies: []
  });
  const [mealLog, setMealLog] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { 
        sender: 'bot', 
        text: 'नमस्ते! I\'m your AI nutrition assistant. I can help you with meal planning, nutrition advice, and answer your dietary questions in Hindi or English!',
        sources: [] 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);


  // --- Utility Functions ---

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);

  // --- Authentication & Profile Fetch Logic ---

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile.');
      }

      const user = await response.json();
      setUserData(prev => ({
        ...prev, 
        name: user.name,
        email: user.email,
        ...user.profile,
      }));
      setIsLoggedIn(true);
      setCurrentPage('home'); 
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      handleLogout();
    }
  };

  const handleAuthSuccess = (token) => {
    localStorage.setItem('token', token);
    fetchUserProfile(token);
  };
  
  const handleAuthError = (errorMsg) => {
      console.error('Auth attempt failed:', errorMsg);
  }
  
  const handleProfileUpdateSuccess = (updatedData) => {
      setUserData(prev => ({
          ...prev,
          ...updatedData,
          healthIssues: updatedData.healthIssues,
          allergies: updatedData.allergies,
      }));
      setCurrentPage('home');
  }

  const handleProfileUpdateError = (errorMsg) => {
      console.error('Profile update failed:', errorMsg);
  }


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setCurrentPage('auth');
    }
  }, []); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData({
        name: '', email: '', weight: '', height: '', age: '', gender: '', region: '', healthIssues: [], goal: '', targetWeight: '', activityLevel: '', dietPreference: '', allergies: []
    });
    setCurrentPage('auth');
  };

  // --- Chat Feature Implementation (Calling the Service) ---

  const handleChatSend = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userQuery = chatInput.trim();
    const userMessage = { sender: 'user', text: userQuery, sources: [] };
    
    // 1. Update UI immediately
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    // 2. Call the separated service function
    const botResponse = await callGeminiApi(userQuery, userData);
    
    // 3. Update UI with final response (success or failure)
    setChatMessages(prev => [...prev, { sender: 'bot', ...botResponse }]);
    setIsTyping(false);
  };
  
  const handleCameraScan = () => {
    console.log('Camera scan feature coming soon!'); 
  };
  
  // --- UI Components ---
  
  const SectionCard = ({ title, icon: Icon, color, onClick, children }) => (
    <div 
      className={`bg-white p-6 rounded-2xl shadow-lg border-t-4 border-${color}-500 transition hover:shadow-xl cursor-pointer`} 
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600 mr-4`}>
            <Icon size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <ChevronRight className="text-gray-400" size={20} />
      </div>
      {children && <p className="mt-3 text-sm text-gray-500">{children}</p>}
    </div>
  );

  const HomeSection = () => (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-2xl shadow-xl text-white">
        <h1 className="text-2xl font-bold">Namaste, {userData.name || 'User'}! 👋</h1>
        <p className="mt-1 text-sm opacity-90">What step will you take towards a healthier India today?</p>
        <div className="mt-4 flex space-x-3">
          <button onClick={() => setCurrentPage('profile')} className="flex items-center bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition shadow-md">
            <User size={16} className="mr-2"/> Complete Profile
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setCurrentPage('chat')} 
          className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 border border-gray-100"
        >
          <MessageCircle size={32} className="text-blue-500"/>
          <span className="text-sm font-medium mt-2">Chat with AI</span>
        </button>
        <button 
          onClick={handleCameraScan} 
          className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 border border-gray-100"
        >
          <Camera size={32} className="text-orange-500"/>
          <span className="text-sm font-medium mt-2">Scan Meal</span>
        </button>
      </div>

      {/* Progress & Goals */}
      <h2 className="text-2xl font-bold text-gray-800 pt-4">Your Health Snapshot</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Set Health Goals" icon={Target} color="blue" onClick={() => setCurrentPage('profile')}>
          Define your target weight, activity level, and diet preferences.
        </SectionCard>
        <SectionCard title="Track Progress" icon={TrendingUp} color="purple" onClick={() => setCurrentPage('progress')}>
          View your weight history and performance metrics over time.
        </SectionCard>
      </div>

      {/* Core Features */}
      <h2 className="text-2xl font-bold text-gray-800 pt-4">Explore Swasth Bharat</h2>
      <div className="space-y-4">
        <SectionCard title="Daily Meal Log" icon={Calendar} color="red" onClick={() => setCurrentPage('mealLog')}>
          Log your meals quickly and get nutritional analysis.
        </SectionCard>
        <SectionCard title="Regional Recipes" icon={Book} color="yellow" onClick={() => setCurrentPage('recipes')}>
          Browse personalized, nutritious recipes based on Indian regional cuisine.
        </SectionCard>
        <SectionCard title="Community & Experts" icon={Users} color="pink" onClick={() => setCurrentPage('expertConsult')}>
          Connect with certified nutritionists and the Swasth Bharat community.
        </SectionCard>
      </div>
    </div>
  );

  const MealLogSection = () => (
    <div className="p-4 sm:p-6 md:p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Daily Meal Log</h1>
      <div className="bg-green-50 p-4 rounded-xl shadow-inner mb-6 flex justify-between items-center">
        <p className="font-semibold text-green-700">Today's Total: 1850 / 2200 kcal</p>
        <button className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition">
          <Plus size={20} />
        </button>
      </div>
      
      {mealLog.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500">No meals logged yet today.</p>
          <button onClick={() => console.log('Add meal modal')} className="mt-4 text-sm text-green-600 font-medium hover:underline">
            Tap to add your first meal!
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Meal log items would be mapped here */}
        </div>
      )}

      {/* Floating Action Button for easy adding */}
      <button 
        onClick={() => console.log('Add meal modal')} 
        className="fixed bottom-20 right-6 bg-orange-500 text-white p-4 rounded-full shadow-2xl hover:bg-orange-600 transition duration-300 z-10"
        aria-label="Add Meal"
      >
        <Plus size={24} />
      </button>

    </div>
  );

  const ChatSection = () => (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <div className="flex-shrink-0 flex items-center p-4 bg-white border-b shadow-sm">
        <button onClick={() => setCurrentPage('home')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2">
          <X size={24} />
        </button>
        <MessageCircle size={28} className="text-green-600 mr-3"/>
        <h1 className="text-xl font-bold text-gray-800">AI Nutrition Chat</h1>
      </div>
      
      {/* Disclaimer */}
      <div className="flex-shrink-0 p-3 bg-blue-100 text-blue-800 text-xs text-center font-medium border-b border-blue-200">
        Powered by Gemini: Advice grounded in **Indian Food Composition Tables** and **ICMR-NIN Guidelines**.
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '50vh' }}>
        {chatMessages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xs sm:max-w-md p-3 rounded-xl shadow-md ${
                msg.sender === 'user' 
                  ? 'bg-green-500 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Citations/Sources */}
              {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
                      <p className="font-semibold mb-1">Sources:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                          {msg.sources.map((source, idx) => (
                              <li key={idx} className="break-words">
                                  <a 
                                      href={source.uri} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="hover:underline text-blue-500"
                                  >
                                      {source.title || source.uri}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="max-w-xs sm:max-w-md p-3 rounded-xl bg-white text-gray-500 rounded-tl-none border border-gray-100 flex items-center">
               <span className="typing-indicator"></span> 
               <span className="ml-2">Typing...</span>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex-shrink-0 p-4 bg-white border-t">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder={isTyping ? "Swasth Assistant is typing..." : "Ask about nutrition, recipes, diet plans..."}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
            disabled={isTyping}
          />
          <button
            onClick={handleChatSend}
            disabled={!chatInput.trim() || isTyping}
            className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* CSS for typing animation */}
      <style>{`
        .typing-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 2px;
          border-radius: 50%;
          background-color: #a0a0a0;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator:nth-child(2) {
          animation-delay: -1.1s;
        }
        .typing-indicator:nth-child(3) {
          animation-delay: -0.7s;
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1.0);
          }
        }
        .typing-indicator::after, .typing-indicator::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #a0a0a0;
        }
        .typing-indicator::before {
             animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator::after {
             animation: bounce 1.4s infinite ease-in-out;
             animation-delay: -0.7s;
        }
      `}</style>
    </div>
  );

  // --- Main Render Function ---

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomeSection />;
      case 'mealLog':
        return <MealLogSection />;
      case 'chat':
        return <ChatSection />;
      case 'profile':
        return (
            <ProfileScreen 
                userData={userData}
                onUpdateSuccess={handleProfileUpdateSuccess}
                onUpdateError={handleProfileUpdateError}
            />
        );
      case 'progress':
          return <ProgressSection weightHistory={weightHistory} />;
      case 'recipes':
          return <RecipesSection region={userData.region} dietPreference={userData.dietPreference} />;
      case 'expertConsult':
          return <ExpertConsultSection />;
      case 'settings':
          return <SettingsSection />;
      default:
        return <HomeSection />;
    }
  };

  const NavItem = ({ page, icon: Icon, label, requiresAuth = true }) => {
    if (requiresAuth && !isLoggedIn) return null;
    return (
      <button 
        onClick={() => { 
          setCurrentPage(page); 
          setShowMenu(false);
        }}
        className={`flex items-center px-4 py-3 rounded-xl transition w-full ${
          currentPage === page 
            ? 'bg-green-100 text-green-700 font-semibold' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Icon size={20} className="mr-3"/>
        {label}
      </button>
    );
  };

  if (!isLoggedIn && currentPage !== 'auth' && currentPage !== 'register') {
      setCurrentPage('auth');
  }

  if (currentPage === 'auth' || currentPage === 'register') {
      return (
        <AuthScreen 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onAuthSuccess={handleAuthSuccess} 
          onAuthError={handleAuthError}
        />
      );
  }


  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white shadow-md">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold text-green-600">
            {currentPage === 'home' ? 'Swasth Bharat' : currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1')}
          </h1>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Notifications">
              <Bell size={24} />
            </button>
            <button onClick={() => setShowMenu(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-10 sm:hidden">
        <div className="flex justify-around p-2">
          <button onClick={() => setCurrentPage('home')} className={`flex flex-col items-center p-2 text-sm ${currentPage === 'home' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
            <Home size={24} />
            <span className="text-xs">Home</span>
          </button>
          <button onClick={() => setCurrentPage('mealLog')} className={`flex flex-col items-center p-2 text-sm ${currentPage === 'mealLog' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
            <Calendar size={24} />
            <span className="text-xs">Log</span>
          </button>
          <button onClick={() => setCurrentPage('chat')} className={`flex flex-col items-center p-2 text-sm ${currentPage === 'chat' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <MessageCircle size={24} />
            <span className="text-xs">AI Chat</span>
          </button>
          <button onClick={() => setCurrentPage('progress')} className={`flex flex-col items-center p-2 text-sm ${currentPage === 'progress' ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
            <TrendingUp size={24} />
            <span className="text-xs">Progress</span>
          </button>
          <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center p-2 text-sm ${currentPage === 'profile' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
            <User size={24} />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* Side Menu Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-30">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMenu(false)}></div>
          
          {/* Drawer Content */}
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-2xl p-6 transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-700">Menu</h2>
              <button onClick={() => setShowMenu(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-2">
              <NavItem page="home" icon={Home} label="Home" />
              <NavItem page="profile" icon={User} label="My Profile" />
              <NavItem page="mealLog" icon={Calendar} label="Daily Log" />
              <NavItem page="chat" icon={MessageCircle} label="AI Assistant" />
              <NavItem page="progress" icon={TrendingUp} label="Progress & Metrics" />
              <NavItem page="recipes" icon={Book} label="Regional Recipes" />
              <NavItem page="expertConsult" icon={Users} label="Community & Experts" />
            </div>

            <div className="mt-8 pt-4 border-t">
              <NavItem page="settings" icon={Settings} label="Settings" />
              <button 
                onClick={handleLogout} 
                className="flex items-center px-4 py-3 rounded-xl transition w-full text-red-500 hover:bg-red-50 font-semibold mt-2"
              >
                <LogOut size={20} className="mr-3"/>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwasthBharatApp;
