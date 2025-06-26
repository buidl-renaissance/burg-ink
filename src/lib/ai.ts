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