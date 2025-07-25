const { chromium } = require('playwright');

(async () => {
  console.log('🌐 Manual JJP Site Validation Test');
  console.log('═'.repeat(50));
  
  let browser;
  let page;
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Test results
    const results = {
      mainPageLoad: false,
      contactsPageAccessible: false,
      importFunctionality: false,
      searchFunctionality: false,
      crmIntegration: false,
      errors: []
    };
    
    // Test main page
    console.log('📱 Testing main page...');
    try {
      await page.goto('https://justpeople1.netlify.app', { waitUntil: 'networkidle' });
      await page.waitForSelector('body', { timeout: 10000 });
      results.mainPageLoad = true;
      console.log('✅ Main page loaded successfully');
    } catch (error) {
      results.errors.push(`Main page load failed: ${error.message}`);
      console.log('❌ Main page load failed');
    }
    
    // Test contacts page
    console.log('📞 Testing contacts page...');
    try {
      await page.goto('https://justpeople1.netlify.app/contacts', { waitUntil: 'networkidle' });
      await page.waitForSelector('body', { timeout: 10000 });
      results.contactsPageAccessible = true;
      console.log('✅ Contacts page accessible');
      
      // Look for import functionality
      try {
        const importButton = await page.waitForSelector('button:has-text("Import Contacts")', { timeout: 5000 });
        if (importButton) {
          results.importFunctionality = true;
          console.log('✅ Import functionality found');
        }
      } catch (e) {
        console.log('⚠️  Import functionality not found');
      }
      
      // Look for search functionality
      try {
        const searchInput = await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
        if (searchInput) {
          results.searchFunctionality = true;
          console.log('✅ Search functionality found');
        }
      } catch (e) {
        console.log('⚠️  Search functionality not found');
      }
      
    } catch (error) {
      results.errors.push(`Contacts page access failed: ${error.message}`);
      console.log('❌ Contacts page access failed');
    }
    
    // Test CRM integration
    console.log('🏢 Testing CRM integration...');
    try {
      await page.goto('https://justpeople1.netlify.app/admin/crm', { waitUntil: 'networkidle' });
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Look for CRM dashboard
      try {
        const crmTitle = await page.waitForSelector('text=CRM Dashboard', { timeout: 5000 });
        if (crmTitle) {
          results.crmIntegration = true;
          console.log('✅ CRM integration found');
        }
      } catch (e) {
        console.log('⚠️  CRM dashboard not found');
      }
      
    } catch (error) {
      results.errors.push(`CRM integration test failed: ${error.message}`);
      console.log('❌ CRM integration test failed');
    }
    
    // Generate report
    console.log('\n📊 Test Results:');
    console.log('═'.repeat(50));
    console.log(`Main Page Load: ${results.mainPageLoad ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Contacts Page Accessible: ${results.contactsPageAccessible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Import Functionality: ${results.importFunctionality ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Search Functionality: ${results.searchFunctionality ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CRM Integration: ${results.crmIntegration ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(v => v === true).length;
    const totalTests = Object.keys(results).length - 1; // Exclude errors array
    
    console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    // Specific recommendations
    console.log('\n💡 Recommendations:');
    console.log('═'.repeat(50));
    
    if (!results.mainPageLoad) {
      console.log('• Fix main page loading issues');
    }
    
    if (!results.contactsPageAccessible) {
      console.log('• Deploy contact management functionality');
    }
    
    if (!results.importFunctionality) {
      console.log('• Implement contact import functionality');
    }
    
    if (!results.searchFunctionality) {
      console.log('• Add search functionality to contacts page');
    }
    
    if (!results.crmIntegration) {
      console.log('• Deploy CRM dashboard integration');
    }
    
    if (passedTests === totalTests) {
      console.log('• All tests passed! Contact integration is working correctly');
    } else if (passedTests > totalTests / 2) {
      console.log('• Basic functionality is working. Focus on remaining features');
    } else {
      console.log('• Major issues detected. Review deployment and functionality');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();