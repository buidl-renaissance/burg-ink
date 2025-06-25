import { createCheckoutSessionHandler } from "buidl-ticketing";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    return createCheckoutSessionHandler(req, res);
}
