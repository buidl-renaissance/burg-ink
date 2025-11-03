// Marketing content templates and formatting utilities

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  contentType: string;
  template: string;
  variables: string[];
  example?: string;
}

export interface CTATemplate {
  id: string;
  text: string;
  category: 'booking' | 'engagement' | 'sales' | 'social' | 'general';
  platforms: string[];
  tone: 'professional' | 'casual' | 'hype' | 'minimal';
}

export interface HashtagStrategy {
  id: string;
  name: string;
  description: string;
  hashtags: {
    trending: string[];
    niche: string[];
    branded: string[];
    location: string[];
  };
  platform: string;
}

// Platform-specific formatting rules
export const PLATFORM_FORMATTING = {
  instagram: {
    lineBreaks: true,
    emojiSupport: true,
    hashtagLimit: 30,
    mentionLimit: 20,
    linkSupport: false, // Only in bio
    storyLength: 2200
  },
  facebook: {
    lineBreaks: true,
    emojiSupport: true,
    hashtagLimit: 50,
    mentionLimit: 50,
    linkSupport: true,
    postLength: 63206
  },
  twitter: {
    lineBreaks: false,
    emojiSupport: true,
    hashtagLimit: 10,
    mentionLimit: 10,
    linkSupport: true,
    tweetLength: 280
  },
  tiktok: {
    lineBreaks: true,
    emojiSupport: true,
    hashtagLimit: 100,
    mentionLimit: 20,
    linkSupport: false,
    captionLength: 2200
  },
  email: {
    lineBreaks: true,
    emojiSupport: true,
    hashtagLimit: 0,
    mentionLimit: 0,
    linkSupport: true,
    bodyLength: 10000
  }
};

// CTA Templates
export const CTA_TEMPLATES: CTATemplate[] = [
  // Booking CTAs
  {
    id: 'book-appointment',
    text: 'Book your appointment today!',
    category: 'booking',
    platforms: ['instagram', 'facebook', 'twitter', 'tiktok'],
    tone: 'professional'
  },
  {
    id: 'book-now',
    text: 'Ready to book? DM me!',
    category: 'booking',
    platforms: ['instagram', 'twitter'],
    tone: 'casual'
  },
  {
    id: 'book-hype',
    text: '🔥 Limited spots available - book now! 🔥',
    category: 'booking',
    platforms: ['instagram', 'tiktok'],
    tone: 'hype'
  },

  // Engagement CTAs
  {
    id: 'follow-me',
    text: 'Follow for more art!',
    category: 'engagement',
    platforms: ['instagram', 'twitter', 'tiktok'],
    tone: 'casual'
  },
  {
    id: 'share-thoughts',
    text: 'Share your thoughts below!',
    category: 'engagement',
    platforms: ['instagram', 'facebook'],
    tone: 'casual'
  },
  {
    id: 'tag-friends',
    text: 'Tag a friend who needs this!',
    category: 'engagement',
    platforms: ['instagram', 'facebook', 'tiktok'],
    tone: 'casual'
  },

  // Sales CTAs
  {
    id: 'view-portfolio',
    text: 'View my full portfolio',
    category: 'sales',
    platforms: ['instagram', 'facebook', 'twitter'],
    tone: 'professional'
  },
  {
    id: 'shop-now',
    text: 'Shop prints and originals',
    category: 'sales',
    platforms: ['instagram', 'facebook'],
    tone: 'professional'
  },
  {
    id: 'commission-info',
    text: 'Commissions open - DM for details',
    category: 'sales',
    platforms: ['instagram', 'twitter'],
    tone: 'professional'
  },

  // Social CTAs
  {
    id: 'visit-studio',
    text: 'Visit my studio',
    category: 'social',
    platforms: ['instagram', 'facebook'],
    tone: 'casual'
  },
  {
    id: 'join-newsletter',
    text: 'Join my newsletter for updates',
    category: 'social',
    platforms: ['instagram', 'facebook', 'email'],
    tone: 'professional'
  }
];

// Content Templates
export const CONTENT_TEMPLATES: ContentTemplate[] = [
  // Instagram Templates
  {
    id: 'ig-artwork-showcase',
    name: 'Artwork Showcase',
    description: 'Template for showcasing new artwork',
    platform: 'instagram',
    contentType: 'social-post',
    template: `🎨 {title}

{description}

{behind_scenes}

{cta}

{hashtags}`,
    variables: ['title', 'description', 'behind_scenes', 'cta', 'hashtags'],
    example: `🎨 Sunset Dreams

A new piece exploring the intersection of light and shadow in urban landscapes.

This painting took me 3 weeks to complete, experimenting with different techniques to capture that perfect golden hour glow.

DM me for commission inquiries!

#urbanart #sunset #painting #detroitartist #goldenhour #originalart`
  },

  {
    id: 'ig-tattoo-reveal',
    name: 'Tattoo Reveal',
    description: 'Template for revealing new tattoos',
    platform: 'instagram',
    contentType: 'social-post',
    template: `✨ Fresh ink reveal! ✨

{design_description}

{process_notes}

{placement_info}

{cta}

{hashtags}`,
    variables: ['design_description', 'process_notes', 'placement_info', 'cta', 'hashtags'],
    example: `✨ Fresh ink reveal! ✨

This geometric mandala design combines traditional elements with modern linework.

The session took 4 hours with careful attention to symmetry and flow.

Perfect placement on the upper arm for maximum visibility.

Book your consultation today!

#tattoo #geometric #mandala #linework #detroittattoo #tattooartist`
  },

  // Facebook Templates
  {
    id: 'fb-story-post',
    name: 'Story Sharing',
    description: 'Longer-form content for Facebook',
    platform: 'facebook',
    contentType: 'social-post',
    template: `{title}

{detailed_description}

{process_story}

{inspiration}

{community_question}

{cta}

{hashtags}`,
    variables: ['title', 'detailed_description', 'process_story', 'inspiration', 'community_question', 'cta', 'hashtags'],
    example: `Behind the Canvas: My Latest Portrait

This portrait represents a breakthrough in my artistic journey. After months of studying light and shadow, I finally feel like I'm capturing not just the physical likeness, but the essence of the person.

The process was challenging - 15 hours over three sessions, constantly adjusting the composition and color palette. Each brushstroke felt intentional.

I was inspired by the way morning light transforms ordinary faces into something extraordinary.

What's your favorite type of portrait? Realistic or abstract?

Visit my studio this weekend for an open house!

#portrait #art #painting #detroitartist #openstudio #artprocess`
  },

  // Twitter Templates
  {
    id: 'twitter-art-thread',
    name: 'Art Thread',
    description: 'Twitter thread for art content',
    platform: 'twitter',
    contentType: 'social-post',
    template: `🎨 {title}

{short_description}

{thread_continuation}

{cta}

{hashtags}`,
    variables: ['title', 'short_description', 'thread_continuation', 'cta', 'hashtags'],
    example: `🎨 New painting: "Urban Sunrise"

Exploring how city lights blend with dawn colors.

Thread 🧵

1/ The inspiration came from walking through downtown Detroit at 6 AM. The way streetlights create pools of orange against the blue sky was mesmerizing.

2/ I used a palette knife technique for the buildings to create texture, then glazed over with thin layers of color.

3/ The challenge was balancing the warm artificial light with the cool natural light of sunrise.

DM for prints!

#art #painting #detroit #sunrise #urbanart`
  },

  // TikTok Templates
  {
    id: 'tiktok-process',
    name: 'Process Video',
    description: 'Template for TikTok process videos',
    platform: 'tiktok',
    contentType: 'social-post',
    template: `{hook}

{process_description}

{result_reveal}

{cta}

{hashtags}`,
    variables: ['hook', 'process_description', 'result_reveal', 'cta', 'hashtags'],
    example: `POV: You're watching me create magic ✨

This painting technique will blow your mind! Swipe to see the transformation.

The final result is absolutely stunning - who knew these colors could work together?

Follow for more art tips!

#art #painting #artist #arttok #paintingprocess #arttips`
  }
];

// Hashtag Strategies
export const HASHTAG_STRATEGIES: HashtagStrategy[] = [
  {
    id: 'art-general',
    name: 'General Art',
    description: 'Broad art hashtags for maximum reach',
    hashtags: {
      trending: ['#art', '#artist', '#artwork', '#painting', '#drawing'],
      niche: ['#contemporaryart', '#fineart', '#artgallery', '#artcollector'],
      branded: ['#detroitartist', '#localartist', '#originalart'],
      location: ['#detroit', '#michigan', '#midwestart']
    },
    platform: 'instagram'
  },
  {
    id: 'tattoo-traditional',
    name: 'Traditional Tattoo',
    description: 'Hashtags for traditional tattoo work',
    hashtags: {
      trending: ['#tattoo', '#tattooartist', '#ink', '#tattooart'],
      niche: ['#traditional', '#american', '#boldwillhold', '#traditional'],
      branded: ['#detroittattoo', '#313ink', '#michigantattoo'],
      location: ['#detroit', '#313', '#michigan', '#midwest']
    },
    platform: 'instagram'
  },
  {
    id: 'art-minimalist',
    name: 'Minimalist Art',
    description: 'Clean, minimal art hashtags',
    hashtags: {
      trending: ['#minimalism', '#minimalart', '#cleanart', '#simple'],
      niche: ['#geometric', '#lineart', '#monochrome', '#contemporary'],
      branded: ['#minimalartist', '#cleanlines', '#simpleart'],
      location: ['#detroit', '#michigan', '#minimalist']
    },
    platform: 'instagram'
  }
];

/**
 * Formats content for a specific platform
 */
export function formatForPlatform(
  content: string, 
  platform: keyof typeof PLATFORM_FORMATTING
): string {
  const rules = PLATFORM_FORMATTING[platform];
  let formatted = content;

  // Handle line breaks
  if (!rules.lineBreaks) {
    formatted = formatted.replace(/\n/g, ' ');
  }

  // Handle emoji support
  if (!rules.emojiSupport) {
    // Remove or replace emojis if platform doesn't support them well
    formatted = formatted.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
  }

  return formatted;
}

/**
 * Gets appropriate CTA for platform and tone
 */
export function getCTAForPlatform(
  platform: string, 
  tone: string, 
  category: string = 'engagement'
): string {
  const cta = CTA_TEMPLATES.find(template => 
    template.platforms.includes(platform) && 
    template.tone === tone && 
    template.category === category
  );

  return cta?.text || 'Follow for more!';
}

/**
 * Gets hashtag strategy for content type
 */
export function getHashtagStrategy(
  platform: string
): HashtagStrategy | null {
  return HASHTAG_STRATEGIES.find(strategy => 
    strategy.platform === platform
  ) || null;
}

/**
 * Builds hashtag set from strategy
 */
export function buildHashtagSet(
  strategy: HashtagStrategy, 
  customTags: string[] = []
): string[] {
  const hashtags = [
    ...strategy.hashtags.trending.slice(0, 5),
    ...strategy.hashtags.niche.slice(0, 8),
    ...strategy.hashtags.branded,
    ...strategy.hashtags.location.slice(0, 3),
    ...customTags.slice(0, 5)
  ];

  // Remove duplicates and limit to platform max
  return [...new Set(hashtags)].slice(0, 30);
}

/**
 * Gets content template by ID
 */
export function getContentTemplate(templateId: string): ContentTemplate | null {
  return CONTENT_TEMPLATES.find(template => template.id === templateId) || null;
}

/**
 * Applies template with variables
 */
export function applyTemplate(
  template: ContentTemplate, 
  variables: Record<string, string>
): string {
  let content = template.template;

  template.variables.forEach(variable => {
    const value = variables[variable] || '';
    content = content.replace(new RegExp(`{${variable}}`, 'g'), value);
  });

  return content;
}

/**
 * Gets platform-specific recommendations
 */
export function getPlatformRecommendations(platform: string): string[] {
  const recommendations = {
    instagram: [
      'Post consistently (1-2 times per day)',
      'Use high-quality images',
      'Engage with comments within 2 hours',
      'Use Stories for behind-the-scenes content',
      'Include location tags',
      'Post when your audience is most active (usually 6-9 PM)',
      'Use 5-10 relevant hashtags',
      'Use line breaks for better readability'
    ],
    facebook: [
      'Share longer-form content',
      'Use Facebook Groups for community building',
      'Post when your audience is most active',
      'Include call-to-action buttons',
      'Share blog posts and articles',
      'Use Facebook Live for real-time engagement',
      'Use paragraph breaks for readability'
    ],
    twitter: [
      'Keep posts concise and punchy',
      'Use trending hashtags strategically',
      'Engage in conversations',
      'Retweet relevant content',
      'Post multiple times per day',
      'Use 1-2 hashtags maximum',
      'Consider thread format for longer content'
    ],
    tiktok: [
      'Create vertical video content',
      'Use trending sounds and effects',
      'Post consistently (1-3 times per day)',
      'Engage with comments quickly',
      'Use 5-10 relevant hashtags',
      'Keep captions short and engaging',
      'Use trending hashtags for discovery'
    ],
    email: [
      'Use compelling subject lines',
      'Keep content scannable',
      'Include clear CTAs',
      'Test different send times',
      'Personalize when possible',
      'Keep subject lines under 60 characters',
      'Use proper email formatting'
    ]
  };

  return recommendations[platform as keyof typeof recommendations] || [];
}
