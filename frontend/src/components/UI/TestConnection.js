import React from 'react';
import styled from 'styled-components';

const TestBanner = styled.div`
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(45deg, #ff0000, #00ff00);
  color: white;
  padding: 20px;
  border-radius: 10px;
  font-size: 20px;
  font-weight: bold;
  z-index: 9999;
  animation: rotate 2s linear infinite;
  
  @keyframes rotate {
    from { transform: translateX(-50%) rotate(0deg); }
    to { transform: translateX(-50%) rotate(360deg); }
  }
`;

const TestConnection = () => {
  return (
    <TestBanner>
      🚨 FRONTEND CONNECTION WORKING! 🚨
    </TestBanner>
  );
};

export default TestConnection;