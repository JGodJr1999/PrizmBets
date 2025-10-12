# PrizmBets - Complete Sports Betting Management Platform

A comprehensive sports betting platform that allows users to import, track, and analyze all their betting data from every sportsbook in one centralized location.

## 🎯 Features

- **Data Import & Upload**: Support for all major sportsbooks with CSV/Excel file import
- **Portfolio Management**: Track all your bets across multiple sportsbooks in one place
- **Advanced Analytics**: Comprehensive analysis of betting performance with detailed insights
- **Live Sports Data**: Real-time sports data, odds, and statistics for informed decisions
- **User Dashboard**: Centralized view of betting history, performance, and analytics
- **Secure Architecture**: Built with security best practices from the ground up

## 🏗️ Architecture

### Backend (Python + Flask)
- **Secure API**: Input validation, CORS protection, rate limiting
- **Modular Structure**: Separate services for data processing, analytics, and live sports
- **Configuration Management**: Environment-based settings with security focus

### Frontend (React)
- **Modern UI**: Professional dark theme with gold accents and responsive design
- **Data Management**: Intuitive upload and management of betting data
- **Real-time Analytics**: Instant performance analysis with loading states and error handling
- **User Experience**: Clean navigation with animated components using Framer Motion

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

The API will be available at `http://localhost:5001`

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
PrizmBets/
├── backend/
│   ├── app/
│   │   ├── config/         # Configuration management
│   │   ├── models/         # Data models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── agents/         # AI agents and automation
│   │   └── utils/          # Utilities and validation
│   ├── migrations/         # Database migrations
│   ├── tests/             # Backend tests
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # Styled components and themes
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Frontend utilities
│   └── package.json
└── README.md
```

## 📊 Data Management

PrizmBets supports data import from all major sportsbooks:

### Supported Sportsbooks
- DraftKings
- FanDuel  
- BetMGM
- Caesars
- PointsBet
- Barstool
- WynnBET
- BetRivers
- Unibet
- ESPN BET

### Data Processing Features
- **Automated Processing**: CSV/Excel files are automatically parsed and validated
- **Data Validation**: Ensures accuracy and consistency of imported data
- **Historical Integration**: Seamlessly merge data from multiple time periods
- **Statistics Generation**: Automatic calculation of win rates, ROI, and other metrics

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

### POST /api/upload-data
Upload betting data for processing.

**Request:** Multipart form data with CSV/Excel files

**Response:**
```json
{
  "success": true,
  "processed_data": {
    "total_bets": 150,
    "total_winnings": 2500.00,
    "win_rate": 65.5,
    "avg_bet_size": 45.00
  }
}
```

## 🚀 Deployment

### Firebase Hosting
The app is deployed on Firebase Hosting with automatic SSL and global CDN.

```bash
# Build the frontend
cd frontend && npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

**Live URL**: [https://prizmbets.app](https://prizmbets.app)

## 🔮 Future Enhancements

### Planned Features
- **Real-time Notifications**: Alerts for significant changes in betting patterns
- **Advanced Filtering**: Filter and search betting history by various criteria
- **Export Functionality**: Export data for tax purposes and external analysis
- **Social Features**: Share insights and compare performance with friends
- **Mobile App**: React Native mobile application

### Technical Roadmap
- **Enhanced Analytics**: Machine learning models for performance prediction
- **API Integrations**: Direct integration with sportsbook APIs
- **Real-time Updates**: WebSocket connections for live data streaming
- **Microservices**: Split services for improved scalability
- **Docker Deployment**: Containerized deployment with Docker Compose

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is for data management and analytical purposes only. It does not constitute financial or betting advice. Users should gamble responsibly and within their means.

---

**Built with ❤️ for smarter betting management**