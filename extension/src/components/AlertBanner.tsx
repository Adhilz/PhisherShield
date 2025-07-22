// extension/src/components/AlertBanner.tsx
import React from 'react';

interface AlertBannerProps {
    message: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ message }) => {
    if (!message) return null;

    const isSuspiciousMessage = message.toLowerCase().includes('suspicious') || message.toLowerCase().includes('warning');

    return (
        <div className={isSuspiciousMessage ? 'phishershield-alert-banner suspicious' : 'phishershield-alert-banner safe'}> {/* <--- APPLY CONDITIONAL CLASS */}
            <p><strong>Alert:</strong> {message}</p>
        </div>
    );
};

export default AlertBanner;