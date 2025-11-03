// Content validation utilities for marketing content

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ContentValidationOptions {
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'email';
  contentType: 'social-post' | 'caption' | 'hashtags' | 'bio' | 'artist-statement' | 'email';
  strictMode?: boolean;
}

// Platform-specific limits and rules
const PLATFORM_RULES = {
  instagram: {
    caption: { maxLength: 2200, optimalLength: 125, hashtags: { max: 30, optimal: 5 } },
    story: { maxLength: 2200 },
    bio: { maxLength: 150, optimalLength: 100 }
  },
  facebook: {
    post: { maxLength: 63206, optimalLength: 40 },
    bio: { maxLength: 5000 }
  },
  twitter: {
    tweet: { maxLength: 280, optimalLength: 100 },
    bio: { maxLength: 160 }
  },
  tiktok: {
    caption: { maxLength: 2200, optimalLength: 125, hashtags: { max: 100, optimal: 5 } },
    bio: { maxLength: 80 }
  },
  email: {
    subject: { maxLength: 60, optimalLength: 30 },
    body: { maxLength: 10000, optimalLength: 200 }
  }
};

// Content quality rules
const QUALITY_RULES = {
  hashtags: {
    maxConsecutive: 3,
    minSpacing: 1,
    avoidSpam: ['#follow4follow', '#like4like', '#f4f', '#l4l'],
    requireRelevance: true
  },
  mentions: {
    maxPerPost: 5,
    requireRelevance: true
  },
  ctas: {
    maxPerPost: 2,
    preferredTypes: ['book', 'visit', 'follow', 'contact', 'view', 'shop']
  },
  language: {
    avoidSpamWords: ['free', 'win', 'congratulations', 'click here'],
    requireProfessionalism: true,
    maxExclamationMarks: 2
  }
};

/**
 * Validates content against platform-specific rules and best practices
 */
export function validateContent(
  content: string, 
  options: ContentValidationOptions
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  const rules = PLATFORM_RULES[options.platform];
  const contentType = options.contentType;

  // Character length validation
  validateCharacterLength(content, options, rules, result);

  // Hashtag validation (if applicable)
  if (contentType === 'social-post' || contentType === 'caption' || contentType === 'hashtags') {
    validateHashtags(content, options, rules, result);
  }

  // Mention validation
  validateMentions(content, result);

  // CTA validation
  validateCTAs(content, result);

  // Language quality validation
  validateLanguageQuality(content, result);

  // Platform-specific validation
  validatePlatformSpecific(content, options, result);

  // Determine overall validity
  result.isValid = result.errors.length === 0;

  return result;
}

interface PlatformRules {
  caption?: { maxLength?: number; optimalLength?: number; hashtags?: { max: number; optimal: number } };
  story?: { maxLength?: number };
  bio?: { maxLength?: number; optimalLength?: number };
  post?: { maxLength?: number; optimalLength?: number };
  tweet?: { maxLength?: number; optimalLength?: number };
  subject?: { maxLength?: number; optimalLength?: number };
  body?: { maxLength?: number; optimalLength?: number };
}

function validateCharacterLength(
  content: string, 
  options: ContentValidationOptions, 
  rules: PlatformRules, 
  result: ValidationResult
): void {
  const length = content.length;
  let maxLength: number;
  let optimalLength: number;

  // Get appropriate limits based on content type
  switch (options.contentType) {
    case 'social-post':
    case 'caption':
      maxLength = rules.caption?.maxLength || rules.post?.maxLength || 2200;
      optimalLength = rules.caption?.optimalLength || rules.post?.optimalLength || 125;
      break;
    case 'bio':
      maxLength = rules.bio?.maxLength || 150;
      optimalLength = rules.bio?.optimalLength || 100;
      break;
    case 'email':
      maxLength = rules.body?.maxLength || 10000;
      optimalLength = rules.body?.optimalLength || 200;
      break;
    default:
      maxLength = 2200;
      optimalLength = 125;
  }

  // Check maximum length
  if (length > maxLength) {
    result.errors.push(`Content exceeds maximum length of ${maxLength} characters (${length} characters)`);
    result.isValid = false;
  }

  // Check optimal length
  if (length > optimalLength * 2) {
    result.warnings.push(`Content is quite long (${length} characters). Optimal length is around ${optimalLength} characters.`);
  }

  // Platform-specific suggestions
  if (options.platform === 'twitter' && length > 200) {
    result.suggestions.push('Consider breaking this into a thread for better engagement on Twitter');
  }

  if (options.platform === 'instagram' && length < 50) {
    result.suggestions.push('Instagram posts with 50+ characters tend to get better engagement');
  }
}

function validateHashtags(
  content: string, 
  options: ContentValidationOptions, 
  rules: PlatformRules, 
  result: ValidationResult
): void {
  const hashtags = content.match(/#\w+/g) || [];
  const hashtagRules = rules.caption?.hashtags || { max: 30, optimal: 5 };

  // Check hashtag count
  if (hashtags.length > hashtagRules.max) {
    result.errors.push(`Too many hashtags (${hashtags.length}). Maximum allowed: ${hashtagRules.max}`);
    result.isValid = false;
  }

  if (hashtags.length > hashtagRules.optimal) {
    result.warnings.push(`Consider using fewer hashtags (${hashtags.length}). Optimal count: ${hashtagRules.optimal}`);
  }

  // Check for spam hashtags
  const spamHashtags = hashtags.filter(tag => 
    QUALITY_RULES.hashtags.avoidSpam.includes(tag.toLowerCase())
  );
  if (spamHashtags.length > 0) {
    result.warnings.push(`Avoid spam hashtags: ${spamHashtags.join(', ')}`);
  }

  // Check hashtag spacing
  const consecutiveHashtags = content.match(/#\w+\s*#\w+\s*#\w+/g);
  if (consecutiveHashtags && consecutiveHashtags.length > QUALITY_RULES.hashtags.maxConsecutive) {
    result.suggestions.push('Consider spacing out hashtags for better readability');
  }

  // Platform-specific hashtag advice
  if (options.platform === 'instagram') {
    if (hashtags.length < 5) {
      result.suggestions.push('Instagram posts with 5-10 hashtags tend to perform better');
    }
  }

  if (options.platform === 'twitter') {
    if (hashtags.length > 2) {
      result.warnings.push('Twitter works best with 1-2 hashtags');
    }
  }
}

function validateMentions(content: string, result: ValidationResult): void {
  const mentions = content.match(/@\w+/g) || [];

  if (mentions.length > QUALITY_RULES.mentions.maxPerPost) {
    result.warnings.push(`Many mentions (${mentions.length}). Consider keeping it to ${QUALITY_RULES.mentions.maxPerPost} or fewer`);
  }

  // Check for relevance (basic check for common irrelevant mentions)
  const irrelevantMentions = mentions.filter(mention => 
    ['@everyone', '@here', '@channel'].includes(mention.toLowerCase())
  );
  if (irrelevantMentions.length > 0) {
    result.warnings.push('Some mentions may not be relevant to this content');
  }
}

function validateCTAs(content: string, result: ValidationResult): void {
  const ctaPatterns = [
    /book\s+(now|today|appointment)/i,
    /visit\s+(my|our)/i,
    /follow\s+(me|us)/i,
    /contact\s+(me|us)/i,
    /view\s+(my|our|the)/i,
    /shop\s+(now|here)/i,
    /check\s+(out|this)/i,
    /learn\s+more/i,
    /get\s+(started|involved)/i,
    /sign\s+up/i
  ];

  const foundCTAs = ctaPatterns.filter(pattern => pattern.test(content));
  
  if (foundCTAs.length === 0) {
    result.suggestions.push('Consider adding a call-to-action to encourage engagement');
  } else if (foundCTAs.length > QUALITY_RULES.ctas.maxPerPost) {
    result.warnings.push(`Multiple CTAs detected (${foundCTAs.length}). Consider focusing on one main action`);
  }
}

function validateLanguageQuality(content: string, result: ValidationResult): void {
  // Check for excessive exclamation marks
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > QUALITY_RULES.language.maxExclamationMarks) {
    result.warnings.push(`Too many exclamation marks (${exclamationCount}). Use sparingly for impact`);
  }

  // Check for spam words
  const spamWords = QUALITY_RULES.language.avoidSpamWords.filter(word => 
    content.toLowerCase().includes(word)
  );
  if (spamWords.length > 0) {
    result.warnings.push(`Consider avoiding spam words: ${spamWords.join(', ')}`);
  }

  // Check for professional language
  const unprofessionalWords = ['awesome', 'amazing', 'incredible', 'mind-blowing'];
  const foundUnprofessional = unprofessionalWords.filter(word => 
    content.toLowerCase().includes(word)
  );
  if (foundUnprofessional.length > 2) {
    result.suggestions.push('Consider using more specific, professional language');
  }

  // Check for readability
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.length > 50);
  if (longSentences.length > sentences.length * 0.5) {
    result.suggestions.push('Consider shorter sentences for better readability');
  }
}

function validatePlatformSpecific(
  content: string, 
  options: ContentValidationOptions, 
  result: ValidationResult
): void {
  switch (options.platform) {
    case 'instagram':
      // Instagram-specific validations
      if (options.contentType === 'social-post' && !content.includes('#')) {
        result.suggestions.push('Instagram posts perform better with hashtags');
      }
      if (content.includes('http://') || content.includes('https://')) {
        result.suggestions.push('Instagram allows only one clickable link in bio. Consider using link in bio');
      }
      break;

    case 'twitter':
      // Twitter-specific validations
      if (content.length > 200) {
        result.suggestions.push('Consider breaking long content into a thread');
      }
      if (!content.includes('#') && options.contentType === 'social-post') {
        result.suggestions.push('Twitter posts with hashtags get more engagement');
      }
      break;

    case 'facebook':
      // Facebook-specific validations
      if (content.length < 40) {
        result.suggestions.push('Facebook posts with 40+ characters perform better');
      }
      break;

    case 'tiktok':
      // TikTok-specific validations
      if (options.contentType === 'social-post' && !content.includes('#')) {
        result.suggestions.push('TikTok captions work best with trending hashtags');
      }
      break;

    case 'email':
      // Email-specific validations
      if (options.contentType === 'email' && content.includes('!!!')) {
        result.warnings.push('Avoid excessive exclamation marks in emails');
      }
      break;
  }
}

/**
 * Validates and cleans hashtags
 */
export function validateAndCleanHashtags(hashtags: string[]): {
  valid: string[];
  invalid: string[];
  suggestions: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const suggestions: string[] = [];

  hashtags.forEach(hashtag => {
    // Remove # if present for validation
    const cleanTag = hashtag.replace(/^#/, '');
    
    // Check if hashtag is valid
    if (/^[a-zA-Z0-9_]+$/.test(cleanTag) && cleanTag.length > 0 && cleanTag.length <= 100) {
      valid.push(`#${cleanTag}`);
    } else {
      invalid.push(hashtag);
      if (cleanTag.length === 0) {
        suggestions.push('Hashtag cannot be empty');
      } else if (cleanTag.length > 100) {
        suggestions.push('Hashtag too long (max 100 characters)');
      } else {
        suggestions.push('Hashtag contains invalid characters (only letters, numbers, and underscores allowed)');
      }
    }
  });

  return { valid, invalid, suggestions };
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
      'Use 5-10 relevant hashtags'
    ],
    facebook: [
      'Share longer-form content',
      'Use Facebook Groups for community building',
      'Post when your audience is most active',
      'Include call-to-action buttons',
      'Share blog posts and articles',
      'Use Facebook Live for real-time engagement'
    ],
    twitter: [
      'Keep posts concise and punchy',
      'Use trending hashtags strategically',
      'Engage in conversations',
      'Retweet relevant content',
      'Post multiple times per day',
      'Use 1-2 hashtags maximum'
    ],
    tiktok: [
      'Create vertical video content',
      'Use trending sounds and effects',
      'Post consistently (1-3 times per day)',
      'Engage with comments quickly',
      'Use 5-10 relevant hashtags',
      'Keep captions short and engaging'
    ],
    email: [
      'Use compelling subject lines',
      'Keep content scannable',
      'Include clear CTAs',
      'Test different send times',
      'Personalize when possible',
      'Keep subject lines under 60 characters'
    ]
  };

  return recommendations[platform as keyof typeof recommendations] || [];
}
