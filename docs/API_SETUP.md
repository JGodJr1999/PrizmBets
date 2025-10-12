# PrizmBets - Live Sports Data Setup Guide

## Getting Real Live Sports Data

PrizmBets uses **The Odds API** for real-time sports betting data. By default, the app runs in **Demo Mode** with mock data.

### Quick Setup (5 minutes)

1. **Get Your Free API Key**
   - Visit [The Odds API](https://the-odds-api.com/)
   - Click "Get API Key" 
   - Sign up for free account
   - Copy your API key from the dashboard

2. **Configure SmartBets**
   - Open `backend/.env`
   - Find the line: `ODDS_API_KEY=demo_key_for_testing`
   - Replace with: `ODDS_API_KEY=your_actual_api_key_here`
   - Save the file

3. **Restart the Backend**
   - Stop the backend server (Ctrl+C)
   - Restart: `python fast_sports_server.py`

4. **Verify Live Data**
   - Visit Live Sports page
   - Demo Mode banner should disappear
   - You'll see real odds from actual sportsbooks!

### API Limits & Usage

**Free Tier Includes:**
- 10,000 requests per month
- Access to all sports
- Real-time odds from 200+ bookmakers
- Historical data access

**Typical Usage:**
- ~300 requests per day
- Each sport page load = 1 request
- Plenty for personal/development use

### Supported Sports

With a real API key, you get access to:
- **US Sports**: NFL, NBA, MLB, NHL, NCAAF, NCAAB, WNBA
- **Soccer**: Premier League, La Liga, Champions League, MLS
- **Combat**: UFC/MMA, Boxing
- **Tennis**: ATP, WTA tournaments
- **Golf**: PGA Tour events
- **And more!**

### Troubleshooting

**Still seeing Demo Mode?**
1. Check API key is correctly entered in `.env`
2. Make sure you restarted the backend server
3. Check browser console for errors
4. Verify API key is active on The Odds API dashboard

**API Errors?**
- Check your monthly quota hasn't exceeded
- Ensure API key has correct permissions
- Try the test endpoint: `https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_KEY`

### Development Tips

1. **Cache is Your Friend**: SmartBets caches data for 5 minutes to save API calls
2. **Use Demo Mode**: Perfect for development without using quota
3. **Monitor Usage**: Check your dashboard at the-odds-api.com

### Need Help?

- API Documentation: https://the-odds-api.com/liveapi/guides/v4/
- SmartBets Issues: Create an issue on GitHub
- API Support: support@the-odds-api.com

---

*Note: SmartBets 2.0 is not affiliated with The Odds API. We're just happy customers!*