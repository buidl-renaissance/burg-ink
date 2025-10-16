# Artist Admin Panel — Next Steps & Implementation Plan

*Last updated: Oct 16, 2025 (America/Detroit)*

## 0) Goals for this iteration

* Ship **Marketing Assistant v1** (captions, hashtags, auto-campaigns, cross‑post & link‑in‑bio blocks).
* Add **Config → Structure** to let admins define categories, taxonomies, and page layouts without code.
* Implement **Automated Workflows** for media → (Tattoo | Artwork) entities with review gates.
* Deliver **Upload Intelligence**: detect tattoos vs. general artwork; prompt to create structured items.
* Establish **roles/permissions, audit logs, versioning** for safe admin operations.

---

## 1) Core Entities & Minimal Schema (Turso/Drizzle-ready)

### 1.1 Media

* `id` (uuid)
* `owner_id`
* `url_original`, `url_display`, `url_thumb`
* `mime_type`, `width`, `height`, `filesize`
* `detected_type` enum: `tattoo | artwork | unknown`
* `detections` (jsonb): labels, confidence, body_part boxes
* `exif` (jsonb)
* `ingest_status` enum: `pending | processed | failed`
* `created_at`, `updated_at`

### 1.2 Artwork

* `id`, `slug`, `title`, `description`, `status` (`draft|review|published|archived`)
* `artist_id`
* `media_primary_id`
* `tags` (jsonb), `categories` (jsonb)
* `series_id` (optional)
* `price_cents` (nullable), `for_sale` (bool), `sku`
* `dimensions`, `materials`, `year`
* `seo_meta` (jsonb)
* `created_at`, `updated_at`

### 1.3 Tattoo

* `id`, `slug`, `title`, `status`
* `artist_id`
* `media_primary_id`
* `style[]` (e.g., traditional, neo, realism), `themes[]` (snake, flower), `body_zone` (enum), `color_mode` (black-grey|color)
* `placement_notes`, `aftercare_notes`
* `booking_link` (nullable)
* `seo_meta` (jsonb)
* `created_at`, `updated_at`

### 1.4 Taxonomy (admin-defined)

* `id`, `namespace` (e.g., `tattoo.style`, `tattoo.body_zone`, `artwork.category`)
* `key` (machine), `label` (display), `description`, `order`
* `is_active` (bool), `parent_id` (nullable)

### 1.5 Workflow Rules

* `id`, `name`, `trigger` (upload|publish|schedule), `conditions` (jsonb), `actions` (jsonb), `is_enabled`

### 1.6 Marketing Asset

* `id`, `entity_type` (tattoo|artwork|collection), `entity_id`
* `caption`, `hashtags[]`, `cta`
* `channels[]` (ig, tiktok, fb, x, threads, pinterest, web-hero, newsletter)
* `schedule_at` (nullable), `status` (draft|scheduled|sent|failed), `results` (jsonb)

### 1.7 System Config

* `id`, `group` (ui, seo, watermark, automations), `key`, `value` (jsonb)

### 1.8 Audit & Versioning

* `audit_log`: `id`, `actor_id`, `entity`, `entity_id`, `action`, `diff` (jsonb), `timestamp`
* `versions`: `id`, `entity`, `entity_id`, `snapshot` (jsonb), `created_at`

---

## 2) Upload Intelligence → Prompted Creation

### 2.1 Detection Pipeline

1. **Upload** → create `media` row with `ingest_status=pending`.
2. **Process** (Ingest worker):

   * Derive variants: `display`, `thumb`.
   * Run classification: `tattoo` vs `artwork` (fallback `unknown`).
   * Run taggers:

     * Tattoo: style, color_mode, body_zone (rough), themes (snake, flower, skull...).
     * Artwork: medium, palette, subject.
   * Save to `detections` with confidences.
   * Set `ingest_status=processed`.
3. **Create Prompt**: If `detected_type=t attoo|artwork` and confidence ≥ threshold:

   * Surface **Inline Banner** in Media Library: "Looks like a **Tattoo** (92%). Create a Tattoo entry?" → `Create Tattoo`.
   * Pre-fill form sections from detections; attach primary image.

### 2.2 Confidence Thresholds (configurable)

* `classification_min_conf`: default 0.70
* `auto-tag_min_conf`: default 0.55
* `auto-create_entity_on_upload`: default `false` (use "prompt to create" first; can be enabled per-org)

### 2.3 UX states

* Chip labels on thumbnails: `Tattoo? 88%` / `Artwork? 76%`.
* Bulk actions: `Create Tattoos from 8 selected` (review modal).
* Undo snackbar after creation.

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

## 9) Implementation Checklist (2–3 sprints)

### Sprint 1 — Foundations

* [ ] DB: tables for media, tattoo, artwork, taxonomy, workflows, marketing, config, audit, versions.
* [ ] Upload pipeline (variants + metadata) with queue worker.
* [ ] Classifier stub (rules + baseline model) writing `detections`.
* [ ] Media Library UI: chips, filters, bulk select, review modal.
* [ ] Settings → Structure MVP (taxonomy CRUD + required fields).

### Sprint 2 — Workflows & Entities

* [ ] Rule engine (triggers/conditions/actions) + rule runner.
* [ ] Tattoo/Artwork create-from-media flow with prefill.
* [ ] Review queues + statuses (draft/review/published).
* [ ] Audit log + basic version snapshots.

### Sprint 3 — Marketing Assistant v1

* [ ] Caption/hashtag generator w/ tone presets.
* [ ] Cross-post connectors (start with IG + site hero export; add others).
* [ ] Scheduler + Outbox Kanban + A/B.
* [ ] Alt text generator + watermark enforcement.
* [ ] Analytics stub (clicks, reach, CTR inputs where available).

---

## 10) Example Drizzle Types (TS) — sketch

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
