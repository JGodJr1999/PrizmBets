"""
Interactive Tutorial System for PrizmBets
Step-by-step guides to help users understand AI betting analysis
"""

from typing import Dict, List, Any
from enum import Enum

class TutorialStep:
    """Individual step in a tutorial"""
    
    def __init__(self, title: str, content: str, action: str = None, 
                 visual_aid: str = None, tips: List[str] = None):
        self.title = title
        self.content = content
        self.action = action  # What user should do
        self.visual_aid = visual_aid  # UI element to highlight
        self.tips = tips or []

class Tutorial:
    """Complete tutorial with multiple steps"""
    
    def __init__(self, id: str, title: str, description: str, 
                 difficulty: str, duration: str, steps: List[TutorialStep]):
        self.id = id
        self.title = title
        self.description = description
        self.difficulty = difficulty
        self.duration = duration
        self.steps = steps

# Tutorial Definitions
TUTORIALS = [
    Tutorial(
        id="getting-started",
        title="Getting Started with PrizmBets AI",
        description="Learn the basics of AI-powered sports betting analysis",
        difficulty="Beginner",
        duration="5 minutes",
        steps=[
            TutorialStep(
                title="Welcome to PrizmBets",
                content="PrizmBets uses artificial intelligence to analyze sports bets and provide data-driven insights. Our AI considers over 50 factors to evaluate your betting decisions.",
                action="Click 'Start Analysis' to begin",
                visual_aid="start-button",
                tips=[
                    "AI analysis works best with multiple data points",
                    "Always consider AI insights alongside your own research",
                    "Start with our demo parlays to see how it works"
                ]
            ),
            TutorialStep(
                title="Understanding AI Scores",
                content="Our AI provides scores from 1-10 for each bet. Scores above 7 indicate strong confidence, 5-7 are moderate, and below 5 suggest caution.",
                action="Look at the score explanation panel",
                visual_aid="score-display",
                tips=[
                    "Higher scores don't guarantee wins",
                    "Consider the reasoning behind scores",
                    "Combine multiple moderate scores rather than chasing high scores"
                ]
            ),
            TutorialStep(
                title="Reading Risk Factors",
                content="Every analysis includes risk factors - potential issues that could affect your bet. Pay close attention to these warnings.",
                action="Review the risk factors section",
                visual_aid="risk-panel",
                tips=[
                    "Weather and injuries are common risk factors",
                    "Market movement can indicate insider information",
                    "Rivalry games often have additional unpredictability"
                ]
            ),
            TutorialStep(
                title="Correlation Analysis",
                content="When building parlays, our AI checks if your bets are correlated. Lower correlation means better diversification and risk management.",
                action="Add multiple bets to see correlation analysis",
                visual_aid="correlation-meter",
                tips=[
                    "Avoid betting team totals with game totals (highly correlated)",
                    "Different sports/leagues have lower correlation",
                    "Player props from same game are often correlated"
                ]
            ),
            TutorialStep(
                title="Your First Analysis",
                content="Now try creating your own parlay! Add 2-3 bets and see how our AI evaluates your selections.",
                action="Create a parlay with your own picks",
                visual_aid="parlay-builder",
                tips=[
                    "Start simple with moneyline or spread bets",
                    "Mix different sports for better diversification",
                    "Pay attention to the overall confidence rating"
                ]
            )
        ]
    ),
    
    Tutorial(
        id="advanced-analysis",
        title="Advanced AI Analysis Features",
        description="Deep dive into sophisticated betting analysis tools",
        difficulty="Intermediate", 
        duration="8 minutes",
        steps=[
            TutorialStep(
                title="Expected Value (EV) Calculations",
                content="Expected Value shows the theoretical profit/loss of a bet over many repetitions. Positive EV means profitable long-term, negative EV means losing.",
                action="Look for EV percentages in analysis results",
                visual_aid="ev-display",
                tips=[
                    "Focus on bets with positive expected value",
                    "Small positive EV can be profitable over time",
                    "EV is theoretical - variance still matters"
                ]
            ),
            TutorialStep(
                title="Market Movement Analysis",
                content="Our AI tracks how betting lines move and identifies 'sharp money' vs 'public money' to find value opportunities.",
                action="Check the line movement indicator",
                visual_aid="line-movement",
                tips=[
                    "Reverse line movement often indicates sharp money",
                    "Heavy public betting can create value on other side",
                    "Late line movement may indicate injury news"
                ]
            ),
            TutorialStep(
                title="Historical Performance Patterns", 
                content="AI analyzes historical data to identify trends: how teams perform in specific situations, weather conditions, or against certain opponents.",
                action="Review historical trends section",
                visual_aid="trends-panel",
                tips=[
                    "Look for meaningful sample sizes (20+ games)",
                    "Recent trends may be more relevant than old data",
                    "Consider if trends have logical explanations"
                ]
            ),
            TutorialStep(
                title="Bankroll Management Integration",
                content="Our AI suggests bet sizing based on confidence levels and your risk tolerance. Higher confidence allows for larger bets.",
                action="Set your risk tolerance in settings",
                visual_aid="bankroll-settings",
                tips=[
                    "Never bet more than you can afford to lose",
                    "Conservative: 1-2% per bet, Aggressive: 3-5% per bet",
                    "Reduce bet size when confidence is lower"
                ]
            ),
            TutorialStep(
                title="Live Betting Opportunities",
                content="AI can identify in-game betting opportunities when live odds don't reflect current game state or momentum shifts.",
                action="Explore live betting section",
                visual_aid="live-betting",
                tips=[
                    "Live betting requires quick decision making",
                    "Watch games when possible for context",
                    "Be aware of delays in live data feeds"
                ]
            )
        ]
    ),
    
    Tutorial(
        id="risk-management",
        title="Smart Risk Management Strategies",
        description="Learn professional risk management techniques",
        difficulty="Intermediate",
        duration="6 minutes", 
        steps=[
            TutorialStep(
                title="The Kelly Criterion",
                content="A mathematical formula that calculates optimal bet size based on your edge and the odds. Our AI can suggest Kelly-optimal bet sizes.",
                action="Enable Kelly sizing in bet recommendations",
                visual_aid="kelly-toggle",
                tips=[
                    "Full Kelly can be aggressive - consider fractional Kelly",
                    "Only use Kelly when you have confirmed edge",
                    "Kelly requires accurate probability estimates"
                ]
            ),
            TutorialStep(
                title="Diversification Strategies",
                content="Spread risk across different sports, bet types, and time periods. Don't put all eggs in one basket.",
                action="Review your betting portfolio diversity",
                visual_aid="portfolio-view",
                tips=[
                    "Mix different sports and leagues",
                    "Combine different bet types (spreads, totals, props)",
                    "Avoid betting entire bankroll on one day"
                ]
            ),
            TutorialStep(
                title="Handling Losing Streaks",
                content="Even good bettors experience losing streaks. Learn when to reduce bet sizes and when to trust your process.",
                action="View streak management guidelines",
                visual_aid="streak-tracker",
                tips=[
                    "Reduce bet size during losing streaks",
                    "Don't chase losses with bigger bets",
                    "Trust your process if analysis remains sound"
                ]
            ),
            TutorialStep(
                title="Profit Taking and Reinvestment",
                content="Decide when to take profits out of your betting bankroll vs reinvesting for growth.",
                action="Set profit taking rules in settings",
                visual_aid="profit-settings",
                tips=[
                    "Consider taking profits at 25-50% bankroll growth",
                    "Reinvest gradually to compound growth",
                    "Keep detailed records for tax purposes"
                ]
            )
        ]
    ),
    
    Tutorial(
        id="parlay-building",
        title="Building Winning Parlays",
        description="Master the art of parlay construction with AI assistance",
        difficulty="Beginner",
        duration="7 minutes",
        steps=[
            TutorialStep(
                title="Parlay Basics",
                content="Parlays combine multiple bets into one wager. All selections must win for the parlay to pay out. Higher risk, higher reward.",
                action="Start building your first parlay",
                visual_aid="parlay-builder",
                tips=[
                    "Start with 2-3 legs for beginners",
                    "Each additional leg significantly increases difficulty",
                    "Parlays are entertainment - most are -EV long term"
                ]
            ),
            TutorialStep(
                title="Selecting Quality Legs",
                content="Choose bets with good individual value and low correlation. Our AI helps identify the best combinations.",
                action="Add legs and watch correlation warnings",
                visual_aid="correlation-alerts",
                tips=[
                    "Look for individual bets you'd make anyway",
                    "Avoid obvious correlations (team total + game total)",
                    "Mix different sports when possible"
                ]
            ),
            TutorialStep(
                title="Optimal Parlay Size",
                content="Most successful parlays are 2-4 legs. Longer parlays become exponentially harder to win despite higher payouts.",
                action="Compare different parlay lengths",
                visual_aid="payout-calculator",
                tips=[
                    "2-leg parlays: ~25% win rate",
                    "3-leg parlays: ~12.5% win rate", 
                    "4+ legs: entertainment only"
                ]
            ),
            TutorialStep(
                title="Parlay Insurance Options",
                content="Some sportsbooks offer parlay insurance - getting money back if one leg loses. Factor this into your analysis.",
                action="Check for insurance offerings",
                visual_aid="insurance-options",
                tips=[
                    "Insurance reduces parlay payout",
                    "Most useful on 4+ leg parlays",
                    "Read terms carefully - many restrictions apply"
                ]
            ),
            TutorialStep(
                title="When to Hedge Parlays",
                content="If most legs hit, you might hedge the final leg to guarantee profit. Our AI can calculate optimal hedge amounts.",
                action="Learn hedge calculation tools",
                visual_aid="hedge-calculator",
                tips=[
                    "Only hedge when you have significant profit at risk",
                    "Calculate break-even points before betting",
                    "Don't hedge small parlays - let them ride"
                ]
            )
        ]
    ),
    
    Tutorial(
        id="free-tier-mastery",
        title="Maximizing Your Free Tier Benefits",
        description="Get the most value from your daily free evaluations",
        difficulty="Beginner",
        duration="4 minutes",
        steps=[
            TutorialStep(
                title="Daily Limits Strategy",
                content="You get 3 free parlay evaluations and 10 odds comparisons daily. Use them strategically for maximum value.",
                action="Check your daily usage in the dashboard",
                visual_aid="usage-tracker",
                tips=[
                    "Save evaluations for your strongest betting opportunities",
                    "Use odds comparisons for all your bets",
                    "Limits reset at midnight Eastern time"
                ]
            ),
            TutorialStep(
                title="Demo Parlay Learning",
                content="Study our demo parlays to understand AI analysis patterns. Each demo shows different betting strategies and risk levels.",
                action="Explore demo parlays in different sports",
                visual_aid="demo-section",
                tips=[
                    "Focus on the reasoning behind each score",
                    "Note how correlation affects overall ratings",
                    "See how different sports require different approaches"
                ]
            ),
            TutorialStep(
                title="Building Your Betting Knowledge",
                content="Use free tier to learn without pressure. Test different strategies and see how AI evaluates various approaches.",
                action="Try different betting strategies",
                visual_aid="strategy-comparison",
                tips=[
                    "Experiment with different sports",
                    "Try conservative vs aggressive approaches",
                    "Keep notes on what works for your style"
                ]
            ),
            TutorialStep(
                title="When to Consider Upgrading",
                content="If you're consistently using all daily limits and finding value in the analysis, upgrading unlocks unlimited usage and advanced features.",
                action="Review upgrade benefits",
                visual_aid="upgrade-options",
                tips=[
                    "Upgrade when you're betting regularly",
                    "Pro tier adds unlimited evaluations",
                    "Premium includes advanced market analysis"
                ]
            )
        ]
    )
]

def get_tutorial(tutorial_id: str) -> Tutorial:
    """Get specific tutorial by ID"""
    for tutorial in TUTORIALS:
        if tutorial.id == tutorial_id:
            return tutorial
    return None

def get_all_tutorials() -> List[Tutorial]:
    """Get all available tutorials"""
    return TUTORIALS

def get_tutorials_by_difficulty(difficulty: str) -> List[Tutorial]:
    """Get tutorials filtered by difficulty"""
    return [t for t in TUTORIALS if t.difficulty.lower() == difficulty.lower()]

def format_tutorial_for_api(tutorial: Tutorial) -> Dict[str, Any]:
    """Format tutorial for API response"""
    return {
        "id": tutorial.id,
        "title": tutorial.title,
        "description": tutorial.description,
        "difficulty": tutorial.difficulty,
        "duration": tutorial.duration,
        "step_count": len(tutorial.steps),
        "steps": [
            {
                "title": step.title,
                "content": step.content,
                "action": step.action,
                "visual_aid": step.visual_aid,
                "tips": step.tips
            }
            for step in tutorial.steps
        ]
    }

def get_tutorial_progress_tracker():
    """Get tutorial progress tracking structure"""
    return {
        "tutorials_completed": [],
        "current_tutorial": None,
        "current_step": 0,
        "total_tutorials": len(TUTORIALS),
        "achievements": {
            "first_tutorial": False,
            "all_beginner": False,
            "all_intermediate": False,
            "tutorial_master": False
        }
    }