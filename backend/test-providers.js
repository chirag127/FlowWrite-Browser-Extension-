/**
 * Simple validation test for AI Provider Manager
 * Run with: node backend/test-providers.js
 */

require('dotenv').config();

console.log('Testing AI Provider Manager...');

try {
    const aiProviders = require('./services/aiProviders');
    console.log('✓ AI Provider Manager loaded successfully');
    
    const providers = aiProviders.getAvailableProviders();
    console.log(`✓ Found ${providers.length} available provider(s)`);
    
    const health = aiProviders.getHealthStatus();
    console.log('✓ Health status retrieved successfully');
    console.log('\nHealth Status:', JSON.stringify(health, null, 2));
    
    console.log('\n✓ All validation tests passed!');
} catch (error) {
    console.error('✗ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
