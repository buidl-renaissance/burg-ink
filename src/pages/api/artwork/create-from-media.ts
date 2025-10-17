import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { media, artwork, artists } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { MediaClassification } from '../../../lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mediaId, artistId, additionalData } = req.body;

    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    // Fetch the media record
    const mediaRecord = await db.query.media.findFirst({
      where: eq(media.id, mediaId)
    });

    if (!mediaRecord) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Check if media already has a linked entity
    if (mediaRecord.suggested_entity_id && mediaRecord.suggested_entity_type === 'artwork') {
      return res.status(409).json({ 
        error: 'Media already linked to an artwork',
        entityId: mediaRecord.suggested_entity_id
      });
    }

    // Parse classification data
    let classification: MediaClassification | null = null;
    if (mediaRecord.detections) {
      try {
        classification = JSON.parse(mediaRecord.detections) as MediaClassification;
      } catch (error) {
        console.warn('Failed to parse classification data:', error);
      }
    }

    // Get default artist if not provided
    let defaultArtist = null;
    if (artistId) {
      defaultArtist = await db.query.artists.findFirst({
        where: eq(artists.id, artistId)
      });
    }

    // Generate slug from title or filename
    const baseTitle = mediaRecord.title || mediaRecord.filename || 'Untitled Artwork';
    const slug = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    // Determine artwork type based on classification or filename
    let artworkType = 'artwork';
    if (mediaRecord.filename) {
      const filename = mediaRecord.filename.toLowerCase();
      if (filename.includes('painting') || filename.includes('paint')) {
        artworkType = 'painting';
      } else if (filename.includes('drawing') || filename.includes('sketch')) {
        artworkType = 'drawing';
      } else if (filename.includes('digital') || filename.includes('illustration')) {
        artworkType = 'digital';
      } else if (filename.includes('print') || filename.includes('poster')) {
        artworkType = 'print';
      }
    }

    // Create artwork data with AI-suggested fields
    const artworkData = {
      slug,
      title: classification?.suggestedTags?.find(tag => 
        tag.toLowerCase().includes('art') || 
        tag.toLowerCase().includes('painting') ||
        tag.toLowerCase().includes('drawing')
      ) || baseTitle,
      description: mediaRecord.description || 
        (classification ? `AI-detected ${classification.detectedType} with ${Math.round((classification.confidence || 0) * 100)}% confidence` : 'Created from media'),
      type: artworkType,
      artist_id: defaultArtist?.id || null,
      image: mediaRecord.medium_url || mediaRecord.original_url,
      category: classification?.suggestedCategory || 'General',
      meta: JSON.stringify({
        source_media_id: mediaId,
        ai_classification: classification,
        created_from_media: true,
        confidence: classification?.confidence || 0,
        ...additionalData
      }),
      data: JSON.stringify({
        original_media: {
          id: mediaId,
          filename: mediaRecord.filename,
          mime_type: mediaRecord.mime_type,
          size: mediaRecord.size,
          width: mediaRecord.width,
          height: mediaRecord.height
        },
        ai_suggestions: {
          tags: classification?.suggestedTags || [],
          category: classification?.suggestedCategory,
          style: classification?.style
        }
      })
    };

    // Create the artwork
    const newArtwork = await db.insert(artwork).values(artworkData).returning();

    // Update media record to link it to the created artwork
    await db.update(media)
      .set({
        suggested_entity_id: newArtwork[0].id,
        suggested_entity_type: 'artwork'
      })
      .where(eq(media.id, mediaId));

    res.status(201).json({
      success: true,
      artwork: newArtwork[0],
      media: {
        id: mediaId,
        linked_entity_id: newArtwork[0].id,
        linked_entity_type: 'artwork'
      },
      ai_suggestions: {
        confidence: classification?.confidence || 0,
        detected_type: classification?.detectedType || 'unknown',
        suggested_tags: classification?.suggestedTags || [],
        suggested_category: classification?.suggestedCategory,
        suggested_style: classification?.style
      }
    });

  } catch (error) {
    console.error('Error creating artwork from media:', error);
    res.status(500).json({ 
      error: 'Failed to create artwork from media',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
