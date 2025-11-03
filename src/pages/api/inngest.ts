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
import { 
  processMediaResize,
  processNewUploadResize,
  processBatchResize
} from "@/lib/functions/processImageResizing";
import { createArtworkEmbeddings } from "@/lib/functions/processArtworkEmbeddings";
import { processMediaUpload } from "@/lib/functions/processMediaUpload";

// Create the handler to serve your functions
const handler = serve({
  client: inngest,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  functions: [
    processGoogleImages,
    verifyUser,
    listGoogleDriveFiles,
    processSingleFile,
    analyzeMedia,
    updateUserSyncSettings,
    processGoogleImagesParallel,
    analyzeMediaBatch,
    processMediaResize,
    processNewUploadResize,
    processBatchResize,
    createArtworkEmbeddings,
    processMediaUpload
  ],
});

export default handler; 