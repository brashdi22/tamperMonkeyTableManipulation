const {Builder, By, Key} = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Drag functionality tests', function(){
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

    it ('should drag rows correctly', async function() {
        // Get the tbody of the of first table
        const tbody = await tables[0].findElement(By.css('tbody'));

        // Get the first row
        const firstRow = await tbody.findElement(By.css('tr:nth-child(1)'));

        // Get the drag handle of the first row
        const dragHandle = await firstRow.findElement(By.css('td:nth-child(1)'));

        // Get the drag handle of the forth row
        const dropLocation = await tbody.findElement(By.css('tr:nth-child(4) td:nth-child(1)'));

        // Drag the first row to the forth row
        // This should insert the first row between the third and forth row (it becomes the third row)
        await driver.actions()
            .move({origin: dragHandle}).press()
            .move({origin: dropLocation}).release()
            .perform();


        // Get the third row
        const thirdthRow = await tbody.findElement(By.css('tr:nth-child(3)'));

        // Verify that the thirdthRow row = first row
        assert.equal(await thirdthRow.getText(), await firstRow.getText());

    });

    it ('should drag columns correctly', async function() {
        // Get the first table
        const table = tables[0];

        // Get the cells in the third column
        const thirdCells = await table.findElements(By.css('tr td:nth-child(3), tr th:nth-child(3)'));

        // Get the drag handle third column
        const dragHandle = await table.findElement(By.css('thead tr:first-child th:nth-child(3)'));

        // Get the drag handle of the seventh column
        const dropLocation = await table.findElement(By.css('thead tr:first-child th:nth-child(7)'));

        // Drag the third column to the seventh column
        await driver.actions()
            .move({origin: dragHandle}).press()
            .move({origin: dropLocation}).release()
            .perform();

        // Get the cells in the seventh column
        const seventhCells = await table.findElement(By.css('tr td:nth-child(7), tr th:nth-child(7)'));

        // Verify that cells in the seventh column = cells in the third column
        for (let i = 0; i < seventhCells.length; i++) {
            assert.equal(await seventhCells[i].getText(), await thirdCells[i].getText());
        }
    });

});