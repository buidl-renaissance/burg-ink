import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../db';
import { users, userActivityLogs } from '../../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

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

    const { id } = req.query;
    const userId = parseInt(id as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetUser(req, res, userId);
      case 'PATCH':
        return handleUpdateUser(req, res, userId, currentUser.id);
      case 'DELETE':
        return handleDeleteUser(req, res, userId, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetUser(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get recent activity
  const recentActivity = await db
    .select()
    .from(userActivityLogs)
    .where(eq(userActivityLogs.user_id, userId))
    .orderBy(desc(userActivityLogs.created_at))
    .limit(10);

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio,
      profile_picture: user.profile_picture,
      is_verified: user.is_verified,
      last_login_at: user.last_login_at,
      login_count: user.login_count,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    recent_activity: recentActivity.map(activity => ({
      id: activity.id,
      action: activity.action,
      details: activity.details,
      created_at: activity.created_at
    }))
  });
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse, userId: number, currentUserId: number) {
  const { 
    name, 
    email, 
    role, 
    status, 
    bio, 
    password,
    is_verified 
  } = req.body;

  // Get current user data
  const currentUserData = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!currentUserData) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) {
    // Check if email is already taken by another user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'Email already taken by another user' });
    }
    updateData.email = email;
  }
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  if (bio !== undefined) updateData.bio = bio;
  if (is_verified !== undefined) updateData.is_verified = is_verified ? 1 : 0;

  if (password !== undefined && password.trim() !== '') {
    const saltRounds = 12;
    updateData.password = await bcrypt.hash(password, saltRounds);
  }

  updateData.updated_at = new Date().toISOString();

  try {
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    // Log activity
    await db.insert(userActivityLogs).values({
      user_id: currentUserId,
      action: 'user_updated',
      details: JSON.stringify({ 
        target_user_id: userId,
        changes: Object.keys(updateData).filter(key => key !== 'updated_at')
      })
    });

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        bio: updatedUser.bio,
        profile_picture: updatedUser.profile_picture,
        is_verified: updatedUser.is_verified,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse, userId: number, currentUserId: number) {
  // Prevent deleting yourself
  if (userId === currentUserId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Check if user exists
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // Soft delete - set status to inactive instead of actually deleting
    const [updatedUser] = await db
      .update(users)
      .set({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning();

    // Log activity
    await db.insert(userActivityLogs).values({
      user_id: currentUserId,
      action: 'user_deleted',
      details: JSON.stringify({ 
        target_user_id: userId,
        target_user_email: user.email
      })
    });

    return res.status(200).json({
      message: 'User deactivated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
