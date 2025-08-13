# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Claude.MD rules:

Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Development Commands

### Backend (Flask/Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py  # Starts development server on port 5001
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
- Backend: `cd backend && python -m pytest tests/`
- Frontend: `cd frontend && npm test`

## Architecture Overview

Prizm Bets is a full-stack sports betting management platform with a Flask backend and React frontend.

### Backend Structure (`backend/`)
- **Flask API**: Main server runs on port 5001 with CORS configured for frontend
- **Configuration**: Environment-based settings in `app/config/settings.py` with security focus
- **AI Service**: `app/services/ai_evaluator.py` - Core parlay evaluation logic (currently sophisticated placeholder)
- **Modular Design**: Services separated by concern (AI, odds, analytics)
- **Security**: Input validation, rate limiting, CORS protection, secure headers

### Frontend Structure (`frontend/`)
- **React 18**: Modern React with functional components and hooks
- **Styled Components**: CSS-in-JS styling with dark theme
- **API Integration**: Axios client with interceptors for error handling
- **Component Architecture**: Organized by feature (Parlay, Results, Layout)

### Key Integration Points
- **API Endpoint**: `POST /api/evaluate` - Main parlay evaluation
- **Proxy Configuration**: Frontend proxies API calls to `http://localhost:5001`
- **Data Flow**: React form → API validation → AI evaluation → Results display

### Security Implementation
- Backend validates all inputs using marshmallow schemas
- CORS configured for specific origins only
- Rate limiting on API endpoints
- Secure cookie settings and headers
- Environment variables for sensitive configuration

### Current AI Evaluation Logic
The `AIEvaluator` class provides:
- Individual bet scoring with explanations
- Overall parlay score calculation with correlation effects
- Risk factor assessment
- Confidence levels and recommendations
- Sportsbook suggestions

*Note: Current AI is sophisticated placeholder logic - designed for future ML model integration*

### Development Notes
- Backend uses Flask development server (not suitable for production)
- Frontend has hot reload enabled
- Both services must run simultaneously for full functionality
- Environment variables should be configured via `.env` files
- API responses are structured for easy frontend consumption