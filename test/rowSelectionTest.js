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

    it('should select rows correctly', async function() {
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of rows
        const startCell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(1)'));
        const endCell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(1)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Get all cells in the first four rows
        const cells = await table.findElements(By.css('tr:nth-child(n+2):nth-child(-n+5) td'));
        // Iterate over each cell and check if it's selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(classes.includes('selected'), 'Cell is not selected');
        }
    });

    it('should unselect rows correctly', async function() {
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of rows 2-5
        let startCell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(1)'));
        let endCell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(1)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Simulate the unselection of the 2 middle rows from the 4 selected rows
        startCell = await table.findElement(By.css('tr:nth-child(3) td:nth-child(1)'));
        endCell = await table.findElement(By.css('tr:nth-child(4) td:nth-child(1)'));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .keyUp(Key.CONTROL).perform();

        // Get all cells in the 2nd and 5th rows, these should be selected
        const cells2nd = await table.findElements(By.css('tr:nth-child(2) td'));
        const cells5th = await table.findElements(By.css('tr:nth-child(5) td'));

        // Combine the results
        cells = cells2nd.concat(cells5th);

        // Iterate over each cell and check if it's still selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(classes.includes('selected'), 'Cell is not selected while it should be selected');
        }

        // Get all cells in the 3rd and 4th rows, these should not be selected
        const cells3rd = await table.findElements(By.css('tr:nth-child(3) td'));
        const cells4th = await table.findElements(By.css('tr:nth-child(4) td'));
        // Combine the results
        cells = cells3rd.concat(cells4th);

        // Iterate over each cell and check if it's still selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(!classes.includes('selected'), 'Cell is selected while it should not be selected');
        }
    });

});