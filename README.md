# SmartBets 2.0 - AI-Powered Sports Betting Intelligence

A secure, full-stack sports betting intelligence platform that uses AI to evaluate parlays and provide smart betting recommendations.

## 🎯 Features

- **AI Parlay Evaluation**: Advanced algorithms analyze bet combinations using historical data and trends
- **Risk Assessment**: Detailed risk factors and confidence levels for each bet
- **Odds Comparison**: Find the best odds across multiple sportsbooks (coming soon)
- **Smart Recommendations**: Actionable insights and betting strategy recommendations
- **Secure Architecture**: Built with security best practices from the ground up

## 🏗️ Architecture

### Backend (Python + Flask)
- **Secure API**: Input validation, CORS protection, rate limiting
- **Modular Structure**: Separate services for AI, odds comparison, and analytics
- **Configuration Management**: Environment-based settings with security focus

### Frontend (React)
- **Modern UI**: Dark theme inspired by PickFinder with responsive design
- **Real-time Evaluation**: Instant AI analysis with loading states and error handling
- **Type Safety**: Input validation and sanitization on the client side

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the development server:
```bash
python run.py
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🔒 Security Features

- **Input Sanitization**: All user inputs are validated and sanitized
- **CORS Protection**: Configured for specific allowed origins
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Security Headers**: Comprehensive security headers on all responses
- **Environment Configuration**: Sensitive data stored in environment variables
- **Error Handling**: Secure error messages that don't expose internal details

## 📁 Project Structure

```
SmartBets2.0/
├── backend/
│   ├── app/
│   │   ├── config/         # Configuration management
│   │   ├── models/         # Data models (future)
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities and validation
│   ├── migrations/         # Database migrations (future)
│   ├── tests/             # Backend tests (future)
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # Styled components and themes
│   │   └── utils/         # Frontend utilities
│   └── package.json
└── README.md
```

## 🤖 AI Evaluation

The AI evaluator currently provides:
- **Individual Bet Analysis**: Score and explanation for each bet
- **Overall Parlay Score**: Combined intelligence rating
- **Risk Assessment**: Identification of potential risk factors
- **Confidence Levels**: High/Medium/Low confidence ratings
- **Betting Recommendations**: Clear actionable advice

*Note: Current implementation uses sophisticated placeholder logic. Production version will integrate with real ML models and historical data.*

## 🔮 Future Enhancements

### Planned Features
- **User Authentication**: JWT-based user sessions and profiles
- **Real Odds Integration**: Live odds from major sportsbooks
- **Historical Tracking**: Save and analyze past parlays
- **Advanced Analytics**: User performance metrics and trends
- **Mobile App**: React Native mobile application
- **Social Features**: Share and compare parlays with friends

### Technical Roadmap
- **Database Integration**: PostgreSQL with SQLAlchemy ORM
- **ML Pipeline**: TensorFlow/PyTorch models for bet analysis
- **Real-time Updates**: WebSocket connections for live odds
- **Microservices**: Split services for scalability
- **Docker Deployment**: Containerized deployment with Docker Compose

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📊 API Documentation

### POST /api/evaluate
Evaluate a parlay using AI analysis.

**Request Body:**
```json
{
  "bets": [
    {
      "team": "Lakers",
      "odds": -110,
      "bet_type": "moneyline", 
      "amount": 25.00,
      "sportsbook": "draftkings"
    }
  ],
  "total_amount": 100.00,
  "user_notes": "Confident in this parlay"
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "overall_score": 0.75,
    "confidence": "High",
    "recommendation": "RECOMMENDED - Strong value opportunity",
    "individual_bet_scores": [...],
    "risk_factors": [...],
    "best_odds_suggestion": {...}
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is for educational and informational purposes only. It does not constitute financial or betting advice. Users should gamble responsibly and within their means.

---

**Built with ❤️ for smarter sports betting**