import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import ContentManager from '@/lib/ai/contentManager';
import HardcodedContentManager from '@/lib/hardcodedContentManager';
import ContentWorkflow from '@/lib/contentWorkflow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { testType, testData } = req.body;

    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      results: {},
      errors: []
    };

    try {
      switch (testType) {
        case 'command-parsing':
          await testCommandParsing(results);
          break;
        case 'content-suggestions':
          await testContentSuggestions(results);
          break;
        case 'hardcoded-content':
          await testHardcodedContent(results);
          break;
        case 'workflow-execution':
          await testWorkflowExecution(results);
          break;
        case 'voice-integration':
          await testVoiceIntegration(results);
          break;
        case 'all':
          await testAllFeatures(results);
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }

      return res.status(200).json({
        success: true,
        results
      });

    } catch (error) {
      console.error('Test execution error:', error);
      results.errors.push({
        type: 'execution',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: false,
        results,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Content assistant test API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testCommandParsing(results: any) {
  const contentManager = ContentManager.getInstance();
  
  const testCommands = [
    'Create a new artwork titled Sacred Path',
    'Update the homepage hero text',
    'Delete the event with ID 5',
    'Show me all unpublished tattoos',
    'Change the about page bio to something new'
  ];

  results.results.commandParsing = {
    testCommands,
    parsedCommands: [],
    errors: []
  };

  for (const command of testCommands) {
    try {
      const parsed = await contentManager.parseCommand(command);
      results.results.commandParsing.parsedCommands.push({
        input: command,
        output: parsed,
        success: true
      });
    } catch (error) {
      results.results.commandParsing.errors.push({
        command,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

async function testContentSuggestions(results: any) {
  const contentManager = ContentManager.getInstance();
  
  const testCommands = [
    {
      intent: 'create' as const,
      contentType: 'artwork' as const,
      value: 'Test Artwork',
      requiresApproval: true,
      confidence: 0.9,
      reasoning: 'Test command for artwork creation'
    },
    {
      intent: 'update' as const,
      contentType: 'hardcoded' as const,
      target: { contentId: 'homepage-hero', field: 'title' },
      value: 'New Hero Title',
      requiresApproval: true,
      confidence: 0.8,
      reasoning: 'Test command for hardcoded content update'
    }
  ];

  results.results.contentSuggestions = {
    testCommands,
    suggestions: [],
    errors: []
  };

  for (const command of testCommands) {
    try {
      const suggestions = await contentManager.generateContentSuggestions(command);
      results.results.contentSuggestions.suggestions.push({
        command,
        suggestions,
        success: true
      });
    } catch (error) {
      results.results.contentSuggestions.errors.push({
        command,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

async function testHardcodedContent(results: any) {
  const hardcodedManager = HardcodedContentManager.getInstance();
  
  results.results.hardcodedContent = {
    scanResults: null,
    registryItems: null,
    errors: []
  };

  try {
    // Test scanning codebase
    const scanResults = await hardcodedManager.scanCodebaseForContent();
    results.results.hardcodedContent.scanResults = {
      itemsFound: scanResults.length,
      items: scanResults.slice(0, 5) // Limit to first 5 for brevity
    };

    // Test getting all content items
    const allItems = await hardcodedManager.getAllContentItems();
    results.results.hardcodedContent.registryItems = {
      totalItems: allItems.length,
      items: allItems.slice(0, 5) // Limit to first 5 for brevity
    };

  } catch (error) {
    results.results.hardcodedContent.errors.push({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testWorkflowExecution(results: any) {
  const workflow = ContentWorkflow.getInstance();
  
  results.results.workflowExecution = {
    activeWorkflows: null,
    errors: []
  };

  try {
    // Test getting active workflows
    const activeWorkflows = workflow.getAllActiveWorkflows();
    results.results.workflowExecution.activeWorkflows = {
      count: activeWorkflows.length,
      workflows: activeWorkflows
    };

  } catch (error) {
    results.results.workflowExecution.errors.push({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testVoiceIntegration(results: any) {
  results.results.voiceIntegration = {
    browserSupport: {
      speechRecognition: 'speechRecognition' in window || 'webkitSpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices
    },
    capabilities: {
      voiceInput: true,
      voiceOutput: true,
      voiceCommands: true
    },
    errors: []
  };
}

async function testAllFeatures(results: any) {
  // Run all tests
  await testCommandParsing(results);
  await testContentSuggestions(results);
  await testHardcodedContent(results);
  await testWorkflowExecution(results);
  await testVoiceIntegration(results);

  // Test content analysis
  const contentManager = ContentManager.getInstance();
  const testContent = 'This is a test content for analysis. It should be analyzed for quality, SEO, and accessibility.';
  
  try {
    const analysis = await contentManager.analyzeContent(testContent, 'text');
    results.results.contentAnalysis = {
      testContent,
      analysis,
      success: true
    };
  } catch (error) {
    results.results.contentAnalysis = {
      testContent,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }

  // Test content search
  try {
    const searchResults = await contentManager.searchContent('artwork', { title: 'test' });
    results.results.contentSearch = {
      query: { contentType: 'artwork', filters: { title: 'test' } },
      results: searchResults,
      success: true
    };
  } catch (error) {
    results.results.contentSearch = {
      query: { contentType: 'artwork', filters: { title: 'test' } },
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}
