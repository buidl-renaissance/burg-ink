import { sql } from "drizzle-orm";
import { 
  text, 
  sqliteTable, 
  integer, 
  index,
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
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
}, (table) => ({
  slugIdx: uniqueIndex("artwork_slug_idx").on(table.slug),
  artistIdx: index("artwork_artist_idx").on(table.artist_id),
  typeIdx: index("artwork_type_idx").on(table.type),
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
  bio: text("bio"),
  profile_picture: text("profile_picture"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  cidIdx: uniqueIndex("user_cid_idx").on(table.cid),
  emailIdx: uniqueIndex("user_email_idx").on(table.email),
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