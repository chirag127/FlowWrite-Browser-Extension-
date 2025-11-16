/**
 * Test file for AI Provider Manager
 * 
 * This file demonstrates how to use the AI Provider Manager
 * Run with: node backend/services/aiProviders.test.js
 */

require('dotenv').config();
const aiProviders = require('./aiProviders');

async function testProviderManager() {
    console.log('=== AI Provider Manager Tests ===\n');

    // Test 1: Get available providers
    console.log('1. Available Providers:');
    const providers = aiProviders.getAvailableProviders();
    console.log(JSON.stringify(providers, null, 2));
    console.log();

    // Test 2: Get health status
    console.log('2. Health Status:');
    const health = aiProviders.getHealthStatus();
    console.log(JSON.stringify(health, null, 2));
    console.log();

    // Test 3: Test fallback logic (if any provider is configured)
    if (providers.length > 0) {
        console.log('3. Testing fallback generation:');
        try {
            const prompt = 'The quick brown fox';
            console.log(`Prompt: "${prompt}"`);
            
            const result = await aiProviders.generateWithFallback(prompt, {
                preferredSize: 'small'
            });
            
            console.log(`Result: "${result}"`);
            console.log();

            // Test 4: Check health status after request
            console.log('4. Health Status After Request:');
            const healthAfter = aiProviders.getHealthStatus();
            console.log(JSON.stringify(healthAfter, null, 2));
        } catch (error) {
            console.error('Error during fallback test:', error.message);
        }
    } else {
        console.log('No providers configured. Add API keys to .env file to test generation.');
    }
}

testProviderManager().catch(console.error);
