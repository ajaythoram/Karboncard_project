const puppeteer = require('puppeteer');
const fs = require('fs');

const EMAIL = 'thoramajaykumar7036@gmail.com'; 
const PASSWORD = 'Ajay@9908'; 
const companies = ['infosys', 'google', 'microsoft'];  // enter compamny name you want

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAndScrape() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.linkedin.com/login');
    await page.type('#username', EMAIL);
    await page.type('#password', PASSWORD);
    await page.click('.btn__primary--large');
    await page.waitForSelector('.feed-identity-module__actor-meta', { timeout: 10 * 60 * 1000 });

    let data = [];

    for (let companyName of companies) {
        const searchURL = `https://www.linkedin.com/search/results/companies/?keywords=${companyName}`;
        await page.goto(searchURL);

        const links = await page.evaluate(() => {
            const elements = document.querySelectorAll('.app-aware-link.scale-down');
            const links = Array.from(elements).map(element => element.href);
            return links;
        });

        if (links.length > 0) {
            const linkedinLink = links[0];
            await page.goto(`${linkedinLink}/about`);

            await page.waitForSelector('a.link-without-visited-state.ember-view');
            const website = await page.evaluate(() => {
                const elements = document.querySelectorAll('a.link-without-visited-state.ember-view');
                const websites = Array.from(elements).map(element => element.href);
                return websites[0];
            });

            data.push({ companyName, website, linkedinLink });
        } else {
            console.log(`Company not found: ${companyName}`);
        }

        await sleep(5000);
    }

    await browser.close();

    const csvData = data.map(company => `${company.companyName},${company.website},${company.linkedinLink}`).join('\n');
    fs.writeFileSync('companies.csv', `Company Name,Website,LinkedIn Page URL\n${csvData}`);
}

loginAndScrape().catch((e) => {
    console.log(e);
    console.log({ message: "Error Occurred", success: false });
});
