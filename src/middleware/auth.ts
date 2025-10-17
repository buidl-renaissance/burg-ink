import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';

export type NextApiHandlerWithAuth = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; email: string; name: string }
) => void | Promise<void>;

export const withAuth = (handler: NextApiHandlerWithAuth) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const user = await getAuthorizedUser(req);
      
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      return handler(req, res, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};
