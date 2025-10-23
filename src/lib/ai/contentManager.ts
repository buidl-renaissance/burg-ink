import OpenAI from 'openai';
import { db } from '../db';
import { artwork, tattoos, events, artists, websiteSettings } from '../../../db/schema';
import { eq, like, or } from 'drizzle-orm';
import HardcodedContentManager from '../hardcodedContentManager';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentCommand {
  intent: 'create' | 'update' | 'delete' | 'read' | 'list' | 'search';
  contentType: 'artwork' | 'tattoo' | 'event' | 'artist' | 'settings' | 'hardcoded' | 'page';
  target?: {
    id?: number;
    slug?: string;
    field?: string;
    contentId?: string;
    filePath?: string;
  };
  value?: string;
  filters?: Record<string, any>;
  requiresApproval: boolean;
  confidence: number;
  reasoning: string;
}

export interface ContentSuggestion {
  id?: number;
  content_type: string;
  target_id?: number;
  target_path?: string;
  field_name?: string;
  current_value?: string;
  suggested_value: string;
  change_type: 'create' | 'update' | 'delete';
  reasoning: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

export interface ContentAnalysis {
  quality_score: number;
  seo_score: number;
  accessibility_score: number;
  suggestions: string[];
  issues: string[];
}

export class ContentManager {
  private static instance: ContentManager;
  private hardcodedManager: HardcodedContentManager;

  constructor() {
    this.hardcodedManager = HardcodedContentManager.getInstance();
  }

  static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  /**
   * Parse natural language command into structured action
   */
  async parseCommand(userInput: string, context?: any): Promise<ContentCommand> {
    const prompt = `You are a content management AI assistant. Parse the following user command into a structured action.

User command: "${userInput}"

Context: ${context ? JSON.stringify(context, null, 2) : 'No context provided'}

Available content types: artwork, tattoo, event, artist, settings, hardcoded, page

Return a JSON object with this structure:
{
  "intent": "create|update|delete|read|list|search",
  "contentType": "artwork|tattoo|event|artist|settings|hardcoded|page",
  "target": {
    "id": number (if specific item),
    "slug": "string (if slug provided)",
    "field": "string (if specific field)",
    "contentId": "string (for hardcoded content)",
    "filePath": "string (for hardcoded content)"
  },
  "value": "string (new content value)",
  "filters": { "key": "value" } (for search/list operations),
  "requiresApproval": boolean,
  "confidence": number (0.0 to 1.0),
  "reasoning": "string (explanation of the parsed command)"
}

Examples:
- "Update the homepage hero text" → {"intent": "update", "contentType": "hardcoded", "target": {"contentId": "homepage-hero-text"}, "requiresApproval": true, "confidence": 0.9, "reasoning": "User wants to update hardcoded homepage hero text"}
- "Create a new artwork titled Sacred Path" → {"intent": "create", "contentType": "artwork", "value": "Sacred Path", "requiresApproval": true, "confidence": 0.8, "reasoning": "User wants to create new artwork with specific title"}
- "Show me all unpublished events" → {"intent": "list", "contentType": "event", "filters": {"status": "draft"}, "requiresApproval": false, "confidence": 0.9, "reasoning": "User wants to list events with draft status"}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert content management AI that parses natural language commands into structured actions. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return parsed as ContentCommand;

    } catch (error) {
      console.error('Error parsing command:', error);
      // Return a fallback command
      return {
        intent: 'read',
        contentType: 'page',
        requiresApproval: false,
        confidence: 0.1,
        reasoning: 'Failed to parse command, defaulting to read operation'
      };
    }
  }

  /**
   * Generate content suggestions based on command
   */
  async generateContentSuggestions(command: ContentCommand, currentContent?: any): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    try {
      switch (command.intent) {
        case 'create':
          suggestions.push(...await this.generateCreateSuggestions(command));
          break;
        case 'update':
          suggestions.push(...await this.generateUpdateSuggestions(command, currentContent));
          break;
        case 'delete':
          suggestions.push(...await this.generateDeleteSuggestions(command));
          break;
        default:
          // For read/list/search, no suggestions needed
          break;
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Generate suggestions for create operations
   */
  private async generateCreateSuggestions(command: ContentCommand): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    if (command.contentType === 'artwork' && command.value) {
      suggestions.push({
        content_type: 'artwork',
        suggested_value: command.value,
        change_type: 'create',
        reasoning: `Create new artwork titled "${command.value}"`,
        confidence_score: 0.8,
        status: 'pending'
      });
    } else if (command.contentType === 'tattoo' && command.value) {
      suggestions.push({
        content_type: 'tattoo',
        suggested_value: command.value,
        change_type: 'create',
        reasoning: `Create new tattoo titled "${command.value}"`,
        confidence_score: 0.8,
        status: 'pending'
      });
    } else if (command.contentType === 'event' && command.value) {
      suggestions.push({
        content_type: 'event',
        suggested_value: command.value,
        change_type: 'create',
        reasoning: `Create new event titled "${command.value}"`,
        confidence_score: 0.8,
        status: 'pending'
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions for update operations
   */
  private async generateUpdateSuggestions(command: ContentCommand, currentContent?: any): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    if (command.contentType === 'hardcoded' && command.target?.contentId && command.value) {
      // Get current hardcoded content
      const contentItem = await this.hardcodedManager.getContentItem(command.target.contentId);
      if (contentItem) {
        suggestions.push({
          content_type: 'hardcoded',
          target_path: contentItem.file_path,
          field_name: command.target.field,
          current_value: contentItem.current_value,
          suggested_value: command.value,
          change_type: 'update',
          reasoning: `Update ${command.target.contentId} from "${contentItem.current_value}" to "${command.value}"`,
          confidence_score: 0.9,
          status: 'pending'
        });
      }
    } else if (command.contentType === 'settings' && command.target?.field && command.value) {
      suggestions.push({
        content_type: 'settings',
        field_name: command.target.field,
        suggested_value: command.value,
        change_type: 'update',
        reasoning: `Update setting ${command.target.field} to "${command.value}"`,
        confidence_score: 0.9,
        status: 'pending'
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions for delete operations
   */
  private async generateDeleteSuggestions(command: ContentCommand): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    if (command.target?.id) {
      suggestions.push({
        content_type: command.contentType,
        target_id: command.target.id,
        change_type: 'delete',
        reasoning: `Delete ${command.contentType} with ID ${command.target.id}`,
        confidence_score: 0.9,
        status: 'pending'
      });
    }

    return suggestions;
  }

  /**
   * Analyze content quality and provide suggestions
   */
  async analyzeContent(content: string, contentType: string): Promise<ContentAnalysis> {
    const prompt = `Analyze the following content for quality, SEO, and accessibility:

Content Type: ${contentType}
Content: "${content}"

Provide analysis in JSON format:
{
  "quality_score": number (0-100),
  "seo_score": number (0-100),
  "accessibility_score": number (0-100),
  "suggestions": ["suggestion1", "suggestion2"],
  "issues": ["issue1", "issue2"]
}

Focus on:
- Content clarity and readability
- SEO optimization (keywords, meta descriptions, headings)
- Accessibility (alt text, heading structure, color contrast)
- Grammar and spelling
- Content length and structure`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert content analyst specializing in quality, SEO, and accessibility. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content) as ContentAnalysis;

    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        quality_score: 50,
        seo_score: 50,
        accessibility_score: 50,
        suggestions: ['Content analysis failed'],
        issues: ['Unable to analyze content']
      };
    }
  }

  /**
   * Execute content changes
   */
  async executeContentChanges(suggestions: ContentSuggestion[]): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];
    let success = true;

    for (const suggestion of suggestions) {
      try {
        let result: any;

        switch (suggestion.content_type) {
          case 'artwork':
            result = await this.executeArtworkChange(suggestion);
            break;
          case 'tattoo':
            result = await this.executeTattooChange(suggestion);
            break;
          case 'event':
            result = await this.executeEventChange(suggestion);
            break;
          case 'settings':
            result = await this.executeSettingsChange(suggestion);
            break;
          case 'hardcoded':
            result = await this.executeHardcodedChange(suggestion);
            break;
          default:
            throw new Error(`Unsupported content type: ${suggestion.content_type}`);
        }

        results.push(result);
      } catch (error) {
        const errorMsg = `Error executing ${suggestion.content_type} change: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        success = false;
      }
    }

    return { success, results, errors };
  }

  /**
   * Execute artwork changes
   */
  private async executeArtworkChange(suggestion: ContentSuggestion): Promise<any> {
    if (suggestion.change_type === 'create') {
      // Create new artwork
      const newArtwork = await db.insert(artwork).values({
        title: suggestion.suggested_value,
        slug: this.generateSlug(suggestion.suggested_value),
        type: 'artwork',
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).returning();
      return newArtwork[0];
    } else if (suggestion.change_type === 'update' && suggestion.target_id) {
      // Update existing artwork
      const updated = await db.update(artwork)
        .set({
          [suggestion.field_name || 'title']: suggestion.suggested_value,
          updated_at: new Date().toISOString()
        })
        .where(eq(artwork.id, suggestion.target_id))
        .returning();
      return updated[0];
    } else if (suggestion.change_type === 'delete' && suggestion.target_id) {
      // Delete artwork
      await db.delete(artwork).where(eq(artwork.id, suggestion.target_id));
      return { deleted: true, id: suggestion.target_id };
    }
  }

  /**
   * Execute tattoo changes
   */
  private async executeTattooChange(suggestion: ContentSuggestion): Promise<any> {
    if (suggestion.change_type === 'create') {
      const newTattoo = await db.insert(tattoos).values({
        title: suggestion.suggested_value,
        slug: this.generateSlug(suggestion.suggested_value),
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).returning();
      return newTattoo[0];
    } else if (suggestion.change_type === 'update' && suggestion.target_id) {
      const updated = await db.update(tattoos)
        .set({
          [suggestion.field_name || 'title']: suggestion.suggested_value,
          updated_at: new Date().toISOString()
        })
        .where(eq(tattoos.id, suggestion.target_id))
        .returning();
      return updated[0];
    } else if (suggestion.change_type === 'delete' && suggestion.target_id) {
      await db.delete(tattoos).where(eq(tattoos.id, suggestion.target_id));
      return { deleted: true, id: suggestion.target_id };
    }
  }

  /**
   * Execute event changes
   */
  private async executeEventChange(suggestion: ContentSuggestion): Promise<any> {
    if (suggestion.change_type === 'create') {
      const newEvent = await db.insert(events).values({
        title: suggestion.suggested_value,
        slug: this.generateSlug(suggestion.suggested_value),
        cid: this.generateCid(),
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).returning();
      return newEvent[0];
    } else if (suggestion.change_type === 'update' && suggestion.target_id) {
      const updated = await db.update(events)
        .set({
          [suggestion.field_name || 'title']: suggestion.suggested_value,
          updated_at: new Date().toISOString()
        })
        .where(eq(events.id, suggestion.target_id))
        .returning();
      return updated[0];
    } else if (suggestion.change_type === 'delete' && suggestion.target_id) {
      await db.delete(events).where(eq(events.id, suggestion.target_id));
      return { deleted: true, id: suggestion.target_id };
    }
  }

  /**
   * Execute settings changes
   */
  private async executeSettingsChange(suggestion: ContentSuggestion): Promise<any> {
    if (suggestion.field_name) {
      // Check if setting exists
      const existing = await db.query.websiteSettings.findFirst({
        where: eq(websiteSettings.key, suggestion.field_name)
      });

      if (existing) {
        // Update existing setting
        const updated = await db.update(websiteSettings)
          .set({
            value: suggestion.suggested_value,
            updated_at: new Date().toISOString()
          })
          .where(eq(websiteSettings.key, suggestion.field_name))
          .returning();
        return updated[0];
      } else {
        // Create new setting
        const created = await db.insert(websiteSettings).values({
          key: suggestion.field_name,
          value: suggestion.suggested_value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).returning();
        return created[0];
      }
    }
  }

  /**
   * Execute hardcoded content changes
   */
  private async executeHardcodedChange(suggestion: ContentSuggestion): Promise<any> {
    if (suggestion.target_path && suggestion.field_name) {
      const changes = [{
        content_id: suggestion.field_name,
        new_value: suggestion.suggested_value,
        file_path: suggestion.target_path
      }];

      const result = await this.hardcodedManager.applyContentChanges(changes);
      return result;
    }
  }

  /**
   * Search content based on filters
   */
  async searchContent(contentType: string, filters: Record<string, any>): Promise<any[]> {
    switch (contentType) {
      case 'artwork':
        return await this.searchArtwork(filters);
      case 'tattoo':
        return await this.searchTattoos(filters);
      case 'event':
        return await this.searchEvents(filters);
      case 'artist':
        return await this.searchArtists(filters);
      default:
        return [];
    }
  }

  private async searchArtwork(filters: Record<string, any>): Promise<any[]> {
    let query = db.select().from(artwork);

    if (filters.title) {
      query = query.where(like(artwork.title, `%${filters.title}%`));
    }
    if (filters.category) {
      query = query.where(eq(artwork.category, filters.category));
    }

    return await query;
  }

  private async searchTattoos(filters: Record<string, any>): Promise<any[]> {
    let query = db.select().from(tattoos);

    if (filters.title) {
      query = query.where(like(tattoos.title, `%${filters.title}%`));
    }
    if (filters.category) {
      query = query.where(eq(tattoos.category, filters.category));
    }

    return await query;
  }

  private async searchEvents(filters: Record<string, any>): Promise<any[]> {
    let query = db.select().from(events);

    if (filters.title) {
      query = query.where(like(events.title, `%${filters.title}%`));
    }

    return await query;
  }

  private async searchArtists(filters: Record<string, any>): Promise<any[]> {
    let query = db.select().from(artists);

    if (filters.name) {
      query = query.where(like(artists.name, `%${filters.name}%`));
    }

    return await query;
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate unique CID
   */
  private generateCid(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export default ContentManager;
