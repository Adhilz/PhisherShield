import { Request, Response } from 'express';
import { reportPhishingLink } from '../integrations/phishTank';

export const reportController = {
    report: async (req: Request, res: Response) => {
        const { url, description } = req.body;

        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        try {
            const result = await reportPhishingLink(url, description);
            return res.status(200).json({ message: 'Report submitted successfully', result });
        } catch (error) {
            return res.status(500).json({ message: 'Error reporting phishing link', error });
        }
    }
};