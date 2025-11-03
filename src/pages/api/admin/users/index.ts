import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../db';
import { users, userActivityLogs, userInvitations, emails } from '../../../../../db/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';
import { generateUserInvitationEmail } from '@/lib/emailTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get full user data from database to check role
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
      columns: {
        role: true,
      }
    });

    if (!currentUserData || currentUserData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetUsers(req, res);
      case 'POST':
        return handleCreateUser(req, res, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  const { 
    page = '1', 
    limit = '50', 
    search = '', 
    role = '', 
    status = '',
    verified = ''
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build query conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }
  
  if (role) {
    conditions.push(eq(users.role, role as string));
  }
  
  if (status) {
    conditions.push(eq(users.status, status as string));
  }
  
  if (verified !== '') {
    conditions.push(eq(users.is_verified, verified === 'true' ? 1 : 0));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get users with pagination
  const userList = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.created_at))
    .limit(limitNum)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(whereClause);

  // Get user stats
  const [activeUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.status, 'active'));

  const [verifiedUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.is_verified, 1));

  const [adminUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, 'admin'));

  return res.status(200).json({
    users: userList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    },
    stats: {
      total: count,
      active: activeUsers.count,
      verified: verifiedUsers.count,
      admins: adminUsers.count
    }
  });
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse, currentUserId: number) {
  const { 
    name, 
    email, 
    role = 'user', 
    sendInvitation = false,
    password 
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existingUser) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  try {
    if (sendInvitation) {
      // Create invitation instead of user
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const [invitation] = await db.insert(userInvitations).values({
        email,
        role,
        invited_by: currentUserId,
        token,
        expires_at: expiresAt.toISOString()
      }).returning();

      // Get the admin user's name for the email
      const adminUser = await db.query.users.findFirst({
        where: eq(users.id, currentUserId),
        columns: { name: true }
      });

      // Generate invitation link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const invitationLink = `${baseUrl}/register?token=${token}`;

      // Send invitation email
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailTemplate = generateUserInvitationEmail({
          name,
          email,
          role,
          invitationLink,
          invitedBy: adminUser?.name
        });

        const emailResult = await resend.emails.send({
          from: 'Burg Ink <noreply@burg-ink.com>',
          to: [email],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        // Log the email in the database
        await db.insert(emails).values({
          resend_id: emailResult.data?.id || null,
          subject: emailTemplate.subject,
          from: 'Burg Ink <noreply@burg-ink.com>',
          to: JSON.stringify([email]),
          html_content: emailTemplate.html,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: JSON.stringify({
            invitation_id: invitation.id,
            user_email: email,
            role: role
          })
        });

        console.log('Invitation email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails, but log it
      }

      // Log activity
      await db.insert(userActivityLogs).values({
        user_id: currentUserId,
        action: 'user_invited',
        details: JSON.stringify({ 
          email, 
          role, 
          invitation_id: invitation.id 
        })
      });

      return res.status(201).json({
        message: 'User invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at
        }
      });
    } else {
      // Create user directly
      if (!password) {
        return res.status(400).json({ error: 'Password is required when not sending invitation' });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role,
        status: 'active'
      }).returning();

      // Log activity
      await db.insert(userActivityLogs).values({
        user_id: currentUserId,
        action: 'user_created',
        details: JSON.stringify({ 
          user_id: newUser.id,
          email: newUser.email,
          role: newUser.role 
        })
      });

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at
        }
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}
