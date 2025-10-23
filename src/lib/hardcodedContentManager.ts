import fs from 'fs';
import path from 'path';
import { db } from './db';
import { hardcodedContentRegistry } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface HardcodedContentItem {
  id: number;
  content_id: string;
  file_path: string;
  line_number?: number;
  content_type: 'text' | 'html' | 'jsx' | 'component';
  section_type: 'hero' | 'navigation' | 'footer' | 'sidebar' | 'title' | 'description' | 'other';
  current_value: string;
  description?: string;
  is_editable: boolean;
  last_modified?: string;
}

export interface ContentChange {
  content_id: string;
  new_value: string;
  file_path: string;
  line_number?: number;
}

export interface ContentDiff {
  content_id: string;
  old_value: string;
  new_value: string;
  file_path: string;
  line_number?: number;
  changes: Array<{
    type: 'added' | 'removed' | 'modified';
    content: string;
    line?: number;
  }>;
}

export class HardcodedContentManager {
  private static instance: HardcodedContentManager;
  private contentCache: Map<string, HardcodedContentItem> = new Map();

  static getInstance(): HardcodedContentManager {
    if (!HardcodedContentManager.instance) {
      HardcodedContentManager.instance = new HardcodedContentManager();
    }
    return HardcodedContentManager.instance;
  }

  /**
   * Scan the codebase for tagged content sections
   */
  async scanCodebaseForContent(rootPath: string = process.cwd()): Promise<HardcodedContentItem[]> {
    const contentItems: HardcodedContentItem[] = [];
    const srcPath = path.join(rootPath, 'src');

    if (!fs.existsSync(srcPath)) {
      throw new Error('Source directory not found');
    }

    // Scan all TypeScript/JavaScript files
    const files = this.getAllFiles(srcPath, ['.tsx', '.ts', '.jsx', '.js']);
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const items = this.extractContentFromFile(filePath, content);
        contentItems.push(...items);
      } catch (error) {
        console.warn(`Error reading file ${filePath}:`, error);
      }
    }

    return contentItems;
  }

  /**
   * Extract content items from a single file
   */
  private extractContentFromFile(filePath: string, content: string): HardcodedContentItem[] {
    const items: HardcodedContentItem[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for data-content-id attributes
      const contentIdMatch = line.match(/data-content-id="([^"]+)"/);
      if (contentIdMatch) {
        const contentId = contentIdMatch[1];
        const contentTypeMatch = line.match(/data-content-type="([^"]+)"/);
        const sectionTypeMatch = line.match(/data-section-type="([^"]+)"/);
        
        // Extract the content value (text between tags)
        const contentMatch = line.match(/>([^<]+)</);
        const contentValue = contentMatch ? contentMatch[1].trim() : '';

        if (contentValue) {
          items.push({
            id: 0, // Will be set when saved to database
            content_id: contentId,
            file_path: filePath,
            line_number: i + 1,
            content_type: (contentTypeMatch?.[1] as any) || 'text',
            section_type: (sectionTypeMatch?.[1] as any) || 'other',
            current_value: contentValue,
            description: this.generateDescription(contentId, contentValue),
            is_editable: true,
            last_modified: new Date().toISOString()
          });
        }
      }
    }

    return items;
  }

  /**
   * Generate a human-readable description for content
   */
  private generateDescription(contentId: string, value: string): string {
    const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
    return `${contentId}: "${shortValue}"`;
  }

  /**
   * Get all files with specific extensions
   */
  private getAllFiles(dirPath: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          files.push(...this.getAllFiles(fullPath, extensions));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  /**
   * Register content items in the database
   */
  async registerContentItems(items: HardcodedContentItem[]): Promise<void> {
    for (const item of items) {
      try {
        // Check if content already exists
        const existing = await db.query.hardcodedContentRegistry.findFirst({
          where: eq(hardcodedContentRegistry.content_id, item.content_id)
        });

        if (existing) {
          // Update existing content if value has changed
          if (existing.current_value !== item.current_value) {
            await db.update(hardcodedContentRegistry)
              .set({
                current_value: item.current_value,
                last_modified: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .where(eq(hardcodedContentRegistry.content_id, item.content_id));
          }
        } else {
          // Insert new content
          await db.insert(hardcodedContentRegistry).values({
            content_id: item.content_id,
            file_path: item.file_path,
            line_number: item.line_number,
            content_type: item.content_type,
            section_type: item.section_type,
            current_value: item.current_value,
            description: item.description,
            is_editable: item.is_editable ? 1 : 0,
            last_modified: item.last_modified
          });
        }

        // Update cache
        this.contentCache.set(item.content_id, item);
      } catch (error) {
        console.error(`Error registering content item ${item.content_id}:`, error);
      }
    }
  }

  /**
   * Get all registered content items
   */
  async getAllContentItems(): Promise<HardcodedContentItem[]> {
    const items = await db.query.hardcodedContentRegistry.findMany();
    return items.map(item => ({
      id: item.id,
      content_id: item.content_id,
      file_path: item.file_path,
      line_number: item.line_number || undefined,
      content_type: item.content_type as any,
      section_type: item.section_type as any,
      current_value: item.current_value,
      description: item.description || undefined,
      is_editable: Boolean(item.is_editable),
      last_modified: item.last_modified || undefined
    }));
  }

  /**
   * Get content item by ID
   */
  async getContentItem(contentId: string): Promise<HardcodedContentItem | null> {
    // Check cache first
    if (this.contentCache.has(contentId)) {
      return this.contentCache.get(contentId)!;
    }

    const item = await db.query.hardcodedContentRegistry.findFirst({
      where: eq(hardcodedContentRegistry.content_id, contentId)
    });

    if (!item) {
      return null;
    }

    const contentItem: HardcodedContentItem = {
      id: item.id,
      content_id: item.content_id,
      file_path: item.file_path,
      line_number: item.line_number || undefined,
      content_type: item.content_type as any,
      section_type: item.section_type as any,
      current_value: item.current_value,
      description: item.description || undefined,
      is_editable: Boolean(item.is_editable),
      last_modified: item.last_modified || undefined
    };

    this.contentCache.set(contentId, contentItem);
    return contentItem;
  }

  /**
   * Generate a diff for content changes
   */
  generateDiff(oldValue: string, newValue: string): ContentDiff {
    const oldLines = oldValue.split('\n');
    const newLines = newValue.split('\n');
    const changes: Array<{ type: 'added' | 'removed' | 'modified'; content: string; line?: number }> = [];

    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        if (oldLine && newLine) {
          changes.push({ type: 'modified', content: `${oldLine} → ${newLine}`, line: i + 1 });
        } else if (oldLine) {
          changes.push({ type: 'removed', content: oldLine, line: i + 1 });
        } else if (newLine) {
          changes.push({ type: 'added', content: newLine, line: i + 1 });
        }
      }
    }

    return {
      content_id: '',
      old_value: oldValue,
      new_value: newValue,
      file_path: '',
      changes
    };
  }

  /**
   * Apply content changes to files
   */
  async applyContentChanges(changes: ContentChange[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    let success = true;

    for (const change of changes) {
      try {
        const contentItem = await this.getContentItem(change.content_id);
        if (!contentItem) {
          errors.push(`Content item ${change.content_id} not found`);
          continue;
        }

        // Read the file
        const fileContent = fs.readFileSync(change.file_path, 'utf-8');
        const lines = fileContent.split('\n');

        // Find and replace the content
        let found = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`data-content-id="${change.content_id}"`)) {
            // Replace the content between the tags
            const line = lines[i];
            const newLine = line.replace(/>([^<]+)</, `>${change.new_value}<`);
            lines[i] = newLine;
            found = true;
            break;
          }
        }

        if (!found) {
          errors.push(`Content ID ${change.content_id} not found in file ${change.file_path}`);
          continue;
        }

        // Write the file back
        const newContent = lines.join('\n');
        fs.writeFileSync(change.file_path, newContent, 'utf-8');

        // Update the database
        await db.update(hardcodedContentRegistry)
          .set({
            current_value: change.new_value,
            last_modified: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .where(eq(hardcodedContentRegistry.content_id, change.content_id));

        // Update cache
        if (this.contentCache.has(change.content_id)) {
          const cached = this.contentCache.get(change.content_id)!;
          cached.current_value = change.new_value;
          cached.last_modified = new Date().toISOString();
        }

      } catch (error) {
        errors.push(`Error applying change to ${change.content_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        success = false;
      }
    }

    return { success, errors };
  }

  /**
   * Preview content changes without applying them
   */
  async previewContentChanges(changes: ContentChange[]): Promise<ContentDiff[]> {
    const diffs: ContentDiff[] = [];

    for (const change of changes) {
      const contentItem = await this.getContentItem(change.content_id);
      if (contentItem) {
        const diff = this.generateDiff(contentItem.current_value, change.new_value);
        diff.content_id = change.content_id;
        diff.file_path = change.file_path;
        diff.line_number = change.line_number;
        diffs.push(diff);
      }
    }

    return diffs;
  }

  /**
   * Delete content item from registry
   */
  async deleteContentItem(contentId: string): Promise<boolean> {
    try {
      await db.delete(hardcodedContentRegistry)
        .where(eq(hardcodedContentRegistry.content_id, contentId));
      
      this.contentCache.delete(contentId);
      return true;
    } catch (error) {
      console.error(`Error deleting content item ${contentId}:`, error);
      return false;
    }
  }

  /**
   * Clear all content cache
   */
  clearCache(): void {
    this.contentCache.clear();
  }
}

export default HardcodedContentManager;
