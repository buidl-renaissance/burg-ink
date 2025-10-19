const { db } = require('../src/lib/db');
const { websiteSettings, marketingConversations } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

async function migrateOnboardingData() {
  console.log('Starting onboarding data migration...');

  try {
    // Create default onboarding configuration
    const defaultOnboardingConfig = {
      steps: [
        {
          id: 'profile_created',
          name: 'Basic Profile',
          description: 'Name and artistic medium',
          required: true
        },
        {
          id: 'goals_set',
          name: 'Goals & Audience',
          description: 'Marketing goals and target audience',
          required: true
        },
        {
          id: 'preferences_configured',
          name: 'Artistic Preferences',
          description: 'Style, influences, and creative process',
          required: false
        },
        {
          id: 'onboarding_complete',
          name: 'Complete',
          description: 'All essential information gathered',
          required: true
        }
      ],
      welcomeMessages: {
        new_user: "Hello! Welcome to your AI marketing assistant. Let's start by creating your artist profile. What's your name?",
        profile_created: "Welcome back! Let's continue setting up your marketing strategy. What are your primary goals as an artist?",
        goals_set: "Great progress! Now let's refine your artistic style and marketing preferences. What influences your creative work?",
        preferences_configured: "Almost there! Let's complete your profile. What makes your work unique?",
        complete: "Hello! I'm ready to help you with marketing for your work. What would you like to work on today?"
      }
    };

    // Check if onboarding config already exists
    const existingConfig = await db.query.websiteSettings.findFirst({
      where: eq(websiteSettings.key, 'onboarding_config')
    });

    if (!existingConfig) {
      // Insert default onboarding configuration
      await db.insert(websiteSettings).values({
        key: 'onboarding_config',
        value: JSON.stringify(defaultOnboardingConfig),
        description: 'Configuration for marketing assistant onboarding flow'
      });
      console.log('✅ Created default onboarding configuration');
    } else {
      console.log('ℹ️  Onboarding configuration already exists');
    }

    // Create default AI prompts configuration
    const defaultAIPrompts = {
      systemPrompts: {
        new_user: "You are helping a new artist create their profile. Focus on getting their name and basic information first.",
        profile_created: "The artist has basic profile info. Now help them define their goals and target audience.",
        goals_set: "The artist has goals defined. Help them refine their artistic style and preferences.",
        preferences_configured: "The artist has most information. Help them complete their unique value proposition.",
        complete: "The artist has completed onboarding. Provide advanced marketing strategies and content creation help."
      },
      conversationFlow: {
        intro: "Get the artist's name and basic information",
        style: "Understand their artistic medium and unique style", 
        audience: "Identify their target audience and collectors",
        goals: "Determine their marketing and career objectives",
        summary: "Provide personalized marketing recommendations"
      }
    };

    const existingPrompts = await db.query.websiteSettings.findFirst({
      where: eq(websiteSettings.key, 'ai_prompts_config')
    });

    if (!existingPrompts) {
      await db.insert(websiteSettings).values({
        key: 'ai_prompts_config',
        value: JSON.stringify(defaultAIPrompts),
        description: 'AI prompt templates for different onboarding stages'
      });
      console.log('✅ Created AI prompts configuration');
    } else {
      console.log('ℹ️  AI prompts configuration already exists');
    }

    // Analyze existing conversations to see if we can extract onboarding data
    const allConversations = await db.query.marketingConversations.findMany({
      orderBy: [desc(marketingConversations.created_at)]
    });

    console.log(`📊 Found ${allConversations.length} existing conversations`);

    // Create a summary of onboarding completion across users
    const userOnboardingStats = {};
    
    for (const conversation of allConversations) {
      if (conversation.artist_profile) {
        try {
          const profile = JSON.parse(conversation.artist_profile);
          const userId = conversation.user_id;
          
          if (!userOnboardingStats[userId]) {
            userOnboardingStats[userId] = {
              profile_created: false,
              goals_set: false,
              preferences_configured: false,
              onboarding_complete: false
            };
          }

          // Update stats based on profile completeness
          if (profile.name && profile.medium) {
            userOnboardingStats[userId].profile_created = true;
          }
          if (profile.goals && profile.targetAudience) {
            userOnboardingStats[userId].goals_set = true;
          }
          if (profile.style && profile.inspiration) {
            userOnboardingStats[userId].preferences_configured = true;
          }
          if (profile.name && profile.medium && profile.goals && profile.targetAudience && profile.style) {
            userOnboardingStats[userId].onboarding_complete = true;
          }
        } catch (error) {
          console.warn(`⚠️  Could not parse profile for conversation ${conversation.id}:`, error.message);
        }
      }
    }

    // Store user onboarding statistics
    const onboardingStats = {
      totalUsers: Object.keys(userOnboardingStats).length,
      profileCreated: Object.values(userOnboardingStats).filter(u => u.profile_created).length,
      goalsSet: Object.values(userOnboardingStats).filter(u => u.goals_set).length,
      preferencesConfigured: Object.values(userOnboardingStats).filter(u => u.preferences_configured).length,
      onboardingComplete: Object.values(userOnboardingStats).filter(u => u.onboarding_complete).length,
      userStats: userOnboardingStats
    };

    await db.insert(websiteSettings).values({
      key: 'onboarding_stats',
      value: JSON.stringify(onboardingStats),
      description: 'Statistics on user onboarding completion rates'
    });

    console.log('📈 Onboarding Statistics:');
    console.log(`   Total Users: ${onboardingStats.totalUsers}`);
    console.log(`   Profile Created: ${onboardingStats.profileCreated} (${Math.round(onboardingStats.profileCreated / onboardingStats.totalUsers * 100)}%)`);
    console.log(`   Goals Set: ${onboardingStats.goalsSet} (${Math.round(onboardingStats.goalsSet / onboardingStats.totalUsers * 100)}%)`);
    console.log(`   Preferences Configured: ${onboardingStats.preferencesConfigured} (${Math.round(onboardingStats.preferencesConfigured / onboardingStats.totalUsers * 100)}%)`);
    console.log(`   Onboarding Complete: ${onboardingStats.onboardingComplete} (${Math.round(onboardingStats.onboardingComplete / onboardingStats.totalUsers * 100)}%)`);

    console.log('✅ Onboarding data migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateOnboardingData()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateOnboardingData };
