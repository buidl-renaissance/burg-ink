# Inquiries System Setup

This document explains the inquiries system that has been added to the Burg Ink website.

## Overview

The inquiries system allows customers to submit inquiries through the website, stores them in the database, and automatically sends email notifications to Andrea.

## Features

- **Customer Inquiry Form**: Located at `/inquire` page
- **Database Storage**: All inquiries are stored in the `inquiries` table
- **Email Notifications**: Automatic email notifications sent to Andrea via Resend
- **Admin Management**: Admin panel to view, filter, and manage inquiries
- **Status Tracking**: Track inquiry status (new, contacted, completed, archived)
- **Internal Notes**: Add internal notes to inquiries

## Database Schema

The `inquiries` table includes the following fields:

- `id`: Primary key
- `name`: Customer name (required)
- `email`: Customer email (required)
- `phone`: Customer phone (optional)
- `inquiry_type`: Type of inquiry (tattoo, artwork, collaboration, other)
- `message`: Customer message (required)
- `status`: Current status (new, contacted, completed, archived)
- `email_sent`: Boolean flag for email notification sent
- `email_sent_at`: Timestamp when email was sent
- `notes`: Internal notes
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## API Endpoints

### POST `/api/inquiries/create`
Creates a new inquiry and sends email notification.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "inquiryType": "tattoo",
  "message": "I'm interested in getting a tattoo..."
}
```

### GET `/api/inquiries`
Lists all inquiries with optional filtering.

**Query Parameters:**
- `status`: Filter by status
- `type`: Filter by inquiry type
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

### GET `/api/inquiries/[id]`
Gets a specific inquiry by ID.

### PATCH `/api/inquiries/[id]`
Updates inquiry status or notes.

**Request Body:**
```json
{
  "status": "contacted",
  "notes": "Customer contacted via phone"
}
```

## Email Templates

The system uses two email templates:

1. **Notification Email**: Sent to Andrea when a new inquiry is submitted
2. **Confirmation Email**: Can be sent to customers (not currently implemented)

Email templates are defined in `src/lib/emailTemplates.ts`.

## Admin Panel

Access the inquiries management panel at `/admin/inquiries`.

Features:
- View all inquiries in a table format
- Filter by status and type
- Update inquiry status
- View full inquiry details in a modal
- Add/edit internal notes
- Click email/phone links to contact customers

## Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
RESEND_API_KEY=your_resend_api_key_here
```

## Resend Setup

1. Sign up for a Resend account at https://resend.com
2. Get your API key from the dashboard
3. Add the API key to your environment variables
4. Update the "from" email address in the API endpoint to match your verified domain
5. Update the "to" email address to Andrea's actual email address

## Email Configuration

In `src/pages/api/inquiries/create.ts`, update these lines:

```typescript
from: 'Burg Ink <noreply@burg-ink.com>', // Update to your verified domain
to: ['andrea@burg-ink.com'], // Update to Andrea's actual email
```

## Database Migration

The inquiries table was created with migration `0012_new_chamber.sql`. If you need to run the migration:

```bash
yarn db:migrate
```

## Usage

1. Customers visit `/inquire` and fill out the form
2. Form submission creates an inquiry record in the database
3. Email notification is automatically sent to Andrea
4. Andrea can manage inquiries through the admin panel at `/admin/inquiries`
5. Status can be updated as inquiries are processed

## Customization

### Adding New Inquiry Types

1. Update the form options in `src/pages/inquire.tsx`
2. Update the admin panel filters in `src/pages/admin/inquiries.tsx`
3. Update the email template if needed

### Modifying Email Templates

Edit the templates in `src/lib/emailTemplates.ts` to match your branding and requirements.

### Adding New Statuses

1. Update the database schema if needed
2. Update the admin panel status options
3. Update the status badge styling

## Troubleshooting

### Email Not Sending
- Check that `RESEND_API_KEY` is set correctly
- Verify the "from" email domain is verified in Resend
- Check the server logs for email errors

### Database Issues
- Run `yarn db:migrate` to ensure migrations are applied
- Check that the database connection is working

### Form Not Submitting
- Check browser console for JavaScript errors
- Verify the API endpoint is accessible
- Check server logs for API errors
