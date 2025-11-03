import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { contacts, users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get full user data from database to check role
    const userData = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
      columns: {
        role: true
      }
    });

    // Check if user has admin or artist permissions
    if (!userData || !userData.role || !['admin', 'artist'].includes(userData.role)) {
      return res.status(403).json({ error: 'Admin or artist access required' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contacts: contactsData, updateExisting = false } = req.body;

    if (!Array.isArray(contactsData) || contactsData.length === 0) {
      return res.status(400).json({ error: 'Contacts array is required and must not be empty' });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number, error: string }>
    };

    for (let i = 0; i < contactsData.length; i++) {
      const contactData = contactsData[i];
      
      try {
        // Validate required fields
        if (!contactData.first_name || !contactData.last_name || !contactData.email) {
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields: first_name, last_name, or email'
          });
          continue;
        }

        // Check if contact already exists
        const existingContact = await db.query.contacts.findFirst({
          where: eq(contacts.email, contactData.email)
        });

        if (existingContact) {
          if (updateExisting) {
            // Update existing contact
            await db
              .update(contacts)
              .set({
                first_name: contactData.first_name,
                last_name: contactData.last_name,
                phone: contactData.phone || existingContact.phone,
                company: contactData.company || existingContact.company,
                job_title: contactData.job_title || existingContact.job_title,
                source: contactData.source || existingContact.source,
                lifecycle_stage: contactData.lifecycle_stage || existingContact.lifecycle_stage,
                tags: contactData.tags ? JSON.stringify(contactData.tags) : existingContact.tags,
                custom_fields: contactData.custom_fields ? JSON.stringify(contactData.custom_fields) : existingContact.custom_fields,
                notes: contactData.notes || existingContact.notes,
                avatar_url: contactData.avatar_url || existingContact.avatar_url,
                updated_at: new Date().toISOString()
              })
              .where(eq(contacts.id, existingContact.id));
            
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Create new contact
          await db.insert(contacts).values({
            first_name: contactData.first_name,
            last_name: contactData.last_name,
            email: contactData.email,
            phone: contactData.phone || null,
            company: contactData.company || null,
            job_title: contactData.job_title || null,
            source: contactData.source || 'import',
            lifecycle_stage: contactData.lifecycle_stage || 'lead',
            tags: JSON.stringify(contactData.tags || []),
            custom_fields: JSON.stringify(contactData.custom_fields || {}),
            notes: contactData.notes || null,
            avatar_url: contactData.avatar_url || null,
            is_active: 1
          });
          
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    console.error('Contact import API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
