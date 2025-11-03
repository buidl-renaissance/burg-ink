import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../../db';
import { users, userActivityLogs } from '../../../../../../db/schema';
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

    // Check if user has admin permissions
    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const userId = parseInt(id as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended' });
    }

    // Prevent changing your own status
    if (userId === currentUser.id) {
      return res.status(400).json({ error: 'Cannot change your own status' });
    }

    // Get current user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          status,
          updated_at: new Date().toISOString()
        })
        .where(eq(users.id, userId))
        .returning();

      // Log activity
      await db.insert(userActivityLogs).values({
        user_id: currentUser.id,
        action: 'user_status_changed',
        details: JSON.stringify({ 
          target_user_id: userId,
          target_user_email: user.email,
          old_status: user.status,
          new_status: status,
          reason: reason || null
        })
      });

      return res.status(200).json({
        message: `User status changed to ${status} successfully`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          status: updatedUser.status,
          updated_at: updatedUser.updated_at
        }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      return res.status(500).json({ error: 'Failed to update user status' });
    }
  } catch (error) {
    console.error('User status API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
