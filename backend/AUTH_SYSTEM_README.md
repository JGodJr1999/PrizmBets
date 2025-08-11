# SmartBets 2.0 Authentication System

A comprehensive user authentication and database system for the SmartBets sports betting intelligence platform.

## 🚀 Features

### Authentication & Security
- **JWT-based authentication** with access and refresh tokens
- **Secure password hashing** using PBKDF2 with salt
- **Session management** with device tracking and automatic cleanup
- **Multi-device support** with session limits per user
- **Suspicious activity detection** and IP tracking
- **Password strength validation** with security requirements
- **Email verification** system (framework ready)
- **Password reset** functionality (framework ready)

### Database Architecture
- **SQLAlchemy ORM** with Flask-Migrate for schema management
- **PostgreSQL** for production, SQLite for development
- **Optimized indexes** for performance
- **JSON fields** for flexible data storage
- **Relationship management** with cascade deletes
- **Audit trails** with created/updated timestamps

### User Management
- **User profiles** with preferences and settings
- **Subscription tiers** (free, premium, pro)
- **Betting history** tracking with AI evaluations
- **Parlay management** with detailed analytics
- **Role-based access control** decorators

## 📁 File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py          # Model exports
│   │   ├── user.py              # User, UserProfile, BettingHistory, UserSession
│   │   └── parlay.py            # Parlay model
│   ├── routes/
│   │   ├── api.py               # Existing API routes
│   │   └── auth.py              # Authentication endpoints
│   ├── utils/
│   │   ├── validation.py        # Existing validation utilities
│   │   ├── auth_validation.py   # Authentication validation schemas
│   │   ├── jwt_utils.py         # JWT token management
│   │   └── auth_decorators.py   # Authentication decorators
│   ├── config/
│   │   └── settings.py          # Updated with JWT and DB config
│   └── __init__.py              # Updated Flask app factory
├── migrations/                  # Database migrations (auto-generated)
├── init_db.py                   # Database initialization script
├── test_auth.py                 # Authentication system tests
├── database_schema.sql          # Complete SQL schema
├── requirements.txt             # Updated dependencies
└── AUTH_SYSTEM_README.md        # This file
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///dev_smartbets.db  # Development
# DATABASE_URL=postgresql://user:pass@localhost/smartbets  # Production

# Security Keys
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Email settings for verification
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 3. Initialize Database

```bash
python init_db.py
```

This will:
- Create the database tables
- Set up migrations
- Create a test user account

### 4. Start the Server

```bash
python run.py
```

### 5. Test the System

```bash
python test_auth.py
```

## 📚 API Endpoints

### Authentication Routes (`/api/auth/`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/register` | Register new user | None |
| POST | `/login` | Login user | None |
| POST | `/refresh` | Refresh access token | Refresh Token |
| GET | `/me` | Get current user info | Access Token |
| POST | `/logout` | Logout current session | Access Token |
| POST | `/logout-all` | Logout all sessions | Access Token |
| PUT | `/profile` | Update user profile | Access Token |
| POST | `/change-password` | Change password | Access Token |
| GET | `/sessions` | Get user sessions | Access Token |
| DELETE | `/sessions/{id}` | Revoke specific session | Access Token |

### Registration

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!",
  "name": "John Doe",
  "terms_accepted": true,
  "marketing_emails": false
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "remember_me": true
}
```

### Using Access Tokens

```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

## 🔐 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not a common weak password

### Token Management
- **Access tokens**: Short-lived (1 hour), for API access
- **Refresh tokens**: Long-lived (30 days), for token renewal
- **Token blacklisting**: Revoked tokens are tracked
- **Session limits**: Maximum 5 active sessions per user
- **Automatic cleanup**: Expired sessions are automatically removed

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

## 🗄️ Database Models

### User Model
```python
class User(db.Model):
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    subscription_tier = Column(String(50), default='free')
    created_at = Column(DateTime, default=datetime.utcnow)
    # ... additional fields
```

### UserProfile Model
```python
class UserProfile(db.Model):
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    timezone = Column(String(50), default='UTC')
    favorite_sports = Column(JSON, default=list)
    preferred_sportsbooks = Column(JSON, default=list)
    default_bet_amount = Column(Numeric(10, 2), default=10.00)
    risk_tolerance = Column(String(20), default='medium')
    # ... additional fields
```

### BettingHistory Model
```python
class BettingHistory(db.Model):
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    parlay_data = Column(JSON, nullable=False)
    ai_evaluation = Column(JSON, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    actual_result = Column(String(20))  # win, loss, push, pending
    confidence_score = Column(Numeric(5, 2))
    # ... additional fields
```

## 🎛️ Authentication Decorators

### Basic Authentication
```python
from app.utils.auth_decorators import auth_required

@app.route('/protected')
@auth_required()
def protected_route():
    user = get_current_user()
    return {'user_id': user.id}
```

### Subscription Requirements
```python
from app.utils.auth_decorators import subscription_required

@app.route('/premium-feature')
@subscription_required('premium')
def premium_feature():
    # Only premium+ users can access
    return {'feature': 'premium_data'}
```

### Email Verification Required
```python
from app.utils.auth_decorators import verified_user_required

@app.route('/verified-only')
@verified_user_required()
def verified_only():
    # Only verified users can access
    return {'message': 'verified user content'}
```

## 🧪 Testing

### Manual Testing
```bash
# Test the authentication system
python test_auth.py
```

### Using curl
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirm_password": "TestPassword123!",
    "name": "Test User",
    "terms_accepted": true
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

## 🔄 Database Migrations

### Create Migration
```bash
flask db migrate -m "Description of changes"
```

### Apply Migration
```bash
flask db upgrade
```

### Rollback Migration
```bash
flask db downgrade
```

## 🚀 Production Deployment

### Environment Setup
1. Set production environment variables
2. Use PostgreSQL database
3. Configure SSL/HTTPS
4. Set up email service for verification
5. Configure monitoring and logging

### Security Checklist
- [ ] Change default secret keys
- [ ] Use HTTPS in production
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerting
- [ ] Review CORS settings
- [ ] Enable email verification
- [ ] Set up log aggregation

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```
Solution: Check DATABASE_URL in .env file
```

**Token Verification Failed**
```
Solution: Check JWT_SECRET_KEY matches between requests
```

**Migration Errors**
```
Solution: Delete migrations folder and run init_db.py again
```

### Logs
Check application logs for detailed error information:
```bash
tail -f logs/smartbets.log
```

## 📈 Performance Optimization

### Database Indexes
All critical queries are optimized with appropriate indexes:
- User email lookups
- Session token validation
- Betting history queries
- Parlay searches

### Connection Pooling
SQLAlchemy is configured with connection pooling:
- `pool_pre_ping`: True
- `pool_recycle`: 300 seconds
- `pool_timeout`: 30 seconds
- `max_overflow`: 10 connections

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure security best practices

## 📄 License

This authentication system is part of the SmartBets 2.0 project.

---

**Note**: This system provides a solid foundation for user authentication with room for extension. Consider adding features like:
- Two-factor authentication (2FA)
- OAuth integration (Google, Facebook)
- Advanced rate limiting
- Audit logging
- Admin dashboard
- Email verification workflows