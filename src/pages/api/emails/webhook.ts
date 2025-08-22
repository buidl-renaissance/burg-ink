import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { emails } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

// Define interfaces for Resend webhook data
interface ResendWebhookData {
  email_id: string;
  created_at: string;
  from: string;
  to: string[];
  subject: string;
  reason?: string;
}

interface ResendWebhookBody {
  type: string;
  data: ResendWebhookData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body as ResendWebhookBody;

    console.log('Resend webhook received:', { type, data });

    // Handle different webhook events
    switch (type) {
      case 'email.delivered':
        await handleEmailDelivered(data);
        break;
      case 'email.delivery_delayed':
        await handleEmailDeliveryDelayed(data);
        break;
      case 'email.bounced':
        await handleEmailBounced(data);
        break;
      case 'email.complained':
        await handleEmailComplained(data);
        break;
      case 'email.opened':
        await handleEmailOpened(data);
        break;
      case 'email.clicked':
        await handleEmailClicked(data);
        break;
      case 'email.unsubscribed':
        await handleEmailUnsubscribed(data);
        break;
      default:
        console.log('Unhandled webhook type:', type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleEmailDelivered(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}

async function handleEmailDeliveryDelayed(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      status: 'delayed',
      error_message: data.reason || 'Delivery delayed',
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}

async function handleEmailBounced(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      status: 'bounced',
      bounced_at: new Date().toISOString(),
      error_message: data.reason || 'Email bounced',
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}

async function handleEmailComplained(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      status: 'complained',
      complained_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}

async function handleEmailOpened(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}

async function handleEmailClicked(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      clicked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}

async function handleEmailUnsubscribed(data: ResendWebhookData) {
  await db.update(emails)
    .set({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .where(eq(emails.resend_id, data.email_id));
}
