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

    it('should select/unselect one cell correctly', async function() {
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of a cell
        const cell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
        await cell.click();

        // Check that the cell was selected correctly
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 1, '1 cell should be selected');

        // Simulate the unselection of a cell
        await driver.actions().keyDown(Key.CONTROL).click(cell).keyUp(Key.CONTROL).perform();
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 0, 'No cell should be selected');
    });

    it('should select/unselect multiple cells correctly', async function() {
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of cells
        let startCell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
        let endCell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(5)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Check that the cells were selected correctly
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 16, '16 cells should be selected');

        startCell = await table.findElement(By.css('tr:nth-child(3) td:nth-child(3)'));
        endCell = await table.findElement(By.css('tr:nth-child(4) td:nth-child(4)'));

        // Simulate the unselection of cells
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .keyUp(Key.CONTROL).perform();
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 12, '12 cells should be selected');
    });

    it('should select/unselect whole table correctly', async function() {
        // Get the first table
        const table = tables[0];

        // Get all cells in the table
        const cells = await table.findElements(By.css('td, th'));
    
        // Simulate the selection of the whole table
        const cell = await table.findElement(By.css('tr:nth-child(1) th:nth-child(1)'));
        await cell.click();

        // Check that the whole table was selected correctly
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, cells.length, 'Not all cells are selected');

        // Simulate the unselection of a cell
        await driver.actions().keyDown(Key.CONTROL).click(cell).keyUp(Key.CONTROL).perform();
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 0, 'No cell should be selected');
    });

    it('should be able to select/unselect cells that are not next to each other', async function() {
        // Get the first table
        const table = tables[0];
    
        // Select multiple cells from one end of the table
        const startCell1 = await table.findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
        const endCell1 = await table.findElement(By.css('tr:nth-child(3) td:nth-child(3)'));
        await driver.actions()
            .move({origin: startCell1}).press()
            .move({origin: endCell1}).release()
            .perform();
    
        // Select multiple cells from the other end of the table while holding the control key
        const startCell2 = await table.findElement(By.css('tr:nth-child(4) td:nth-child(4)'));
        const endCell2 = await table.findElement(By.css('tr:nth-child(5) td:nth-child(5)'));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell2}).press()
            .move({origin: endCell2}).release()
            .keyUp(Key.CONTROL).perform();
    
        // Check that all cells are selected
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 8, '8 cells should be selected');

        // unselect the first cell
        let cell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
        await driver.actions().keyDown(Key.CONTROL).click(cell).keyUp(Key.CONTROL).perform();

        // unselect the second cell
        cell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(5)'));
        await driver.actions().keyDown(Key.CONTROL).click(cell).keyUp(Key.CONTROL).perform();

        // Check that are 6 selected cells left
        selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 6, '6 cells should be selected');
    });

    it('should unselect previous selection when selecting a new cell if the control key is not pressed', async function() {
        // Get the first table
        const table = tables[0];
    
        // Select a cell
        const cell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(5)'));
        await cell.click();
    
        // Press the mouse on cell (2,2)
        const startCell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
        await driver.actions().move({origin: startCell}).press().perform();

        // Move the mouse to cell (6,6)
        const endCell = await table.findElement(By.css('tr:nth-child(6) td:nth-child(6)'));
        await driver.actions().move({origin: endCell}).perform();

        // Move the mouse back to cell (2,2)
        await driver.actions().move({origin: startCell}).perform();

        // Release the mouse
        await driver.actions().release().perform();
    
        // Check that only on cell is selected
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 1, '1 cell should be selected');
    });

    it('should forget the previous selection when pressing outside the table', async function() {
        // Get the first table
        const table = tables[0];
    
        // Select a cell
        const cell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(5)'));
        await cell.click();

        // Press the mouse outside the table
        //Press on the h1 element
        const header = await driver.findElement(By.css('h1'));
        await driver.actions().move({origin: header}).press().perform();
    
        // Press the mouse on cell (2,2)
        const startCell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
        await driver.actions().keyDown(Key.CONTROL)
            .move({origin: startCell}).press()
            .perform();

        // Move the mouse to cell (6,6)
        const midCell = await table.findElement(By.css('tr:nth-child(6) td:nth-child(6)'));
        await driver.actions().move({origin: midCell}).perform();

        // Move the mouse back to cell (2,2)
        await driver.actions().move({origin: startCell}).perform();

        // Release the mouse
        await driver.actions().release().keyUp(Key.CONTROL).perform();
    
        // Check that only on cell is selected
        let selectedCells = await table.findElements(By.css('.selectedTableObjCell'));
        assert.strictEqual(selectedCells.length, 1, '1 cell should be selected');
    });
});