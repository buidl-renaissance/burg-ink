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