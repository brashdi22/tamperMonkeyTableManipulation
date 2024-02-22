const {Builder, By, Key} = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const assert = require('assert');

describe('Check main functionality', function(){
    let driver;
    let table;
    let toolbar;

    beforeEach(async function() {
        const profilePath = 'C:/Users/brash/AppData/Local/Microsoft/Edge/User Data/Profile 1';
        let options = new edge.Options();
        options.addArguments('user-data-dir=' + profilePath);
        options.addArguments('--no-sandbox');
        // options.addArguments('--disable-gpu');

        driver = new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();

        const url = 'file:///C:/Users/brash/Desktop/3rdYproject/repository/tamperMonkeyTableManipulation/testWebpage/testPage.html';
        // const url = 'https://en.wikipedia.org/wiki/List_of_slow_rotators_(minor_planets)'
        await driver.get(url);
        // Set time out for the page to load
        await driver.sleep(300);

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
    });

    afterEach(async function() {
        await driver.quit();
    });

    it('should add complete toolbar to the page', async function(){
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        assert.ok(toolbar, 'Toolbar not found');

        // Highlight button
        const highlightButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightButton")', toolbar);
        assert.ok(highlightButton, 'Highlight button not found');

        // Highlight colour
        const highlightColour = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightColour")', toolbar);
        assert.ok(highlightColour, 'Highlight colour not found');

        // Hide button
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        assert.ok(hideButton, 'Hide button not found');

        // Show button
        const showButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#showButton")', toolbar);
        assert.ok(showButton, 'Show button not found');

        // Magnify button
        const magnifyButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#magnifyButton")', toolbar);
        assert.ok(magnifyButton, 'Magnify button not found');

        // Charts button
        const chartsButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#dataTypeButton")', toolbar);
        assert.ok(chartsButton, 'Charts button not found');

        // Add Table button
        const addTableButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#newTableButton")', toolbar);
        assert.ok(addTableButton, 'Add Table button not found');

        // Delete Table button
        const deleteTableButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#deleteTableButton")', toolbar);
        assert.ok(deleteTableButton, 'Delete Table button not found');
    });

    it('should add settings menu', async function(){
        const tableId = await table.getAttribute('id');
        const settingsMenu = await driver.findElement(By.id(`${tableId}-menuContainer`));
        assert.ok(settingsMenu, 'Settings menu not found');
    });

    it('should add rows drag handles', async function(){
        // Get the rows in the tbody
        const rows = await table.findElements(By.css('tbody tr'));

        // For each row, check if the first cell has the class 'rowDragHandle'
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const firstCell = await row.findElement(By.css('td'));
            const classes = await firstCell.getAttribute('class');
            assert.ok(classes.includes('rowDragHandle'), 'Row ' + i + ' does not have a drag handle');
        }
    });

    it('should add rows selectors', async function(){
        // Get the rows in the tbody
        const rows = await table.findElements(By.css('tbody tr'));

        // For each row, check if the second cell has the class 'rowSelector'
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const secondCell = await row.findElement(By.css('td:nth-child(2)'));
            const classes = await secondCell.getAttribute('class');
            assert.ok(classes.includes('rowSelector'), 'Row ' + i + ' does not have a row selector');
        }
    });

    it('should add column drag handles', async function(){
        // Get the first row in the thead
        const row = await table.findElements(By.css('thead tr:first-child th:nth-child(n+3)'));

        // For each cell, check if it has the class 'columnDragHandle'
        for (let i = 0; i < row.length; i++) {
            const classes = await row[i].getAttribute('class');
            assert.ok(classes.includes('columnDragHandle'), 'Column ' + i + 2 + ' does not have a drag handle');
        }
    });

    it('should destroy table instance', async function(){
        // Get the delete table button
        const deleteTableButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#deleteTableButton")', toolbar);

        // Click the button then click the table
        await deleteTableButton.click();
        await table.click();

        // Fetch the table object and check if it is destroyed
        table = await driver.executeScript('return document.tableObjects.values().next().value;')
        assert.ok(!table, 'Table not destroyed');
    });
    
});


