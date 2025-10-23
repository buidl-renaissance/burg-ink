import { db } from './db';
import { contentChangeSuggestions, contentAuditLog, contentManagementConversations } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import ContentManager from './ai/contentManager';
import HardcodedContentManager from './hardcodedContentManager';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  autoExecute: boolean;
  timeout?: number; // in milliseconds
}

export interface WorkflowExecution {
  id: string;
  suggestionId: number;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowResult {
  success: boolean;
  executionId: string;
  results: any[];
  errors: string[];
  rollbackData?: any;
}

export class ContentWorkflow {
  private static instance: ContentWorkflow;
  private contentManager: ContentManager;
  private hardcodedManager: HardcodedContentManager;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.contentManager = ContentManager.getInstance();
    this.hardcodedManager = HardcodedContentManager.getInstance();
  }

  static getInstance(): ContentWorkflow {
    if (!ContentWorkflow.instance) {
      ContentWorkflow.instance = new ContentWorkflow();
    }
    return ContentWorkflow.instance;
  }

  /**
   * Create workflow steps for a content change suggestion
   */
  createWorkflowSteps(suggestion: any): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    // Step 1: Validate suggestion
    steps.push({
      id: 'validate',
      name: 'Validate Suggestion',
      description: 'Validate the content change suggestion',
      status: 'pending',
      required: true,
      autoExecute: true,
      timeout: 5000
    });

    // Step 2: Check permissions
    steps.push({
      id: 'permissions',
      name: 'Check Permissions',
      description: 'Verify user has permission to make this change',
      status: 'pending',
      required: true,
      autoExecute: true,
      timeout: 3000
    });

    // Step 3: Backup current content (if applicable)
    if (suggestion.change_type === 'update' || suggestion.change_type === 'delete') {
      steps.push({
        id: 'backup',
        name: 'Backup Current Content',
        description: 'Create backup of current content for rollback',
        status: 'pending',
        required: true,
        autoExecute: true,
        timeout: 10000
      });
    }

    // Step 4: Preview changes
    if (suggestion.content_type === 'hardcoded') {
      steps.push({
        id: 'preview',
        name: 'Preview Changes',
        description: 'Generate preview of content changes',
        status: 'pending',
        required: true,
        autoExecute: true,
        timeout: 15000
      });
    }

    // Step 5: Execute change
    steps.push({
      id: 'execute',
      name: 'Execute Change',
      description: 'Apply the content change',
      status: 'pending',
      required: true,
      autoExecute: false, // Requires manual approval
      timeout: 30000
    });

    // Step 6: Verify change
    steps.push({
      id: 'verify',
      name: 'Verify Change',
      description: 'Verify the change was applied correctly',
      status: 'pending',
      required: true,
      autoExecute: true,
      timeout: 10000
    });

    // Step 7: Update audit log
    steps.push({
      id: 'audit',
      name: 'Update Audit Log',
      description: 'Log the change in audit trail',
      status: 'pending',
      required: true,
      autoExecute: true,
      timeout: 5000
    });

    return steps;
  }

  /**
   * Start workflow execution for a suggestion
   */
  async startWorkflow(suggestionId: number, userId: number): Promise<WorkflowExecution> {
    const suggestion = await db.query.contentChangeSuggestions.findFirst({
      where: eq(contentChangeSuggestions.id, suggestionId)
    });

    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    if (suggestion.user_id !== userId) {
      throw new Error('Unauthorized to execute this suggestion');
    }

    if (suggestion.status !== 'approved') {
      throw new Error('Suggestion must be approved before execution');
    }

    const executionId = `exec_${Date.now()}_${suggestionId}`;
    const steps = this.createWorkflowSteps(suggestion);

    const execution: WorkflowExecution = {
      id: executionId,
      suggestionId,
      steps,
      currentStep: 0,
      status: 'pending',
      startedAt: new Date()
    };

    this.activeExecutions.set(executionId, execution);

    // Start the workflow
    this.executeWorkflow(executionId);

    return execution;
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflow(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    execution.status = 'running';

    try {
      for (let i = 0; i < execution.steps.length; i++) {
        execution.currentStep = i;
        const step = execution.steps[i];
        step.status = 'in_progress';

        try {
          await this.executeStep(execution, step);
          step.status = 'completed';
        } catch (error) {
          step.status = 'failed';
          execution.status = 'failed';
          execution.error = error instanceof Error ? error.message : 'Unknown error';
          break;
        }

        // If step is not auto-execute, wait for manual approval
        if (!step.autoExecute) {
          execution.status = 'pending';
          return; // Wait for manual approval
        }
      }

      // All steps completed
      execution.status = 'completed';
      execution.completedAt = new Date();

      // Update suggestion status
      await db.update(contentChangeSuggestions)
        .set({
          status: 'applied',
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .where(eq(contentChangeSuggestions.id, execution.suggestionId));

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const suggestion = await db.query.contentChangeSuggestions.findFirst({
      where: eq(contentChangeSuggestions.id, execution.suggestionId)
    });

    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    switch (step.id) {
      case 'validate':
        await this.validateSuggestion(suggestion);
        break;

      case 'permissions':
        await this.checkPermissions(suggestion);
        break;

      case 'backup':
        await this.backupContent(suggestion);
        break;

      case 'preview':
        await this.previewChanges(suggestion);
        break;

      case 'execute':
        await this.executeChange(suggestion);
        break;

      case 'verify':
        await this.verifyChange(suggestion);
        break;

      case 'audit':
        await this.updateAuditLog(suggestion);
        break;

      default:
        throw new Error(`Unknown step: ${step.id}`);
    }
  }

  /**
   * Validate suggestion
   */
  private async validateSuggestion(suggestion: any): Promise<void> {
    if (!suggestion.suggested_value || suggestion.suggested_value.trim() === '') {
      throw new Error('Suggested value cannot be empty');
    }

    if (suggestion.content_type === 'hardcoded' && !suggestion.target_path) {
      throw new Error('Target path is required for hardcoded content changes');
    }

    if (suggestion.change_type === 'update' && !suggestion.current_value) {
      throw new Error('Current value is required for update operations');
    }
  }

  /**
   * Check user permissions
   */
  private async checkPermissions(suggestion: any): Promise<void> {
    // For now, assume all authenticated users have permission
    // In a real implementation, you would check user roles and permissions
    if (!suggestion.user_id) {
      throw new Error('User ID is required');
    }
  }

  /**
   * Backup current content
   */
  private async backupContent(suggestion: any): Promise<void> {
    if (suggestion.content_type === 'hardcoded') {
      const contentItem = await this.hardcodedManager.getContentItem(suggestion.field_name || '');
      if (contentItem) {
        // Store backup in audit log
        await db.insert(contentAuditLog).values({
          user_id: suggestion.user_id,
          action: 'backup',
          content_type: suggestion.content_type,
          target_path: suggestion.target_path,
          field_name: suggestion.field_name,
          old_value: suggestion.current_value,
          new_value: suggestion.current_value, // Backup is the same as current
          suggestion_id: suggestion.id,
          metadata: JSON.stringify({ 
            backup_created: new Date().toISOString(),
            content_id: contentItem.content_id
          })
        });
      }
    }
  }

  /**
   * Preview changes
   */
  private async previewChanges(suggestion: any): Promise<void> {
    if (suggestion.content_type === 'hardcoded') {
      const changes = [{
        content_id: suggestion.field_name || '',
        new_value: suggestion.suggested_value,
        file_path: suggestion.target_path || ''
      }];

      const diffs = await this.hardcodedManager.previewContentChanges(changes);
      
      // Store preview in audit log
      await db.insert(contentAuditLog).values({
        user_id: suggestion.user_id,
        action: 'preview',
        content_type: suggestion.content_type,
        target_path: suggestion.target_path,
        field_name: suggestion.field_name,
        old_value: suggestion.current_value,
        new_value: suggestion.suggested_value,
        suggestion_id: suggestion.id,
        metadata: JSON.stringify({ 
          preview_created: new Date().toISOString(),
          diffs: diffs
        })
      });
    }
  }

  /**
   * Execute the actual change
   */
  private async executeChange(suggestion: any): Promise<void> {
    const suggestions = [suggestion];
    const result = await this.contentManager.executeContentChanges(suggestions);

    if (!result.success) {
      throw new Error(`Failed to execute change: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Verify the change was applied correctly
   */
  private async verifyChange(suggestion: any): Promise<void> {
    if (suggestion.content_type === 'hardcoded') {
      const contentItem = await this.hardcodedManager.getContentItem(suggestion.field_name || '');
      if (!contentItem || contentItem.current_value !== suggestion.suggested_value) {
        throw new Error('Change verification failed - content does not match expected value');
      }
    }
  }

  /**
   * Update audit log
   */
  private async updateAuditLog(suggestion: any): Promise<void> {
    await db.insert(contentAuditLog).values({
      user_id: suggestion.user_id,
      action: 'applied',
      content_type: suggestion.content_type,
      target_id: suggestion.target_id,
      target_path: suggestion.target_path,
      field_name: suggestion.field_name,
      old_value: suggestion.current_value,
      new_value: suggestion.suggested_value,
      suggestion_id: suggestion.id,
      metadata: JSON.stringify({ 
        applied_at: new Date().toISOString(),
        workflow_execution: true
      })
    });
  }

  /**
   * Approve a workflow step
   */
  async approveStep(executionId: string, stepId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    if (step.status !== 'in_progress') {
      throw new Error('Step is not in progress');
    }

    step.status = 'completed';
    execution.status = 'running';

    // Continue workflow execution
    this.executeWorkflow(executionId);
  }

  /**
   * Reject a workflow step
   */
  async rejectStep(executionId: string, stepId: string, reason: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    step.status = 'failed';
    execution.status = 'failed';
    execution.error = reason;
  }

  /**
   * Get workflow execution status
   */
  getWorkflowStatus(executionId: string): WorkflowExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Get all active workflows
   */
  getAllActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel a workflow execution
   */
  async cancelWorkflow(executionId: string, reason: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    execution.status = 'cancelled';
    execution.error = reason;

    // Update suggestion status
    await db.update(contentChangeSuggestions)
      .set({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .where(eq(contentChangeSuggestions.id, execution.suggestionId));
  }

  /**
   * Rollback a completed workflow
   */
  async rollbackWorkflow(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    if (execution.status !== 'completed') {
      throw new Error('Only completed workflows can be rolled back');
    }

    const suggestion = await db.query.contentChangeSuggestions.findFirst({
      where: eq(contentChangeSuggestions.id, execution.suggestionId)
    });

    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    // Rollback the change
    if (suggestion.content_type === 'hardcoded') {
      const changes = [{
        content_id: suggestion.field_name || '',
        new_value: suggestion.current_value || '',
        file_path: suggestion.target_path || ''
      }];

      await this.hardcodedManager.applyContentChanges(changes);
    }

    // Update suggestion status
    await db.update(contentChangeSuggestions)
      .set({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .where(eq(contentChangeSuggestions.id, execution.suggestionId));

    // Log rollback
    await db.insert(contentAuditLog).values({
      user_id: suggestion.user_id,
      action: 'rollback',
      content_type: suggestion.content_type,
      target_id: suggestion.target_id,
      target_path: suggestion.target_path,
      field_name: suggestion.field_name,
      old_value: suggestion.suggested_value,
      new_value: suggestion.current_value,
      suggestion_id: suggestion.id,
      metadata: JSON.stringify({ 
        rolled_back_at: new Date().toISOString(),
        execution_id: executionId
      })
    });
  }
}

export default ContentWorkflow;
