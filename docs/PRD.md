# Artist Admin Panel — Next Steps & Implementation Plan

*Last updated: Oct 16, 2025 (America/Detroit)*

## 0) Goals for this iteration

* Ship **Marketing Assistant v1** (captions, hashtags, auto-campaigns, cross‑post & link‑in‑bio blocks).
* Add **Config → Structure** to let admins define categories, taxonomies, and page layouts without code.
* Implement **Automated Workflows** for media → (Tattoo | Artwork) entities with review gates.
* Deliver **Upload Intelligence**: detect tattoos vs. general artwork; prompt to create structured items.
* Establish **roles/permissions, audit logs, versioning** for safe admin operations.

---

## 1) Current Implementation Status

### ✅ **Implemented Features**

**Core Admin Panel**:
- ✅ **Media Management**: Upload, process, and organize images with AI analysis
- ✅ **Portfolio Management**: Create and edit tattoo and artwork entries
- ✅ **Inquiry System**: Handle client inquiries with mobile-responsive interface
- ✅ **Settings Management**: Configure site settings and preferences
- ✅ **AI Integration**: GPT-4o powered image analysis and content generation
- ✅ **Background Processing**: Inngest workflow automation for media processing
- ✅ **Mobile Responsive**: Card-based layouts for mobile devices

**Technical Infrastructure**:
- ✅ **Database**: SQLite with Drizzle ORM (ready for Turso migration)
- ✅ **File Storage**: DigitalOcean Spaces integration
- ✅ **Image Processing**: Sharp-based resizing and optimization
- ✅ **Email System**: Resend integration for transactional emails
- ✅ **Authentication**: Google OAuth integration
- ✅ **Real-time Updates**: Polling-based status updates

### 🚧 **In Development**
- **Marketing Assistant**: Social media content generation and scheduling
- **Automated Workflows**: Rule-based automation for media processing
- **Taxonomy Management**: Admin-configurable categories and tags
- **Audit Logging**: Track changes and user actions

---

## 2) Current Database Schema (Drizzle/SQLite)

### 2.1 Media (✅ Implemented)

```typescript
export const media = sqliteTable("media", {
  id: text("id").primaryKey(), // UUID
  original_url: text("original_url").notNull(),
  medium_url: text("medium_url"),
  thumbnail_url: text("thumbnail_url"),
  source: text("source").notNull(), // 'local' | 'gdrive'
  source_id: text("source_id"),
  tags: text("tags").default("[]"), // JSON string
  title: text("title"),
  description: text("description"), // AI-generated
  alt_text: text("alt_text"),
  created_at: integer("created_at").default(sql`(unixepoch())`).notNull(),
  user_id: integer("user_id").references(() => users.id),
  filename: text("filename"),
  mime_type: text("mime_type"),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  processing_status: text("processing_status").default("pending"),
});
```

### 2.2 Artwork (✅ Implemented)

```typescript
export const artwork = sqliteTable("artwork", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  artist_id: integer("artist_id").references(() => artists.id),
  image: text("image"), // Main artwork image
  category: text("category"),
  meta: text("meta"), // JSON string for additional metadata
  data: text("data"), // JSON string for additional data
  embedding: blob("embedding"), // Float32Array vector as binary
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});
```

### 2.3 Tattoos (✅ Implemented)

```typescript
export const tattoos = sqliteTable("tattoos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  artist_id: integer("artist_id").references(() => artists.id),
  image: text("image"), // Main tattoo image
  category: text("category"), // Traditional, Japanese, Geometric, etc.
  placement: text("placement"), // Body placement (arm, leg, back, etc.)
  size: text("size"), // small, medium, large
  style: text("style"), // Style description
  meta: text("meta"), // JSON string for additional metadata
  data: text("data"), // JSON string for additional data
  embedding: blob("embedding"), // Float32Array vector as binary
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});
```

### 2.4 Artists (✅ Implemented)

```typescript
export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  profile_picture: text("profile_picture"),
  bio: text("bio"),
  social_links_id: integer("social_links_id").references(() => socialLinks.id),
  tags: text("tags"), // JSON string of tags
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});
```

### 2.5 Inquiries (✅ Implemented)

```typescript
export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  budget: text("budget"),
  tattoo_concept: text("tattoo_concept").notNull(),
  animal_person_emotion: text("animal_person_emotion"),
  abstract_energy: text("abstract_energy"),
  tattoo_size: text("tattoo_size"),
  color_preference: text("color_preference"),
  photo_references: text("photo_references"), // JSON array
  placement_photos: text("placement_photos"), // JSON array
  newsletter_signup: integer("newsletter_signup").default(0),
  inquiry_type: text("inquiry_type").notNull(),
  message: text("message").notNull(),
  status: text("status").default("new"),
  email_sent: integer("email_sent").default(0),
  email_sent_at: text("email_sent_at"),
  notes: text("notes"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 2.6 Users (✅ Implemented)

```typescript
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cid: text("cid").unique(),
  name: text("name").notNull(),
  email: text("email").unique(),
  password: text("password"),
  bio: text("bio"),
  profile_picture: text("profile_picture"),
  data: text("data"), // JSON string
  google_id: text("google_id"),
  google_drive_token: text("google_drive_token"),
  google_drive_refresh_token: text("google_drive_refresh_token"),
  google_drive_folder_id: text("google_drive_folder_id"),
  google_drive_sync_enabled: integer("google_drive_sync_enabled").default(0),
  last_sync_at: text("last_sync_at"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 2.7 Emails (✅ Implemented)

```typescript
export const emails = sqliteTable("emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resend_id: text("resend_id").unique(),
  subject: text("subject").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(), // JSON array
  cc: text("cc"), // JSON array
  bcc: text("bcc"), // JSON array
  html_content: text("html_content"),
  text_content: text("text_content"),
  status: text("status").default("pending"),
  error_message: text("error_message"),
  sent_at: text("sent_at"),
  delivered_at: text("delivered_at"),
  opened_at: text("opened_at"),
  clicked_at: text("clicked_at"),
  bounced_at: text("bounced_at"),
  complained_at: text("complained_at"),
  unsubscribed_at: text("unsubscribed_at"),
  metadata: text("metadata"), // JSON string
  template_id: text("template_id"),
  inquiry_id: integer("inquiry_id").references(() => inquiries.id),
  user_id: integer("user_id").references(() => users.id),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 2.8 Additional Tables (✅ Implemented)

**Events & Venues**:
```typescript
export const venues = sqliteTable("venues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  zip_code: text("zip_code"),
  country: text("country"),
  place_id: text("place_id"),
  geo: text("geo"),
  data: text("data"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cid: text("cid").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  image: text("image"),
  image_data: text("image_data"),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  categories: text("categories"),
  event_categories: text("event_categories"),
  featured: integer("featured").default(0),
  host: text("host"),
  venue_id: integer("venue_id").references(() => venues.id),
  url: text("url"),
  data: text("data"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});
```

**Social Links & Content**:
```typescript
export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  twitter: text("twitter"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  github: text("github"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artwork_id: integer("artwork_id").references(() => artwork.id).notNull(),
  user_id: integer("user_id"),
  width: integer("width"),
  height: integer("height"),
  type: text("type").notNull(), // image, video, etc.
  youtube_id: text("youtube_id"),
  url: text("url"),
  caption: text("caption"),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const artworkCollaborators = sqliteTable("artwork_collaborators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artwork_id: integer("artwork_id").references(() => artwork.id).notNull(),
  artist_id: integer("artist_id").references(() => artists.id).notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const googleDriveAssets = sqliteTable("google_drive_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id).notNull(),
  file_id: text("file_id").notNull(),
  folder_id: text("folder_id"),
  name: text("name").notNull(),
  mime_type: text("mime_type").notNull(),
  size: text("size"),
  web_content_link: text("web_content_link"),
  thumbnail_link: text("thumbnail_link"),
  spaces_key: text("spaces_key"),
  spaces_url: text("spaces_url"),
  created_time: text("created_time"),
  modified_time: text("modified_time"),
  sync_status: text("sync_status").default("pending"),
  artwork_id: integer("artwork_id").references(() => artwork.id),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

---

## 3) Planned Schema Extensions

### 3.1 Taxonomy (🚧 Planned)

```typescript
export const taxonomy = sqliteTable("taxonomy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  namespace: text("namespace").notNull(), // 'tattoo.style', 'artwork.category'
  key: text("key").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  is_active: integer("is_active").default(1),
  parent_id: integer("parent_id").references(() => taxonomy.id),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 3.2 Workflow Rules (🚧 Planned)

```typescript
export const workflowRules = sqliteTable("workflow_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // 'upload', 'publish', 'schedule'
  conditions: text("conditions").notNull(), // JSON
  actions: text("actions").notNull(), // JSON
  is_enabled: integer("is_enabled").default(1),
  last_fired: text("last_fired"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 3.3 Marketing Assets (🚧 Planned)

```typescript
export const marketingAssets = sqliteTable("marketing_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entity_type: text("entity_type").notNull(), // 'tattoo', 'artwork', 'collection'
  entity_id: integer("entity_id").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags"), // JSON array
  cta: text("cta"),
  channels: text("channels").notNull(), // JSON array
  schedule_at: text("schedule_at"),
  status: text("status").default("draft"), // 'draft', 'scheduled', 'sent', 'failed'
  results: text("results"), // JSON
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 3.4 System Config (🚧 Planned)

```typescript
export const systemConfig = sqliteTable("system_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  group: text("group").notNull(), // 'ui', 'seo', 'watermark', 'automations'
  key: text("key").notNull(),
  value: text("value").notNull(), // JSON
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### 3.5 Audit & Versioning (🚧 Planned)

```typescript
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor_id: integer("actor_id").references(() => users.id),
  entity: text("entity").notNull(),
  entity_id: integer("entity_id").notNull(),
  action: text("action").notNull(),
  diff: text("diff"), // JSON
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const versions = sqliteTable("versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entity: text("entity").notNull(),
  entity_id: integer("entity_id").notNull(),
  snapshot: text("snapshot").notNull(), // JSON
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

---

## 4) Current AI Implementation (✅ Implemented)

### 4.1 Media Processing Pipeline

**Current Workflow** (`processMediaUpload.ts`):
1. **Upload** → create `media` row with `processing_status=pending`
2. **Process** (Inngest worker):
   * Download original file from DigitalOcean Spaces
   * Generate resized versions (`medium`, `thumb`) using Sharp
   * Extract image dimensions (width, height)
   * Upload resized versions to Spaces
   * Run AI analysis with GPT-4o
   * Update database with URLs, dimensions, and AI metadata

### 4.2 AI Analysis Functions (✅ Implemented)

**Media Analysis** (`analyzeMediaImage`):
```typescript
interface MediaAnalysis {
  tags: string[];
  title: string;
  description: string;
  altText: string;
}
```

**Tattoo Analysis** (`analyzeTattooImage`):
```typescript
interface TattooAnalysis {
  title: string;
  description: string;
  category: string; // Traditional, Japanese, Geometric, etc.
  placement: string; // Arm, Leg, Back, etc.
  size: string; // Small, Medium, Large, Extra Large
  style: string; // Detailed style description
}
```

**Marketing Assistant** (`generateMarketingResponse`):
```typescript
interface ArtistProfile {
  name?: string;
  medium?: string;
  style?: string;
  targetAudience?: string;
  goals?: string;
  inspiration?: string;
  uniqueValue?: string;
}
```

### 4.3 Current Processing Status

**Media Processing States**:
- `pending` → `processing` → `completed` | `failed`
- Real-time status updates via polling
- Error handling and retry logic

**AI Integration**:
- ✅ GPT-4o for image analysis
- ✅ Automatic tagging and categorization
- ✅ Tattoo-specific analysis with placement/size/style detection
- ✅ Marketing assistant with conversation flow
- ✅ Fallback values for failed analysis

---

## 5) Planned Upload Intelligence Enhancements

### 5.1 Detection Pipeline Improvements

1. **Enhanced Classification**: 
   * Detect `tattoo` vs `artwork` vs `unknown` with confidence scores
   * Store detection results in `media.detections` field (JSON)
   * Configurable confidence thresholds

2. **Smart Prompts**:
   * Surface inline banners in Media Library: "Looks like a **Tattoo** (92%). Create a Tattoo entry?"
   * Pre-fill form sections from AI analysis
   * Bulk actions: "Create Tattoos from 8 selected"

3. **UX Enhancements**:
   * Chip labels on thumbnails: `Tattoo? 88%` / `Artwork? 76%`
   * Confidence indicators in media grid
   * Undo snackbar after entity creation

### 5.2 Confidence Thresholds (configurable)

* `classification_min_conf`: default 0.70
* `auto-tag_min_conf`: default 0.55  
* `auto-create_entity_on_upload`: default `false` (prompt-to-create first)

---

## 3) Taxonomy & Structure (Admin Config)

### 3.1 Predefined starter sets

**Tattoos**

* `style`: traditional, neo-traditional, japanese, tribal, realism, watercolor, illustrative, geometric, fine-line
* `themes`: snake, dragon, koi, flower, skull, dagger, portrait, script, sacred-geometry
* `body_zone`: sleeve-upper, sleeve-forearm, chest, back, shoulder, calf, thigh, hand, neck
* `color_mode`: black-grey, color

**Artwork**

* `category`: painting, print, mural, digital, sculpture, mixed-media
* `subject`: abstract, landscape, portrait, still-life, typography
* `medium`: acrylic, oil, spray, ink, digital

### 3.2 Admin‑editable

* Add, rename, reorder, deactivate terms.
* Nesting (e.g., `tattoo.style > japanese > tebori`).
* Validation rules (e.g., `tattoo: body_zone REQUIRED`).

### 3.3 Page structure presets (no-code)

* **Tattoo Gallery**: grid → filter by style/body_zone; sort by newest/popular.
* **Artist Profile**: hero → latest tattoos → artwork highlights → booking CTA.
* **Collections/Series**: curated sets across tattoo/artwork.
* Drag‑and‑drop sections; save as layout presets per route.

---

## 4) Automated Workflows (Rules Engine)

### 4.1 Triggers

* `on_upload(media)`
* `on_publish(entity)`
* `on_schedule(marketing_asset)`
* `daily_cron()`

### 4.2 Conditions (examples)

* `detected_type == "tattoo" AND detections.style["traditional"] >= 0.6`
* `entity == "artwork" AND for_sale == true`
* `channel includes "instagram" AND caption is empty`

### 4.3 Actions (examples)

* `create_entity": {type: "tattoo", from_media: media.id}`
* `apply_tags": {namespace: "tattoo.style", keys: ["traditional"]}`
* `watermark": {position: "bottom-right", opacity: 0.25}`
* `generate_caption": {tone: "hype", max_len: 180}`
* `schedule_post": {channels: ["ig", "tiktok"], best_time: "auto"}`
* `notify": {role: "editor", message: "3 new tattoos ready for review"}`

### 4.4 Example JSON rule

```json
{
  "name": "Auto-prompt tattoos",
  "trigger": "on_upload",
  "conditions": {
    "detected_type": "tattoo",
    "min_conf": 0.7
  },
  "actions": [
    {"type": "flag_media", "flag": "tattoo_candidate"},
    {"type": "open_prompt", "prompt": "Create Tattoo from this upload?"}
  ],
  "is_enabled": true
}
```

### 4.5 Review queues

* **Media → Candidates**: pending classification; quick accept/fix type.
* **Entities → Drafts**: tattoos/artworks awaiting metadata.
* **Marketing → Outbox**: drafts to schedule; compliance checks (watermark, credit, alt text).

---

## 5) Marketing Assistant v1

### 5.1 Capabilities

* **Caption generator** (tone presets: hype, minimal, storytelling, educational).
* **Hashtag sets** (global + per‑taxonomy: e.g., #detroittattoo #fineline #313connect).
* **CTA blocks**: book now, view series, visit event, shop print.
* **Cross‑posting**: IG/FB/Threads/X/TikTok/Pinterest + site hero + newsletter snippet.
* **UTM builder**: campaign, medium, content; short links.
* **A/B variations** with quick preview.

### 5.2 Data inputs

* Entity fields, taxonomy, detections, color palette, artist bio, event calendar.

### 5.3 Guardrails

* Word/character limits per channel.
* Auto‑credit collaborators & photographer if present.
* Alt text generation for accessibility.
* Watermark enforcement toggle per channel.

### 5.4 Scheduling

* Best‑time suggestions (local timezone) using rolling engagement averages.
* Calendar view; drag to reschedule; pause all.

---

## 6) Settings → Configure Site & Automation

### 6.1 Structure

* Taxonomies (see §3).
* Required fields per entity type.
* Default page layouts (home, gallery, artist profile, series, event).

### 6.2 Media & Watermark

* Default watermark logo, opacity, position, size rules per output size.
* Auto‑resize/quality for web hero, grid, thumb.
* NSFW/consent toggles for sensitive placements.

### 6.3 SEO & Social

* Default OpenGraph/Twitter card templates per entity.
* Robots/meta rules; sitemap enable.

### 6.4 Automations

* Rule library (enable/disable); per‑org thresholds.
* Notification channels: in‑app, email, Slack/Discord webhook.

### 6.5 Integrations

* Instagram/TikTok/Facebook/X connectors.
* Newsletter (Buttondown/Mailchimp/Resend).
* Webhooks (n8n compatible) for inbound/outbound events.

---

## 7) Roles & Permissions

* **Owner**: all settings, billing.
* **Admin**: structure, workflows, publishing.
* **Editor**: create/edit entities, schedule marketing, approve drafts.
* **Contributor**: upload media, create drafts, cannot publish.
* Row‑level ownership on media & drafts; audit every update.

---

## 8) UI: Key Screens (wireframe notes)

### 8.1 Media Library

* Grid w/ chips (`Tattoo? 88%`, `Artwork? 76%`).
* Bulk create → Tattoo/Artwork review modal (prefilled by detections).
* Filters: type, confidence, tags, ingest_status.

### 8.2 Tattoo/Artwork Editor

* Left: metadata tabs (Basics, Taxonomy, SEO, Notes).
* Right: preview; related media; AI suggestions.
* `Generate caption` → insert into Marketing draft.

### 8.3 Workflows

* Table of rules → on/off; last fired; run manual test.
* Rule builder (IF/THEN) with condition & action pickers.

### 8.4 Marketing Outbox

* Kanban: Draft → Ready → Scheduled → Sent.
* Per‑channel preview; violations (length, missing alt, watermark).

### 8.5 Settings → Structure

* Taxonomy manager with drag‑sort and nesting.
* Validation rules per entity.

---

## 9) Implementation Status & Next Steps

### ✅ **Sprint 1 — Foundations (COMPLETED)**

* [x] **Database**: Core tables for media, tattoo, artwork, inquiries, users, emails
* [x] **Upload Pipeline**: Inngest workflow with Sharp-based image processing
* [x] **AI Integration**: GPT-4o analysis for media and tattoo classification
* [x] **Media Library**: Grid/list views with mobile-responsive cards
* [x] **Admin Panel**: Navigation, settings, portfolio management
* [x] **Authentication**: Google OAuth integration
* [x] **File Storage**: DigitalOcean Spaces with automatic resizing

### 🚧 **Sprint 2 — Workflows & Enhanced Intelligence (IN PROGRESS)**

* [x] **Tattoo/Artwork Creation**: Create-from-media flow with AI prefill
* [x] **Mobile Responsive**: Card-based layouts for mobile devices
* [x] **Inquiry Management**: Mobile-responsive inquiry handling
* [ ] **Enhanced Classification**: Tattoo vs artwork detection with confidence scores
* [ ] **Smart Prompts**: Inline banners for entity creation suggestions
* [ ] **Rule Engine**: Basic workflow automation (triggers/conditions/actions)
* [ ] **Taxonomy Management**: Admin-configurable categories and tags

### 📋 **Sprint 3 — Marketing Assistant v1 (PLANNED)**

* [ ] **Caption/Hashtag Generator**: Tone presets and content optimization
* [ ] **Cross-post Connectors**: Instagram, TikTok, Facebook integration
* [ ] **Scheduler**: Calendar view with best-time suggestions
* [ ] **Outbox Kanban**: Draft → Ready → Scheduled → Sent workflow
* [ ] **A/B Testing**: Content variations with performance tracking
* [ ] **Watermark Enforcement**: Per-channel watermark settings
* [ ] **Analytics Integration**: Engagement metrics and performance tracking

### 🎯 **Current Priority Features**

**High Priority**:
1. **Enhanced Media Classification**: Tattoo vs artwork detection with confidence scores
2. **Taxonomy Management**: Admin interface for managing categories and tags
3. **Marketing Assistant v1**: Basic caption generation and social media integration

**Medium Priority**:
1. **Workflow Automation**: Rule-based triggers for common actions
2. **Audit Logging**: Track changes and user actions
3. **Advanced Scheduling**: Best-time suggestions and calendar integration

**Low Priority**:
1. **A/B Testing**: Content variations and performance optimization
2. **Advanced Analytics**: Detailed engagement and conversion tracking
3. **Multi-tenant Support**: Multiple artist/studio management

---

## 10) Current API Endpoints (✅ Implemented)

### 10.1 Media Management
- `GET /api/media` - List all media with filtering and pagination
- `POST /api/upload/local` - Upload media files locally
- `GET /api/media/[id]/status` - Get processing status
- `GET /api/media/stats` - Media statistics

### 10.2 Portfolio Management
- `GET /api/artwork` - List artwork with filtering
- `POST /api/artwork` - Create new artwork
- `GET /api/artwork/[id]` - Get specific artwork
- `PUT /api/artwork/[id]` - Update artwork
- `DELETE /api/artwork/[id]` - Delete artwork
- `GET /api/tattoos` - List tattoos with filtering
- `POST /api/tattoos` - Create new tattoo
- `GET /api/tattoos/[id]` - Get specific tattoo
- `PUT /api/tattoos/[id]` - Update tattoo
- `DELETE /api/tattoos/[id]` - Delete tattoo
- `POST /api/tattoos/analyze` - AI analysis for tattoo images

### 10.3 Inquiry Management
- `GET /api/inquiries` - List inquiries with filtering
- `POST /api/inquiries/create` - Create new inquiry
- `GET /api/inquiries/[id]` - Get specific inquiry
- `PUT /api/inquiries/[id]` - Update inquiry

### 10.4 AI & Analysis
- `POST /api/marketing-assistant` - Marketing assistant conversation
- `POST /api/tattoos/analyze` - Tattoo image analysis

### 10.5 Email Management
- `GET /api/emails` - List sent emails
- `POST /api/emails/webhook` - Resend webhook handler

### 10.6 Authentication
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/login` - Login endpoint
- `POST /api/auth/logout` - Logout endpoint
- `GET /api/auth/me` - Get current user

### 10.7 Background Processing
- `POST /api/inngest` - Inngest webhook handler
- `GET /api/inngest/status` - Processing status

---

## 11) Technology Stack (Current)

### 11.1 Frontend
- **Framework**: Next.js 13+ with TypeScript
- **Styling**: Styled Components
- **UI Components**: Custom components with React Icons
- **State Management**: React hooks and context
- **Responsive Design**: Mobile-first approach with breakpoints

### 11.2 Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: SQLite with Drizzle ORM (Turso-ready)
- **File Storage**: DigitalOcean Spaces
- **Background Jobs**: Inngest for workflow automation
- **Image Processing**: Sharp for resizing and optimization

### 11.3 AI & Analytics
- **AI Provider**: OpenAI GPT-4o
- **Image Analysis**: Custom prompts for media and tattoo classification
- **Content Generation**: Marketing assistant with conversation flow

### 11.4 Integrations
- **Authentication**: Google OAuth
- **Email**: Resend for transactional emails
- **File Sync**: Google Drive integration (optional)
- **Payment**: Stripe integration (for future e-commerce)

### 11.5 Development & Deployment
- **Version Control**: Git with GitHub
- **Deployment**: Vercel (recommended)
- **Database Migration**: Drizzle Kit
- **Environment**: Environment variables for configuration

---

## 12) Example Drizzle Types (Current Implementation)

```ts
export type Media = {
  id: string; ownerId: string;
  urlOriginal: string; urlDisplay: string; urlThumb: string;
  mimeType: string; width: number; height: number; filesize: number;
  detectedType: 'tattoo' | 'artwork' | 'unknown';
  detections: Record<string, any>; exif: Record<string, any> | null;
  ingestStatus: 'pending' | 'processed' | 'failed';
  createdAt: string; updatedAt: string;
};

export type WorkflowRule = {
  id: string; name: string; isEnabled: boolean;
  trigger: 'on_upload' | 'on_publish' | 'on_schedule' | 'daily_cron';
  conditions: Record<string, any>;
  actions: Array<Record<string, any>>;
};
```

---

## 11) n8n / Webhook Recipes (optional integration)

* **On Upload** → webhook to n8n → branch by `detected_type` → set tags → notify Slack.
* **On Publish** → render static image card (OG template) → push to IG queue.
* **Weekly Digest** → compile top 6 items → draft newsletter in Buttondown.

---

## 12) Policy & Safety

* Consent flags for tattoo placements; opt-in for client photos.
* NSFW handling, blurring, and age gates where relevant.
* Photographer credit requirements.
* Right-to-remove mechanism + takedown log.

---

## 13) Success Metrics

* Time-to-publish from upload (median).
* % uploads classified; % accepted suggestions.
* Posts/week per artist; CTR from social to site.
* Booking conversions (if integrated).

---

## 14) Open Questions

* Which social channels to launch first (IG + site hero assumed)?
* Watermark per-channel defaults? (IG on, TikTok off?)
* Booking integration target (Calendly, Momence, or native?).

---

## 15) Quick Start (Operator Guide)

1. Go to **Settings → Structure** and confirm tattoo/artwork taxonomies.
2. Configure **Settings → Automations**: enable `Auto-prompt tattoos` rule.
3. Upload test media; accept prompts to create entities; edit metadata.
4. In **Marketing → Outbox**, generate captions and schedule to IG.
5. Review analytics weekly; tweak taxonomies and rules.
