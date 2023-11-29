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
        const cell1 = await tables[0].findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
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
        const cell2 = await tables[0].findElement(By.css('tr:nth-child(3) td:nth-child(2)'));
        await cell2.click();

        // Check that the cell is highlighted yellow
        const cellColour = await cell1.getCssValue('background-color');
        assert.strictEqual(cellColour, 'rgba(250, 240, 107, 1)');
    });

    it('should change the colour of the highlighted cell correctly', async function(){
        // Simulate the selection of a cell
        const cell1 = await tables[0].findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
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
        const cell2 = await tables[0].findElement(By.css('tr:nth-child(3) td:nth-child(2)'));
        await cell2.click();

        // Check that the cell is highlighted blue
        const cellColour = await cell1.getCssValue('background-color');
        assert.strictEqual(cellColour, 'rgba(213, 230, 237, 1)');
    });

    it('should unhighlight the selected cell correctly', async function(){
        // Simulate the selection of a cell
        const cell1 = await tables[0].findElement(By.css('tr:nth-child(2) td:nth-child(2)'));
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
    
        // Simulate the selection of rows
        const startCell = await table.findElement(By.css('tr:nth-child(2) td:nth-child(1)'));
        const endCell = await table.findElement(By.css('tr:nth-child(5) td:nth-child(1)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Click the hide button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        await hideButton.click();

        // Check that the rows were hidden correctly, their style should contain 'display: none'
        const rows = await table.findElements(By.css('tr:nth-child(n+2):nth-child(-n+5)'));
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
        const startCell = await table.findElement(By.css('tr:nth-child(1) th:nth-child(2)'));
        const endCell = await table.findElement(By.css('tr:nth-child(1) th:nth-child(5)'));
        await driver.actions()
            .move({origin: startCell}).press()
            .move({origin: endCell}).release()
            .perform();

        // Click the hide button
        const toolbar = await driver.findElement(By.id('TableObjToolbar'));
        const hideButton = await driver.executeScript('return arguments[0].shadowRoot.querySelector("#hideButton")', toolbar);
        await hideButton.click();

        // Check that the columns were hidden correctly, their style should contain 'display: none'
        const columns = await table.findElements(By.css('tr th:nth-child(n+2):nth-child(-n+5)'));
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

});


