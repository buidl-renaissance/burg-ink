import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../db';
import { users, userActivityLogs } from '../../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin permissions
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, user_ids, reason } = req.body;

    if (!action || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'Action and user_ids array are required' });
    }

    const userIds = user_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (userIds.length === 0) {
      return res.status(400).json({ error: 'Valid user IDs are required' });
    }

    // Prevent bulk operations on yourself
    if (userIds.includes(currentUser.id)) {
      return res.status(400).json({ error: 'Cannot perform bulk operations on your own account' });
    }

    try {
      let result;
      let activityAction;

      switch (action) {
        case 'activate':
          result = await db
            .update(users)
            .set({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .where(inArray(users.id, userIds))
            .returning();
          activityAction = 'users_bulk_activated';
          break;

        case 'deactivate':
          result = await db
            .update(users)
            .set({ 
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .where(inArray(users.id, userIds))
            .returning();
          activityAction = 'users_bulk_deactivated';
          break;

        case 'suspend':
          result = await db
            .update(users)
            .set({ 
              status: 'suspended',
              updated_at: new Date().toISOString()
            })
            .where(inArray(users.id, userIds))
            .returning();
          activityAction = 'users_bulk_suspended';
          break;

        case 'delete':
          result = await db
            .update(users)
            .set({ 
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .where(inArray(users.id, userIds))
            .returning();
          activityAction = 'users_bulk_deleted';
          break;

        default:
          return res.status(400).json({ error: 'Invalid action. Must be activate, deactivate, suspend, or delete' });
      }

      // Log activity
      await db.insert(userActivityLogs).values({
        user_id: currentUser.id,
        action: activityAction,
        details: JSON.stringify({ 
          user_ids: userIds,
          action,
          reason: reason || null,
          affected_count: result.length
        })
      });

      return res.status(200).json({
        message: `Bulk ${action} completed successfully`,
        action,
        affected_users: result.length,
        users: result.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status
        }))
      });
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      return res.status(500).json({ error: 'Failed to perform bulk operation' });
    }
  } catch (error) {
    console.error('Bulk users API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
