// Copyright © 2025 - PROPRIETARY & CONFIDENTIAL - All Rights Reserved
import React from 'react';

export const ConfidentialWatermark: React.FC = () => {
  const viewerId = `VIEWER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  React.useEffect(() => {
    console.log(`%c⚠️ CONFIDENTIAL CODE - VIEWING LOGGED ⚠️`, 
      'color: red; font-size: 20px; font-weight: bold;');
    console.log(`Viewer ID: ${viewerId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`%cUnauthorized copying or distribution is prohibited.`, 
      'color: orange; font-size: 14px;');
  }, []);

  return (
    <div className="fixed bottom-2 right-2 opacity-30 pointer-events-none select-none z-50">
      <div className="text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded">
        CONFIDENTIAL - © 2025
      </div>
    </div>
  );
};
