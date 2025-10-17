import { taxonomy } from '../../../db/schema';

export interface TaxonomySeedData {
  namespace: string;
  key: string;
  label: string;
  description?: string;
  order: number;
  parent_id?: number;
}

export const DEFAULT_TAXONOMIES: TaxonomySeedData[] = [
  // Tattoo Styles
  { namespace: 'tattoo.style', key: 'traditional', label: 'Traditional', description: 'Classic American traditional tattoo style', order: 1 },
  { namespace: 'tattoo.style', key: 'neo-traditional', label: 'Neo-Traditional', description: 'Modern interpretation of traditional style', order: 2 },
  { namespace: 'tattoo.style', key: 'japanese', label: 'Japanese', description: 'Traditional Japanese tattoo art (irezumi)', order: 3 },
  { namespace: 'tattoo.style', key: 'realism', label: 'Realism', description: 'Photorealistic tattoo style', order: 4 },
  { namespace: 'tattoo.style', key: 'watercolor', label: 'Watercolor', description: 'Watercolor painting style tattoos', order: 5 },
  { namespace: 'tattoo.style', key: 'geometric', label: 'Geometric', description: 'Geometric and mathematical designs', order: 6 },
  { namespace: 'tattoo.style', key: 'blackwork', label: 'Blackwork', description: 'Bold black ink designs', order: 7 },
  { namespace: 'tattoo.style', key: 'fine-line', label: 'Fine Line', description: 'Delicate, thin line work', order: 8 },
  { namespace: 'tattoo.style', key: 'tribal', label: 'Tribal', description: 'Traditional tribal patterns and designs', order: 9 },
  { namespace: 'tattoo.style', key: 'illustrative', label: 'Illustrative', description: 'Illustration-style tattoos', order: 10 },
  { namespace: 'tattoo.style', key: 'dotwork', label: 'Dotwork', description: 'Tattoos created using dot techniques', order: 11 },
  { namespace: 'tattoo.style', key: 'biomechanical', label: 'Biomechanical', description: 'Mechanical and organic fusion designs', order: 12 },
  { namespace: 'tattoo.style', key: 'minimalist', label: 'Minimalist', description: 'Simple, clean, minimal designs', order: 13 },
  { namespace: 'tattoo.style', key: 'other', label: 'Other', description: 'Other tattoo styles', order: 99 },

  // Tattoo Placements
  { namespace: 'tattoo.placement', key: 'arm', label: 'Arm', description: 'Upper arm area', order: 1 },
  { namespace: 'tattoo.placement', key: 'forearm', label: 'Forearm', description: 'Lower arm area', order: 2 },
  { namespace: 'tattoo.placement', key: 'sleeve', label: 'Sleeve', description: 'Full arm sleeve', order: 3 },
  { namespace: 'tattoo.placement', key: 'leg', label: 'Leg', description: 'Upper leg area', order: 4 },
  { namespace: 'tattoo.placement', key: 'calf', label: 'Calf', description: 'Lower leg area', order: 5 },
  { namespace: 'tattoo.placement', key: 'back', label: 'Back', description: 'Upper back area', order: 6 },
  { namespace: 'tattoo.placement', key: 'lower-back', label: 'Lower Back', description: 'Lower back area', order: 7 },
  { namespace: 'tattoo.placement', key: 'chest', label: 'Chest', description: 'Chest area', order: 8 },
  { namespace: 'tattoo.placement', key: 'shoulder', label: 'Shoulder', description: 'Shoulder area', order: 9 },
  { namespace: 'tattoo.placement', key: 'neck', label: 'Neck', description: 'Neck area', order: 10 },
  { namespace: 'tattoo.placement', key: 'hand', label: 'Hand', description: 'Hand and fingers', order: 11 },
  { namespace: 'tattoo.placement', key: 'foot', label: 'Foot', description: 'Foot and ankle', order: 12 },
  { namespace: 'tattoo.placement', key: 'ribcage', label: 'Ribcage', description: 'Side rib area', order: 13 },
  { namespace: 'tattoo.placement', key: 'stomach', label: 'Stomach', description: 'Abdominal area', order: 14 },
  { namespace: 'tattoo.placement', key: 'other', label: 'Other', description: 'Other body placement', order: 99 },

  // Tattoo Sizes
  { namespace: 'tattoo.size', key: 'small', label: 'Small', description: 'Less than 3 inches', order: 1 },
  { namespace: 'tattoo.size', key: 'medium', label: 'Medium', description: '3-6 inches', order: 2 },
  { namespace: 'tattoo.size', key: 'large', label: 'Large', description: '6-12 inches', order: 3 },
  { namespace: 'tattoo.size', key: 'extra-large', label: 'Extra Large', description: 'Over 12 inches', order: 4 },

  // Tattoo Color Modes
  { namespace: 'tattoo.color_mode', key: 'black-grey', label: 'Black & Grey', description: 'Monochrome black and grey tattoos', order: 1 },
  { namespace: 'tattoo.color_mode', key: 'color', label: 'Color', description: 'Full color tattoos', order: 2 },
  { namespace: 'tattoo.color_mode', key: 'mixed', label: 'Mixed', description: 'Combination of black/grey and color', order: 3 },

  // Artwork Categories
  { namespace: 'artwork.category', key: 'painting', label: 'Painting', description: 'Traditional painted artwork', order: 1 },
  { namespace: 'artwork.category', key: 'print', label: 'Print', description: 'Printed artwork and reproductions', order: 2 },
  { namespace: 'artwork.category', key: 'digital', label: 'Digital', description: 'Digital artwork and illustrations', order: 3 },
  { namespace: 'artwork.category', key: 'sculpture', label: 'Sculpture', description: 'Three-dimensional artwork', order: 4 },
  { namespace: 'artwork.category', key: 'drawing', label: 'Drawing', description: 'Pencil, pen, or charcoal drawings', order: 5 },
  { namespace: 'artwork.category', key: 'mixed-media', label: 'Mixed Media', description: 'Artwork combining multiple mediums', order: 6 },
  { namespace: 'artwork.category', key: 'photography', label: 'Photography', description: 'Photographic artwork', order: 7 },
  { namespace: 'artwork.category', key: 'textile', label: 'Textile', description: 'Fabric-based artwork', order: 8 },
  { namespace: 'artwork.category', key: 'ceramics', label: 'Ceramics', description: 'Pottery and ceramic artwork', order: 9 },
  { namespace: 'artwork.category', key: 'other', label: 'Other', description: 'Other artwork categories', order: 99 },

  // Artwork Mediums
  { namespace: 'artwork.medium', key: 'acrylic', label: 'Acrylic', description: 'Acrylic paint medium', order: 1 },
  { namespace: 'artwork.medium', key: 'oil', label: 'Oil', description: 'Oil paint medium', order: 2 },
  { namespace: 'artwork.medium', key: 'watercolor', label: 'Watercolor', description: 'Watercolor paint medium', order: 3 },
  { namespace: 'artwork.medium', key: 'ink', label: 'Ink', description: 'Ink-based medium', order: 4 },
  { namespace: 'artwork.medium', key: 'charcoal', label: 'Charcoal', description: 'Charcoal medium', order: 5 },
  { namespace: 'artwork.medium', key: 'pencil', label: 'Pencil', description: 'Graphite pencil medium', order: 6 },
  { namespace: 'artwork.medium', key: 'spray', label: 'Spray Paint', description: 'Spray paint medium', order: 7 },
  { namespace: 'artwork.medium', key: 'digital', label: 'Digital', description: 'Digital creation medium', order: 8 },
  { namespace: 'artwork.medium', key: 'clay', label: 'Clay', description: 'Clay and ceramic medium', order: 9 },
  { namespace: 'artwork.medium', key: 'fabric', label: 'Fabric', description: 'Textile and fabric medium', order: 10 },
  { namespace: 'artwork.medium', key: 'wood', label: 'Wood', description: 'Wood-based medium', order: 11 },
  { namespace: 'artwork.medium', key: 'metal', label: 'Metal', description: 'Metal-based medium', order: 12 },
  { namespace: 'artwork.medium', key: 'other', label: 'Other', description: 'Other artistic mediums', order: 99 },

  // Artwork Subjects
  { namespace: 'artwork.subject', key: 'abstract', label: 'Abstract', description: 'Non-representational artwork', order: 1 },
  { namespace: 'artwork.subject', key: 'portrait', label: 'Portrait', description: 'Human or animal portraits', order: 2 },
  { namespace: 'artwork.subject', key: 'landscape', label: 'Landscape', description: 'Natural scenery and landscapes', order: 3 },
  { namespace: 'artwork.subject', key: 'still-life', label: 'Still Life', description: 'Inanimate object compositions', order: 4 },
  { namespace: 'artwork.subject', key: 'figurative', label: 'Figurative', description: 'Human figure artwork', order: 5 },
  { namespace: 'artwork.subject', key: 'nature', label: 'Nature', description: 'Natural elements and wildlife', order: 6 },
  { namespace: 'artwork.subject', key: 'urban', label: 'Urban', description: 'City and urban environments', order: 7 },
  { namespace: 'artwork.subject', key: 'fantasy', label: 'Fantasy', description: 'Fantasy and imaginative subjects', order: 8 },
  { namespace: 'artwork.subject', key: 'spiritual', label: 'Spiritual', description: 'Religious and spiritual themes', order: 9 },
  { namespace: 'artwork.subject', key: 'geometric', label: 'Geometric', description: 'Geometric shapes and patterns', order: 10 },
  { namespace: 'artwork.subject', key: 'typography', label: 'Typography', description: 'Text and lettering artwork', order: 11 },
  { namespace: 'artwork.subject', key: 'other', label: 'Other', description: 'Other artistic subjects', order: 99 },
];

export function getTaxonomiesByNamespace(namespace: string): TaxonomySeedData[] {
  return DEFAULT_TAXONOMIES.filter(t => t.namespace === namespace);
}

export function getAllNamespaces(): string[] {
  return [...new Set(DEFAULT_TAXONOMIES.map(t => t.namespace))];
}

export function getTaxonomyByKey(namespace: string, key: string): TaxonomySeedData | undefined {
  return DEFAULT_TAXONOMIES.find(t => t.namespace === namespace && t.key === key);
}
