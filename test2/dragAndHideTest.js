const {Builder, By, Key} = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const assert = require('assert');

describe('Test the drag and hide functionality', function(){
    let driver;
    let table;
    let toolbar;
    let numOfRows;
    let numOfCols;

    beforeEach(async function() {
        const profilePath = 'C:/Users/brash/AppData/Local/Microsoft/Edge/User Data/Profile 1';
        let options = new edge.Options();
        options.addArguments('user-data-dir=' + profilePath);
        options.addArguments('--no-sandbox');

        driver = new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();

        const url = 'file:///C:/Users/brash/Desktop/3rdYproject/repository/tamperMonkeyTableManipulation/testWebpage/testPage.html';
        // const url = 'https://en.wikipedia.org/wiki/List_of_slow_rotators_(minor_planets)'
        await driver.get(url);
        // Set time out for the page to load
        await driver.sleep(3000);

        // assign the first table in the page to the 'table' variable
        const tables = await driver.findElements(By.css('table'));
        if (tables.length > 0) {
            table = tables[0];
        } else {
            console.log('No tables found');
        }

        // Get the toolbar
        toolbar = await driver.findElement(By.id('TableObjToolbar'));
        assert.ok(toolbar, 'Toolbar not found');

        // Get the initialise table instance button
        const addTableButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#newTableButton")', toolbar);
        assert.ok(addTableButton, 'Add Table button not found');

        // Click the button then click the table
        await addTableButton.click();
        await table.click();

        // Wait for the table to be created then assign it to the 'table' variable
        await driver.sleep(500);
        table = await driver.executeScript('return document.tableObjects.values().next().value.table;');

        // Click the button again (toggle it off)
        await addTableButton.click();

        // Get the number of rows and columns in the table
        numOfRows = await table.findElements(By.css('tbody tr'));
        numOfCols = await table.findElements(By.css('tbody tr:nth-child(1) td'));
        numOfRows = numOfRows.length;
        numOfCols = numOfCols.length;
    });

    afterEach(async function() {
        await driver.quit();
    });

    it ('should drag rows correctly', async function() {
        // Get the first row
        const firstRow = await table.findElement(By.css('tbody tr:nth-child(1)'));

        // Get the drag handle of the first row
        const dragHandle = await table.findElement(By.css('td:nth-child(1)'));

        // Get the drag handle of the forth row
        const dropLocation = await table.findElement(By.css('tr:nth-child(4) td:nth-child(1)'));

        // Drag the first row to the forth row
        // This should insert the first row between the third and forth row (it becomes the third row)
        await driver.actions()
            .move({origin: dragHandle}).press()
            .move({origin: dropLocation}).release()
            .perform();

        // Get the third row
        const thirdRow = await table.findElement(By.css('tbody tr:nth-child(3)'));

        // Verify that the current third row is the old first row
        assert.equal(await thirdRow.getText(), await firstRow.getText());
    });

    it ('should hide and show rows correctly', async function() {
        // Get the first row
        const firstRow = await table.findElement(By.css('tbody tr:nth-child(1)'));

        // Get the row selector of the first row
        const firstRowSelector = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(2)'));
        await firstRowSelector.click();

        // Get the hide button and click it
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        await hideButton.click();

        // Verify that the first row is hidden
        assert.equal(await firstRow.getAttribute('style'), 'display: none;');

        // Get the show button and click it
        const showButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#showButton")', toolbar);
        await showButton.click();

        // Verify that the first row is shown
        assert.equal(await firstRow.getAttribute('style'), '');
    });
    
});


