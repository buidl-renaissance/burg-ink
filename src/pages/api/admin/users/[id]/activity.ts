import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../../db';
import { userActivityLogs, users } from '../../../../../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const userId = parseInt(id as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { 
      page = '1', 
      limit = '50', 
      action = '' 
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query conditions
    const conditions = [eq(userActivityLogs.user_id, userId)];
    
    if (action) {
      conditions.push(eq(userActivityLogs.action, action as string));
    }

    const whereClause = and(...conditions);

    // Get activity logs with pagination
    const activities = await db
      .select({
        id: userActivityLogs.id,
        action: userActivityLogs.action,
        details: userActivityLogs.details,
        ip_address: userActivityLogs.ip_address,
        user_agent: userActivityLogs.user_agent,
        created_at: userActivityLogs.created_at,
        actor_name: users.name,
        actor_email: users.email
      })
      .from(userActivityLogs)
      .leftJoin(users, eq(userActivityLogs.user_id, users.id))
      .where(whereClause)
      .orderBy(desc(userActivityLogs.created_at))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userActivityLogs)
      .where(whereClause);

    // Get activity summary
    const actionSummary = await db
      .select({
        action: userActivityLogs.action,
        count: sql<number>`count(*)`
      })
      .from(userActivityLogs)
      .where(eq(userActivityLogs.user_id, userId))
      .groupBy(userActivityLogs.action);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details ? JSON.parse(activity.details) : null,
        ip_address: activity.ip_address,
        user_agent: activity.user_agent,
        created_at: activity.created_at,
        actor: {
          name: activity.actor_name,
          email: activity.actor_email
        }
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      },
      summary: {
        total_activities: count,
        action_breakdown: actionSummary.reduce((acc, item) => {
          acc[item.action] = item.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('User activity API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
