import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { inquiries } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

type InquiryUpdateData = {
  status?: string;
  notes?: string;
  updated_at: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const inquiryId = parseInt(id as string, 10);

  if (isNaN(inquiryId)) {
    return res.status(400).json({ error: 'Invalid inquiry ID' });
  }

  if (req.method === 'GET') {
    try {
      const [inquiry] = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.id, inquiryId));

      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }

      res.status(200).json({ inquiry });
    } catch (error) {
      console.error('Error fetching inquiry:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch inquiry' 
      });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { status, notes } = req.body;

      const updateData: InquiryUpdateData = {
        updated_at: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const [updatedInquiry] = await db
        .update(inquiries)
        .set(updateData)
        .where(eq(inquiries.id, inquiryId))
        .returning();

      if (!updatedInquiry) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }

      res.status(200).json({ 
        success: true,
        inquiry: updatedInquiry 
      });
    } catch (error) {
      console.error('Error updating inquiry:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to update inquiry' 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
