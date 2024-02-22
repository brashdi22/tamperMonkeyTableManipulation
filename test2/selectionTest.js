const {Builder, By, Key} = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const assert = require('assert');

describe('Test the selection functionality', function(){
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

    it('should select/unselect whole table correctly', async function() {
        const cells = await table.findElements(By.css('thead tr:not(:first-child) th, tbody td:not(:first-child)'));
    
        // Simulate the selection of the whole table
        const cell = await table.findElement(By.css('tr:nth-child(2) th:first-child'));
        await driver.executeScript("arguments[0].scrollIntoView(true);", cell);
        await cell.click();

        // Check that the whole table was selected correctly
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, cells.length, 'Not all cells are selected');

        // Simulate the unselection of a cell
        await driver.actions().keyDown(Key.CONTROL).click(cell).keyUp(Key.CONTROL).perform();
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 0, 'No cell should be selected');
    });

    it('should select/unselect one cell correctly', async function() {
        // Simulate the selection of a cell
        const cell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(3)'));
        await cell.click();

        // Check that the cell was selected correctly
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 1, '1 cell should be selected');

        // Simulate the unselection of a cell
        await driver.actions().keyDown(Key.CONTROL).click(cell).keyUp(Key.CONTROL).perform();
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 0, 'No cell should be selected');
    });

    it('should be able to select cells that are not next to each other', async function() {
        // Select multiple cells from one end of the table
        const startCell1 = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(3)'));
        const endCell1 = await table.findElement(By.css('tbody tr:nth-child(2) td:nth-child(4)'));
        await driver.actions()
            .move({origin: startCell1}).press()
            .move({origin: endCell1}).release()
            .perform();
    
        // Select multiple cells from the other end of the table while holding the control key
        const startCell2 = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows-1}) td:nth-child(${numOfCols-1})`));
        const endCell2 = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows}) td:nth-child(${numOfCols})`));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell2}).press()
            .move({origin: endCell2}).release()
            .keyUp(Key.CONTROL).perform();
    
        // Check that all cells are selected
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 8, '8 cells should be selected');
    });

    it('should select/unselect multiple cells correctly', async function() {
        // Simulate the selection of cells
        let startCell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(3)'));
        let endCell = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows}) td:nth-child(${numOfCols})`));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Exclude the first 2 columns (rows handles and rows selectors)
        let numOfSelectedCells = numOfRows * (numOfCols-2);

        // Check that the cells were selected correctly
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, numOfSelectedCells, numOfSelectedCells + ' cells should be selected');


        // Change the end cell to be the first cell in the last row
        endCell = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows}) td:nth-child(3)`));

        // Simulate the unselection of cells
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .keyUp(Key.CONTROL).perform();

        // Exclude the first 3 columns (rows handles and rows selectors + the one we just unselected)
        numOfSelectedCells = numOfRows * (numOfCols-3);

        // Check that the cells were unselected correctly
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, numOfSelectedCells, numOfSelectedCells + ' cells should be selected');
    });

    it('should select rows correctly', async function() {  
        // Simulate the selection of rows
        const startCell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(2)'));
        const endCell = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows}) td:nth-child(2)`));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Exclude the first 2 columns (rows handles and rows selectors)
        let numOfSelectedCells = numOfRows * (numOfCols-1);

        // Check that the cells were selected correctly
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, numOfSelectedCells, numOfSelectedCells + ' cells should be selected');
    });

    it('should select rows not next each other correctly', async function() {  
        // Simulate the selection of the first 2 rows
        let startCell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(2)'));
        let endCell = await table.findElement(By.css(`tbody tr:nth-child(2) td:nth-child(2)`));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Simulate the selection of the last 2 rows while holding the control key
        startCell = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows-1}) td:nth-child(2)`));
        endCell = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows}) td:nth-child(2)`));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .keyUp(Key.CONTROL).perform();
            
        // Get the cells in the first/last 2 rows except the first column (drag handles), then combine the results
        const cells1 = await table.findElements(By.css('tbody tr:nth-child(n+1):nth-child(-n+2) td:not(:first-child)'));
        const cells2 = await table.findElements(By.css(`tbody tr:nth-child(${numOfRows-1}):nth-child(${numOfRows}) td:not(:first-child)`));
        const cells = cells1.concat(cells2);

        // Iterate over the cells and check if they are selected
        for (let i = 0; i < cells.length; i++) {
            const classes = await cells[i].getAttribute('class');
            assert(classes.includes('selectedTableObjCell'), 'Cell is not selected');
        }
    });

    it('should unselect rows correctly', async function() {
        // Simulate the selection of all rows
        let startCell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(2)'));
        let endCell = await table.findElement(By.css(`tbody tr:nth-child(${numOfRows}) td:nth-child(${numOfCols})`));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Simulate the unselection of the 2 first rows from the 4 selected rows
        startCell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(2)'));
        endCell = await table.findElement(By.css('tbody tr:nth-child(2) td:nth-child(2)'));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .keyUp(Key.CONTROL).perform();

        // Get the cells in the first 2 rows except the first column (drag handles)
        const cells = await table.findElements(By.css('tbody tr:nth-child(n+1):nth-child(-n+2) td:not(:first-child)'));

        // Ensure that no cell in the first 2 rows is selected
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const classes = await cell.getAttribute('class');
            assert(!classes.includes('selectedTableObjCell'), 'Cell is selected while it should not be selected');
        }

        // Ensure that everything else is selected
        const numOfSelectedCells = (numOfRows-2) * (numOfCols-1);
        const selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, numOfSelectedCells, numOfSelectedCells + ' cells should be selected');
    });

    it('should highlight the selected cell using the selected colour', async function(){
        // Simulate the selection of cells
        let startCell = await table.findElement(By.css('tbody tr:nth-child(1) td:nth-child(3)'));
        let endCell = await table.findElement(By.css('tbody tr:nth-child(2) td:nth-child(4)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Click the highlight button
        const highlightButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightButton")', toolbar);
        await highlightButton.click();

        const selectedCells = await table.findElements(By.css('.selectedTableObjCell'));

        // Check that the cells are highlighted
        for (let i = 0; i < selectedCells.length; i++) {
            const classes = await selectedCells[i].getAttribute('class');
            assert(classes.includes('highlightedTableObjCell'), 'Cell is not highlighted');
        }
    });
    
});


