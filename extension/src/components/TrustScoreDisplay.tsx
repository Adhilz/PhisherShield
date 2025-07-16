// extension/src/components/TrustScoreDisplay.tsx
import React from 'react';

interface TrustScoreDisplayProps {
    trustScore: number | null; // This *must* match the type passed from Popup.tsx
}

const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({ trustScore }) => {
    if (trustScore === null) {
        return <p>Checking trust score...</p>;
    }

    const scoreColor = trustScore >= 50 ? 'green' : 'red';

    return (
        <div style={{ margin: '10px 0', padding: '10px', border: `1px solid ${scoreColor}`, borderRadius: '5px', textAlign: 'center' }}>
            <p>Trust Score: <strong style={{ color: scoreColor }}>{trustScore}</strong></p>
        </div>
    );
};

export default TrustScoreDisplay;