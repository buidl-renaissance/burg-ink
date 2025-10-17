import { db } from '../../../db';
import { workflowRules } from '../../../db/schema';
import { eq, and, asc } from 'drizzle-orm';

export interface WorkflowContext {
  media: any; // Media record
  classification?: any; // MediaClassification result
  user?: any; // User record
  [key: string]: any; // Additional context data
}

export interface WorkflowCondition {
  type: string;
  value: any;
  operator?: string; // 'equals', 'greater_than', 'contains', etc.
}

export interface WorkflowAction {
  type: string;
  params: Record<string, any>;
}

export interface WorkflowRule {
  id: number;
  name: string;
  description?: string;
  trigger: string;
  conditions: string; // JSON string
  actions: string; // JSON string
  is_enabled: number;
  priority: number;
}

export interface WorkflowExecution {
  ruleId: number;
  trigger: string;
  context: WorkflowContext;
  result: 'success' | 'failure';
  actionsExecuted: WorkflowAction[];
  error?: string;
  timestamp: string;
}

// Condition evaluators
const conditionEvaluators = {
  detected_type: (context: WorkflowContext, condition: WorkflowCondition): boolean => {
    const detectedType = context.classification?.detectedType || context.media?.detected_type;
    return detectedType === condition.value;
  },
  
  min_confidence: (context: WorkflowContext, condition: WorkflowCondition): boolean => {
    const confidence = parseFloat(context.classification?.confidence || context.media?.detection_confidence || '0');
    return confidence >= condition.value;
  },
  
  has_tags: (context: WorkflowContext, condition: WorkflowCondition): boolean => {
    const tags = context.media?.tags ? JSON.parse(context.media.tags) : [];
    const requiredTags = Array.isArray(condition.value) ? condition.value : [condition.value];
    return requiredTags.some((tag: string) => tags.includes(tag));
  },
  
  mime_type: (context: WorkflowContext, condition: WorkflowCondition): boolean => {
    const mimeType = context.media?.mime_type || '';
    if (condition.operator === 'starts_with') {
      return mimeType.startsWith(condition.value);
    }
    return mimeType === condition.value;
  },
  
  processing_status: (context: WorkflowContext, condition: WorkflowCondition): boolean => {
    return context.media?.processing_status === condition.value;
  },
};

// Action executors
const actionExecutors = {
  flag_media: async (context: WorkflowContext, action: WorkflowAction): Promise<void> => {
    // Add a flag to the media record
    const flags = context.media.flags ? JSON.parse(context.media.flags) : [];
    const newFlag = action.params.flag;
    
    if (!flags.includes(newFlag)) {
      flags.push(newFlag);
      // Note: In a real implementation, you'd update the media record here
      console.log(`Flagged media ${context.media.id} with: ${newFlag}`);
    }
  },
  
  apply_tags: async (context: WorkflowContext, action: WorkflowAction): Promise<void> => {
    // Apply tags from taxonomy
    const currentTags = context.media.tags ? JSON.parse(context.media.tags) : [];
    const newTags = Array.isArray(action.params.tags) ? action.params.tags : [action.params.tags];
    
    const updatedTags = [...new Set([...currentTags, ...newTags])];
    console.log(`Applied tags to media ${context.media.id}:`, newTags);
    // Note: In a real implementation, you'd update the media record here
  },
  
  create_entity: async (context: WorkflowContext, action: WorkflowAction): Promise<void> => {
    // Mark media for entity creation
    console.log(`Marking media ${context.media.id} for ${action.params.type} creation`);
    // Note: In a real implementation, you'd update the media record with suggested_entity_type
  },
  
  notify_admin: async (context: WorkflowContext, action: WorkflowAction): Promise<void> => {
    // Send notification to admin
    console.log(`Admin notification: ${action.params.message}`);
    // Note: In a real implementation, you'd integrate with notification system
  },
  
  set_status: async (context: WorkflowContext, action: WorkflowAction): Promise<void> => {
    // Update processing status
    console.log(`Setting media ${context.media.id} status to: ${action.params.status}`);
    // Note: In a real implementation, you'd update the media record
  },
};

export class WorkflowEngine {
  /**
   * Evaluate all enabled workflow rules for a given trigger and context
   */
  static async evaluateRules(trigger: string, context: WorkflowContext): Promise<WorkflowExecution[]> {
    try {
      // Fetch all enabled rules for this trigger, ordered by priority
      const rules = await db.select().from(workflowRules)
        .where(and(
          eq(workflowRules.trigger, trigger),
          eq(workflowRules.is_enabled, 1)
        ))
        .orderBy(asc(workflowRules.priority));
      
      const executions: WorkflowExecution[] = [];
      
      for (const rule of rules) {
        try {
          const execution = await this.executeRule(rule, context);
          executions.push(execution);
          
          // Update last_fired_at timestamp
          await db.update(workflowRules)
            .set({ 
              last_fired_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .where(eq(workflowRules.id, rule.id));
            
        } catch (error) {
          console.error(`Error executing rule ${rule.id}:`, error);
          executions.push({
            ruleId: rule.id,
            trigger,
            context,
            result: 'failure',
            actionsExecuted: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      }
      
      return executions;
    } catch (error) {
      console.error('Error evaluating workflow rules:', error);
      throw error;
    }
  }
  
  /**
   * Execute a single workflow rule
   */
  static async executeRule(rule: WorkflowRule, context: WorkflowContext): Promise<WorkflowExecution> {
    try {
      // Parse conditions and actions from JSON
      const conditions: WorkflowCondition[] = JSON.parse(rule.conditions);
      const actions: WorkflowAction[] = JSON.parse(rule.actions);
      
      // Check if all conditions are met
      const conditionsMet = await this.checkConditions(conditions, context);
      
      if (!conditionsMet) {
        return {
          ruleId: rule.id,
          trigger: rule.trigger,
          context,
          result: 'success',
          actionsExecuted: [],
          timestamp: new Date().toISOString(),
        };
      }
      
      // Execute actions
      const executedActions: WorkflowAction[] = [];
      
      for (const action of actions) {
        try {
          await this.executeAction(action, context);
          executedActions.push(action);
        } catch (error) {
          console.error(`Error executing action ${action.type}:`, error);
          // Continue with other actions even if one fails
        }
      }
      
      return {
        ruleId: rule.id,
        trigger: rule.trigger,
        context,
        result: 'success',
        actionsExecuted: executedActions,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      return {
        ruleId: rule.id,
        trigger: rule.trigger,
        context,
        result: 'failure',
        actionsExecuted: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Check if all conditions are met
   */
  static async checkConditions(conditions: WorkflowCondition[], context: WorkflowContext): Promise<boolean> {
    for (const condition of conditions) {
      const evaluator = conditionEvaluators[condition.type as keyof typeof conditionEvaluators];
      
      if (!evaluator) {
        console.warn(`Unknown condition type: ${condition.type}`);
        continue;
      }
      
      const result = evaluator(context, condition);
      if (!result) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Execute a single action
   */
  static async executeAction(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    const executor = actionExecutors[action.type as keyof typeof actionExecutors];
    
    if (!executor) {
      throw new Error(`Unknown action type: ${action.type}`);
    }
    
    await executor(context, action);
  }
  
  /**
   * Test a workflow rule with sample data
   */
  static async testRule(rule: WorkflowRule, testContext: WorkflowContext): Promise<WorkflowExecution> {
    return this.executeRule(rule, testContext);
  }
}

// Helper functions for creating common workflow rules
export const WorkflowRuleTemplates = {
  /**
   * Auto-suggest tattoo creation for high-confidence tattoo detections
   */
  suggestTattooCreation: (): Partial<WorkflowRule> => ({
    name: 'Auto-suggest Tattoo Creation',
    description: 'Automatically suggest creating a tattoo entity for high-confidence tattoo detections',
    trigger: 'on_upload',
    conditions: JSON.stringify([
      { type: 'detected_type', value: 'tattoo' },
      { type: 'min_confidence', value: 0.7 }
    ]),
    actions: JSON.stringify([
      { type: 'flag_media', params: { flag: 'tattoo_candidate' } },
      { type: 'create_entity', params: { type: 'tattoo' } }
    ]),
    priority: 1,
  }),
  
  /**
   * Auto-suggest artwork creation for high-confidence artwork detections
   */
  suggestArtworkCreation: (): Partial<WorkflowRule> => ({
    name: 'Auto-suggest Artwork Creation',
    description: 'Automatically suggest creating an artwork entity for high-confidence artwork detections',
    trigger: 'on_upload',
    conditions: JSON.stringify([
      { type: 'detected_type', value: 'artwork' },
      { type: 'min_confidence', value: 0.7 }
    ]),
    actions: JSON.stringify([
      { type: 'flag_media', params: { flag: 'artwork_candidate' } },
      { type: 'create_entity', params: { type: 'artwork' } }
    ]),
    priority: 2,
  }),
  
  /**
   * Apply tattoo-specific tags for tattoo detections
   */
  applyTattooTags: (): Partial<WorkflowRule> => ({
    name: 'Apply Tattoo Tags',
    description: 'Automatically apply tattoo-related tags for tattoo detections',
    trigger: 'on_upload',
    conditions: JSON.stringify([
      { type: 'detected_type', value: 'tattoo' },
      { type: 'min_confidence', value: 0.5 }
    ]),
    actions: JSON.stringify([
      { type: 'apply_tags', params: { tags: ['tattoo', 'body-art'] } }
    ]),
    priority: 3,
  }),
  
  /**
   * Apply artwork-specific tags for artwork detections
   */
  applyArtworkTags: (): Partial<WorkflowRule> => ({
    name: 'Apply Artwork Tags',
    description: 'Automatically apply artwork-related tags for artwork detections',
    trigger: 'on_upload',
    conditions: JSON.stringify([
      { type: 'detected_type', value: 'artwork' },
      { type: 'min_confidence', value: 0.5 }
    ]),
    actions: JSON.stringify([
      { type: 'apply_tags', params: { tags: ['artwork', 'visual-art'] } }
    ]),
    priority: 4,
  }),
};
