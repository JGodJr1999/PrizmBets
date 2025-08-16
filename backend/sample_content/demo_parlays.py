"""
Demo Parlay Examples for PrizmBets
Sample betting scenarios with AI analysis to showcase platform capabilities
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any

class DemoParlay:
    """Sample parlay with AI analysis explanation"""
    
    def __init__(self, title: str, description: str, bets: List[Dict], 
                 analysis: Dict, risk_level: str, confidence: float):
        self.title = title
        self.description = description
        self.bets = bets
        self.analysis = analysis
        self.risk_level = risk_level
        self.confidence = confidence
        self.created_at = datetime.now()

# Demo Parlay Examples
DEMO_PARLAYS = [
    DemoParlay(
        title="Conservative NFL Sunday Favorites",
        description="A low-risk parlay focusing on heavy favorites in prime matchups",
        bets=[
            {
                "sport": "NFL",
                "game": "Buffalo Bills vs Miami Dolphins",
                "bet_type": "moneyline",
                "selection": "Buffalo Bills",
                "odds": -280,
                "reasoning": "Bills at home against division rival, strong rushing attack"
            },
            {
                "sport": "NFL", 
                "game": "Kansas City Chiefs vs Denver Broncos",
                "bet_type": "spread",
                "selection": "Chiefs -7.5",
                "odds": -110,
                "reasoning": "Chiefs favored by touchdown+ with Mahomes at home"
            },
            {
                "sport": "NFL",
                "game": "San Francisco 49ers vs Arizona Cardinals", 
                "bet_type": "total",
                "selection": "Over 47.5",
                "odds": -105,
                "reasoning": "Both teams prefer high-scoring offensive games"
            }
        ],
        analysis={
            "overall_score": 7.2,
            "risk_factors": [
                "Division games can be unpredictable",
                "Weather could affect totals",
                "Injury reports pending"
            ],
            "positive_factors": [
                "All teams coming off bye weeks",
                "Historical head-to-head favors selections",
                "Vegas line movement supports picks"
            ],
            "correlation_analysis": {
                "score": 6.8,
                "explanation": "Low negative correlation between selections - independent outcomes"
            },
            "value_assessment": {
                "expected_value": "+2.4%",
                "explanation": "Slight edge over book odds based on model projections"
            },
            "recommendations": [
                "Consider reducing stake on total bet",
                "Monitor weather forecasts before kickoff",
                "Strong play for conservative bettors"
            ]
        },
        risk_level="Low",
        confidence=0.72
    ),
    
    DemoParlay(
        title="High-Value NBA Player Props",
        description="Advanced analytics-driven player performance bets",
        bets=[
            {
                "sport": "NBA",
                "game": "Lakers vs Celtics",
                "bet_type": "player_prop",
                "selection": "LeBron James Over 7.5 Assists",
                "odds": +105,
                "reasoning": "Facing zone defense that creates assist opportunities"
            },
            {
                "sport": "NBA",
                "game": "Warriors vs Nuggets", 
                "bet_type": "player_prop",
                "selection": "Stephen Curry Over 4.5 Three-Pointers",
                "odds": -120,
                "reasoning": "Nuggets rank 28th in three-point defense"
            },
            {
                "sport": "NBA",
                "game": "Bucks vs Heat",
                "bet_type": "player_prop", 
                "selection": "Giannis Antetokounmpo Over 11.5 Rebounds",
                "odds": -110,
                "reasoning": "Heat missing key rebounders, pace favors Giannis"
            }
        ],
        analysis={
            "overall_score": 8.4,
            "risk_factors": [
                "Player props subject to rest/rotation",
                "Blowout games reduce playing time",
                "Foul trouble could limit minutes"
            ],
            "positive_factors": [
                "All players in contract years (motivated)",
                "Favorable matchups based on defensive rankings",
                "Props historically hit at high rates vs these teams"
            ],
            "correlation_analysis": {
                "score": 8.1,
                "explanation": "Independent games with no correlation risk"
            },
            "value_assessment": {
                "expected_value": "+8.7%",
                "explanation": "Significant edge identified through advanced metrics"
            },
            "recommendations": [
                "Excellent value play for experienced bettors",
                "Monitor injury reports 2 hours before games",
                "Consider individual bets if parlay odds concern you"
            ]
        },
        risk_level="Medium",
        confidence=0.84
    ),
    
    DemoParlay(
        title="Contrarian College Football Special",
        description="Going against public betting trends with analytical edge",
        bets=[
            {
                "sport": "NCAAF",
                "game": "Alabama vs Auburn (Iron Bowl)",
                "bet_type": "spread",
                "selection": "Auburn +14.5", 
                "odds": -108,
                "reasoning": "Rivalry game, Alabama overvalued, Auburn desperate"
            },
            {
                "sport": "NCAAF",
                "game": "Ohio State vs Michigan",
                "bet_type": "total",
                "selection": "Under 58.5",
                "odds": -115,
                "reasoning": "Weather forecast shows wind/rain, defensive focus"
            },
            {
                "sport": "NCAAF", 
                "game": "Georgia vs Florida",
                "bet_type": "moneyline",
                "selection": "Florida +220",
                "odds": +220,
                "reasoning": "Florida at home, Georgia looking ahead to SEC Championship"
            }
        ],
        analysis={
            "overall_score": 6.9,
            "risk_factors": [
                "High public betting percentage against picks",
                "Rivalry games inherently unpredictable", 
                "Weather conditions could change"
            ],
            "positive_factors": [
                "Sharp money supports all selections",
                "Historical data favors contrarian approach",
                "Line movement indicates value"
            ],
            "correlation_analysis": {
                "score": 7.2,
                "explanation": "No direct correlation, but all contrarian plays"
            },
            "value_assessment": {
                "expected_value": "+12.3%",
                "explanation": "High value due to public bias creating line inefficiencies"
            },
            "recommendations": [
                "For experienced bettors comfortable with contrarian approach",
                "Consider smaller stake due to variance",
                "Strong analytical support despite public sentiment"
            ]
        },
        risk_level="High", 
        confidence=0.69
    ),

    DemoParlay(
        title="Soccer Multi-League Value Hunter",
        description="International soccer betting with market inefficiencies",
        bets=[
            {
                "sport": "Soccer",
                "game": "Manchester City vs Liverpool (Premier League)",
                "bet_type": "total_goals",
                "selection": "Over 2.5 Goals",
                "odds": -130,
                "reasoning": "Two high-scoring teams, historical avg 3.2 goals"
            },
            {
                "sport": "Soccer",
                "game": "Real Madrid vs Barcelona (La Liga)",
                "bet_type": "both_teams_score",
                "selection": "Yes",
                "odds": -145,
                "reasoning": "El Clasico typically features goals from both sides"
            },
            {
                "sport": "Soccer",
                "game": "Bayern Munich vs Borussia Dortmund (Bundesliga)",
                "bet_type": "asian_handicap",
                "selection": "Bayern -1.0",
                "odds": -108,
                "reasoning": "Bayern at home, Dortmund inconsistent away form"
            }
        ],
        analysis={
            "overall_score": 7.8,
            "risk_factors": [
                "Soccer inherently lower-scoring than other sports",
                "Red cards can drastically change games",
                "Different leagues have varying styles"
            ],
            "positive_factors": [
                "All marquee matchups with attacking intent",
                "Historical trends strongly support selections",
                "Market inefficiencies in international betting"
            ],
            "correlation_analysis": {
                "score": 8.5,
                "explanation": "Independent leagues, no correlation between outcomes"
            },
            "value_assessment": {
                "expected_value": "+6.8%",
                "explanation": "Good value from combining efficient markets"
            },
            "recommendations": [
                "Solid play for soccer betting enthusiasts",
                "Consider live betting if games start conservatively",
                "Monitor team news for late scratches"
            ]
        },
        risk_level="Medium",
        confidence=0.78
    ),

    DemoParlay(
        title="MLB Playoff Pitcher's Duel",
        description="Postseason baseball betting focused on starting pitching",
        bets=[
            {
                "sport": "MLB",
                "game": "Dodgers vs Padres (NLDS Game 3)",
                "bet_type": "total",
                "selection": "Under 7.5 Runs",
                "odds": -105,
                "reasoning": "Two ace pitchers, playoff atmosphere tightens offense"
            },
            {
                "sport": "MLB",
                "game": "Astros vs Yankees (ALCS Game 2)", 
                "bet_type": "first_5_innings",
                "selection": "Under 4.5 Runs",
                "odds": +110,
                "reasoning": "Playoff baseball, starters go deeper, bullpens rested"
            },
            {
                "sport": "MLB",
                "game": "Braves vs Phillies (NLDS Game 4)",
                "bet_type": "moneyline",
                "selection": "Braves -125",
                "odds": -125,
                "reasoning": "Better starting pitcher, home field advantage"
            }
        ],
        analysis={
            "overall_score": 8.1,
            "risk_factors": [
                "One big inning can break totals",
                "Playoff pressure affects some players differently",
                "Weather delays can impact pitching"
            ],
            "positive_factors": [
                "Playoff baseball historically lower-scoring",
                "All starting pitchers have strong playoff records",
                "Bullpens well-rested in all series"
            ],
            "correlation_analysis": {
                "score": 7.9,
                "explanation": "Similar game scripts but independent outcomes"
            },
            "value_assessment": {
                "expected_value": "+5.4%",
                "explanation": "Market undervalues playoff pitching performance"
            },
            "recommendations": [
                "Excellent for playoff baseball specialists",
                "Weather could be factor - monitor forecasts",
                "Strong analytical foundation for all picks"
            ]
        },
        risk_level="Medium-Low",
        confidence=0.81
    )
]

def get_demo_parlay(index: int = None) -> DemoParlay:
    """Get a specific demo parlay or random one"""
    if index is not None and 0 <= index < len(DEMO_PARLAYS):
        return DEMO_PARLAYS[index]
    
    import random
    return random.choice(DEMO_PARLAYS)

def get_all_demo_parlays() -> List[DemoParlay]:
    """Get all demo parlays"""
    return DEMO_PARLAYS

def format_demo_parlay_for_api(parlay: DemoParlay) -> Dict[str, Any]:
    """Format demo parlay for API response"""
    return {
        "title": parlay.title,
        "description": parlay.description,
        "bets": parlay.bets,
        "analysis": {
            "overall_score": parlay.analysis["overall_score"],
            "confidence": parlay.confidence,
            "risk_level": parlay.risk_level,
            "risk_factors": parlay.analysis["risk_factors"],
            "positive_factors": parlay.analysis["positive_factors"],
            "correlation_analysis": parlay.analysis["correlation_analysis"],
            "value_assessment": parlay.analysis["value_assessment"],
            "recommendations": parlay.analysis["recommendations"]
        },
        "ai_insights": {
            "primary_strength": f"This parlay's strength lies in {parlay.analysis['positive_factors'][0].lower()}",
            "key_risk": f"Main concern: {parlay.analysis['risk_factors'][0].lower()}",
            "betting_strategy": f"Best suited for {parlay.risk_level.lower()}-risk bettors",
            "confidence_explanation": f"AI confidence of {parlay.confidence:.0%} based on {len(parlay.analysis['positive_factors'])} positive factors vs {len(parlay.analysis['risk_factors'])} risk factors"
        },
        "educational_notes": {
            "what_is_correlation": "Correlation measures how one bet's outcome affects another. Lower correlation = better diversification.",
            "expected_value_explained": "Expected value shows long-term profit/loss. Positive EV means profitable over many bets.",
            "risk_management": f"This {parlay.risk_level.lower()}-risk parlay should represent appropriate portion of your bankroll.",
            "ai_analysis_process": "Our AI considers 50+ factors including team stats, weather, injuries, betting market movements, and historical patterns."
        },
        "metadata": {
            "created_at": parlay.created_at.isoformat(),
            "sport_count": len(set(bet["sport"] for bet in parlay.bets)),
            "bet_count": len(parlay.bets),
            "demo_type": "sample_analysis"
        }
    }

# Educational betting scenarios
BETTING_SCENARIOS = [
    {
        "scenario": "The Sharp Bettor's Approach",
        "description": "How professional bettors identify value and manage risk",
        "example": {
            "situation": "Line moves from -3 to -1.5 after sharp money hits the underdog",
            "analysis": "This reverse line movement indicates smart money disagrees with public perception",
            "action": "Consider the underdog bet as the line movement suggests value",
            "lesson": "Follow the smart money, not the public"
        }
    },
    {
        "scenario": "Weather Impact Analysis", 
        "description": "How weather conditions affect betting decisions",
        "example": {
            "situation": "NFL game with 25+ mph winds and rain forecast",
            "analysis": "Passing games suffer, field goals become difficult, scoring decreases",
            "action": "Bet the under on totals, avoid player passing props",
            "lesson": "Weather is often undervalued by casual bettors"
        }
    },
    {
        "scenario": "Injury News Reaction",
        "description": "Properly evaluating the impact of key player injuries",
        "example": {
            "situation": "Star quarterback ruled out 2 hours before game",
            "analysis": "Line will move, but backup QB may be undervalued in specific situations",
            "action": "Quick analysis of backup's strengths vs opponent's weaknesses",
            "lesson": "Late injury news creates opportunity if you're prepared"
        }
    }
]