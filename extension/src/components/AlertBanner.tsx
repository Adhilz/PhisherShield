// extension/src/components/AlertBanner.tsx
import React from 'react';

interface AlertBannerProps {
    message: string; // This *must* match the type passed from Popup.tsx
    // Add other props here later if AlertBanner needs them (e.g., onContinue, onReport)
}

const AlertBanner: React.FC<AlertBannerProps> = ({ message }) => {
    if (!message) return null;

    const bannerStyle = {
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        backgroundColor: message.toLowerCase().includes('suspicious') ? '#ffe0e0' : '#e0ffe0',
        color: message.toLowerCase().includes('suspicious') ? '#d32f2f' : '#2e7d32',
        border: `1px solid ${message.toLowerCase().includes('suspicious') ? '#f44336' : '#4caf50'}`
    };

    return (
        <div style={bannerStyle}>
            <p><strong>Alert:</strong> {message}</p>
        </div>
    );
};

export default AlertBanner;