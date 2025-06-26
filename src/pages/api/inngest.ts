import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { processGoogleImages } from "@/lib/functions/processGoogleImages";

// Create the handler to serve your functions
const handler = serve({
  client: inngest,
  functions: [processGoogleImages],
});

export default handler; 