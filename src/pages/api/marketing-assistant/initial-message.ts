import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { marketingConversations } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ArtistProfile } from '@/lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user's most recent conversation to determine their current profile
    const latestConversation = await db.query.marketingConversations.findFirst({
      where: and(
        eq(marketingConversations.user_id, user.id),
        eq(marketingConversations.is_active, 1)
      ),
      orderBy: [desc(marketingConversations.updated_at)]
    });

    let currentProfile: Partial<ArtistProfile> = {};
    let onboardingState = {
      profile_created: false,
      goals_set: false,
      preferences_configured: false,
      onboarding_complete: false
    };

    if (latestConversation && latestConversation.artist_profile) {
      try {
        currentProfile = JSON.parse(latestConversation.artist_profile);
        
        // Determine onboarding state based on profile completeness
        onboardingState = {
          profile_created: !!(currentProfile.name && currentProfile.medium),
          goals_set: !!(currentProfile.goals && currentProfile.targetAudience),
          preferences_configured: !!(currentProfile.style && currentProfile.inspiration),
          onboarding_complete: !!(currentProfile.name && currentProfile.medium && currentProfile.goals && currentProfile.targetAudience && currentProfile.style)
        };
      } catch (error) {
        console.error('Error parsing artist profile:', error);
      }
    }

    // Generate appropriate initial message based on onboarding state
    let initialMessage = "Hello! I'm your AI marketing assistant. I'm here to help you understand your artistic identity and create effective marketing strategies. Let's start by getting to know you and your work better. What's your name?";

    if (onboardingState.onboarding_complete) {
      initialMessage = `Hello ${currentProfile.name}! I'm ready to help you with marketing for your ${currentProfile.medium} work. What would you like to work on today?`;
    } else if (onboardingState.profile_created && !onboardingState.goals_set) {
      initialMessage = `Welcome back, ${currentProfile.name}! Let's continue setting up your marketing strategy. What are your primary goals as an artist?`;
    } else if (onboardingState.goals_set && !onboardingState.preferences_configured) {
      initialMessage = `Great progress, ${currentProfile.name}! Now let's refine your artistic style and marketing preferences. What influences your creative work?`;
    } else if (onboardingState.preferences_configured && !onboardingState.onboarding_complete) {
      initialMessage = `Almost there, ${currentProfile.name}! Let's complete your profile. What makes your ${currentProfile.medium} work unique?`;
    }

    return res.status(200).json({
      message: initialMessage,
      onboardingState,
      currentProfile
    });

  } catch (error) {
    console.error('Initial message API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
