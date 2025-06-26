import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { processGoogleImages } from "@/lib/functions/processGoogleImages";

// Create the handler to serve your functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processGoogleImages],
}); 