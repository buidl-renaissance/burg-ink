import { sql } from "drizzle-orm";
import { 
  text, 
  sqliteTable, 
  integer, 
  index,
  blob,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

// Social Links table
export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  twitter: text("twitter"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  github: text("github"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Artists table
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
}, (table) => ({
  slugIdx: uniqueIndex("slug_idx").on(table.slug),
}));

// Artwork table
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
}, (table) => ({
  slugIdx: uniqueIndex("artwork_slug_idx").on(table.slug),
  artistIdx: index("artwork_artist_idx").on(table.artist_id),
  typeIdx: index("artwork_type_idx").on(table.type),
}));

// Tattoos table
export const tattoos = sqliteTable("tattoos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  artist_id: integer("artist_id").references(() => artists.id),
  image: text("image"), // Main tattoo image
  category: text("category"), // Traditional, Japanese, Geometric, Floral, Blackwork, Watercolor, etc.
  placement: text("placement"), // Body placement (arm, leg, back, etc.)
  size: text("size"), // small, medium, large
  style: text("style"), // Style description
  meta: text("meta"), // JSON string for additional metadata
  data: text("data"), // JSON string for additional data
  embedding: blob("embedding"), // Float32Array vector as binary
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
}, (table) => ({
  slugIdx: uniqueIndex("tattoos_slug_idx").on(table.slug),
  artistIdx: index("tattoos_artist_idx").on(table.artist_id),
  categoryIdx: index("tattoos_category_idx").on(table.category),
}));

// Content table for artwork media
export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artwork_id: integer("artwork_id").references(() => artwork.id).notNull(),
  user_id: integer("user_id"), // Reference to user who created the content
  width: integer("width"),
  height: integer("height"),
  type: text("type").notNull(), // image, video, etc.
  youtube_id: text("youtube_id"),
  url: text("url"),
  caption: text("caption"),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  artworkIdx: index("content_artwork_idx").on(table.artwork_id),
  typeIdx: index("content_type_idx").on(table.type),
}));

// Artwork collaborators junction table
export const artworkCollaborators = sqliteTable("artwork_collaborators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artwork_id: integer("artwork_id").references(() => artwork.id).notNull(),
  artist_id: integer("artist_id").references(() => artists.id).notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  artworkArtistIdx: uniqueIndex("artwork_artist_unique_idx").on(table.artwork_id, table.artist_id),
  artworkIdx: index("collaborators_artwork_idx").on(table.artwork_id),
  artistIdx: index("collaborators_artist_idx").on(table.artist_id),
}));

// Users table (basic structure for content references)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cid: text("cid").unique(),
  name: text("name").notNull(),
  email: text("email").unique(),
  password: text("password"),
  bio: text("bio"),
  profile_picture: text("profile_picture"),
  role: text("role").default("user"), // 'admin' | 'user' | 'artist' | 'moderator'
  status: text("status").default("active"), // 'active' | 'inactive' | 'suspended'
  is_verified: integer("is_verified").default(0), // Email verification status
  last_login_at: text("last_login_at"), // Last login timestamp
  login_count: integer("login_count").default(0), // Total login count
  data: text("data"), // JSON string for additional data
  google_id: text("google_id"),
  google_drive_token: text("google_drive_token"),
  google_drive_refresh_token: text("google_drive_refresh_token"),
  google_drive_folder_id: text("google_drive_folder_id"),
  google_drive_sync_enabled: integer("google_drive_sync_enabled").default(0),
  last_sync_at: text("last_sync_at"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  cidIdx: uniqueIndex("user_cid_idx").on(table.cid),
  emailIdx: uniqueIndex("user_email_idx").on(table.email),
  roleIdx: index("user_role_idx").on(table.role),
  statusIdx: index("user_status_idx").on(table.status),
}));

// Saved Marketing Content table
export const savedMarketingContent = sqliteTable("saved_marketing_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  artist_id: integer("artist_id").references(() => artists.id),
  entity_id: integer("entity_id"), // artwork or tattoo id
  entity_type: text("entity_type"), // 'artwork' | 'tattoo'
  content_type: text("content_type").notNull(), // 'social-post' | 'caption' | 'hashtags' | 'bio' | 'artist-statement' | 'email'
  platform: text("platform").notNull(), // 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'email'
  tone: text("tone").notNull(), // 'professional' | 'casual' | 'hype' | 'minimal' | 'storytelling' | 'educational'
  content: text("content").notNull(),
  hashtags: text("hashtags"), // JSON string of hashtags
  metadata: text("metadata"), // JSON string for additional data (CTAs, mentions, etc.)
  title: text("title"), // User-defined title for saved content
  tags: text("tags"), // JSON string of user tags for organization
  is_favorite: integer("is_favorite").default(0), // 0 or 1
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index("saved_content_user_idx").on(table.user_id),
  artistIdx: index("saved_content_artist_idx").on(table.artist_id),
  contentTypeIdx: index("saved_content_type_idx").on(table.content_type),
  platformIdx: index("saved_content_platform_idx").on(table.platform),
}));

// Marketing Assistant Conversation Threads table
export const marketingConversations = sqliteTable("marketing_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  artist_id: integer("artist_id").references(() => artists.id),
  title: text("title").notNull(), // User-defined or auto-generated title
  messages: text("messages").notNull(), // JSON string of conversation messages
  artist_profile: text("artist_profile"), // JSON string of artist profile at time of conversation
  conversation_stage: text("conversation_stage").default("intro"), // Current stage of conversation
  is_active: integer("is_active").default(1), // 0 or 1 - whether this is the current active conversation
  tags: text("tags"), // JSON string of user tags for organization
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  last_message_at: text("last_message_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index("conversation_user_idx").on(table.user_id),
  artistIdx: index("conversation_artist_idx").on(table.artist_id),
  activeIdx: index("conversation_active_idx").on(table.is_active),
  lastMessageIdx: index("conversation_last_message_idx").on(table.last_message_at),
}));

// Venues table for events
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
  data: text("data"), // JSON string for additional data
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});

// Events table
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cid: text("cid").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  image: text("image"),
  image_data: text("image_data"), // JSON string for image metadata
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  categories: text("categories"), // JSON string of categories
  event_categories: text("event_categories"), // JSON string of event categories
  featured: integer("featured").default(0), // boolean as integer
  host: text("host"),
  venue_id: integer("venue_id").references(() => venues.id),
  url: text("url"),
  data: text("data"), // JSON string for additional data
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
}, (table) => ({
  slugIdx: uniqueIndex("event_slug_idx").on(table.slug),
  cidIdx: index("event_cid_idx").on(table.cid),
  venueIdx: index("event_venue_idx").on(table.venue_id),
  startDateIdx: index("event_start_date_idx").on(table.start_date),
  featuredIdx: index("event_featured_idx").on(table.featured),
}));

// Event comments table
export const eventComments = sqliteTable("event_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event_id: integer("event_id").references(() => events.id).notNull(),
  user_id: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
}, (table) => ({
  eventIdx: index("comment_event_idx").on(table.event_id),
  userIdx: index("comment_user_idx").on(table.user_id),
}));

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
  spaces_key: text("spaces_key"), // DigitalOcean Spaces object key
  spaces_url: text("spaces_url"), // DigitalOcean Spaces public URL
  created_time: text("created_time"),
  modified_time: text("modified_time"),
  sync_status: text("sync_status").default("pending"),
  artwork_id: integer("artwork_id").references(() => artwork.id),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  fileIdx: uniqueIndex("gdrive_file_id_idx").on(table.file_id),
  userIdx: index("gdrive_user_idx").on(table.user_id),
  folderIdx: index("gdrive_folder_idx").on(table.folder_id),
}));

// Media table for storing media assets from various sources (matching actual database after migration 0016)
export const media = sqliteTable("media", {
  id: text("id").primaryKey(), // Text UUID as per migration 0016
  original_url: text("original_url").notNull(), // Snake case as in database
  medium_url: text("medium_url"), // Snake case as in database
  thumbnail_url: text("thumbnail_url"), // Snake case as in database
  source: text("source").notNull(), // 'local' | 'gdrive'
  source_id: text("source_id"), // Optional source ID for tracking
  ai_analysis: text("ai_analysis"), // JSON string for AI analysis results
  tags: text("tags").default("[]"), // JSON string as in database
  title: text("title"), // Added from media-manager
  description: text("description"), // AI-generated description
  alt_text: text("alt_text"), // Snake case as in database
  created_at: integer("created_at").default(sql`(unixepoch())`).notNull(), // Unix timestamp
  user_id: integer("user_id").references(() => users.id), // Optional user reference
  filename: text("filename"), // Keep filename for compatibility
  mime_type: text("mime_type"), // Keep mime type
  size: integer("size"), // Keep size
  width: integer("width"), // Original image width
  height: integer("height"), // Original image height
  processing_status: text("processing_status").default("pending"), // Keep processing status
  // New classification fields
  detected_type: text("detected_type"), // 'tattoo' | 'artwork' | 'unknown'
  detection_confidence: text("detection_confidence"), // 0.0 to 1.0 as text
  detections: text("detections"), // JSON blob for detailed AI classification results
  suggested_entity_id: integer("suggested_entity_id"), // Track if entity was created from this media
  suggested_entity_type: text("suggested_entity_type"), // 'tattoo' | 'artwork'
}, (table) => ({
  sourceIdx: index("media_source_idx").on(table.source),
  userIdx: index("media_user_idx").on(table.user_id),
  statusIdx: index("media_status_idx").on(table.processing_status),
  sourceIdIdx: index("media_source_id_idx").on(table.source_id),
  detectedTypeIdx: index("media_detected_type_idx").on(table.detected_type),
  confidenceIdx: index("media_confidence_idx").on(table.detection_confidence),
}));

// Taxonomy table for admin-configurable categories and tags
export const taxonomy = sqliteTable("taxonomy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  namespace: text("namespace").notNull(), // e.g., 'tattoo.style', 'tattoo.placement', 'artwork.category'
  key: text("key").notNull(), // Unique within namespace
  label: text("label").notNull(), // Display name
  description: text("description"), // Optional description
  order: integer("order").default(0), // For sorting within namespace
  is_active: integer("is_active").default(1), // Boolean flag
  parent_id: integer("parent_id"), // Self-reference for hierarchical taxonomies (no foreign key to avoid circular reference)
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  namespaceKeyIdx: uniqueIndex("taxonomy_namespace_key_idx").on(table.namespace, table.key),
  namespaceIdx: index("taxonomy_namespace_idx").on(table.namespace),
  parentIdx: index("taxonomy_parent_idx").on(table.parent_id),
  activeIdx: index("taxonomy_active_idx").on(table.is_active),
}));

// Workflow rules table for automation rules
export const workflowRules = sqliteTable("workflow_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // e.g., "Auto-suggest tattoo creation"
  description: text("description"), // Optional description
  trigger: text("trigger").notNull(), // 'on_upload', 'on_classification', 'on_publish'
  conditions: text("conditions").notNull(), // JSON - e.g., {"detected_type": "tattoo", "min_confidence": 0.7}
  actions: text("actions").notNull(), // JSON - e.g., [{"type": "flag_media"}, {"type": "notify_admin"}]
  is_enabled: integer("is_enabled").default(1), // Boolean flag
  priority: integer("priority").default(0), // Execution order (lower numbers execute first)
  last_fired_at: text("last_fired_at"), // Timestamp of last execution
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  enabledIdx: index("workflow_enabled_idx").on(table.is_enabled),
  triggerIdx: index("workflow_trigger_idx").on(table.trigger),
  priorityIdx: index("workflow_priority_idx").on(table.priority),
}));

// Inquiries table for storing customer inquiries
export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contact_id: integer("contact_id").references(() => contacts.id), // Link to contact record
  name: text("name").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  budget: text("budget"), // Budget for the project
  tattoo_concept: text("tattoo_concept").notNull(), // Main tattoo description
  animal_person_emotion: text("animal_person_emotion"), // Emotion for animal/person designs
  abstract_energy: text("abstract_energy"), // Adjectives and energy for abstract designs
  tattoo_size: text("tattoo_size"), // Size estimate
  color_preference: text("color_preference"), // 'color' or 'black_gray'
  photo_references: text("photo_references"), // JSON array of uploaded reference photo URLs
  placement_photos: text("placement_photos"), // JSON array of uploaded placement photo URLs
  newsletter_signup: integer("newsletter_signup").default(0), // boolean as integer
  inquiry_type: text("inquiry_type").notNull(), // 'tattoo', 'artwork', 'collaboration', 'other'
  message: text("message").notNull(), // Legacy field for backward compatibility
  status: text("status").default("new"), // 'new', 'contacted', 'completed', 'archived'
  email_sent: integer("email_sent").default(0), // boolean as integer
  email_sent_at: text("email_sent_at"),
  notes: text("notes"), // Internal notes
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  contactIdx: index("inquiry_contact_idx").on(table.contact_id),
  emailIdx: index("inquiry_email_idx").on(table.email),
  statusIdx: index("inquiry_status_idx").on(table.status),
  typeIdx: index("inquiry_type_idx").on(table.inquiry_type),
  createdAtIdx: index("inquiry_created_at_idx").on(table.created_at),
}));

// Emails table for tracking sent emails via Resend
export const emails = sqliteTable("emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resend_id: text("resend_id").unique(), // Resend email ID
  subject: text("subject").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(), // JSON array of recipients
  cc: text("cc"), // JSON array of CC recipients
  bcc: text("bcc"), // JSON array of BCC recipients
  html_content: text("html_content"),
  text_content: text("text_content"),
  status: text("status").default("pending"), // 'pending', 'sent', 'delivered', 'failed', 'bounced', 'complained', 'unsubscribed'
  error_message: text("error_message"), // Error message if failed
  sent_at: text("sent_at"),
  delivered_at: text("delivered_at"),
  opened_at: text("opened_at"),
  clicked_at: text("clicked_at"),
  bounced_at: text("bounced_at"),
  complained_at: text("complained_at"),
  unsubscribed_at: text("unsubscribed_at"),
  metadata: text("metadata"), // JSON string for additional metadata
  template_id: text("template_id"), // If using email templates
  inquiry_id: integer("inquiry_id").references(() => inquiries.id), // Link to inquiry if applicable
  user_id: integer("user_id").references(() => users.id), // Link to user if applicable
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  resendIdIdx: uniqueIndex("email_resend_id_idx").on(table.resend_id),
  statusIdx: index("email_status_idx").on(table.status),
  fromIdx: index("email_from_idx").on(table.from),
  toIdx: index("email_to_idx").on(table.to),
  sentAtIdx: index("email_sent_at_idx").on(table.sent_at),
  createdAtIdx: index("email_created_at_idx").on(table.created_at),
  inquiryIdx: index("email_inquiry_idx").on(table.inquiry_id),
  userIdx: index("email_user_idx").on(table.user_id),
}));

// Website Settings table for storing global website settings as key-value pairs
export const websiteSettings = sqliteTable("website_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(), // Setting key (e.g., 'default_artist_profile', 'onboarding_config')
  value: text("value").notNull(), // Setting value as raw string or JSON-encoded data
  description: text("description"), // Optional description of what this setting does
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  keyIdx: uniqueIndex("settings_key_idx").on(table.key),
}));

// User Activity Logs table for tracking user actions
export const userActivityLogs = sqliteTable("user_activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'login', 'logout', 'profile_update', 'password_change', etc.
  details: text("details"), // JSON string with additional action details
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index("activity_user_idx").on(table.user_id),
  actionIdx: index("activity_action_idx").on(table.action),
  createdAtIdx: index("activity_created_at_idx").on(table.created_at),
}));

// User Invitations table for tracking pending user invitations
export const userInvitations = sqliteTable("user_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  role: text("role").default("user"), // Role to assign when user accepts invitation
  invited_by: integer("invited_by").references(() => users.id).notNull(),
  token: text("token").notNull().unique(), // Unique invitation token
  expires_at: text("expires_at").notNull(), // Expiration timestamp
  accepted_at: text("accepted_at"), // When invitation was accepted
  user_id: integer("user_id").references(() => users.id), // Created user ID after acceptance
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index("invitation_email_idx").on(table.email),
  tokenIdx: uniqueIndex("invitation_token_idx").on(table.token),
  invitedByIdx: index("invitation_invited_by_idx").on(table.invited_by),
}));

// Contacts table for CRM contact management
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  job_title: text("job_title"),
  source: text("source").default("website"), // 'website', 'referral', 'social', 'event', 'import'
  lifecycle_stage: text("lifecycle_stage").default("lead"), // 'lead', 'prospect', 'customer', 'advocate'
  tags: text("tags").default("[]"), // JSON array of tag names
  custom_fields: text("custom_fields").default("{}"), // JSON object with custom field values
  notes: text("notes"), // General notes about the contact
  avatar_url: text("avatar_url"),
  is_active: integer("is_active").default(1), // Boolean flag
  last_contacted_at: text("last_contacted_at"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: uniqueIndex("contact_email_idx").on(table.email),
  sourceIdx: index("contact_source_idx").on(table.source),
  stageIdx: index("contact_stage_idx").on(table.lifecycle_stage),
  activeIdx: index("contact_active_idx").on(table.is_active),
}));

// Contact Tags table for organizing contacts
export const contactTags = sqliteTable("contact_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").default("#96885f"), // Hex color for UI display
  description: text("description"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameIdx: uniqueIndex("tag_name_idx").on(table.name),
}));

// Contact Notes table for interaction tracking
export const contactNotes = sqliteTable("contact_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contact_id: integer("contact_id").references(() => contacts.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  note_type: text("note_type").default("general"), // 'general', 'call', 'email', 'meeting', 'follow_up'
  content: text("content").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  contactIdx: index("note_contact_idx").on(table.contact_id),
  userIdx: index("note_user_idx").on(table.user_id),
  createdAtIdx: index("note_created_at_idx").on(table.created_at),
}));

// Contact Custom Fields table for defining custom fields
export const contactCustomFields = sqliteTable("contact_custom_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  field_name: text("field_name").notNull(),
  field_type: text("field_type").notNull(), // 'text', 'number', 'date', 'select', 'multiselect', 'boolean'
  field_options: text("field_options"), // JSON array for select/multiselect options
  is_required: integer("is_required").default(0), // Boolean flag
  display_order: integer("display_order").default(0),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameIdx: uniqueIndex("custom_field_name_idx").on(table.field_name),
  orderIdx: index("custom_field_order_idx").on(table.display_order),
}));

// Email Campaigns table for email marketing
export const emailCampaigns = sqliteTable("email_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  preview_text: text("preview_text"),
  html_content: text("html_content").notNull(),
  text_content: text("text_content"),
  from_name: text("from_name").notNull(),
  from_email: text("from_email").notNull(),
  reply_to: text("reply_to"),
  status: text("status").default("draft"), // 'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'
  scheduled_at: text("scheduled_at"), // When campaign should be sent
  sent_at: text("sent_at"), // When campaign was actually sent
  created_by: integer("created_by").references(() => users.id).notNull(),
  recipient_count: integer("recipient_count").default(0),
  opened_count: integer("opened_count").default(0),
  clicked_count: integer("clicked_count").default(0),
  bounced_count: integer("bounced_count").default(0),
  unsubscribed_count: integer("unsubscribed_count").default(0),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index("campaign_status_idx").on(table.status),
  createdByIdx: index("campaign_created_by_idx").on(table.created_by),
  scheduledIdx: index("campaign_scheduled_idx").on(table.scheduled_at),
}));

// Campaign Recipients table for tracking individual email sends
export const campaignRecipients = sqliteTable("campaign_recipients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaign_id: integer("campaign_id").references(() => emailCampaigns.id).notNull(),
  contact_id: integer("contact_id").references(() => contacts.id).notNull(),
  email: text("email").notNull(),
  status: text("status").default("pending"), // 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'
  sent_at: text("sent_at"),
  delivered_at: text("delivered_at"),
  opened_at: text("opened_at"),
  clicked_at: text("clicked_at"),
  bounced_at: text("bounced_at"),
  unsubscribed_at: text("unsubscribed_at"),
  error_message: text("error_message"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  campaignIdx: index("recipient_campaign_idx").on(table.campaign_id),
  contactIdx: index("recipient_contact_idx").on(table.contact_id),
  emailIdx: index("recipient_email_idx").on(table.email),
  statusIdx: index("recipient_status_idx").on(table.status),
}));
