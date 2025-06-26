import { Inngest } from "inngest";

// Create an Inngest client
export const inngest = new Inngest({ 
  id: "burg-ink",
  name: "Burg Ink Background Jobs"
});

// Utility function to trigger Google images processing
export async function triggerGoogleImagesProcessing(
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