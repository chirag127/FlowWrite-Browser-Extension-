/**
 * Simple validation test for AI Provider Service
 * Run with: node backend/test-providers.js
 */

require('dotenv').config();

console.log('Testing AI Provider Service...');

try {
    const aiProviderService = require('./services/ai-provider-service');
    console.log('✓ AI Provider Service loaded successfully');
    
    const models = aiProviderService.getAvailableModels();
    console.log(`✓ Found ${models.length} available model(s)`);
    
    const registry = aiProviderService.getModelRegistry();
    console.log('✓ Model registry retrieved successfully');
    console.log('\nModel Registry:');
    registry.forEach(model => {
        console.log(`  [Rank ${model.rank}] ${model.displayName} (${model.provider}) - ${model.category}`);
    });
    
    const health = aiProviderService.getHealthStatus();
    console.log('\n✓ Health status retrieved successfully');
    console.log(`\nHealth Summary: ${health.healthyModels}/${health.availableModels} models healthy`);
    
    console.log('\n✓ All validation tests passed!');
} catch (error) {
    console.error('✗ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
