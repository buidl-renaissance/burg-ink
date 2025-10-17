import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageAnalysis {
  description: string;
  tags: string[];
  content: string;
  style?: string;
  colors?: string[];
  subjects?: string[];
  mood?: string;
}

export interface MediaAnalysis {
  tags: string[];
  title: string;
  description: string;
  altText: string;
}

export interface TattooAnalysis {
  title: string;
  description: string;
  category: string;
  placement: string;
  size: string;
  style: string;
}

export interface MarketingMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArtistProfile {
  name?: string;
  medium?: string;
  style?: string;
  targetAudience?: string;
  goals?: string;
  inspiration?: string;
  uniqueValue?: string;
}

export interface MarketingResponse {
  message: string;
  profile?: Partial<ArtistProfile>;
  stage?: 'intro' | 'style' | 'audience' | 'goals' | 'summary' | 'complete';
  recommendations?: string[];
}

export interface MediaClassification {
  detectedType: 'tattoo' | 'artwork' | 'unknown';
  confidence: number; // 0.0 to 1.0
  detections: {
    tattoo: { score: number; reasoning: string };
    artwork: { score: number; reasoning: string };
  };
  suggestedTags: string[];
  suggestedCategory?: string;
  placement?: string; // for tattoos
  style?: string;
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and provide a detailed response in JSON format with the following structure:
              {
                "title": "Title of the image",
                "description": "A detailed description of what's in the image",
                "tags": ["tag1", "tag2", "tag3"],
                "content": "Main content/subject of the image",
                "style": "Artistic style if applicable",
                "colors": ["primary colors in the image"],
                "subjects": ["main subjects/objects in the image"],
                "mood": "Overall mood or feeling of the image"
              }
              
              Focus on:
              - What is the main subject/content?
              - What artistic style is it (if any)?
              - What colors dominate the image?
              - What mood does it convey?
              - Generate relevant tags for categorization`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response, handling potential code block wrapping
    const jsonContent = content.includes('```json') 
      ? content.split('```json')[1].split('```')[0].trim()
      : content.includes('```')
        ? content.split('```')[1].trim() 
        : content.trim();

    const analysis = JSON.parse(jsonContent) as ImageAnalysis;
    
    return {
      description: analysis.description || '',
      tags: analysis.tags || [],
      content: analysis.content || '',
      style: analysis.style,
      colors: analysis.colors,
      subjects: analysis.subjects,
      mood: analysis.mood,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const MEDIA_ANALYSIS_PROMPT = `You are an AI assistant that analyzes images and extracts metadata for a media management system. 

For each image, provide:
1. Tags: A list of relevant keywords for search and categorization (focus on objects, people, actions, style, mood, colors)
2. Title: A concise, descriptive title for the image (3-8 words, suitable for display)
3. Description: A short, engaging summary (1-2 sentences) suitable for content management
4. Alt text: Descriptive text for accessibility and SEO (be specific and detailed)

Return your response as a JSON object with the following structure:
{
  "tags": ["tag1", "tag2", "tag3"],
  "title": "Descriptive Image Title",
  "description": "Brief description of the image",
  "altText": "Detailed alt text for accessibility"
}

Focus on being accurate, specific, and helpful for content discovery and accessibility.`;

export async function analyzeMediaImage(imageUrl: string): Promise<MediaAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: MEDIA_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide tags, title, description, and alt text.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Clean and parse the JSON response (remove markdown code blocks if present)
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    const analysis = JSON.parse(cleanContent) as MediaAnalysis;
    
    // Validate the response structure
    if (!analysis.tags || !analysis.title || !analysis.description || !analysis.altText) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    
    // Return fallback values if analysis fails
    return {
      tags: ['image', 'media'],
      title: 'Uploaded Image',
      description: 'Image uploaded to media manager',
      altText: 'Uploaded image',
    };
  }
}

const TATTOO_ANALYSIS_PROMPT = `You are an expert tattoo artist and analyst. Analyze tattoo images and provide detailed metadata for a tattoo portfolio management system.

For each tattoo image, provide:
1. Title: A descriptive, artistic title (3-8 words) that captures the essence of the tattoo
2. Description: A detailed description (2-3 sentences) highlighting the artistic elements, technique, and visual impact
3. Category: Choose the most appropriate style from: Traditional, Japanese, Geometric, Floral, Blackwork, Watercolor, Realism, Neo-traditional, Tribal, or Other
4. Placement: Identify the likely body placement (e.g., Arm, Forearm, Upper Arm, Leg, Calf, Thigh, Back, Upper Back, Lower Back, Chest, Shoulder, Neck, Hand, Foot, Ribcage, etc.)
5. Size: Estimate the size category: Small (less than 3 inches), Medium (3-6 inches), Large (6-12 inches), or Extra Large (over 12 inches)
6. Style: Describe the artistic style and technique in detail (e.g., "Bold black linework with dotwork shading", "Vibrant color with smooth gradients", "Fine line minimalist design")

Return your response as a JSON object with the following structure:
{
  "title": "Descriptive Tattoo Title",
  "description": "Detailed artistic description of the tattoo",
  "category": "Category Name",
  "placement": "Body Placement",
  "size": "Size Category",
  "style": "Detailed style and technique description"
}

Focus on being accurate and professional, highlighting the artistic merit and technical execution.`;

export async function analyzeTattooImage(imageUrl: string): Promise<TattooAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: TATTOO_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this tattoo image and provide title, description, category, placement, size, and style details.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Clean and parse the JSON response (remove markdown code blocks if present)
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    const analysis = JSON.parse(cleanContent) as TattooAnalysis;
    
    // Validate the response structure
    if (!analysis.title || !analysis.description || !analysis.category || 
        !analysis.placement || !analysis.size || !analysis.style) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing tattoo image with OpenAI:', error);
    
    // Return fallback values if analysis fails
    return {
      title: 'Custom Tattoo',
      description: 'A unique tattoo design',
      category: 'Other',
      placement: '',
      size: 'Medium',
      style: 'Custom tattoo artwork',
    };
  }
}

export async function generateMarketingResponse(
  userMessage: string,
  conversationHistory: MarketingMessage[],
  currentProfile: Partial<ArtistProfile>
): Promise<MarketingResponse> {
  try {
    const systemPrompt = `You are an expert marketing assistant for artists. Your role is to help artists understand their work and develop effective marketing strategies.

Your conversation should follow this structure:
1. **Introduction**: Get the artist's name and basic information
2. **Style & Medium**: Understand their artistic medium and unique style
3. **Audience**: Identify their target audience and collectors
4. **Goals**: Determine their marketing and career objectives
5. **Summary**: Provide personalized marketing recommendations

Guidelines:
- Be warm, encouraging, and professional
- Ask one focused question at a time
- Build on previous responses to create a comprehensive profile
- Provide specific, actionable marketing advice
- Use the artist's name and details in your responses
- Keep responses conversational but informative

Current artist profile: ${JSON.stringify(currentProfile, null, 2)}

Respond in a natural, conversational tone that feels like talking to a knowledgeable marketing consultant.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    console.log(response);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Determine the conversation stage based on the current profile
    let stage: MarketingResponse['stage'] = 'intro';
    if (currentProfile.name && !currentProfile.medium) {
      stage = 'style';
    } else if (currentProfile.medium && !currentProfile.style) {
      stage = 'audience';
    } else if (currentProfile.style && !currentProfile.targetAudience) {
      stage = 'goals';
    } else if (currentProfile.targetAudience && !currentProfile.goals) {
      stage = 'summary';
    } else if (currentProfile.goals) {
      stage = 'complete';
    }

    // Extract profile updates from the response
    const profileUpdates: Partial<ArtistProfile> = {};
    
    // Enhanced extraction logic based on conversation stage and user input
    if (stage === 'intro' && userMessage.length > 2 && !userMessage.toLowerCase().includes('name')) {
      profileUpdates.name = userMessage;
    } else if (stage === 'style' && userMessage.length > 3) {
      // Extract medium from user response
      const mediumKeywords = ['painting', 'sculpture', 'photography', 'digital', 'drawing', 'printmaking', 'ceramics', 'textile', 'installation', 'video', 'performance'];
      const lowerMessage = userMessage.toLowerCase();
      const foundMedium = mediumKeywords.find(keyword => lowerMessage.includes(keyword));
      if (foundMedium) {
        profileUpdates.medium = foundMedium;
      } else {
        profileUpdates.medium = userMessage;
      }
    } else if (stage === 'audience' && userMessage.length > 3) {
      profileUpdates.style = userMessage;
    } else if (stage === 'goals' && userMessage.length > 3) {
      profileUpdates.targetAudience = userMessage;
    } else if (stage === 'summary' && userMessage.length > 3) {
      profileUpdates.goals = userMessage;
    }

    return {
      message: content,
      profile: Object.keys(profileUpdates).length > 0 ? profileUpdates : undefined,
      stage,
    };
  } catch (error) {
    console.error('Error generating marketing response:', error);
    throw new Error(`Failed to generate marketing response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateMarketingSummary(profile: ArtistProfile): Promise<MarketingResponse> {
  try {
    const prompt = `Based on this artist profile, provide comprehensive marketing recommendations:

Artist Profile:
- Name: ${profile.name}
- Medium: ${profile.medium}
- Style: ${profile.style}
- Target Audience: ${profile.targetAudience}
- Goals: ${profile.goals}

Please provide:
1. A personalized marketing summary
2. Specific platform recommendations
3. Content strategy suggestions
4. Networking and outreach ideas
5. Next steps for implementation

Format your response as a comprehensive marketing plan with clear sections and actionable advice.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: 'You are an expert art marketing consultant with deep knowledge of the art world, social media marketing, and gallery relationships.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return {
      message: content,
      stage: 'complete',
      recommendations: [
        'Content Strategy',
        'Platform Focus',
        'Networking',
        'Gallery Outreach',
        'Social Media'
      ]
    };
  } catch (error) {
    console.error('Error generating marketing summary:', error);
    throw new Error(`Failed to generate marketing summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const MEDIA_CLASSIFICATION_PROMPT = `You are an expert AI assistant that classifies images for a tattoo and artwork portfolio management system.

Your task is to analyze images and determine if they are:
1. TATTOO - Images of tattoos on skin (including healed tattoos, fresh tattoos, tattoo designs on paper/screens)
2. ARTWORK - Traditional or digital artwork, paintings, drawings, prints, sculptures, etc.
3. UNKNOWN - Neither clearly a tattoo nor artwork (e.g., random photos, text, unclear content)

For each classification, provide:
- A confidence score (0.0 to 1.0) for tattoo and artwork
- Detailed reasoning for your assessment
- Suggested tags for categorization
- Category/style information if applicable
- Body placement for tattoos
- Artistic style for artwork

Return your response as a JSON object with this exact structure:
{
  "detectedType": "tattoo" | "artwork" | "unknown",
  "confidence": 0.0 to 1.0,
  "detections": {
    "tattoo": {
      "score": 0.0 to 1.0,
      "reasoning": "detailed explanation"
    },
    "artwork": {
      "score": 0.0 to 1.0,
      "reasoning": "detailed explanation"
    }
  },
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "category name if applicable",
  "placement": "body placement for tattoos",
  "style": "artistic style description"
}

Focus on accuracy and provide detailed reasoning for your classifications.`;

export async function classifyMediaImage(imageUrl: string): Promise<MediaClassification> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: MEDIA_CLASSIFICATION_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and classify it as tattoo, artwork, or unknown with confidence scores and detailed reasoning.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1200,
      temperature: 0.2, // Lower temperature for more consistent classification
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Clean and parse the JSON response (remove markdown code blocks if present)
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    const classification = JSON.parse(cleanContent) as MediaClassification;
    
    // Validate the response structure
    if (!classification.detectedType || typeof classification.confidence !== 'number' || 
        !classification.detections || !classification.suggestedTags) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure confidence is between 0 and 1
    classification.confidence = Math.max(0, Math.min(1, classification.confidence));

    return classification;
  } catch (error) {
    console.error('Error classifying image with OpenAI:', error);
    
    // Return fallback values if classification fails
    return {
      detectedType: 'unknown',
      confidence: 0.0,
      detections: {
        tattoo: { score: 0.0, reasoning: 'Classification failed' },
        artwork: { score: 0.0, reasoning: 'Classification failed' }
      },
      suggestedTags: ['image', 'unknown'],
    };
  }
} 