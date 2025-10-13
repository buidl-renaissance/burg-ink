import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { inquiries, emails } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { generateInquiryNotificationEmail } from '../../../lib/emailTemplates';
import formidable from 'formidable';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data with formidable
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB per file
    });

    const [fields, files] = await form.parse(req);

    // Extract form fields
    const {
      firstName,
      lastName,
      email,
      phone,
      budget,
      tattooConcept,
      animalPersonEmotion,
      abstractEnergy,
      tattooSize,
      colorPreference,
      newsletterSignup,
      inquiryType = 'tattoo',
    } = fields;

    // Validate required fields
    if (!firstName || !lastName || !email || !tattooConcept) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, and tattooConcept are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email as string)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Process uploaded files
    const photoReferences: string[] = [];
    const placementPhotos: string[] = [];

    // Handle photo reference files
    Object.keys(files).forEach((key) => {
      if (key.startsWith('photoReference_')) {
        const file = files[key] as formidable.File;
        if (file) {
          photoReferences.push(file.filepath);
        }
      }
    });

    // Handle placement photo files
    Object.keys(files).forEach((key) => {
      if (key.startsWith('placementPhoto_')) {
        const file = files[key] as formidable.File;
        if (file) {
          placementPhotos.push(file.filepath);
        }
      }
    });

    // Create a comprehensive message for backward compatibility
    const message = `
Tattoo Concept: ${tattooConcept}
${animalPersonEmotion ? `Animal/Person Emotion: ${animalPersonEmotion}` : ''}
${abstractEnergy ? `Abstract Energy: ${abstractEnergy}` : ''}
Size: ${tattooSize}
Color Preference: ${colorPreference}
Budget: ${budget}
Phone: ${phone}
Newsletter Signup: ${newsletterSignup === 'true' ? 'Yes' : 'No'}
    `.trim();

    // Insert inquiry into database
    const [newInquiry] = await db.insert(inquiries).values({
      first_name: firstName as string,
      last_name: lastName as string,
      email: email as string,
      phone: phone as string || null,
      budget: budget as string || null,
      tattoo_concept: tattooConcept as string,
      animal_person_emotion: animalPersonEmotion as string || null,
      abstract_energy: abstractEnergy as string || null,
      tattoo_size: tattooSize as string || null,
      color_preference: colorPreference as string || null,
      photo_references: photoReferences.length > 0 ? JSON.stringify(photoReferences) : null,
      placement_photos: placementPhotos.length > 0 ? JSON.stringify(placementPhotos) : null,
      newsletter_signup: newsletterSignup === 'true' ? 1 : 0,
      inquiry_type: inquiryType as string,
      message, // Legacy field
      status: 'new',
      email_sent: 0,
    }).returning();

    // Send email notification to Andrea
    try {
      const fullName = `${firstName} ${lastName}`;
      const emailTemplate = generateInquiryNotificationEmail({
        name: fullName,
        email: email as string,
        phone: phone as string,
        inquiryType: inquiryType as string,
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
          inquiry_name: fullName,
          inquiry_email: email as string,
          inquiry_type: inquiryType as string
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
