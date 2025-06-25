import { NextApiRequest, NextApiResponse } from 'next';
import { availableTicketsHandler } from 'buidl-ticketing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return availableTicketsHandler(req, res);
}

