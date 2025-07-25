#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 JJP Deployed Site Validation Test Runner');
console.log('═'.repeat(60));

// Configuration
const config = {
  baseURL: 'https://justpeople1.netlify.app',
  testFile: 'tests/deployed-site-validation.spec.ts',
  project: 'deployed-site',
  timeout: 60000
};

console.log(`🎯 Testing: ${config.baseURL}`);
console.log(`📁 Test File: ${config.testFile}`);
console.log(`🖥️  Project: ${config.project}`);
console.log(`⏱️  Timeout: ${config.timeout}ms\n`);

// Set environment variables
process.env.TEST_BASE_URL = config.baseURL;
process.env.PLAYWRIGHT_TIMEOUT = config.timeout.toString();

// Build the command
const command = `npx playwright test "${config.testFile}" --project="${config.project}" --reporter=line --timeout=${config.timeout}`;

console.log('🚀 Executing Tests...');
console.log('─'.repeat(60));

try {
  // Check if playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Playwright...');
    execSync('npm install @playwright/test', { stdio: 'inherit' });
    execSync('npx playwright install', { stdio: 'inherit' });
  }

  // Run the test
  console.log(`📝 Command: ${command}\n`);
  
  const output = execSync(command, {
    cwd: __dirname,
    timeout: config.timeout * 2,
    stdio: 'inherit',
    encoding: 'utf8'
  });
  
  console.log('\n✅ Tests completed successfully!');
  console.log('\n📋 Summary:');
  console.log('─'.repeat(40));
  console.log('✅ All deployed site validation tests passed');
  console.log('🌐 Application is accessible and functional');
  console.log('📊 Check the test output above for detailed results');
  
} catch (error) {
  console.log('\n❌ Tests failed!');
  console.log('─'.repeat(40));
  console.log('Error details:');
  console.log(error.message);
  
  console.log('\n💡 Troubleshooting:');
  console.log('• Check if the deployed site is accessible');
  console.log('• Verify the URL is correct');
  console.log('• Check network connectivity');
  console.log('• Review the test output for specific failures');
  
  process.exit(1);
}

console.log('\n🎉 Test run completed successfully!');
console.log('💻 For detailed HTML reports, run: npx playwright show-report');