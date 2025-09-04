import React, { useEffect, useState } from 'react';

export default function TestLiveData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('TestLiveData: Starting API fetch...');
    
    fetch('/api_all_games')
      .then(res => {
        console.log('TestLiveData: Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('TestLiveData: Success! Data:', data);
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('TestLiveData: Error:', error);
        setError(error);
        setLoading(false);
      });
  }, []);

  const containerStyle = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'monospace'
  };

  const statusStyle = {
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    fontSize: '14px'
  };

  const successStyle = {
    ...statusStyle,
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  };

  const errorStyle = {
    ...statusStyle,
    backgroundColor: '#f8d7da', 
    color: '#721c24',
    border: '1px solid #f5c6cb'
  };

  const loadingStyle = {
    ...statusStyle,
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
    border: '1px solid #bee5eb'
  };

  return (
    <div style={containerStyle}>
      <h1>🧪 EMERGENCY API TEST - Raw Data Pipeline</h1>
      
      <div style={{marginBottom: '20px'}}>
        <strong>Test URL:</strong> /api_all_games<br/>
        <strong>Purpose:</strong> Verify live data pipeline without UI components<br/>
        <strong>Expected:</strong> JSON with 12+ games from real sportsbooks
      </div>

      {loading && (
        <div style={loadingStyle}>
          ⏳ Testing API connection...
        </div>
      )}

      {error && (
        <div style={errorStyle}>
          ❌ <strong>API ERROR:</strong> {error.message}<br/>
          This indicates backend/network issue
        </div>
      )}

      {data && (
        <div style={successStyle}>
          ✅ <strong>API SUCCESS!</strong> 
          <br/>Games Count: {data.games?.length || 0}
          <br/>Success Flag: {data.success ? 'true' : 'false'}
          <br/>Data Source: {data.data_source || 'unknown'}
        </div>
      )}

      {data && (
        <div style={{marginTop: '20px'}}>
          <h3>Raw JSON Response:</h3>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '600px',
            fontSize: '12px'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
        <strong>Next Steps:</strong><br/>
        • If this shows data: Problem is in UI components<br/>
        • If this shows error: Problem is in API/backend<br/>
        • Check browser console for additional errors
      </div>
    </div>
  );
}