const {Builder, By, Key} = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const { log } = require('console');

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
        tables = await driver.findElements(By.css('table'));
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
            const tbody = await table.findElement(By.css('tbody'));
            const rows = await tbody.findElements(By.css('tr'));
            const rowSelectors = await tbody.findElements(By.className('rowSelector'));
            assert.strictEqual(rows.length, rowSelectors.length, 'Not all rows have a row selector');
        }
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
    });

    it('should highlight the selected cell using the selected colour', async function(){
        // Simulate the selection of a cell
        const cell1 = await tables[0].findElement(By.css('tr:nth-child(1) td:nth-child(3)'));
        await cell1.click();

        // Click the highlight button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const highlightButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightButton")', toolbar);
        await highlightButton.click();

        // Check that the cell has the correct class
        // The class list should contain 'selectedTableObjCell', 'highlightedTableObjCell' and 'yellow-highlighted'
        // but it could contain more classes
        const cellClass = await cell1.getAttribute('class');
        assert.strictEqual(cellClass.includes('selectedTableObjCell'), true);
        assert.strictEqual(cellClass.includes('highlightedTableObjCell'), true);
        assert.strictEqual(cellClass.includes('yellow-highlighted'), true);

        // Click on another cell.
        // The colour of the cell is different if the cell is selected and highlighted
        // or just highlighted.
        const cell2 = await tables[0].findElement(By.css('tr:nth-child(2) td:nth-child(3)'));
        await cell2.click();

        // Check that the cell is highlighted yellow
        const cellColour = await cell1.getCssValue('background-color');
        assert.strictEqual(cellColour, 'rgba(250, 240, 107, 1)');
    });

    it('should change the colour of the highlighted cell correctly', async function(){
        // Simulate the selection of a cell
        const cell1 = await tables[0].findElement(By.css('tr:nth-child(1) td:nth-child(3)'));
        await cell1.click();

        // Click the highlight button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const highlightButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightButton")', toolbar);
        await highlightButton.click();

        // Change the highlighter colour to blue
        const highlightColour = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightColour")', toolbar);
        await highlightColour.click();
        await highlightColour.sendKeys(Key.ARROW_DOWN);
        await highlightColour.sendKeys(Key.ENTER);
        await highlightButton.click();

        // Check that the cell has the correct class
        // The class list should contain 'selected', 'highlightedTableObjCell' and 'blue-highlighted'
        // but it could contain more classes.
        // The class list should not contain 'yellow-highlighted'.
        const cellClass = await cell1.getAttribute('class');
        assert.strictEqual(cellClass.includes('selectedTableObjCell'), true);
        assert.strictEqual(cellClass.includes('highlightedTableObjCell'), true);
        assert.strictEqual(cellClass.includes('blue-highlighted'), true);
        assert.strictEqual(cellClass.includes('yellow-highlighted'), false);

        // Click on another cell.
        const cell2 = await tables[0].findElement(By.css('tr:nth-child(2) td:nth-child(3)'));
        await cell2.click();

        // Check that the cell is highlighted blue
        const cellColour = await cell1.getCssValue('background-color');
        assert.strictEqual(cellColour, 'rgba(213, 230, 237, 1)');
    });

    it('should unhighlight the selected cell correctly', async function(){
        // Simulate the selection of a cell
        const cell1 = await tables[0].findElement(By.css('tr:nth-child(1) td:nth-child(3)'));
        await cell1.click();

        // Click the highlight button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const highlightButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightButton")', toolbar);
        await highlightButton.click();

        // Change the highlighter colour to transparent
        const highlightColour = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightColour")', toolbar);
        await highlightColour.click();
        await highlightColour.sendKeys(Key.ARROW_DOWN);
        await highlightColour.sendKeys(Key.ARROW_DOWN);
        await highlightColour.sendKeys(Key.ARROW_DOWN);
        await highlightColour.sendKeys(Key.ENTER);
        await highlightButton.click();

        // Check that the cell has the correct class
        // The class list should contain 'selected' but not 'highlightedTableObjCell'
        const cellClass = await cell1.getAttribute('class');
        assert.strictEqual(cellClass.includes('selectedTableObjCell'), true);
        assert.strictEqual(cellClass.includes('highlightedTableObjCell'), false);
    });

    it('should hide/unhide the selected rows correctly using the hide/show buttons', async function(){
        // Get the first table
        const table = tables[0];
        const tbody = await table.findElement(By.css('tbody'));
    
        // Simulate the selection of rows
        const startCell = await table.findElement(By.css('tr:nth-child(1) td:nth-child(2)'));
        const endCell = await table.findElement(By.css('tr:nth-child(4) td:nth-child(2)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Click the hide button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        await hideButton.click();

        // Check that the rows were hidden correctly, their style should contain 'display: none'
        const rows = await tbody.findElements(By.css('tr:nth-child(n+1):nth-child(-n+4)'));
        for (const row of rows) {
            const style = await row.getAttribute('style');
            assert.strictEqual(style.includes('display: none'), true);
        }

        // Click the show button
        const showButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#showButton")', toolbar);
        await showButton.click();

        // Check that the rows were shown correctly, their style should not contain 'display: none'
        for (const row of rows) {
            const style = await row.getAttribute('style');
            assert.strictEqual(style.includes('display: none'), false);
        }

    });

    it('should hide/unhide the selected columns correctly using the hide/show buttons', async function(){
        // Get the first table
        const table = tables[0];
    
        // Simulate the selection of columns in the thead
        const startCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(3)'));
        const endCell = await table.findElement(By.css('tr:nth-child(2) th:nth-child(6)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Click the hide button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        await hideButton.click();

        // Check that the columns were hidden correctly, their style should contain 'display: none'
        const columns = await table.findElements(By.css('tr th:nth-child(n+3):nth-child(-n+6)'));
        for (const column of columns) {
            const style = await column.getAttribute('style');
            assert.strictEqual(style.includes('display: none'), true);
        }

        // Click the show button
        const showButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#showButton")', toolbar);
        await showButton.click();

        // Check that the columns were shown correctly, their style should not contain 'display: none'
        for (const column of columns) {
            const style = await column.getAttribute('style');
            assert.strictEqual(style.includes('display: none'), false);
        }
    });

    it ('should display the column header when hoovering over a cell', async function(){
        // Get the first table
        const table = tables[0];
    
        // Get the first cell in the third column
        const cell = await table.findElement(By.css('tr:nth-child(1) td:nth-child(3)'));

        // Hover over the cell
        await driver.actions()
            .move({origin: cell})
            .perform();

        // Check that the column header is displayed, the column header should be a title attribute to the cell
        const columnHeader = await cell.getAttribute('title');
        assert.strictEqual(columnHeader, 'Header 1');
    });

    it ('should magnify the cell when hoovering over it', async function(){
        // Get the first table
        const table = tables[0];
    
        // Get a cell
        const cell = await table.findElement(By.css('tr:nth-child(1) td:nth-child(3)'));

        // Get the magnify button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const magnifyButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#magnifyButton")', toolbar);

        // Hover over the cell
        await driver.actions()
            .move({origin: cell})
            .perform();
        
        // Ensure that the cell does not have the 'magnify-on-hover' class yet
        let cellClass = await cell.getAttribute('class');
        assert.strictEqual(cellClass.includes('magnify-on-hover'), false);

        // Click the magnify button
        await magnifyButton.click();

        // Hover over the cell
        await driver.actions()
            .move({origin: cell})
            .perform();

        // The cell should have the 'magnify-on-hover' class
        cellClass = await cell.getAttribute('class');
        assert.strictEqual(cellClass.includes('magnify-on-hover'), true);

        // Get the computed style of the cell to check the transform property
        const transformedStyle = await driver.executeScript("return window.getComputedStyle(arguments[0]).transform;", cell);

        // It should be 1.5 times bigger than the original size
        assert.strictEqual(transformedStyle, 'matrix(1.5, 0, 0, 1.5, 0, 0)');


    });

    it ('should reset the table when clicking the reset button', async function(){
        // Get the first table
        let table = tables[0];
        // Store the innerHTML of the table
        const oldTableInnerHTML = await table.getAttribute('innerHTML');

        // Select a column and highlight it
        let column = await table.findElement(By.css('tr:nth-child(2) th:nth-child(3)'));
        await column.click();

        // Highlight the column
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const highlightButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#highlightButton")', toolbar);
        await highlightButton.click();

        // Select a row and hide it
        const row = await table.findElement(By.css('tr:nth-child(1) td:nth-child(2)'));
        await row.click();

        // Hide the row
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        await hideButton.click();

        // Click the reset button
        const resetButtons = await driver.findElements(By.css('.TableObjResetButton'));
        await driver.executeScript("arguments[0].click();", resetButtons[0]);

        // get the tables again
        tables = await driver.findElements(By.css('table'));
        table = tables[0];

        // Check that the table is reset
        const newTableInnerHTML = await table.getAttribute('innerHTML');
        assert.strictEqual(oldTableInnerHTML, newTableInnerHTML);
    });

    // it ('should copy the selected cells to clipboard', async function(){
    //     // Get the first table
    //     const table = tables[0];
    
    //     // Simulate the selection of cells
    //     let startCell = await table.findElement(By.css('tr:nth-child(1) td:nth-child(3)'));
    //     let endCell = await table.findElement(By.css('tr:nth-child(3) td:nth-child(5)'));
    //     await driver.actions()
    //         .move({origin: startCell}).press()
    //         .move({origin: endCell}).release()
    //         .perform();

    //     // Press ctrl + c
    //     await driver.actions().keyDown(Key.CONTROL).sendKeys('c').keyUp(Key.CONTROL).perform();

    //     // Get the clipboard content
    //     const clipboardContent = await driver.executeScript('return navigator.clipboard.readText()');
    //     console.log(clipboardContent);

    //     // the clipboard content should be matched with the expression 
    //     // '((\d+\t)+\n(\d+\t)+\n(\d+\t)+\n)+'
    //     assert.strictEqual(clipboardContent.match(/((\d+\t)+\n(\d+\t)+\n(\d+\t)+\n)+/g)[0], clipboardContent);
    //     // '77\t46\t32\t\n49\t0\t10\t\n39\t37\t58\t\n'
        
    // });
});


