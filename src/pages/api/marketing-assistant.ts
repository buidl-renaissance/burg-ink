import { NextApiRequest, NextApiResponse } from 'next';
import { generateMarketingResponse, generateMarketingSummary, MarketingMessage, ArtistProfile } from '@/lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory, currentProfile, action } = req.body;

    if (!message && action !== 'generate-summary') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (action === 'generate-summary') {
      // Generate marketing summary based on complete profile
      if (!currentProfile || !currentProfile.name || !currentProfile.medium || !currentProfile.style || !currentProfile.targetAudience || !currentProfile.goals) {
        return res.status(400).json({ error: 'Complete artist profile is required for summary generation' });
      }

      const summary = await generateMarketingSummary(currentProfile as ArtistProfile);
      return res.status(200).json(summary);
    }

    // Handle regular chat message
    const history: MarketingMessage[] = conversationHistory || [];
    const profile: Partial<ArtistProfile> = currentProfile || {};

    const response = await generateMarketingResponse(message, history, profile);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Marketing assistant API error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 