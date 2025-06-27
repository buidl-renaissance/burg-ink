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
import { createArtworkEmbeddings } from "@/lib/functions/processArtworkEmbeddings";

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
    analyzeMediaBatch,
    createArtworkEmbeddings
  ],
});

export default handler; 