import { OpenAI } from "openai";
import { Artwork } from "@/utils/interfaces";

export async function extractArtwork(jsonString: string): Promise<Artwork[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const prompt = `
Extract artwork information from the following JSON and format it according to this TypeScript interface:

interface Artwork {
  id: number;
  slug: string; 
  title: string;
  description: string;
  type: string;
  artist_id?: number;
  image?: string;
  artist?: {
    id: number;
    name: string;
  };
  data: {
    [key: string]: unknown;
  };
  meta: {
    [key: string]: unknown;
  };
}

Return a valid JSON array of artwork objects matching this interface.
If any required fields are missing, generate reasonable placeholder values.
For id fields, generate random numbers.
For slug, convert the title to lowercase, replace spaces with hyphens.

Input JSON:
${jsonString}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 5000,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that extracts and formats artwork data from JSON. You only respond with valid JSON without markdown code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    console.log("Response from OpenAI:", response);
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Remove any markdown code blocks if present
    const cleanedResponse = response.replace(/^```json\n|\n```$/g, '');

    // Parse the response into Artwork objects
    const extractedArtworks = JSON.parse(cleanedResponse) as Artwork[];

    // Validate the required fields exist
    return extractedArtworks.map((artwork) => ({
      id: artwork.id || Date.now() + Math.floor(Math.random() * 10000),
      slug:
        artwork.slug || artwork.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: artwork.title || "Untitled Artwork",
      description: artwork.description || "",
      type: artwork.type || "artwork",
      artist_id: artwork.artist_id,
      image: artwork.image,
      artist: artwork.artist,
      data: artwork.data || {},
      meta: artwork.meta || {},
    }));
  } catch (error) {
    console.error("Error extracting artwork:", error);
    throw new Error("Failed to extract artwork data");
  }
}
