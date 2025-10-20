import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { inquiries, emails, contacts, contactNotes } from '../../../../db/schema';
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

    // Extract form fields (form.parse returns arrays, so we take the first element)
    const firstName = fields.firstName?.[0];
    const lastName = fields.lastName?.[0];
    const email = fields.email?.[0];
    const phone = fields.phone?.[0];
    const budget = fields.budget?.[0];
    const tattooConcept = fields.tattooConcept?.[0];
    const animalPersonEmotion = fields.animalPersonEmotion?.[0];
    const abstractEnergy = fields.abstractEnergy?.[0];
    const tattooSize = fields.tattooSize?.[0];
    const colorPreference = fields.colorPreference?.[0];
    const newsletterSignup = fields.newsletterSignup?.[0];
    const inquiryType = fields.inquiryType?.[0] || 'tattoo';

    // Validate required fields
    if (!firstName || !lastName || !email || !tattooConcept) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, and tattooConcept are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Process uploaded files
    const photoReferences: string[] = [];
    const placementPhotos: string[] = [];

    // Handle photo reference files
    Object.keys(files).forEach((key) => {
      if (key.startsWith('photoReference_')) {
        const fileArray = files[key] as formidable.File | formidable.File[];
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file && file.filepath) {
              photoReferences.push(file.filepath);
            }
          });
        } else if (fileArray && fileArray.filepath) {
          photoReferences.push(fileArray.filepath);
        }
      }
    });

    // Handle placement photo files
    Object.keys(files).forEach((key) => {
      if (key.startsWith('placementPhoto_')) {
        const fileArray = files[key] as formidable.File | formidable.File[];
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file && file.filepath) {
              placementPhotos.push(file.filepath);
            }
          });
        } else if (fileArray && fileArray.filepath) {
          placementPhotos.push(fileArray.filepath);
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

    // Debug: Log the values being inserted
    console.log('Inquiry data being inserted:', {
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      budget: budget,
      tattoo_concept: tattooConcept,
      animal_person_emotion: animalPersonEmotion,
      abstract_energy: abstractEnergy,
      tattoo_size: tattooSize,
      color_preference: colorPreference,
      photo_references: photoReferences,
      placement_photos: placementPhotos,
      newsletter_signup: newsletterSignup,
      inquiry_type: inquiryType,
      message: message,
    });

    // Check if contact already exists
    let contactId = null;
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.email, email)
    });

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      // Create new contact
      const [newContact] = await db.insert(contacts).values({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        source: 'website',
        lifecycle_stage: 'lead',
        tags: JSON.stringify(['inquiry']),
        custom_fields: JSON.stringify({}),
        is_active: 1
      }).returning();
      contactId = newContact.id;
    }

    // Insert inquiry into database
    const [newInquiry] = await db.insert(inquiries).values({
      contact_id: contactId, // Link to contact
      name: `${firstName} ${lastName}`, // Required field
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone || null,
      budget: budget || null,
      tattoo_concept: tattooConcept,
      animal_person_emotion: animalPersonEmotion || null,
      abstract_energy: abstractEnergy || null,
      tattoo_size: tattooSize || null,
      color_preference: colorPreference || null,
      photo_references: photoReferences && photoReferences.length > 0 ? JSON.stringify(photoReferences) : null,
      placement_photos: placementPhotos && placementPhotos.length > 0 ? JSON.stringify(placementPhotos) : null,
      newsletter_signup: newsletterSignup === 'true' ? 1 : 0, // integer
      inquiry_type: inquiryType,
      message: message || '', // Required field - use empty string instead of null
      status: 'new',
      email_sent: 0, // integer
    }).returning();

    // Add inquiry as contact note
    if (contactId) {
      await db.insert(contactNotes).values({
        contact_id: contactId,
        user_id: 1, // System user ID - you might want to create a system user
        note_type: 'inquiry',
        content: `New ${inquiryType} inquiry submitted: ${tattooConcept}`
      });
    }

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
