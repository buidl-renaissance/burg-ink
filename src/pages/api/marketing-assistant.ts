import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { generateMarketingResponse, generateMarketingSummary, MarketingMessage, ArtistProfile } from '@/lib/ai';
import { 
  generateSocialPost, 
  generateCaption, 
  generateHashtags, 
  generateArtistBio, 
  generateArtistStatement, 
  generateEmailTemplate,
  ContentGenerationRequest,
  GeneratedContent
} from '@/lib/ai/contentGeneration';
import { db } from '@/lib/db';
import { artwork, tattoos, marketingConversations, websiteSettings } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to get entity data (artwork or tattoo)
async function getEntityData(entityId: number, entityType: string) {
  try {
    if (entityType === 'artwork') {
      const entity = await db.query.artwork.findFirst({
        where: eq(artwork.id, entityId),
        columns: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
        }
      });
      return entity ? {
        id: entity.id,
        title: entity.title,
        description: entity.description || undefined,
        type: entity.type,
        category: entity.category || undefined,
        tags: [] // Could be enhanced to include tags from taxonomy
      } : undefined;
    } else if (entityType === 'tattoo') {
      const entity = await db.query.tattoos.findFirst({
        where: eq(tattoos.id, entityId),
        columns: {
          id: true,
          title: true,
          description: true,
          category: true,
          style: true,
        }
      });
      return entity ? {
        id: entity.id,
        title: entity.title,
        description: entity.description || undefined,
        type: 'tattoo',
        category: entity.category || undefined,
        tags: [entity.style].filter(Boolean).filter((tag): tag is string => tag !== null)
      } : undefined;
    }
    return undefined;
  } catch (error) {
    console.error('Error fetching entity data:', error);
    return undefined;
  }
}

// Helper function to save conversation to database
async function saveConversationToDatabase(
  userId: number,
  userMessage: string,
  assistantResponse: any,
  conversationHistory: MarketingMessage[],
  currentProfile: Partial<ArtistProfile>,
  conversationId?: number
) {
  try {
    // Build the complete conversation messages
    const allMessages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: assistantResponse.message }
    ];

    const messages = allMessages.map((msg, index) => ({
      id: `msg-${Date.now()}-${index}`,
      type: msg.role,
      content: msg.content,
      timestamp: new Date().toISOString()
    }));

    if (conversationId) {
      // Update existing conversation
      await db.update(marketingConversations)
        .set({
          messages: JSON.stringify(messages),
          artist_profile: JSON.stringify(currentProfile),
          conversation_stage: assistantResponse.stage || 'intro',
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .where(and(
          eq(marketingConversations.id, conversationId),
          eq(marketingConversations.user_id, userId)
        ));
    } else {
      // Create new conversation
      // First, set all other conversations as inactive
      await db.update(marketingConversations)
        .set({ is_active: 0 })
        .where(eq(marketingConversations.user_id, userId));

      // Generate title from first user message
      const title = userMessage.length > 50 
        ? userMessage.substring(0, 47) + '...'
        : userMessage;

      await db.insert(marketingConversations).values({
        user_id: userId,
        artist_id: (currentProfile as any).artistId || null,
        title,
        messages: JSON.stringify(messages),
        artist_profile: JSON.stringify(currentProfile),
        conversation_stage: assistantResponse.stage || 'intro',
        is_active: 1,
        last_message_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      message, 
      conversationHistory, 
      currentProfile, 
      action,
      contentType,
      platform,
      tone,
      entityId,
      entityType,
      additionalContext,
      conversationId,
      saveConversation = true
    } = req.body;

    if (!message && !action) {
      return res.status(400).json({ error: 'Message or action is required' });
    }

    // Handle content generation actions
    if (action === 'generate-content' || action === 'generate-bio' || action === 'generate-hashtags' || action === 'generate-statement' || action === 'generate-email') {
      if (!currentProfile?.name) {
        return res.status(400).json({ error: 'Artist profile is required for content generation' });
      }

      try {
        // Fetch portfolio data for context
        const portfolioResponse = await fetch(`${req.headers.origin}/api/marketing-assistant/portfolio-data?artistId=${currentProfile.artistId || 1}`);
        const portfolioData = portfolioResponse.ok ? await portfolioResponse.json() : null;

        const contentRequest: ContentGenerationRequest = {
          contentType: contentType || 'social-post',
          platform: platform || 'instagram',
          tone: tone || 'professional',
          entityData: entityId ? await getEntityData(entityId, entityType) : undefined,
          artistData: {
            name: currentProfile.name,
            bio: currentProfile.bio,
            style: currentProfile.style,
            medium: currentProfile.medium,
            tags: currentProfile.tags
          },
          portfolioInsights: portfolioData ? {
            topColors: portfolioData.media?.topColors || [],
            commonSubjects: portfolioData.media?.commonSubjects || [],
            mostCommonStyle: portfolioData.analytics?.mostCommonStyle || '',
            mostCommonCategory: portfolioData.analytics?.mostCommonCategory || ''
          } : undefined,
          additionalContext
        };

        let generatedContent: GeneratedContent;

        switch (action) {
          case 'generate-content':
            generatedContent = await generateSocialPost(contentRequest);
            break;
          case 'generate-bio':
            generatedContent = await generateArtistBio(contentRequest);
            break;
          case 'generate-hashtags':
            const hashtags = await generateHashtags(contentRequest);
            generatedContent = {
              content: hashtags.join(' '),
              hashtags,
              platform: platform || 'instagram',
              tone: tone || 'professional',
              characterCount: hashtags.join(' ').length,
              metadata: {
                ctas: [],
                mentions: [],
                keywords: [],
                estimatedEngagement: 'Medium'
              }
            };
            break;
          case 'generate-statement':
            generatedContent = await generateArtistStatement(contentRequest);
            break;
          case 'generate-email':
            generatedContent = await generateEmailTemplate(contentRequest);
            break;
          default:
            return res.status(400).json({ error: 'Invalid content generation action' });
        }

        return res.status(200).json({
          success: true,
          generatedContent,
          action
        });

      } catch (contentError) {
        console.error('Content generation error:', contentError);
        return res.status(500).json({ 
          error: 'Failed to generate content',
          details: contentError instanceof Error ? contentError.message : 'Unknown error'
        });
      }
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

    // Get onboarding configuration from website settings
    let onboardingConfig = null;
    try {
      const onboardingSetting = await db.query.websiteSettings.findFirst({
        where: eq(websiteSettings.key, 'onboarding_config')
      });
      if (onboardingSetting) {
        onboardingConfig = JSON.parse(onboardingSetting.value);
      }
    } catch (error) {
      console.warn('Could not fetch onboarding config:', error);
    }

    const response = await generateMarketingResponse(message, history, profile, onboardingConfig);

    // Save conversation if requested
    if (saveConversation && message) {
      try {
        await saveConversationToDatabase(user.id, message, response, history, profile, conversationId);
      } catch (saveError) {
        console.warn('Failed to save conversation:', saveError);
        // Don't fail the request if saving fails
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Marketing assistant API error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 