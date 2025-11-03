import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { websiteSettings } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get specific setting by key or all settings
      const { key } = req.query;

      if (key) {
        // Fetch specific setting by key
        const setting = await db.query.websiteSettings.findFirst({
          where: eq(websiteSettings.key, key as string)
        });

        if (!setting) {
          return res.status(404).json({ error: 'Setting not found' });
        }

        return res.status(200).json({
          key: setting.key,
          value: setting.value,
          description: setting.description
        });
      } else {
        // Fetch all settings
        const allSettings = await db.query.websiteSettings.findMany();
        
        const settingsMap = allSettings.reduce((acc, setting) => {
          acc[setting.key] = {
            value: setting.value,
            description: setting.description || undefined
          };
          return acc;
        }, {} as Record<string, { value: string; description?: string }>);

        return res.status(200).json({
          settings: settingsMap
        });
      }

    } else if (req.method === 'POST') {
      // Create or update a setting
      const { key, value, description } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
      }

      // Check if setting already exists
      const existingSetting = await db.query.websiteSettings.findFirst({
        where: eq(websiteSettings.key, key)
      });

      if (existingSetting) {
        // Update existing setting
        await db.update(websiteSettings)
          .set({
            value: value,
            description: description || existingSetting.description,
            updated_at: new Date().toISOString()
          })
          .where(eq(websiteSettings.key, key));

        return res.status(200).json({
          message: 'Setting updated successfully',
          key,
          value,
          description
        });
      } else {
        // Create new setting
        await db.insert(websiteSettings).values({
          key,
          value,
          description
        });

        return res.status(201).json({
          message: 'Setting created successfully',
          key,
          value,
          description
        });
      }

    } else if (req.method === 'DELETE') {
      // Delete a setting
      const { key } = req.query;

      if (!key) {
        return res.status(400).json({ error: 'Key is required for deletion' });
      }

      await db.delete(websiteSettings)
        .where(eq(websiteSettings.key, key as string));

      return res.status(200).json({
        message: 'Setting deleted successfully',
        key
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Website settings API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
