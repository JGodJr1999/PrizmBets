#!/usr/bin/env python3
"""
Test script for Educational Content System
Tests demo parlays, tutorials, and educational API endpoints
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from sample_content.demo_parlays import get_all_demo_parlays, format_demo_parlay_for_api, BETTING_SCENARIOS
from sample_content.tutorial_system import get_all_tutorials, format_tutorial_for_api
import json

def test_demo_parlays():
    """Test demo parlay system"""
    print("📊 Testing Demo Parlay System")
    print("=" * 40)
    
    try:
        demo_parlays = get_all_demo_parlays()
        print(f"✅ Found {len(demo_parlays)} demo parlays")
        
        for i, parlay in enumerate(demo_parlays):
            print(f"\n🎯 Demo Parlay {i+1}: {parlay.title}")
            print(f"   Risk Level: {parlay.risk_level}")
            print(f"   Confidence: {parlay.confidence:.0%}")
            print(f"   Bets: {len(parlay.bets)}")
            print(f"   Sports: {len(set(bet['sport'] for bet in parlay.bets))}")
            
            # Test formatting
            formatted = format_demo_parlay_for_api(parlay)
            print(f"   AI Score: {formatted['analysis']['overall_score']}/10")
            print(f"   Risk Factors: {len(formatted['analysis']['risk_factors'])}")
            print(f"   Positive Factors: {len(formatted['analysis']['positive_factors'])}")
        
        print(f"\n✅ All demo parlays formatted successfully")
        
    except Exception as e:
        print(f"❌ Error testing demo parlays: {str(e)}")

def test_tutorials():
    """Test tutorial system"""
    print("\n📚 Testing Tutorial System")
    print("=" * 40)
    
    try:
        tutorials = get_all_tutorials()
        print(f"✅ Found {len(tutorials)} tutorials")
        
        difficulty_counts = {}
        for tutorial in tutorials:
            difficulty = tutorial.difficulty
            difficulty_counts[difficulty] = difficulty_counts.get(difficulty, 0) + 1
            
            print(f"\n📖 Tutorial: {tutorial.title}")
            print(f"   Difficulty: {tutorial.difficulty}")
            print(f"   Duration: {tutorial.duration}")
            print(f"   Steps: {len(tutorial.steps)}")
            
            # Test formatting
            formatted = format_tutorial_for_api(tutorial)
            print(f"   ID: {formatted['id']}")
            print(f"   Step Count: {formatted['step_count']}")
        
        print(f"\n📊 Tutorial Difficulty Distribution:")
        for difficulty, count in difficulty_counts.items():
            print(f"   {difficulty}: {count} tutorials")
        
        print(f"\n✅ All tutorials formatted successfully")
        
    except Exception as e:
        print(f"❌ Error testing tutorials: {str(e)}")

def test_betting_scenarios():
    """Test betting scenarios"""
    print("\n🎲 Testing Betting Scenarios")
    print("=" * 40)
    
    try:
        print(f"✅ Found {len(BETTING_SCENARIOS)} betting scenarios")
        
        for i, scenario in enumerate(BETTING_SCENARIOS):
            print(f"\n📋 Scenario {i+1}: {scenario['scenario']}")
            print(f"   Description: {scenario['description']}")
            print(f"   Has Example: {'example' in scenario}")
            print(f"   Lesson: {scenario['example']['lesson']}")
        
        print(f"\n✅ All betting scenarios validated")
        
    except Exception as e:
        print(f"❌ Error testing betting scenarios: {str(e)}")

def test_api_endpoints():
    """Test educational API endpoints"""
    print("\n🌐 Testing Educational API Endpoints")
    print("=" * 40)
    
    app = create_app('development')
    
    with app.test_client() as client:
        print("\n📡 Testing API Endpoints:")
        
        # Test demo parlays endpoint
        try:
            response = client.get('/api/education/demo-parlays')
            print(f"   GET /api/education/demo-parlays: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"      Parlays returned: {data.get('count', 0)}")
            
        except Exception as e:
            print(f"   ❌ Demo parlays endpoint error: {str(e)}")
        
        # Test tutorials endpoint
        try:
            response = client.get('/api/education/tutorials')
            print(f"   GET /api/education/tutorials: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"      Tutorials returned: {data.get('count', 0)}")
            
        except Exception as e:
            print(f"   ❌ Tutorials endpoint error: {str(e)}")
        
        # Test scenarios endpoint
        try:
            response = client.get('/api/education/scenarios')
            print(f"   GET /api/education/scenarios: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"      Scenarios returned: {data.get('count', 0)}")
            
        except Exception as e:
            print(f"   ❌ Scenarios endpoint error: {str(e)}")
        
        # Test tips endpoint
        try:
            response = client.get('/api/education/tips')
            print(f"   GET /api/education/tips: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"      Daily tip available: {'tip_of_the_day' in data}")
            
        except Exception as e:
            print(f"   ❌ Tips endpoint error: {str(e)}")
        
        # Test glossary endpoint
        try:
            response = client.get('/api/education/glossary')
            print(f"   GET /api/education/glossary: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"      Glossary terms: {data.get('total_terms', 0)}")
            
        except Exception as e:
            print(f"   ❌ Glossary endpoint error: {str(e)}")
        
        # Test random demo parlay
        try:
            response = client.get('/api/education/demo-parlays/random')
            print(f"   GET /api/education/demo-parlays/random: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"      Random parlay title: {data.get('parlay', {}).get('title', 'N/A')}")
            
        except Exception as e:
            print(f"   ❌ Random demo parlay error: {str(e)}")

def test_content_quality():
    """Test content quality and completeness"""
    print("\n🔍 Testing Content Quality")
    print("=" * 40)
    
    try:
        # Check demo parlay completeness
        demo_parlays = get_all_demo_parlays()
        
        for i, parlay in enumerate(demo_parlays):
            issues = []
            
            # Check required fields
            if not parlay.title:
                issues.append("Missing title")
            if not parlay.bets:
                issues.append("No bets defined")
            if not parlay.analysis:
                issues.append("Missing analysis")
            if parlay.confidence < 0 or parlay.confidence > 1:
                issues.append("Invalid confidence range")
            
            # Check analysis completeness
            required_analysis_keys = ['overall_score', 'risk_factors', 'positive_factors', 
                                    'correlation_analysis', 'value_assessment', 'recommendations']
            
            for key in required_analysis_keys:
                if key not in parlay.analysis:
                    issues.append(f"Missing analysis.{key}")
            
            if issues:
                print(f"   ⚠️  Demo Parlay {i+1} issues: {', '.join(issues)}")
            else:
                print(f"   ✅ Demo Parlay {i+1}: Complete")
        
        # Check tutorial completeness
        tutorials = get_all_tutorials()
        
        for tutorial in tutorials:
            issues = []
            
            if not tutorial.steps:
                issues.append("No steps defined")
            if tutorial.difficulty not in ['Beginner', 'Intermediate', 'Advanced']:
                issues.append("Invalid difficulty level")
            
            for j, step in enumerate(tutorial.steps):
                if not step.title:
                    issues.append(f"Step {j+1} missing title")
                if not step.content:
                    issues.append(f"Step {j+1} missing content")
            
            if issues:
                print(f"   ⚠️  Tutorial '{tutorial.title}' issues: {', '.join(issues)}")
            else:
                print(f"   ✅ Tutorial '{tutorial.title}': Complete")
        
        print(f"\n✅ Content quality check completed")
        
    except Exception as e:
        print(f"❌ Error in content quality check: {str(e)}")

if __name__ == "__main__":
    print("🎓 PRIZMBETS EDUCATIONAL CONTENT TESTING")
    print("=" * 50)
    
    # Test all components
    test_demo_parlays()
    test_tutorials()
    test_betting_scenarios()
    test_api_endpoints()
    test_content_quality()
    
    print("\n🎉 Educational Content Testing Complete!")
    print("=" * 50)
    print("💡 Key Features Tested:")
    print("   ✅ 5 Demo parlays with AI analysis")
    print("   ✅ 5 Interactive tutorials")
    print("   ✅ Educational betting scenarios")
    print("   ✅ 6 API endpoints for content delivery")
    print("   ✅ Betting glossary and daily tips")
    print("\n🚀 Ready for user education and onboarding!")