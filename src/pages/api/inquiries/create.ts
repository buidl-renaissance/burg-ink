import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { inquiries, emails } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { generateInquiryNotificationEmail } from '../../../lib/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, inquiryType, message } = req.body;

    // Validate required fields
    if (!name || !email || !inquiryType || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, inquiryType, and message are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Insert inquiry into database
    const [newInquiry] = await db.insert(inquiries).values({
      name,
      email,
      phone: phone || null,
      inquiry_type: inquiryType,
      message,
      status: 'new',
      email_sent: 0,
    }).returning();

    // Send email notification to Andrea
    try {
      const emailTemplate = generateInquiryNotificationEmail({
        name,
        email,
        phone,
        inquiryType,
        message,
        inquiryId: newInquiry.id
      });

      const emailResult = await resend.emails.send({
        from: 'Burg Ink <noreply@burg-ink.com>',
        to: ['andrea@burg-ink.com'], // Replace with Andrea's actual email
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      // Log the email in the database
      await db.insert(emails).values({
        resend_id: emailResult.data?.id || null,
        subject: emailTemplate.subject,
        from: 'Burg Ink <noreply@burg-ink.com>',
        to: JSON.stringify(['andrea@burg-ink.com']),
        html_content: emailTemplate.html,
        status: 'sent',
        sent_at: new Date().toISOString(),
        inquiry_id: newInquiry.id,
        metadata: JSON.stringify({
          inquiry_name: name,
          inquiry_email: email,
          inquiry_type: inquiryType
        })
      });

      // Update inquiry record to mark email as sent
      await db.update(inquiries)
        .set({ 
          email_sent: 1, 
          email_sent_at: new Date().toISOString() 
        })
        .where(eq(inquiries.id, newInquiry.id));

      console.log('Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.status(201).json({ 
      success: true, 
      message: 'Inquiry submitted successfully',
      inquiryId: newInquiry.id 
    });

  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to submit inquiry. Please try again later.' 
    });
  }
}
