const {Builder, By, Key} = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Check main functionality', function(){
    let driver;
    let tables;

    beforeEach(async function() {
        // Create a Selenium driver before each test, and load the page.
        driver = await new Builder().forBrowser('MicrosoftEdge').build();

        await driver.get('file:///C:/Users/brash/Desktop/3rdYproject/repository/tamperMonkeyTableManipulation/testWebpage/testPage.html');
        
        // Inject the user script into the page
        const tableObjScript = fs.readFileSync('TableObj.js', 'utf8');
        const mainScript = fs.readFileSync('main.js', 'utf8');
        await driver.executeScript(tableObjScript + mainScript);

        // Find all the tables on the page
        tables = await driver.findElements(By.tagName('table'));
    });

    afterEach(async function() {
        await driver.quit();
    });


    // The second table does not have a thead element initially,
    // it should be added by the script.
    it('should check thead is present in each table', async function(){
        for (const table of tables) {
        const thead = await table.findElement(By.tagName('thead'));
        assert.ok(thead, 'Table does not have a thead element');
        }
    });

    it('should add row selectors to each table', async function(){
        for (const table of tables) {
            const rows = await table.findElements(By.tagName('tr'));
            const rowSelectors = await table.findElements(By.className('rowSelector'));
            assert.strictEqual(rows.length, rowSelectors.length, 'Not all rows have a row selector');
        }
    });

});