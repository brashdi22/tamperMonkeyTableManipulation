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
        
        // Add the stylesheet to the page
        const stylesheetUrl = '../stylesheet.css';
        await driver.executeScript(`
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '${stylesheetUrl}';
            document.head.appendChild(link);
        `);

        // Inject the user script into the page
        const toolbar = fs.readFileSync('ToolbarShadowDOM.js', 'utf8');
        const tableObjScript = fs.readFileSync('TableObj.js', 'utf8');
        const mainScript = fs.readFileSync('main.js', 'utf8');
        await driver.executeScript(toolbar + tableObjScript + mainScript);

        // Find all the tables on the page
        tables = await driver.findElements(By.tagName('table'));
    });

    afterEach(async function() {
        await driver.quit();
    });

    it('should select columns correctly', async function() {
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of columns in the thead
        const startCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(3)'));
        const endCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(6)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Get all cells in the selected columns
        const cells = await table.findElements(By.css('tr td:nth-child(n+3):nth-child(-n+6), thead tr:not(:first-child) th:nth-child(n+3):nth-child(-n+6)'));
        // Iterate over each cell and check if it's selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(classes.includes('selectedTableObjCell'), 'Cell is not selected');
        }
    });

    it('should unselect columns correctly', async function() {
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of columns 3-6 in the thead
        let startCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(3)'));
        let endCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(6)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Simulate the unselection of the 2 middle coulmns from the 4 selected columns
        startCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(4)'));
        endCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(5)'));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .keyUp(Key.CONTROL).perform();

        // Get all cells in the 3rd and 6th columns, these should be selected
        const cells2nd = await table.findElements(By.css('tr td:nth-child(3), tr:not(:first-child) th:nth-child(3)'));
        const cells5th = await table.findElements(By.css('tr td:nth-child(6), tr:not(:first-child) th:nth-child(6)'));

        // Combine the results
        cells = cells2nd.concat(cells5th);

        // Iterate over each cell and check if it's still selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(classes.includes('selectedTableObjCell'), 'Cell is not selected while it should be selected');
        }

        // Get all cells in the 4th and 5th columns, these should not be selected
        const cells3rd = await table.findElements(By.css('tr td:nth-child(4), tr:not(:first-child) th:nth-child(4)'));
        const cells4th = await table.findElements(By.css('tr td:nth-child(5), tr:not(:first-child) th:nth-child(5)'));
        // Combine the results
        cells = cells3rd.concat(cells4th);

        // Iterate over each cell and check if it's still selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(!classes.includes('selectedTableObjCell'), 'Cell is selected while it should not be selected');
        }
    });

});