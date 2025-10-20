import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { contacts } from '../../../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin or artist permissions
    if (!['admin', 'artist'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Admin or artist access required' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
      format = 'json',
      tags = '', 
      stage = '',
      source = '',
      search = '',
      active = 'true'
    } = req.query;

    // Build query conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(contacts.first_name, `%${search}%`),
          like(contacts.last_name, `%${search}%`),
          like(contacts.email, `%${search}%`),
          like(contacts.company, `%${search}%`)
        )
      );
    }
    
    if (stage) {
      conditions.push(eq(contacts.lifecycle_stage, stage as string));
    }
    
    if (source) {
      conditions.push(eq(contacts.source, source as string));
    }
    
    if (active !== 'all') {
      conditions.push(eq(contacts.is_active, active === 'true' ? 1 : 0));
    }
    
    if (tags) {
      const tagList = tags.split(',');
      // Filter contacts that have any of the specified tags
      const tagConditions = tagList.map(tag => 
        sql`json_extract(${contacts.tags}, '$') LIKE ${`%"${tag.trim()}"%`}`
      );
      conditions.push(or(...tagConditions));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all contacts matching the filters
    const contactsList = await db
      .select()
      .from(contacts)
      .where(whereClause)
      .orderBy(sql`${contacts.created_at} DESC`);

    // Transform data for export
    const exportData = contactsList.map(contact => ({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      job_title: contact.job_title,
      source: contact.source,
      lifecycle_stage: contact.lifecycle_stage,
      tags: JSON.parse(contact.tags || '[]'),
      custom_fields: JSON.parse(contact.custom_fields || '{}'),
      notes: contact.notes,
      avatar_url: contact.avatar_url,
      is_active: contact.is_active === 1,
      last_contacted_at: contact.last_contacted_at,
      created_at: contact.created_at,
      updated_at: contact.updated_at
    }));

    if (format === 'csv') {
      // Generate CSV
      if (exportData.length === 0) {
        return res.status(200).json({
          message: 'No contacts found to export',
          csv: ''
        });
      }

      // Get all possible keys from all contacts (including custom fields)
      const allKeys = new Set<string>();
      exportData.forEach(contact => {
        Object.keys(contact).forEach(key => allKeys.add(key));
        if (contact.custom_fields && typeof contact.custom_fields === 'object') {
          Object.keys(contact.custom_fields).forEach(key => allKeys.add(`custom_${key}`));
        }
      });

      const headers = Array.from(allKeys).sort();
      
      // Create CSV content
      const csvRows = [headers.join(',')];
      
      exportData.forEach(contact => {
        const row = headers.map(header => {
          let value = '';
          
          if (header.startsWith('custom_')) {
            const customKey = header.replace('custom_', '');
            value = contact.custom_fields?.[customKey] || '';
          } else {
            value = contact[header] || '';
          }
          
          // Escape CSV values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          } else if (Array.isArray(value)) {
            value = value.join(';');
          } else if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          
          return value;
        });
        
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="contacts-export-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.status(200).send(csvContent);
    } else {
      // Return JSON
      return res.status(200).json({
        message: 'Export completed',
        count: exportData.length,
        contacts: exportData,
        filters: {
          tags,
          stage,
          source,
          search,
          active
        }
      });
    }
  } catch (error) {
    console.error('Contact export API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
