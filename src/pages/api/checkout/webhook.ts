import { NextApiRequest, NextApiResponse } from 'next';
import { handleStripeWebhook } from 'buidl-ticketing';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handleStripeWebhook(req, res);
}
