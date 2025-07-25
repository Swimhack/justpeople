const https = require('https');
const http = require('http');
const { URL } = require('url');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testDeployedSite() {
  console.log('🌐 Simple JJP Site Validation');
  console.log('═'.repeat(50));
  
  const baseUrl = 'https://justpeople1.netlify.app';
  const testUrls = [
    { name: 'Main Page', url: `${baseUrl}/` },
    { name: 'Contacts Page', url: `${baseUrl}/contacts` },
    { name: 'CRM Dashboard', url: `${baseUrl}/admin/crm` },
  ];
  
  const results = {
    tests: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };
  
  for (const test of testUrls) {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    
    try {
      const response = await makeRequest(test.url);
      
      if (response.statusCode === 200) {
        console.log('✅ Status: OK (200)');
        
        // Check for specific content
        const body = response.body.toLowerCase();
        const hasReact = body.includes('react') || body.includes('div id="root"');
        const hasJJP = body.includes('jjp') || body.includes('solutions');
        const hasContacts = body.includes('contact') || body.includes('import');
        
        console.log(`📱 React App: ${hasReact ? '✅' : '❌'}`);
        console.log(`🏢 JJP Content: ${hasJJP ? '✅' : '❌'}`);
        console.log(`📞 Contact Features: ${hasContacts ? '✅' : '❌'}`);
        
        results.tests.push({
          name: test.name,
          url: test.url,
          status: 'passed',
          statusCode: response.statusCode,
          hasReact,
          hasJJP,
          hasContacts
        });
        
        results.summary.passed++;
        
      } else {
        console.log(`❌ Status: ${response.statusCode}`);
        results.tests.push({
          name: test.name,
          url: test.url,
          status: 'failed',
          statusCode: response.statusCode,
          error: `HTTP ${response.statusCode}`
        });
        
        results.summary.failed++;
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.tests.push({
        name: test.name,
        url: test.url,
        status: 'failed',
        error: error.message
      });
      
      results.summary.failed++;
    }
    
    results.summary.total++;
  }
  
  // Generate final report
  console.log('\n📊 Final Summary');
  console.log('═'.repeat(50));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  
  console.log('\n🎯 Detailed Results:');
  console.log('─'.repeat(50));
  results.tests.forEach(test => {
    console.log(`${test.name}: ${test.status === 'passed' ? '✅' : '❌'} (${test.statusCode || 'ERROR'})`);
    if (test.error) {
      console.log(`  Error: ${test.error}`);
    }
  });
  
  // Specific findings
  console.log('\n🔍 Key Findings:');
  console.log('─'.repeat(50));
  
  const mainPageTest = results.tests.find(t => t.name === 'Main Page');
  if (mainPageTest && mainPageTest.status === 'passed') {
    console.log('✅ Main application is deployed and accessible');
    if (mainPageTest.hasReact) {
      console.log('✅ React application is properly built');
    }
    if (mainPageTest.hasJJP) {
      console.log('✅ JJP branding is present');
    }
  } else {
    console.log('❌ Main application is not accessible');
  }
  
  const contactsTest = results.tests.find(t => t.name === 'Contacts Page');
  if (contactsTest && contactsTest.status === 'passed') {
    console.log('✅ Contacts page is accessible');
    if (contactsTest.hasContacts) {
      console.log('✅ Contact-related content detected');
    }
  } else {
    console.log('❌ Contacts page is not accessible');
  }
  
  const crmTest = results.tests.find(t => t.name === 'CRM Dashboard');
  if (crmTest && crmTest.status === 'passed') {
    console.log('✅ CRM dashboard is accessible');
  } else {
    console.log('❌ CRM dashboard is not accessible');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('─'.repeat(50));
  
  if (results.summary.passed === results.summary.total) {
    console.log('🎉 All basic tests passed! The application is deployed correctly.');
    console.log('💡 Next steps: Test specific contact import functionality manually.');
  } else if (results.summary.passed > 0) {
    console.log('⚠️  Some functionality is working, but issues were found.');
    console.log('💡 Review failed tests and fix deployment issues.');
  } else {
    console.log('🚨 Critical: No tests passed. Check deployment status.');
    console.log('💡 Verify the application is properly deployed to Netlify.');
  }
  
  console.log('\n🔧 Manual Testing Steps:');
  console.log('1. Visit https://justpeople1.netlify.app in your browser');
  console.log('2. Navigate to /contacts page');
  console.log('3. Look for "Import Contacts" button');
  console.log('4. Test file upload functionality');
  console.log('5. Check search and filter features');
  console.log('6. Navigate to /admin/crm');
  console.log('7. Test CRM integration features');
  
  return results;
}

// Run the test
testDeployedSite().catch(console.error);