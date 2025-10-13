import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VisionAnalysisResult {
  tags: string[];
  description: string;
  altText: string;
  confidence: number;
}

export interface VisionAnalysisOptions {
  maxTags?: number;
  includeConfidence?: boolean;
  focusAreas?: string[];
}

/**
 * Analyze an image using OpenAI Vision API to extract tags, description, and alt text
 */
export async function analyzeImageWithVision(
  imageUrl: string,
  options: VisionAnalysisOptions = {}
): Promise<VisionAnalysisResult> {
  const {
    maxTags = 10,
    focusAreas = []
  } = options;

  try {
    const prompt = `Analyze this image and provide:
1. A list of ${maxTags} relevant tags (comma-separated, no numbers or special characters)
2. A brief description (1-2 sentences)
3. Alt text for accessibility (descriptive, concise)

${focusAreas.length > 0 ? `Focus on: ${focusAreas.join(', ')}` : ''}

Format your response as JSON:
{
  "tags": ["tag1", "tag2", ...],
  "description": "Brief description of the image",
  "altText": "Accessible description of the image"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI Vision API');
    }

    // Parse the JSON response
    let analysisData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse AI analysis response');
    }

    // Validate and clean the response
    const result: VisionAnalysisResult = {
      tags: Array.isArray(analysisData.tags) 
        ? analysisData.tags.slice(0, maxTags).map((tag: string) => 
            tag.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '')
          ).filter((tag: string) => tag.length > 0)
        : [],
      description: typeof analysisData.description === 'string' 
        ? analysisData.description.trim() 
        : '',
      altText: typeof analysisData.altText === 'string' 
        ? analysisData.altText.trim() 
        : '',
      confidence: 0.8 // Default confidence, could be enhanced with actual confidence scoring
    };

    return result;
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    
    // Return fallback analysis
    return {
      tags: ['image', 'media'],
      description: 'An image that requires manual analysis',
      altText: 'Image requiring description',
      confidence: 0.1
    };
  }
}

/**
 * Batch analyze multiple images
 */
export async function batchAnalyzeImages(
  imageUrls: string[],
  options: VisionAnalysisOptions = {}
): Promise<VisionAnalysisResult[]> {
  const results: VisionAnalysisResult[] = [];
  
  // Process images sequentially to avoid rate limits
  for (const imageUrl of imageUrls) {
    try {
      const result = await analyzeImageWithVision(imageUrl, options);
      results.push(result);
      
      // Add small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to analyze image ${imageUrl}:`, error);
      results.push({
        tags: ['error', 'unanalyzed'],
        description: 'Failed to analyze this image',
        altText: 'Image analysis failed',
        confidence: 0.0
      });
    }
  }
  
  return results;
}

/**
 * Extract specific information from an image (e.g., text, objects, colors)
 */
export async function extractImageMetadata(
  imageUrl: string,
  extractionType: 'text' | 'objects' | 'colors' | 'faces' | 'all' = 'all'
): Promise<Record<string, unknown>> {
  try {
    const prompts = {
      text: "Extract all visible text from this image. Return as JSON with 'text' field containing an array of text strings.",
      objects: "Identify all objects, people, and items in this image. Return as JSON with 'objects' field containing an array of object names.",
      colors: "Identify the dominant colors in this image. Return as JSON with 'colors' field containing an array of color names.",
      faces: "Detect and describe any faces in this image. Return as JSON with 'faces' field containing an array of face descriptions.",
      all: "Extract comprehensive metadata from this image including text, objects, colors, and faces. Return as JSON with separate fields for each."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompts[extractionType]
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI Vision API');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return {};
  }
}
