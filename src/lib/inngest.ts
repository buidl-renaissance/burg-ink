import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "burg-ink-app",
  name: "Burg Ink App",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Utility function to trigger Google images processing (parallel - recommended)
export async function triggerGoogleImagesProcessing(
  userId: number,
  folderId: string,
  accessToken: string
) {
  return await inngest.send({
    name: "google.images.process.parallel",
    data: {
      userId,
      folderId,
      accessToken,
    },
  });
}

// Utility function to trigger Google images processing (sequential - for compatibility)
export async function triggerGoogleImagesProcessingSequential(
  userId: number,
  folderId: string,
  accessToken: string
) {
  return await inngest.send({
    name: "google.images.process",
    data: {
      userId,
      folderId,
      accessToken,
    },
  });
}

// Utility function to trigger individual file processing
export async function triggerFileProcessing(
  userId: number,
  fileId: string,
  fileName: string,
  fileMimeType: string,
  fileSize: string,
  fileThumbnailLink: string,
  fileWebContentLink: string,
  fileCreatedTime: string,
  fileModifiedTime: string,
  folderId: string,
  accessToken: string
) {
  return await inngest.send({
    name: "file.process",
    data: {
      userId,
      fileId,
      fileName,
      fileMimeType,
      fileSize,
      fileThumbnailLink,
      fileWebContentLink,
      fileCreatedTime,
      fileModifiedTime,
      folderId,
      accessToken,
    },
  });
}

// Utility function to trigger media analysis
export async function triggerMediaAnalysis(
  mediaId: string,
  imageUrl: string
) {
  return await inngest.send({
    name: "media.analyze",
    data: {
      mediaId,
      imageUrl,
    },
  });
}

// Utility function to trigger batch media analysis
export async function triggerBatchMediaAnalysis(
  mediaIds: string[] = []
) {
  return await inngest.send({
    name: "media.analyze.batch",
    data: {
      mediaIds,
    },
  });
} 