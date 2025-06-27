import '../styles/global.css';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { DefaultSeo, NextSeo } from 'next-seo';
import { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
// import FloatingUserProfile from '@/components/FloatingUserProfile';
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
  const router = useRouter();

  // Generate breadcrumbs based on current route
  const breadcrumbs = useMemo(() => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    
    if (pathSegments[0] === 'admin') {
      const adminBreadcrumbs = [
        { label: 'Admin', href: '/admin' }
      ];
      
      // Add specific breadcrumbs for admin sub-pages
      if (pathSegments.length > 1) {
        const pageName = pathSegments[1];
        const pageLabels: { [key: string]: string } = {
          'artwork': 'Artwork',
          'media': 'Media',
          'users': 'Users',
          'events': 'Events',
          'emails': 'Emails',
          'settings': 'Settings'
        };
        
        if (pageLabels[pageName]) {
          adminBreadcrumbs.push({
            label: pageLabels[pageName],
            href: `/admin/${pageName}`
          });
        }
      }
      
      return adminBreadcrumbs;
    }
    
    return undefined;
  }, [router.pathname]);

  // Get current page name for the navbar
  const currentPage = useMemo(() => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    
    if (pathSegments[0] === 'admin') {
      if (pathSegments.length === 1) {
        return 'Dashboard';
      }
      
      const pageName = pathSegments[1];
      const pageLabels: { [key: string]: string } = {
        'artwork': 'Artwork',
        'media': 'Media',
        'users': 'Users',
        'events': 'Events',
        'emails': 'Emails',
        'settings': 'Settings'
      };
      
      return pageLabels[pageName] || 'Admin';
    }
    
    return undefined;
  }, [router.pathname]);

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
            breadcrumbs={breadcrumbs}
            currentPage={currentPage}
          />
        </ThemeProvider>
      </StyleSheetManager>
      <Analytics />
    </>
  );
}
