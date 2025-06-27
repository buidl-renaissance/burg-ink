import '../styles/global.css';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { DefaultSeo, NextSeo } from 'next-seo';
import { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { Navbar } from '@/components/NavBar';
import { theme } from '@/styles/theme';

// Default metadata for the application
export const metadata: Metadata = {
  title: 'Andrea Burg | Artist Gallery',
  description:
    'Contemporary artist exploring the intersection of traditional techniques and modern themes. View artwork, tattoos, and more.',
  keywords: 'Andrea Burg, artist, gallery, artwork, tattoos, contemporary art',
  openGraph: {
    title: 'Andrea Burg | Artist Gallery',
    description:
      'Contemporary artist exploring the intersection of traditional techniques and modern themes',
    images: ['/og-image.jpg'],
  },
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const pageMetadata = pageProps.metadata || metadata;
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NextSeo {...pageMetadata} />
      <DefaultSeo
        openGraph={{
          type: 'website',
          locale: 'en_IE',
        }}
      />
      <StyleSheetManager shouldForwardProp={isPropValid}>
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
          {/* <FloatingUserProfile /> */}
          <Navbar 
            breadcrumbs={pageProps.breadcrumbs}
            currentPage={pageProps.currentPage}
          />
        </ThemeProvider>
      </StyleSheetManager>
      <Analytics />
    </>
  );
}
