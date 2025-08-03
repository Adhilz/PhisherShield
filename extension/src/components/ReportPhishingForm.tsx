// extension/src/components/ReportPhishingForm.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Flag, ExternalLink, AlertTriangle } from 'lucide-react';

interface ReportPhishingFormProps {
    url: string;
}

const ReportPhishingForm: React.FC<ReportPhishingFormProps> = ({ url }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const encodedUrl = encodeURIComponent(url);
        const reportPageUrl = `http://localhost:3001/?url=${encodedUrl}`;

        try {
            chrome.tabs.create({ url: reportPageUrl });
            console.log(`[ReportForm] Successfully called chrome.tabs.create for URL: ${reportPageUrl}`);
        } catch (error) {
            console.error(`[ReportForm] Error calling chrome.tabs.create:`, error);
        }
    };

    return (
        <motion.form 
            onSubmit={handleSubmit} 
            className="phishershield-report-form-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                style={{ textAlign: 'center', marginBottom: '16px' }}
            >
                <AlertTriangle size={20} color="#ea4335" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#202124', fontWeight: '500' }}>
                    Is this site suspicious? Help us by reporting it!
                </p>
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <input
                    type="text"
                    value={url}
                    readOnly
                    placeholder="URL will be automatically filled"
                    style={{ 
                        width: '100%',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        color: '#202124',
                        cursor: 'default',
                        transition: 'all 0.2s'
                    }}
                />
            </motion.div>
            
            <motion.button
                type="submit"
                className="report-btn"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    background: 'linear-gradient(135deg, #fbbc04 0%, #f9ab00 100%)',
                    color: '#202124',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Flag size={16} />
                Report Site
                <ExternalLink size={14} />
            </motion.button>
        </motion.form>
    );
};

export default ReportPhishingForm;
