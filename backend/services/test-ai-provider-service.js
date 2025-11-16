/**
 * Integration test for AI Provider Service
 * Demonstrates rate limiting, backoff, and fallback behavior
 * 
 * Run with: node backend/services/test-ai-provider-service.js
 */

require('dotenv').config();
const aiService = require('./ai-provider-service');

async function testBasicGeneration() {
    console.log('\n=== Test 1: Basic Generation ===');
    try {
        const result = await aiService.generate('Say "Hello, World!" and nothing else.', {
            maxRetries: 1,
        });
        console.log('✓ Success:', result.text.substring(0, 50));
        console.log('  Model used:', result.model.displayName);
    } catch (error) {
        console.error('✗ Failed:', error.message);
    }
}

async function testCategorySelection() {
    console.log('\n=== Test 2: Category Selection ===');
    try {
        const result = await aiService.generate('Complete: function add(a, b) {', {
            category: 'coding-premium',
            maxRetries: 1,
        });
        console.log('✓ Success:', result.text.substring(0, 50));
        console.log('  Model used:', result.model.displayName);
    } catch (error) {
        console.error('✗ Failed (expected if no coding models available):', error.message);
    }
}

async function testSpecificModel() {
    console.log('\n=== Test 3: Specific Model ===');
    const models = aiService.getAvailableModels();
    if (models.length > 0) {
        try {
            const result = await aiService.generate('Say "Test" and nothing else.', {
                modelName: models[0].name,
            });
            console.log('✓ Success:', result.text.substring(0, 50));
            console.log('  Model used:', result.model.displayName);
        } catch (error) {
            console.error('✗ Failed:', error.message);
        }
    } else {
        console.log('⊘ Skipped: No models available');
    }
}

async function testRateLimitBehavior() {
    console.log('\n=== Test 4: Rate Limit Behavior ===');
    const models = aiService.getAvailableModels();
    if (models.length > 0) {
        const testModel = models[models.length - 1].name;
        console.log(`Testing with: ${testModel}`);
        
        const originalRpm = models[models.length - 1].rpm;
        models[models.length - 1].rpm = 2;
        
        for (let i = 1; i <= 5; i++) {
            try {
                const result = await aiService.generate(`Say "${i}" and nothing else.`, {
                    modelName: testModel,
                });
                console.log(`  Request ${i}: ✓ Success`);
            } catch (error) {
                console.log(`  Request ${i}: ✗ ${error.message}`);
            }
        }
        
        models[models.length - 1].rpm = originalRpm;
    } else {
        console.log('⊘ Skipped: No models available');
    }
}

async function testAutomaticFallback() {
    console.log('\n=== Test 5: Automatic Fallback ===');
    const models = aiService.getAvailableModels();
    if (models.length >= 2) {
        console.log('Available models will be tried in rank order');
        try {
            const result = await aiService.generate('Say "Fallback test" and nothing else.');
            console.log('✓ Success:', result.text.substring(0, 50));
            console.log('  Model used:', result.model.displayName, '(rank', result.model.rank + ')');
        } catch (error) {
            console.error('✗ Failed:', error.message);
        }
    } else {
        console.log('⊘ Skipped: Need at least 2 models for fallback test');
    }
}

async function testHealthStatus() {
    console.log('\n=== Test 6: Health Status ===');
    const health = aiService.getHealthStatus();
    console.log(`Total models: ${health.totalModels}`);
    console.log(`Available models: ${health.availableModels}`);
    console.log(`Healthy models: ${health.healthyModels}`);
    
    console.log('\nTop 3 models by rank:');
    health.models.slice(0, 3).forEach(model => {
        console.log(`  [${model.rank}] ${model.displayName}`);
        console.log(`      Category: ${model.category}`);
        console.log(`      Can make request: ${model.canMakeRequest}`);
        console.log(`      Requests: ${model.rateLimits.requestsThisMinute}/${model.rateLimits.rpm} per minute`);
        console.log(`      Failures: ${model.backoff.failureCount}`);
    });
}

async function runTests() {
    console.log('AI Provider Service Integration Tests');
    console.log('=====================================');
    
    const models = aiService.getAvailableModels();
    if (models.length === 0) {
        console.log('\n⚠ Warning: No API keys configured. Tests will be limited.');
        console.log('Set GEMINI_API_KEY, CEREBRAS_API_KEY, or GROQ_API_KEY in .env file.');
    }

    await testHealthStatus();
    
    if (models.length > 0) {
        await testBasicGeneration();
        await testCategorySelection();
        await testSpecificModel();
        await testRateLimitBehavior();
        await testAutomaticFallback();
    }
    
    console.log('\n=== Tests Complete ===\n');
}

runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
