import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { 
  processGoogleImages,
  verifyUser,
  listGoogleDriveFiles,
  processSingleFile,
  analyzeMedia,
  updateUserSyncSettings,
  processGoogleImagesParallel,
  analyzeMediaBatch
} from "@/lib/functions/processGoogleImages";

// Create the handler to serve your functions
const handler = serve({
  client: inngest,
  functions: [
    processGoogleImages,
    verifyUser,
    listGoogleDriveFiles,
    processSingleFile,
    analyzeMedia,
    updateUserSyncSettings,
    processGoogleImagesParallel,
    analyzeMediaBatch
  ],
});

export default handler; 