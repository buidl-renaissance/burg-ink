'use client';

import { Metadata } from 'next';
import SpiritWomenSection from '../components/SpiritWomenSection';

export default function SacredPath() {
  return <SpiritWomenSection />;
}

export const metadata: Metadata = {
  title: 'The Sacred Path | Andrea Burg',
  description: 'Channeling ancestral wisdom through contemporary expression. Explore the sacred path of Andrea Burg\'s spiritual art journey.',
  openGraph: {
    title: 'The Sacred Path | Andrea Burg',
    description: 'Channeling ancestral wisdom through contemporary expression. Explore the sacred path of Andrea Burg\'s spiritual art journey.',
    images: [
      {
        url: '/images/andrea-burg-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Andrea Burg Sacred Path',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Sacred Path | Andrea Burg',
    description: 'Channeling ancestral wisdom through contemporary expression. Explore the sacred path of Andrea Burg\'s spiritual art journey.',
    images: ['/images/andrea-burg-og.jpg'],
  },
};
