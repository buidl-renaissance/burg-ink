import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { websiteSettings } from '../../../../db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch all website settings
      const settings = await db.select().from(websiteSettings);
      
      // Convert to key-value object
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      res.status(200).json({ settings: settingsObj });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const { settings } = req.body;

      // Update or insert each setting
      for (const [key, value] of Object.entries(settings)) {
        await db
          .insert(websiteSettings)
          .values({
            key,
            value: String(value),
            description: getSettingDescription(key),
            updated_at: new Date().toISOString()
          })
          .onConflictDoUpdate({
            target: websiteSettings.key,
            set: {
              value: String(value),
              updated_at: new Date().toISOString()
            }
          });
      }

      res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    site_name: 'The name of the website',
    site_description: 'A brief description of the website',
    site_url: 'The main URL of the website',
    contact_email: 'Contact email address for the website',
    theme: 'Default theme for the website (light/dark/auto)',
    primary_color: 'Primary brand color (hex code)',
    secondary_color: 'Secondary brand color (hex code)',
    accent_color: 'Accent brand color (hex code)',
    logo_url: 'URL of the website logo',
    favicon_url: 'URL of the website favicon',
    font_family: 'Default font family for the website',
    font_size: 'Base font size in pixels',
    default_user_role: 'Default role assigned to new users',
    max_login_attempts: 'Maximum login attempts before lockout',
    session_timeout: 'Session timeout in hours',
    password_min_length: 'Minimum password length',
    require_strong_password: 'Whether to require strong passwords'
  };

  return descriptions[key] || 'Website setting';
}
