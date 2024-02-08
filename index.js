const express = require('express');
const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
 
// creating api request
app.post('/scrape', async (req, res) => {
  const { companyNames } = req.body;

  try {
    // initilize web browser
    const browser = await puppeteer.launch({ headless: true });
    const companyData = [];

    const page = await browser.newPage();
    for (let i = 0; i < companyNames.length; i++) {
      const companyName = companyNames[i];
      try {
        await page.goto('https://www.google.com');
        await page.type('*[name="q"]', companyName);
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          page.keyboard.press('Enter')
        ]);
        await page.waitForSelector('.g');
        const firstUrl = await page.$eval('.g a', anchor => anchor.href);
        if (!firstUrl) {
          console.log(`No valid URL found for ${companyName}`);
          continue;
        }
        // getting page data
        await page.goto(firstUrl);
        const linkedinUrl = await page.$eval('a[href*="linkedin.com"]', anchor => anchor.href);
        const companyUrl = await page.url();
        const emails = pageContent.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        companyData.push({
          companyName,
          companyUrl,
          linkedinUrl,
          emails
        });
      } catch (error) {
        console.error(`Error occurred for ${companyName}:`, error);
      }
    }

    await browser.close();
    
    // creating CSV file 
    const csvWriter = createObjectCsvWriter({
      path: 'company_data.csv',
      header: [
        { id: 'companyName', title: 'Company Name' },
        { id: 'companyUrl', title: 'Website Link' },
        { id: 'linkedinUrl', title: 'LinkedIn Page URL' }
      ]
    });

    await csvWriter.writeRecords(companyData);

    console.log('CSV file generated successfully!');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=company_data.csv');
    fs.createReadStream('company_data.csv').pipe(res);
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ success: false, error: 'An error occurred during scraping.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
