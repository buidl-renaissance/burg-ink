import { NextApiRequest, NextApiResponse } from 'next';
import { extractArtwork } from '@/ai/extractArtwork';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL' });
  }

  try {
    // Fetch the webpage content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const htmlContent = await response.text();
    console.log("Fetched HTML content length:", htmlContent.length);
    
    // Extract artwork data from the HTML content
    const extractedData = await extractArtwork(htmlContent);
    console.log("Extracted data:", extractedData);
    
    // Return the raw extracted data
    res.status(200).json({ artworks: extractedData });
  } catch (error) {
    console.error('Error extracting artwork:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to extract artwork' 
    });
  }
} 