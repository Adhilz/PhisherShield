import { Request, Response } from 'express';
import SecurityEngine from '../engine/securityEngine';
import { TrustScore } from '../types';

const securityEngine = new SecurityEngine();

export const calculateTrustScore = async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const trustScore: TrustScore = await securityEngine.evaluateUrl(url);
        return res.status(200).json(trustScore);
    } catch (error) {
        return res.status(500).json({ error: 'Error calculating Trust Score', details: error.message });
    }
};