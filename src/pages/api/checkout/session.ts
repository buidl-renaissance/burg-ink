import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionHandler } from 'buidl-ticketing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    return getSessionHandler(req, res);
}
