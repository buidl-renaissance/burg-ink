import { inngest } from "@/lib/inngest";
import { OpenAIEmbeddings } from "@langchain/openai";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { Artwork } from "@/utils/interfaces";
import { artwork as artworkTable } from "../../../db/schema";

// Function to create and store artwork embeddings
export const createArtworkEmbeddings = inngest.createFunction(
  { id: "artwork.embeddings.create", name: "Artwork Embeddings Create", concurrency: 6 },
  { event: "artwork.embeddings.create" },
  async ({ event, step }) => {
    const { artwork } = event.data as { artwork: Artwork };

    // Generate embedding
    const input = `${artwork?.title}: ${artwork?.description || ""}`;
    const vector = await step.run("generate-embedding", async () => {
        const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
      return await embeddings.embedQuery(input);
    });

    // Convert vector to buffer for storage
    const buffer = Buffer.from(new Float32Array(vector).buffer);

    // Store embedding in database
    await step.run("store-embedding", async () => {
      await db
        .update(artworkTable)
        .set({ embedding: buffer })
        .where(eq(artworkTable.id, artwork.id));
    });

    return { success: true, artwork };
  }
);
