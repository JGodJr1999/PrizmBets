# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Claude.MD rules:

Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md.
2. The plan should have a list of todo 1items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Development Commands

### Backend (Flask/Python)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip3 install -r requirements.txt
python3 run.py  # Starts development server on port 5001
```

### Frontend (React)
```bash
cd frontend
npm install
npm start      # Development server on port 3000
npm run build  # Production build
npm test       # Run tests
```

### Testing
- Backend: `cd backend && python3 -m pytest tests/`
- Frontend: `cd frontend && npm test`
- Email System: `cd backend && python3 test_email_system.py`
- Admin Dashboard: `cd backend && python3 test_admin_dashboard.py`

## Architecture Overview

Prizm Bets is a full-stack sports betting management platform with a Flask backend and React frontend.

### Backend Structure (`backend/`)
- **Flask API**: Main server runs on port 5001 with CORS configured for frontend
- **Configuration**: Environment-based settings in `app/config/settings.py` with security focus
- **Free Tier System**: `app/services/tier_service.py` - Usage limits and subscription management
- **Email System**: `app/services/email_service.py` - User communications and notifications
- **Admin Dashboard**: `app/services/admin_service.py` - System monitoring and user management
- **AI Service**: `app/services/ai_evaluator.py` - Core parlay evaluation logic
- **Modular Design**: Services separated by concern (AI, odds, analytics, tiers, email)
- **Security**: Input validation, rate limiting, CORS protection, secure headers, admin controls

### Frontend Structure (`frontend/`)
- **React 18**: Modern React with functional components and hooks
- **Styled Components**: CSS-in-JS styling with dark theme
- **API Integration**: Axios client with interceptors for error handling
- **Component Architecture**: Organized by feature (Parlay, Results, Layout)

### Key Integration Points
- **API Endpoint**: `POST /api/evaluate` - Main parlay evaluation with tier checking
- **Admin Dashboard**: `GET /api/admin/dashboard` - System monitoring and analytics  
- **Email System**: `POST /api/email/test-email` - User communication management
- **Tier Management**: `GET /api/usage` - Usage tracking and limits
- **Proxy Configuration**: Frontend proxies API calls to `http://localhost:5001`
- **Data Flow**: React form → Tier validation → AI evaluation → Results display → Usage tracking

### Security Implementation
- Backend validates all inputs using marshmallow schemas
- CORS configured for specific origins only
- Rate limiting on API endpoints
- Secure cookie settings and headers
- Environment variables for sensitive configuration
- Admin role-based access control
- Email security with recipient limits and validation
- JWT token management with session tracking
- SQL injection prevention and input sanitization

### Current System Features
**Free Tier System:**
- 3 daily parlay evaluations for free users
- 10 daily odds comparisons for free users
- Automatic usage tracking and limits
- Email notifications at 80% and 100% usage
- Upgrade prompts and tier management

**Admin Dashboard:**
- User analytics and system monitoring
- Usage trends and revenue metrics
- Admin controls for user management
- Email campaign management

**Email Communications:**
- Welcome emails for new registrations
- Usage limit notifications
- Engagement emails for inactive users
- Upgrade promotion campaigns

**AI Evaluation Logic:**
- Individual bet scoring with explanations
- Overall parlay score calculation with correlation effects
- Risk factor assessment
- Confidence levels and recommendations
- Sportsbook suggestions

*Note: Current AI is sophisticated placeholder logic - designed for future ML model integration*

### Development Notes
- **Platform**: macOS development environment
- **Backend**: Flask development server on port 5001 (not suitable for production)
- **Frontend**: React development server on port 3000 with hot reload
- **Database**: SQLite for development (PostgreSQL for production)
- **Email**: Development mode suppresses email sending (configured in settings)
- **Environment**: Configure variables via `.env` files (see `.env.example`)
- **Testing**: Comprehensive test suites for all major components
- **API Structure**: RESTful endpoints with consistent JSON responses
- **Security**: All endpoints include authentication and input validation

### Production Readiness Status
- ✅ Free tier system with usage tracking
- ✅ Admin dashboard with monitoring
- ✅ Email system with user communications  
- ✅ Security audit completed
- 🔄 Production configuration (in progress)
- ⏳ Domain propagation pending (prizmbets.app)