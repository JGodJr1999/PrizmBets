import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

export default function LiveSportsSimple() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState('all');

  useEffect(() => {
    console.log('LiveSportsSimple: Loading live odds for sport:', selectedSport);
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data;
        if (selectedSport === 'all') {
          console.log('LiveSportsSimple: Calling getLiveOddsAll...');
          data = await apiService.getLiveOddsAll(3, true);
        } else {
          console.log('LiveSportsSimple: Calling getLiveOddsBySport with:', selectedSport);
          data = await apiService.getLiveOddsBySport(selectedSport);
        }
        
        console.log('LiveSportsSimple: API Response:', data);
        
        if (data.success) {
          setGames(data.games || []);
          console.log('LiveSportsSimple: Set games count:', data.games?.length || 0);
        } else {
          throw new Error('API returned success: false');
        }
      } catch (err) {
        console.error('LiveSportsSimple: Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSport]);

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    color: '#333'
  };

  const headerStyle = {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  };

  const sportsButtonStyle = {
    margin: '5px',
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  };

  const activeButtonStyle = {
    ...sportsButtonStyle,
    backgroundColor: '#28a745'
  };

  const gameStyle = {
    border: '1px solid #ddd',
    margin: '10px 0',
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#fff'
  };

  const sports = [
    { key: 'all', name: 'All Sports' },
    { key: 'nfl', name: 'NFL' },
    { key: 'mlb', name: 'MLB' },
    { key: 'nba', name: 'NBA' },
    { key: 'wnba', name: 'WNBA' }
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>🚀 SIMPLIFIED LIVE SPORTS - Emergency Version</h1>
        <p><strong>Purpose:</strong> Minimal UI to test if live data displays</p>
        <p><strong>Status:</strong> {loading ? 'Loading...' : `${games.length} games loaded`}</p>
        
        <div style={{marginTop: '15px'}}>
          <strong>Select Sport:</strong><br/>
          {sports.map(sport => (
            <button
              key={sport.key}
              style={selectedSport === sport.key ? activeButtonStyle : sportsButtonStyle}
              onClick={() => setSelectedSport(sport.key)}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{padding: '20px', textAlign: 'center'}}>
          ⏳ Loading live sports data...
        </div>
      )}

      {error && (
        <div style={{padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', margin: '10px 0'}}>
          ❌ <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div style={{padding: '20px', textAlign: 'center'}}>
          No games available for {selectedSport}
        </div>
      )}

      {!loading && games.length > 0 && (
        <div>
          <h2>📊 Games ({games.length}):</h2>
          {games.map((game, index) => (
            <div key={game.id || index} style={gameStyle}>
              <div style={{marginBottom: '10px'}}>
                <strong>{game.away_team || 'Away'} @ {game.home_team || 'Home'}</strong>
                <span style={{float: 'right', color: '#666'}}>
                  {game.sport?.toUpperCase()}
                </span>
              </div>
              
              <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
                {game.commence_time ? new Date(game.commence_time).toLocaleString() : 'Time TBD'}
              </div>

              {game.sportsbooks && Object.keys(game.sportsbooks).length > 0 && (
                <div>
                  <strong>Odds:</strong>
                  {Object.entries(game.sportsbooks).slice(0, 3).map(([book, odds]) => (
                    <div key={book} style={{margin: '5px 0', fontSize: '14px'}}>
                      <strong>{book}:</strong> 
                      {odds.moneyline && (
                        <span style={{marginLeft: '10px'}}>
                          {game.home_team}: {odds.moneyline.home > 0 ? '+' : ''}{odds.moneyline.home} | 
                          {game.away_team}: {odds.moneyline.away > 0 ? '+' : ''}{odds.moneyline.away}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {game.bookmakers && game.bookmakers.length > 0 && (
                <div>
                  <strong>Bookmakers:</strong>
                  {game.bookmakers.slice(0, 2).map((bookmaker, i) => (
                    <div key={i} style={{margin: '5px 0', fontSize: '14px'}}>
                      <strong>{bookmaker.title || bookmaker.key}:</strong>
                      {bookmaker.markets && bookmaker.markets.map((market, j) => (
                        <span key={j} style={{marginLeft: '10px'}}>
                          {market.key}: {market.outcomes?.map(o => `${o.name}: ${o.price}`).join(', ')}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}