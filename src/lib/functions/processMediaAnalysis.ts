import { inngest } from '../inngest';
import { db } from '../db';
import { media } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { analyzeImageWithVision, extractImageMetadata } from '../ai/visionAnalysis';

interface MediaAnalysisPayload {
  mediaId: number;
  imageUrl: string;
  filename: string;
  mimeType: string;
}

/**
 * Process AI analysis for a media file
 */
export const processMediaAnalysis = inngest.createFunction(
  { 
    id: "process-media-analysis",
    name: "Process Media AI Analysis",
    concurrency: 3 // Limit concurrent analysis to avoid rate limits
  },
  { event: "media.analyze" },
  async ({ event, step }) => {
    const { mediaId, imageUrl, filename, mimeType } = event.data as MediaAnalysisPayload;

    // Only process images
    if (!mimeType.startsWith('image/')) {
      console.log(`Skipping AI analysis for non-image file: ${filename}`);
      return { mediaId, status: 'skipped', reason: 'Not an image' };
    }

    try {
      // Step 1: Perform AI analysis
      const analysisResult = await step.run("analyze-image", async () => {
        console.log(`Starting AI analysis for media ${mediaId}: ${filename}`);
        
        const result = await analyzeImageWithVision(imageUrl, {
          maxTags: 15,
          includeConfidence: true,
          focusAreas: ['art', 'design', 'photography', 'visual elements']
        });
        
        console.log(`AI analysis completed for media ${mediaId}:`, {
          tagsCount: result.tags.length,
          hasDescription: !!result.description,
          hasAltText: !!result.altText
        });
        
        return result;
      });

      // Step 2: Extract additional metadata
      const metadata = await step.run("extract-metadata", async () => {
        try {
          const extracted = await extractImageMetadata(imageUrl, 'all');
          console.log(`Metadata extracted for media ${mediaId}:`, Object.keys(extracted));
          return extracted;
        } catch (error) {
          console.error(`Failed to extract metadata for media ${mediaId}:`, error);
          return {};
        }
      });

      // Step 3: Update media record with analysis results
      await step.run("update-media-record", async () => {
        const updateData: Record<string, unknown> = {
          processing_status: 'completed',
          tags: JSON.stringify(analysisResult.tags),
          description: analysisResult.description,
          alt_text: analysisResult.altText,
          ai_analysis: JSON.stringify({
            tags: analysisResult.tags,
            description: analysisResult.description,
            altText: analysisResult.altText,
            confidence: analysisResult.confidence,
            metadata: metadata,
            analyzedAt: new Date().toISOString(),
            model: 'gpt-4-vision-preview'
          }),
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await db.update(media)
          .set(updateData)
          .where(eq(media.id, mediaId));

        console.log(`Media ${mediaId} updated with AI analysis results`);
      });

      return {
        mediaId,
        status: 'completed',
        tags: analysisResult.tags,
        description: analysisResult.description,
        altText: analysisResult.altText,
        confidence: analysisResult.confidence
      };

    } catch (error) {
      console.error(`AI analysis failed for media ${mediaId}:`, error);
      
      // Update media record with error status
      await step.run("update-error-status", async () => {
        await db.update(media)
          .set({
            processing_status: 'failed',
            ai_analysis: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              failedAt: new Date().toISOString()
            }),
            updated_at: new Date().toISOString(),
          })
          .where(eq(media.id, mediaId));
      });

      return {
        mediaId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

/**
 * Trigger AI analysis for a media file
 */
export async function triggerMediaAnalysis(mediaId: number, imageUrl: string, filename: string, mimeType: string) {
  try {
    await inngest.send({
      name: 'media.analyze',
      data: {
        mediaId,
        imageUrl,
        filename,
        mimeType
      }
    });
    
    console.log(`Triggered AI analysis for media ${mediaId}`);
  } catch (error) {
    console.error(`Failed to trigger AI analysis for media ${mediaId}:`, error);
    throw error;
  }
}
