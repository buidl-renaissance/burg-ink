import { sql } from "drizzle-orm";
import { 
  text, 
  sqliteTable, 
  integer, 
  real, 
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
  handle: text("handle").notNull().unique(),
  slug: text("slug").notNull().unique(),
  profile_picture: text("profile_picture"),
  bio: text("bio"),
  social_links_id: integer("social_links_id").references(() => socialLinks.id),
  tags: text("tags"), // JSON string of tags
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
}, (table) => ({
  handleIdx: uniqueIndex("handle_idx").on(table.handle),
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
  collaborator_ids: text("collaborator_ids"), // JSON array of collaborator IDs
  category: text("category"),
  is_for_sale: integer("is_for_sale", { mode: "boolean" }).default(false),
  price: real("price"),
  num_collaborators: integer("num_collaborators").default(0),
  review_text: text("review_text"),
  review_image: text("review_image"),
  artist_name: text("artist_name"),
  uploaded_by: text("uploaded_by"),
  transaction_digest: text("transaction_digest"),
  meta: text("meta"), // JSON string for additional metadata
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
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