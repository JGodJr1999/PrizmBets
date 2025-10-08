import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

export default function LiveSportsSimple() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState('all');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('LiveSportsSimple: Loading live odds for sport:', selectedSport);
    
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('LiveSportsSimple: Starting data load for sport:', selectedSport);

        // Check if apiService exists
        if (!apiService) {
          throw new Error('API service is not available');
        }

        let data;
        if (selectedSport === 'all') {
          console.log('LiveSportsSimple: Calling getLiveOddsAll...');
          if (!apiService.getLiveOddsAll) {
            throw new Error('getLiveOddsAll method not available');
          }
          data = await apiService.getLiveOddsAll(3, true);
        } else {
          console.log('LiveSportsSimple: Calling getLiveOddsBySport with:', selectedSport);
          if (!apiService.getLiveOddsBySport) {
            throw new Error('getLiveOddsBySport method not available');
          }
          data = await apiService.getLiveOddsBySport(selectedSport);
        }

        console.log('LiveSportsSimple: API Response:', data);

        // Defensive checks for API response
        if (!data) {
          throw new Error('No data returned from API');
        }

        if (data.success) {
          const gamesData = data.games || [];
          setGames(Array.isArray(gamesData) ? gamesData : []);
          console.log('LiveSportsSimple: Set games count:', gamesData.length);
          setRetryCount(0); // Reset retry count on success
        } else {
          const errorMsg = data.error || data.message || 'API returned success: false';
          throw new Error(errorMsg);
        }
      } catch (err) {
        console.error('LiveSportsSimple: Error loading data:', err);
        const errorMessage = err?.message || 'Unknown error occurred';
        setError(errorMessage);

        // Auto-retry logic for network errors (max 2 retries)
        if (retryCount < 2 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log('LiveSportsSimple: Retrying in 2 seconds... (attempt', retryCount + 1, ')');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSport, retryCount]);

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
          <div style={{marginBottom: '10px'}}>
            ❌ <strong>Error:</strong> {error}
          </div>
          {retryCount < 2 && (
            <button
              style={{
                ...sportsButtonStyle,
                backgroundColor: '#dc3545',
                fontSize: '14px',
                padding: '8px 12px'
              }}
              onClick={() => {
                console.log('LiveSportsSimple: Manual retry requested');
                setRetryCount(prev => prev + 1);
              }}
            >
              🔄 Retry ({retryCount}/2)
            </button>
          )}
          {retryCount >= 2 && (
            <div style={{fontSize: '14px', marginTop: '10px'}}>
              Maximum retry attempts reached. Please check your connection or try again later.
            </div>
          )}
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
          {games.map((game, index) => {
            // Defensive checks for game data
            if (!game || typeof game !== 'object') {
              console.warn('LiveSportsSimple: Invalid game data at index', index, game);
              return null;
            }

            return (
              <div key={game.id || `game-${index}`} style={gameStyle}>
                <div style={{marginBottom: '10px'}}>
                  <strong>{game.away_team || 'Away'} @ {game.home_team || 'Home'}</strong>
                  <span style={{float: 'right', color: '#666'}}>
                    {game.sport ? String(game.sport).toUpperCase() : 'UNKNOWN'}
                  </span>
                </div>

                <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
                  {game.commence_time ? (() => {
                    try {
                      return new Date(game.commence_time).toLocaleString();
                    } catch (e) {
                      console.warn('LiveSportsSimple: Invalid date format:', game.commence_time);
                      return 'Time TBD';
                    }
                  })() : 'Time TBD'}
                </div>

                {game.sportsbooks && typeof game.sportsbooks === 'object' && Object.keys(game.sportsbooks).length > 0 && (
                  <div>
                    <strong>Odds:</strong>
                    {Object.entries(game.sportsbooks).slice(0, 3).map(([book, odds]) => {
                      if (!odds || typeof odds !== 'object') return null;

                      return (
                        <div key={book} style={{margin: '5px 0', fontSize: '14px'}}>
                          <strong>{book}:</strong>
                          {odds.moneyline && typeof odds.moneyline === 'object' && (
                            <span style={{marginLeft: '10px'}}>
                              {game.home_team}: {odds.moneyline.home > 0 ? '+' : ''}{odds.moneyline.home || 'N/A'} |
                              {game.away_team}: {odds.moneyline.away > 0 ? '+' : ''}{odds.moneyline.away || 'N/A'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {game.bookmakers && Array.isArray(game.bookmakers) && game.bookmakers.length > 0 && (
                  <div>
                    <strong>Bookmakers:</strong>
                    {game.bookmakers.slice(0, 2).map((bookmaker, i) => {
                      if (!bookmaker || typeof bookmaker !== 'object') return null;

                      return (
                        <div key={i} style={{margin: '5px 0', fontSize: '14px'}}>
                          <strong>{bookmaker.title || bookmaker.key || 'Unknown'}:</strong>
                          {bookmaker.markets && Array.isArray(bookmaker.markets) && bookmaker.markets.map((market, j) => {
                            if (!market || typeof market !== 'object') return null;

                            return (
                              <span key={j} style={{marginLeft: '10px'}}>
                                {market.key}: {market.outcomes && Array.isArray(market.outcomes) ?
                                  market.outcomes.map(o => o && typeof o === 'object' ? `${o.name || 'N/A'}: ${o.price || 'N/A'}` : 'Invalid data').join(', ') :
                                  'No outcomes'
                                }
                              </span>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}