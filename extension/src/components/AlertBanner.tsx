// extension/src/components/AlertBanner.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertBannerProps {
    message: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ message }) => {
    if (!message) return null;

    const isSuspiciousMessage = message.toLowerCase().includes('suspicious') || message.toLowerCase().includes('warning');
    const isSafeMessage = message.toLowerCase().includes('safe') || message.toLowerCase().includes('trusted');

    const getIcon = () => {
        if (isSuspiciousMessage) {
            return <AlertTriangle size={20} color="#ef4444" />;
        } else if (isSafeMessage) {
            return <CheckCircle size={20} color="#10b981" />;
        } else {
            return <Info size={20} color="#3b82f6" />;
        }
    };

    return (
        <motion.div 
            className={`phishershield-alert-banner ${isSuspiciousMessage ? 'suspicious' : 'safe'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -1 }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ marginTop: '2px' }}>
                    {getIcon()}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>
                        <strong>Alert:</strong> {message}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default AlertBanner;