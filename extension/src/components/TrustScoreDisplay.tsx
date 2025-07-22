// extension/src/components/TrustScoreDisplay.tsx
import React from 'react';

interface TrustScoreDisplayProps {
    trustScore: number | null;
}

const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({ trustScore }) => {
    if (trustScore === null) {
        return <p>Checking trust score...</p>;
    }

    const isSuspicious = trustScore < 50; // Determine based on threshold

    return (
        <div className={isSuspicious ? 'phishershield-score-display suspicious' : 'phishershield-score-display safe'}> {/* <--- APPLY CONDITIONAL CLASS */}
            <p>Trust Score: <strong>{trustScore}</strong></p> {/* Color handled by CSS now */}
        </div>
    );
};

export default TrustScoreDisplay;