import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { media, tattoos, artists } from '../../../../db/schema';
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
    if (mediaRecord.suggested_entity_id && mediaRecord.suggested_entity_type === 'tattoo') {
      return res.status(409).json({ 
        error: 'Media already linked to a tattoo',
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
    const baseTitle = mediaRecord.title || mediaRecord.filename || 'Untitled Tattoo';
    const slug = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    // Create tattoo data with AI-suggested fields
    const tattooData = {
      slug,
      title: classification?.suggestedTags?.find(tag => 
        tag.toLowerCase().includes('tattoo') || 
        tag.toLowerCase().includes('design')
      ) || baseTitle,
      description: mediaRecord.description || 
        (classification ? `AI-detected ${classification.detectedType} with ${Math.round((classification.confidence || 0) * 100)}% confidence` : 'Created from media'),
      artist_id: defaultArtist?.id || null,
      image: mediaRecord.medium_url || mediaRecord.original_url,
      category: classification?.suggestedCategory || 'Traditional',
      placement: classification?.placement || 'Arm',
      size: (classification?.detections?.tattoo?.score ?? 0) > 0.7 ? 'Medium' : 'Large',
      style: classification?.style || 'Custom',
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
          placement: classification?.placement,
          style: classification?.style
        }
      })
    };

    // Create the tattoo
    const newTattoo = await db.insert(tattoos).values(tattooData).returning();

    // Update media record to link it to the created tattoo
    await db.update(media)
      .set({
        suggested_entity_id: newTattoo[0].id,
        suggested_entity_type: 'tattoo'
      })
      .where(eq(media.id, mediaId));

    res.status(201).json({
      success: true,
      tattoo: newTattoo[0],
      media: {
        id: mediaId,
        linked_entity_id: newTattoo[0].id,
        linked_entity_type: 'tattoo'
      },
      ai_suggestions: {
        confidence: classification?.confidence || 0,
        detected_type: classification?.detectedType || 'unknown',
        suggested_tags: classification?.suggestedTags || [],
        suggested_category: classification?.suggestedCategory,
        suggested_placement: classification?.placement,
        suggested_style: classification?.style
      }
    });

  } catch (error) {
    console.error('Error creating tattoo from media:', error);
    res.status(500).json({ 
      error: 'Failed to create tattoo from media',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


