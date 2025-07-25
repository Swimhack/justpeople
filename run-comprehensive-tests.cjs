#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive JJP Contact Integration Tests\n');

// Test configuration
const testConfig = {
  baseURL: 'https://justpeople1.netlify.app',
  testFiles: [
    'tests/deployed-site-validation.spec.ts',
    'tests/complete-contact-integration.spec.ts',
    'tests/contact-import.spec.ts'
  ],
  projects: ['deployed-site', 'chromium'],
  timeout: 60000
};

// Create results directory
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Test report
const testReport = {
  timestamp: new Date().toISOString(),
  baseURL: testConfig.baseURL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

console.log('📋 Test Configuration:');
console.log(`   Base URL: ${testConfig.baseURL}`);
console.log(`   Test Files: ${testConfig.testFiles.length}`);
console.log(`   Projects: ${testConfig.projects.join(', ')}`);
console.log(`   Timeout: ${testConfig.timeout}ms\n`);

// Function to run a specific test
function runTest(testFile, project) {
  console.log(`\n🧪 Running: ${testFile} (${project})`);
  console.log('─'.repeat(60));
  
  const testResult = {
    file: testFile,
    project: project,
    status: 'unknown',
    duration: 0,
    errors: [],
    output: ''
  };
  
  const startTime = Date.now();
  
  try {
    // Set environment variables
    process.env.TEST_BASE_URL = testConfig.baseURL;
    process.env.PLAYWRIGHT_TIMEOUT = testConfig.timeout.toString();
    
    // Build the command
    const command = `npx playwright test "${testFile}" --project="${project}" --reporter=line`;
    
    console.log(`📝 Command: ${command}`);
    
    // Execute the test
    const output = execSync(command, {
      cwd: __dirname,
      timeout: testConfig.timeout * 2, // Double the timeout for safety
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    testResult.status = 'passed';
    testResult.output = output;
    testResult.duration = Date.now() - startTime;
    
    console.log('✅ Test PASSED');
    console.log(`⏱️  Duration: ${testResult.duration}ms`);
    
    testReport.summary.passed++;
    
  } catch (error) {
    testResult.status = 'failed';
    testResult.duration = Date.now() - startTime;
    testResult.errors.push(error.message);
    testResult.output = error.stdout || error.stderr || error.message;
    
    console.log('❌ Test FAILED');
    console.log(`⏱️  Duration: ${testResult.duration}ms`);
    console.log(`🔍 Error: ${error.message}`);
    
    testReport.summary.failed++;
  }
  
  testReport.tests.push(testResult);
  testReport.summary.total++;
  
  return testResult;
}

// Function to run all tests
async function runAllTests() {
  console.log('🎯 Starting Test Execution...\n');
  
  // Run deployed site validation first
  console.log('🌐 Phase 1: Deployed Site Validation');
  console.log('═'.repeat(60));
  
  const deployedSiteResult = runTest('tests/deployed-site-validation.spec.ts', 'deployed-site');
  
  // Run integration tests
  console.log('\n🔗 Phase 2: Integration Tests');
  console.log('═'.repeat(60));
  
  // Only run integration tests if we have a local server or if deployed site has basic functionality
  if (deployedSiteResult.status === 'passed' || fs.existsSync('http://localhost:5173')) {
    for (const testFile of testConfig.testFiles.slice(1)) {
      for (const project of testConfig.projects) {
        if (project === 'deployed-site' && testFile !== 'tests/deployed-site-validation.spec.ts') {
          // Skip integration tests on deployed site for now
          continue;
        }
        
        runTest(testFile, project);
      }
    }
  } else {
    console.log('⚠️  Skipping integration tests - deployed site basic functionality not confirmed');
  }
  
  return testReport;
}

// Function to generate HTML report
function generateHTMLReport(report) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>JJP Contact Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .passed { border-left-color: #28a745; background: #d4edda; }
        .failed { border-left-color: #dc3545; background: #f8d7da; }
        .skipped { border-left-color: #ffc107; background: #fff3cd; }
        .error { background: #f8f9fa; padding: 10px; border-radius: 3px; margin: 10px 0; }
        .output { background: #f8f9fa; padding: 10px; border-radius: 3px; margin: 10px 0; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>JJP Contact Integration Test Report</h1>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
        <p><strong>Base URL:</strong> ${report.baseURL}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.total}</p>
        <p><strong>Passed:</strong> ${report.summary.passed}</p>
        <p><strong>Failed:</strong> ${report.summary.failed}</p>
        <p><strong>Skipped:</strong> ${report.summary.skipped}</p>
        <p><strong>Success Rate:</strong> ${Math.round((report.summary.passed / report.summary.total) * 100)}%</p>
    </div>
    
    <h2>Test Results</h2>
    ${report.tests.map(test => `
        <div class="test-result ${test.status}">
            <h3>${test.file} (${test.project})</h3>
            <p><strong>Status:</strong> ${test.status.toUpperCase()}</p>
            <p><strong>Duration:</strong> ${test.duration}ms</p>
            ${test.errors.length > 0 ? `
                <div class="error">
                    <strong>Errors:</strong>
                    <ul>
                        ${test.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${test.output ? `
                <div class="output">
                    <strong>Output:</strong>
                    ${test.output}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
  `;
  
  const reportPath = path.join(resultsDir, 'test-report.html');
  fs.writeFileSync(reportPath, htmlContent);
  console.log(`📄 HTML report generated: ${reportPath}`);
}

// Function to save JSON report
function saveJSONReport(report) {
  const reportPath = path.join(resultsDir, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON report saved: ${reportPath}`);
}

// Function to generate recommendations
function generateRecommendations(report) {
  const recommendations = [];
  
  if (report.summary.failed > 0) {
    recommendations.push('🔧 Some tests failed. Review the error messages and fix the issues.');
  }
  
  if (report.summary.total === 0) {
    recommendations.push('⚠️  No tests were executed. Check test configuration and file paths.');
  }
  
  const successRate = (report.summary.passed / report.summary.total) * 100;
  
  if (successRate < 50) {
    recommendations.push('🚨 Critical: Less than 50% of tests passed. Major issues need attention.');
  } else if (successRate < 80) {
    recommendations.push('⚠️  Warning: Less than 80% of tests passed. Some issues need fixing.');
  } else if (successRate < 100) {
    recommendations.push('✅ Good: Most tests passed. Address remaining issues for full functionality.');
  } else {
    recommendations.push('🎉 Excellent: All tests passed! Contact integration is working correctly.');
  }
  
  // Check for specific functionality issues
  const deployedSiteTest = report.tests.find(t => t.file.includes('deployed-site-validation'));
  if (deployedSiteTest && deployedSiteTest.status === 'failed') {
    recommendations.push('🌐 Deployed site validation failed. Check if the application is properly deployed.');
  }
  
  const integrationTests = report.tests.filter(t => t.file.includes('integration'));
  if (integrationTests.length > 0 && integrationTests.every(t => t.status === 'failed')) {
    recommendations.push('🔗 Integration tests failed. Check contact import and CRM functionality.');
  }
  
  return recommendations;
}

// Main execution
(async () => {
  try {
    console.log('🚀 JJP Contact Integration Test Runner');
    console.log('═'.repeat(60));
    
    // Check if playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('❌ Playwright not found. Installing...');
      execSync('npm install @playwright/test', { stdio: 'inherit' });
      execSync('npx playwright install', { stdio: 'inherit' });
    }
    
    // Run all tests
    const finalReport = await runAllTests();
    
    // Generate reports
    console.log('\n📊 Generating Reports...');
    console.log('═'.repeat(60));
    
    generateHTMLReport(finalReport);
    saveJSONReport(finalReport);
    
    // Generate recommendations
    const recommendations = generateRecommendations(finalReport);
    
    console.log('\n📋 Final Summary:');
    console.log('═'.repeat(60));
    console.log(`Total Tests: ${finalReport.summary.total}`);
    console.log(`Passed: ${finalReport.summary.passed}`);
    console.log(`Failed: ${finalReport.summary.failed}`);
    console.log(`Success Rate: ${Math.round((finalReport.summary.passed / finalReport.summary.total) * 100)}%`);
    
    console.log('\n💡 Recommendations:');
    console.log('═'.repeat(60));
    recommendations.forEach(rec => console.log(rec));
    
    console.log('\n🎯 Test execution completed!');
    console.log(`📄 Check ${resultsDir} for detailed reports`);
    
    // Exit with appropriate code
    process.exit(finalReport.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
})();