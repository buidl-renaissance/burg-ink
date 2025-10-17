# Burg Ink - Artist Admin Panel

A comprehensive Next.js application for managing tattoo and artwork portfolios with intelligent media processing, automated workflows, and marketing assistance.

## 📋 Project Overview

This project provides a full-featured admin panel for artists to manage their portfolios, with features including:

- **Media Management**: Upload, process, and organize tattoo and artwork images
- **AI-Powered Classification**: Automatic detection and categorization of media
- **Portfolio Management**: Create and manage tattoo and artwork entries
- **Inquiry System**: Handle client inquiries and communications
- **Marketing Assistant**: Generate captions, hashtags, and schedule social media posts
- **Responsive Design**: Mobile-first admin interface with card-based layouts

## ✨ Current Features

### ✅ Implemented
- **Media Upload & Processing**: Upload images with automatic thumbnail generation
- **AI Image Analysis**: GPT-4o powered analysis for tattoos and artwork
- **Portfolio Management**: Create and edit tattoo and artwork entries
- **Inquiry System**: Handle client inquiries with mobile-responsive interface
- **Admin Dashboard**: Comprehensive admin panel with navigation
- **Settings Management**: Configure site settings and preferences
- **Mobile Responsive**: Card-based layouts for mobile devices

### 🚧 In Development
- **Marketing Assistant**: Social media content generation and scheduling
- **Automated Workflows**: Rule-based automation for media processing
- **Taxonomy Management**: Admin-configurable categories and tags
- **Audit Logging**: Track changes and user actions

## 📚 Documentation

For detailed implementation plans, feature specifications, and roadmap:

**[📖 Product Requirements Document (PRD)](docs/PRD.md)**

The PRD contains comprehensive information about:
- Database schema and entity relationships
- Upload intelligence and AI classification pipeline
- Automated workflows and rule engine
- Marketing assistant capabilities
- Implementation roadmap and sprint planning

## 🛠️ Technology Stack

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Styled Components
- **Database**: SQLite with Turso (cloud) / Drizzle ORM
- **AI/ML**: OpenAI GPT-4o for image analysis and content generation
- **Media Processing**: Sharp for image optimization
- **Background Jobs**: Inngest for workflow automation
- **File Storage**: DigitalOcean Spaces
- **Email**: Resend for transactional emails
- **Deployment**: Vercel

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
