# Swasth Bharat - AI-Powered Indian Nutrition & Health Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌐 Live Demo

**Try it now:** [Click-on-the-link](https://swasth-diet.vercel.app/)

## 📋 Overview

**Swasth Bharat** is a comprehensive health and nutrition platform designed specifically for the Indian population. It combines AI-powered dietary advice with region-specific meal planning, health tracking, and community features to promote wellness across India.

The application leverages Google's **Gemini AI 2.5 Flash Preview** with grounding in the latest **ICMR-NIN Dietary Guidelines (2024)** and **Indian Food Composition Tables (IFCT 2017)** to provide accurate, culturally relevant nutritional guidance.

---

## ✨ Key Features

### 🤖 AI Nutrition Assistant
- **Gemini-Powered Chat**: Real-time conversation with AI trained on Indian nutrition science
- **Grounded Responses**: Citations from authoritative sources (ICMR-NIN, IFCT 2017)
- **Bilingual Support**: Responds in Hindi and English
- **Context-Aware**: Considers your health profile, allergies, and dietary preferences
- **Smart Recommendations**: Personalized meal plans based on regional cuisine

### 👤 Personalized Health Profiles
- Detailed health metrics (age, weight, height, BMI calculation)
- Regional preferences (North, South, East, West, Northeast, Central India)
- Diet types (Vegetarian, Vegan, Non-Vegetarian, Pescatarian)
- Health conditions and allergies tracking
- Activity levels and fitness goals
- Target weight management

### 🍛 Regional Recipe Library
- Authentic recipes from across India
- Filtered by region and dietary preference
- Nutritional information for each recipe
- Meal planning suggestions
- Ingredient-based search

### 📊 Progress Tracking
- Weight history visualization
- BMI trends over time
- Goal achievement monitoring
- Active day counters
- Progress milestones

### 📅 Daily Meal Logging
- Quick meal entry interface
- Calorie tracking
- Nutritional analysis
- Daily summaries

### 👥 Community & Expert Consultation (Coming Soon)
- Connect with certified nutritionists
- Share experiences with other users
- Group challenges and motivation
- Live chat support

---

## 🏗️ Technology Stack

### Frontend
- **React 19.1.1** - Modern UI library with hooks
- **Vite 7.1.7** - Lightning-fast build tool
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Lucide React 0.546.0** - Beautiful icon library
- **React Compiler** - Optimized performance

### Backend
- **Node.js** with **Express 4.21.2**
- **MongoDB** (via Mongoose 8.19.1) - User data and logs
- **PostgreSQL 8.16.3** - Static nutrition data (IFCT tables)
- **JWT Authentication** - Secure token-based auth
- **bcryptjs 2.4.3** - Password hashing
- **CORS** - Cross-origin resource sharing

### AI Integration
- **Google Gemini 2.5 Flash Preview** - Advanced AI model
- **Google Search Grounding** - Real-time data augmentation
- Exponential backoff for API resilience
- Context-aware system prompts

### Deployment
- **Frontend:** Vercel (Static Site)
- **Backend:** Render (Web Service)
- **Database:** MongoDB Atlas (Cloud)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** account (free tier available at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Google Gemini API Key** (free tier available at [Google AI Studio](https://aistudio.google.com/))
- **Git** for version control

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Sidbad12/swasth-diet.git
cd swasth-diet
```

#### 2. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd ../client
npm install
```

#### 3. Environment Configuration

**Server** (`server/.env`):
```
## MongoDB Connection (Get from MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/swasth-bharat?retryWrites=true&w=majority

# PostgreSQL (Optional - for IFCT nutrition data)
POSTGRES_URI=postgresql://<username>:<password>@localhost:5432/nutrition_db

# JWT Secret (Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_super_secure_random_jwt_secret_here

# Gemini AI API Key (Get from Google AI Studio)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Server Port
PORT=3000

# Client URLs (for CORS)
CLIENT_URL=http://localhost:5173
RENDER_CLIENT_URL=https://your-deployed-client-url.vercel.app
```

**Client** - No environment variables needed! API_URL is hardcoded in `src/App.jsx`:
```javascript
const API_URL = 'https://swasth-diet.onrender.com'; // Update this for local: 'http://localhost:3000'
```

#### 4. Run the Application

**Development Mode:**

In separate terminal windows:
```bash
# Terminal 1 - Start Backend
cd server
npm run dev

# Terminal 2 - Start Frontend
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

---

## 📁 Project Structure
```
swasth-diet/
├── client/                    # Frontend React application
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── App.jsx           # Main application component (ALL features)
│   │   ├── App.css           # Component-specific styles
│   │   ├── index.css         # Tailwind imports
│   │   ├── main.jsx          # React entry point
│   │   └── assets/
│   │       └── react.svg
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── postcss.config.js
│   ├── vite.config.js        # Vite configuration
│   └── eslint.config.js
│
├── server/                    # Backend Node.js API
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── models/
│   │   └── UserModel.js      # Mongoose user schema
│   ├── routes/
│   │   ├── authRoutes.js     # Login/Register endpoints
│   │   ├── userRoutes.js     # Profile CRUD endpoints
│   │   └── geminiRoutes.js   # AI chat endpoints (secure)
│   ├── .env                  # Environment variables (DO NOT COMMIT)
│   ├── .gitignore
│   ├── package.json
│   └── server.js             # Express server entry point
│
├── LICENSE                    # MIT License
└── README.md                  # This file
```

---

## 🔐 Authentication Flow

1. **Registration**: 
   - User creates account with name, email, password
   - Password hashed with bcrypt (10 salt rounds)
   - JWT token issued (5-day expiration)
   - User profile initialized with empty health data

2. **Login**: 
   - Credentials validated against database
   - Password compared using bcrypt
   - JWT token issued on success

3. **Protected Routes**: 
   - Token sent in `x-auth-token` header
   - Middleware validates token
   - User ID extracted from token payload
   - Access granted to protected resources

---

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Create new user account | Public |
| POST | `/login` | Authenticate existing user | Public |

**Request Body (Register):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "507f1f77bcf86cd799439011"
}
```

### User Profile Routes (`/api/user`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/profile` | Fetch user profile | Private |
| PUT | `/profile` | Update user profile | Private |

**Headers Required:**
```
x-auth-token: <your-jwt-token>
```

### AI Chat Routes (`/api/gemini`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/chat` | Send query to Gemini AI | Private |

**Request Body:**
```json
{
  "userQuery": "What should I eat for breakfast?",
  "userData": {
    "name": "John",
    "age": 25,
    "weight": 70,
    "region": "North India",
    "dietPreference": "Vegetarian"
  }
}
```

**Response:**
```json
{
  "text": "Namaste! For a healthy North Indian vegetarian breakfast...",
  "sources": [
    {
      "uri": "https://example.com/source",
      "title": "ICMR-NIN Guidelines 2024"
    }
  ]
}
```

---

## 🎨 UI/UX Highlights

- **Mobile-First Design**: Optimized for Indian smartphone users
- **Bottom Navigation**: Easy thumb-reach on mobile devices (iOS/Android style)
- **Gradient Accents**: Saffron-green color scheme reflecting Indian flag colors
- **Smooth Animations**: Powered by Tailwind transitions
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready**: Foundation in place for future implementation

---

## 🔒 Security Best Practices

### API Keys Management
- ✅ **Gemini API Key**: Stored in backend `.env` file (NEVER in frontend)
- ✅ **JWT Secret**: Stored in backend `.env` file
- ✅ **MongoDB URI**: Stored in backend `.env` file

### Why API Keys Stay on Backend:
- Frontend JavaScript is publicly visible in browser DevTools
- Anyone can extract keys from bundled JavaScript files
- Backend environment variables are never exposed to clients
- API calls proxied through backend for security

### MongoDB Security
- **Current Setup**: Accepts connections from `0.0.0.0/0` (all IPs)
- **Why**: Render uses dynamic IP addresses on free tier
- **Protection**: Database secured with username/password authentication
- **Production Recommendation**: Use MongoDB Atlas IP whitelist or private endpoints

### Password Security
- Passwords hashed using bcryptjs with 10 salt rounds
- Never stored in plain text
- JWT tokens expire after 5 days
- Tokens validated on every protected route

---

## ⚡ Performance Notes

### Render Free Tier Limitations
- Backend spins down after 15 minutes of inactivity
- First request after sleep takes **30-60 seconds** to wake up
- Subsequent requests are fast (~100-500ms)

**User Experience Tips:**
```javascript
// Optional: Add server wake-up on app mount
useEffect(() => {
  fetch(`${API_URL}/`)
    .then(() => console.log('Server awake'))
    .catch(() => console.log('Server waking up...'));
}, []);
```

### Gemini API Free Tier Limits
- **15 requests per minute (RPM)**
- **1,500 requests per day**
- **1 million tokens per day**
- Perfect for portfolio/demo projects
- No credit card required

---

## 🌐 Deployment Guide

### Deploy Backend to Render

1. **Create Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. **Build Settings:**
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables** (add in Render dashboard):
```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_secret
   GEMINI_API_KEY=AIzaSy...
   RENDER_CLIENT_URL=https://your-vercel-app.vercel.app
   PORT=3000
```
5. Click **Create Web Service**
6. Copy your Render URL (e.g., `https://swasth-diet.onrender.com`)

### Deploy Frontend to Vercel

1. **Create New Project** on [Vercel](https://vercel.com)
2. Import your GitHub repository
3. **Build Settings:**
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Before Deploying**: Update `API_URL` in `client/src/App.jsx`:
```javascript
   const API_URL = 'https://swasth-diet.onrender.com'; // Your Render URL
```
5. Click **Deploy**
6. Your app will be live at `https://your-app.vercel.app`

### Update CORS Settings

After deployment, update `server/server.js`:
```javascript
const allowedOrigin = process.env.RENDER_CLIENT_URL || 'http://localhost:5173';
```

And set `RENDER_CLIENT_URL` in Render environment variables to your Vercel URL.

---

## 🚧 Deployment Status

| Service | Platform | Status | URL |
|---------|----------|--------|-----|
| Frontend | Vercel | ✅ Always On | [Live Demo](https://your-vercel-url.vercel.app) |
| Backend | Render | ⚠️ Free Tier (Spins Down) | [API](https://swasth-diet.onrender.com) |
| Database | MongoDB Atlas | ✅ Always On | Cloud Hosted |
| AI Service | Google Gemini | ✅ Free Tier Active | 1,500 req/day |

**Performance Notes:**
- First load after backend sleep: 30-60s
- Subsequent loads: 1-2s
- Consider upgrading Render to paid tier ($7/month) for instant responses

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration with validation
- [ ] User login with correct/incorrect credentials
- [ ] Profile creation and updates
- [ ] AI chat with various queries
- [ ] Regional recipe filtering
- [ ] Meal logging interface
- [ ] Progress tracking displays
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Future Testing Plans
```bash
# Install testing dependencies (planned)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests (planned)
npm test
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Make your changes
4. Commit: `git commit -m 'Add some AmazingFeature'`
5. Push: `git push origin feature/AmazingFeature`
6. Open a Pull Request

### Development Guidelines
- Follow existing code style (ESLint configuration provided)
- Write meaningful commit messages
- Test thoroughly before submitting PR
- Update documentation as needed
- Add comments for complex logic

### Code Style
- Use functional components with hooks
- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Use meaningful variable names
- Follow Tailwind utility-first approach

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR:** You can use, modify, and distribute this project freely with attribution.

---

## 👨‍💻 Author

**Sidbad12**
- GitHub: [@Sidbad12](https://github.com/Sidbad12)
- Project: [Swasth Bharat](https://github.com/Sidbad12/swasth-diet)

---

## 🙏 Acknowledgments

- **ICMR-NIN** for the Dietary Guidelines for Indians (2024)
- **National Institute of Nutrition** for IFCT 2017 data
- **Google Gemini** for AI capabilities and free tier
- **Lucide Icons** for the beautiful icon set
- **Tailwind CSS** community for styling inspiration
- **Render** and **Vercel** for free hosting tiers
- **MongoDB Atlas** for free database hosting

---

## 🐛 Known Issues & Roadmap

### Current Limitations
- ❌ PostgreSQL nutrition data integration incomplete (planned)
- ❌ Camera meal scanning feature (UI placeholder only)
- ❌ Community chat feature (coming soon)
- ❌ Meal log data persistence (in-memory only)
- ⚠️ Backend cold start delay on Render free tier (30-60s)

### Planned Features (v2.0)
- ✅ Advanced meal planning with weekly schedules
- ✅ Barcode scanning for packaged foods (using ML)
- ✅ Integration with fitness trackers (Google Fit, Apple Health)
- ✅ Push notifications for meal reminders
- ✅ Multilingual support (Hindi, Tamil, Bengali, Telugu, Marathi)
- ✅ Offline mode with background sync
- ✅ Voice input for hands-free meal logging
- ✅ Recipe video tutorials
- ✅ Social sharing features
- ✅ Export health reports as PDF

### Performance Improvements
- ✅ Implement Redis caching for API responses
- ✅ Add service worker for offline functionality
- ✅ Optimize images with Next.js Image component
- ✅ Implement lazy loading for heavy components
- ✅ Add pagination for recipe library

---

## 📞 Support & Contact

### Issues & Bugs
- **GitHub Issues**: [Create an issue](https://github.com/Sidbad12/swasth-diet/issues)
- Please include:
  - Description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots if applicable

### Feature Requests
- Open a GitHub issue with the `enhancement` label
- Describe the feature and its use case
- Explain why it would benefit users

### Questions
- Check existing issues first
- Create a new issue with the `question` label
- Email: [Contact via GitHub profile]

---

## ⚠️ Disclaimer

**Swasth Bharat** provides general nutritional information and should **not replace professional medical advice**. 

- Always consult with a certified healthcare provider or registered dietitian for personalized health guidance
- Especially important if you have existing medical conditions (diabetes, heart disease, etc.)
- AI recommendations are based on general guidelines and may not suit everyone
- Individual nutritional needs vary based on many factors
- Do not make major dietary changes without medical supervision

**This is a portfolio/educational project and not a substitute for professional healthcare.**

---

## 🌟 Star This Repo!

If you find this project helpful, please give it a ⭐ on GitHub! It helps:
- Others discover the project
- Motivates continued development
- Shows support for open-source health tech

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/Sidbad12/swasth-diet?style=social)
![GitHub forks](https://img.shields.io/github/forks/Sidbad12/swasth-diet?style=social)
![GitHub issues](https://img.shields.io/github/issues/Sidbad12/swasth-diet)
![GitHub license](https://img.shields.io/github/license/Sidbad12/swasth-diet)

---

**Made with ❤️ for a healthier India** 🇮🇳

**#SwasthBharat #DigitalIndia #HealthTech #OpenSource #NutritionAI**