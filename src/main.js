setTimeout(function() {
    'use strict';

    // Add the style sheet to the page
    const styleSheet = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(styleSheet);

    // Load the Chart.js library
    loadChartJSScript();

    // Load Luxon library
    loadLuxonScript();

    // Load the ONNX Runtime Web library
    const ortScript = GM_addElement('script', {src: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/ort.min.js'});
    
    // Load the ONNX model using the ONNX Runtime Web library
    classifierPromise = loadOnnxModel(ortScript);


    // Define the custom elements
    customElements.define('table-obj-toolbar', TableObjToolbar);
    customElements.define('chart-container', ChartContainer);
    
    // Create the toolbar and add to the page
    const toolbar = document.createElement('table-obj-toolbar');
    toolbar.id = 'TableObjToolbar';
    document.body.appendChild(toolbar);


    addDocumentKeydownListener();
    addDocumentClickListener();

    // To be accessed by Selenium during testing
    document.tableObjects = tableObjects;
}, 1);

let tableObjects = new Map();
let classifierPromise;
const coloursMap = {
    '#ebe052': 'yellow',
    '#d5e6ed': 'blue',
    '#9bd49e': 'green',
    'white': 'white'
};

/**
 * This function takes the colour as input and applies the
 * repspective class to the selected cells.
 * @param {String} colour 
 */
function highlight(colour){
    if (colour === 'white'){
        document.querySelectorAll('.selectedTableObjCell').forEach(cell => {
            cell.classList.remove('highlightedTableObjCell');
            // remove any class that ends with -highlighted
            cell.className = cell.className.replace(/\w+-highlighted/g, '');
        });
    }
    else{
        document.querySelectorAll('.selectedTableObjCell').forEach(cell => {
            cell.className = cell.className.replace(/\w+-highlighted/g, '');
            // cell.classList.remove('selectedTableObjCell');

            cell.classList.add('highlightedTableObjCell');
            cell.classList.add(`${colour}-highlighted`);
        });
    }
    
}

/**
 * Hide the selected rows and columns and update the 
 * checkboxes (to keep the UI in sync).
 */
function hideColsRows(){
    // Hide the selected rows
    const rows = document.querySelectorAll('table tbody td:nth-child(2).selectedTableObjCell');
    rows.forEach(cell => {
        hideRow(cell);

        // Get the checkbox and uncheck it
        const table = cell.parentElement.parentElement.parentElement;
        const checkBoxes = document.querySelectorAll(`#settingsMenu-${table.id} .rowCheckbox`);
        const checkbox = checkBoxes[cell.parentElement.rowIndex - table.tHead.rows.length];
        checkbox.checked = false;
    });

    // Hide the selected columns
    let columns = document.querySelectorAll('table thead tr th.selectedTableObjCell');
    columns = sortCellsByByRowDesc(columns);
    columns.forEach(cell => {
        if (cell.style.display !== 'none')
            hideCol(cell);

        // Get the checkbox and uncheck it
        const table = cell.parentElement.parentElement.parentElement;
        const virtaulCol = getTopLeftVirtualIndex(cell, tableObjects.get(table.id).inverseHeaderMapping).col;
        const checkBoxes = document.querySelectorAll(`#settingsMenu-${table.id} .columnCheckbox`);
        const checkbox = checkBoxes[virtaulCol-1];
        if (checkbox) checkbox.checked = false;
        if (!tableObjects.get(table.id).allColumnCheckboxesChecked())
            document.getElementById(`${table.id}-col0`).checked = false;
    });
}

/**
 * Show the hidden rows and columns and update the
 * checkboxes (to keep the UI in sync).
 */
function showColsRows(){
    // Show the hidden rows
    const rows = document.querySelectorAll('table tbody td:nth-child(2).hiddenRow');
    rows.forEach(cell => {
        showRow(cell);

        // Get the checkbox and uncheck it
        const table = cell.parentElement.parentElement.parentElement;
        const checkBoxes = document.querySelectorAll(`#settingsMenu-${table.id} .rowCheckbox`);
        const checkbox = checkBoxes[cell.parentElement.rowIndex - table.tHead.rows.length];
        checkbox.checked = true;
    });

    // Show the hidden columns
    let columns = document.querySelectorAll('table thead tr th.hiddenColumn');
    columns = sortCellsByByRowDesc(columns);
    columns.forEach(cell => {
        if (cell.style.display === 'none')
        showCol(cell);

        // Get the checkbox and check it
        const table = cell.parentElement.parentElement.parentElement;
        const virtaulCol = getTopLeftVirtualIndex(cell, tableObjects.get(table.id).inverseHeaderMapping).col;
        const checkBoxes = document.querySelectorAll(`#settingsMenu-${table.id} .columnCheckbox`);
        const checkbox = checkBoxes[virtaulCol-1];
        if (checkbox) checkbox.checked = true;
        if (tableObjects.get(table.id).allColumnCheckboxesChecked())
            document.getElementById(`${table.id}-col0`).checked = true;
    });
}

/**
 * Hide a column given the header.
 * @param {HTMLTableCellElement} cell the header of the column to hide
 */
function hideCol(cell){
    // Get the table object
    const tableObj = tableObjects.get(cell.parentElement.parentElement.parentElement.id);

    const cellsAboveHeader = new Set();

    const colIndex = getTopLeftVirtualIndex(cell, tableObj.inverseHeaderMapping).col;

    for (let i = cell.parentElement.rowIndex - 1; i >= 0; i--){
        const virtualIndex = JSON.stringify({ row: i, col: colIndex });
        const actualIndex = JSON.parse(tableObj.headerMapping.get(virtualIndex));
        const actualCell = tableObj.table.rows[actualIndex.row].cells[actualIndex.col];
        cellsAboveHeader.add(actualCell);
    }

    cellsAboveHeader.forEach(headerAbove => {
        if (headerAbove.colSpan > cell.colSpan){
            headerAbove.colSpan -= cell.colSpan;
        }
        else{
            headerAbove.style.display = 'none';
            headerAbove.classList.add('hiddenColumn');
        }
    });

    cell.classList.add('hiddenColumn');

    // Get the cells under the header
    const [headers, cells] = tableObj.getCellsUnderHeader(cell, tableObj.headerMapping, tableObj.inverseHeaderMapping);
    headers.forEach(cell => {
        cell.classList.add('hiddenColumn');
        cell.style.display = 'none';
    });
    cells.forEach(cell => {
        cell.style.display = 'none';
    });

    tableObj.headerMapping = tableObj.mapTableHeaderIndices();
    tableObj.inverseHeaderMapping = tableObj.invertMap(tableObj.headerMapping);
}

/**
 * Show a column given the header.
 * @param {HTMLTableCellElement} cell the header of the column to show
 */
function showCol(cell){
    const tableObj = tableObjects.get(cell.parentElement.parentElement.parentElement.id);
    cell.classList.remove('hiddenColumn');

    // use the virtual header mapping to get the cells above the header
    // then for each cell, get the column index and the row index, get the 
    // colspan, then use the index to get the actual cell in the actual thead 
    // and set its colspan to the virtual colspan
    const cellsAboveHeader = new Set();
    const colIndex = getTopLeftVirtualIndex(cell, tableObj.inverseHeaderMapping).col;
    for (let i = cell.parentElement.rowIndex - 1; i >= 0; i--){
        const virtualIndex = JSON.stringify({ row: i, col: colIndex });
        const actualIndex = tableObj.headerMapping.get(virtualIndex);
        cellsAboveHeader.add(actualIndex);
    }

    cellsAboveHeader.forEach(headerAbove => {
        headerAbove = JSON.parse(headerAbove);
        const actualCell = tableObj.table.rows[headerAbove.row].cells[headerAbove.col];

        if (actualCell.style.display === 'none'){
            actualCell.classList.remove('hiddenColumn');
            actualCell.style.display = '';
        }
        else
            actualCell.colSpan += cell.colSpan;
    });
    
    const [headers, cells] = tableObj.getCellsUnderHeader(cell, tableObj.headerMapping, tableObj.inverseHeaderMapping);
    [...headers, ...cells].forEach(cell => {
        cell.style.display = '';
    });
    
    tableObj.headerMapping = tableObj.mapTableHeaderIndices();
    tableObj.inverseHeaderMapping = tableObj.invertMap(tableObj.headerMapping);
}

/**
 * Hide a row given its rowSelector.
 * @param {HTMLTableCellElement} cell the rowSelector of the row to hide
 */
function hideRow(cell){
    cell.parentElement.style.display = 'none';
    cell.classList.add('hiddenRow');
}

/**
 * Show a row given its rowSelector.
 * @param {HTMLTableCellElement} cell the rowSelector of the row to show
 */
function showRow(cell){
    cell.parentElement.style.display = '';
    cell.classList.remove('hiddenRow');
}

/** 
 * This function is used to toggle the magnify-on-hover class on the cells.
 * @param {Boolean} magnify true to add the class, false to remove it.
*/
function toggleMagnify(magnify){
    // Get all cells in all tables except the cells in the first row in the thead and the first cell in each row in the table
    const cells = document.querySelectorAll('tbody tr td:not(:first-child), tr:not(:first-child) th');
    if (magnify){
        cells.forEach(cell => {
            cell.classList.add('magnify-on-hover');
        });
    }
    else{
        cells.forEach(cell => {
            cell.classList.remove('magnify-on-hover');
        });
    }
}

/** 
 * This function copies the text content of the selected cells to the clipboard.
 * The text is copied as text where each seperatede from the other by a new line(\n).
*/
function copySelectedCellsAsText() {
    // Get the text content of each selected cell and join them into a string
    const textToCopy = Array.from(document.querySelectorAll('.selectedTableObjCell'))
        .map(cell => cell.textContent)
        .join('\n');

    // Use the Clipboard API to copy the text to the clipboard
    navigator.clipboard.writeText(textToCopy)
        .catch(err => console.error('Error copying text: ', err));
}

/** 
 * This function copies the text content of the selected cells to the clipboard.
 * The text is copied as TSV (Tab-Separated Values) where each cell is separated
 *  from the other by a tab(\t) and where rows are separateed by new lines(\n).
*/
function copySelectedCellsAsTSV() {
    // Get the selected cells
    const selectedCells = Array.from(document.querySelectorAll('.selectedTableObjCell'));

    // Get the table object of the first selected cell
    const tableObj = tableObjects.get(selectedCells[0].parentElement.parentElement.parentElement.id);

    // Separate the selected cells into th and td
    const ths = selectedCells.filter(cell => cell.tagName === 'TH');
    const tds = selectedCells.filter(cell => cell.tagName === 'TD');

    // For each th, get the corresponding virtual columns, then find the min and max row/column
    let rows = [];
    let cols = [];
    ths.forEach(th => {
        const index = JSON.stringify({ row: th.parentElement.rowIndex, col: th.cellIndex });
        const coveredIndices = tableObj.inverseHeaderMapping.get(index);
        coveredIndices.forEach(index => {
            rows.push(JSON.parse(index).row);
            cols.push(JSON.parse(index).col);
        });
    });

    // Get the min and max row/column index of the selected cells (both th and td)
    const minRowIndex = Math.min(Math.min(...rows), Math.min(...tds.map(cell => cell.parentNode.rowIndex)));
    const maxRowIndex = Math.max(Math.max(...rows), Math.max(...tds.map(cell => cell.parentNode.rowIndex)));
    const minColIndex = Math.min(Math.min(...cols), Math.min(...tds.map(cell => cell.cellIndex)));
    const maxColIndex = Math.max(Math.max(...cols), Math.max(...tds.map(cell => cell.cellIndex)));

    // Create a 2D array with empty strings
    const clipboardArray = Array.from({ length: maxRowIndex - minRowIndex + 1 }, () => Array(maxColIndex - minColIndex + 1).fill(''));

    for (th of ths){
        // Get the top left virtual index
        const topLeftIndex = getTopLeftVirtualIndex(th, tableObj.inverseHeaderMapping);
        clipboardArray[topLeftIndex.row - minRowIndex][topLeftIndex.col - minColIndex] = th.textContent.trim();
    }
    
    // Put the text content of the selected cells in the 2D array
    for (const cell of tds) {
        clipboardArray[cell.parentNode.rowIndex - minRowIndex][cell.cellIndex - minColIndex] = cell.textContent.trim();
    }

    // Get the hidden rows and columns
    const table = selectedCells[0].parentElement.parentElement.parentElement;
    const hiddenRows = Array.from(table.querySelectorAll('tbody td.hiddenRow')).map(cell => cell.parentElement.rowIndex);
    const hiddenCols = Array.from(table.querySelectorAll('thead th.hiddenColumn'))

    // For each column in hiddenCols, get the virtual columns it is spanning over
    let virtualHiddenCols = new Set();
    hiddenCols.forEach(cell => {
        const index = JSON.stringify({ row: cell.parentElement.rowIndex, col: cell.cellIndex });
        const coveredIndices = tableObj.inverseHeaderMapping.get(index);
        coveredIndices.forEach(index => {
            virtualHiddenCols.add(JSON.parse(index).col);
        });
    });
    virtualHiddenCols = Array.from(virtualHiddenCols);
    virtualHiddenCols.sort((a, b) => a - b);

    // Exclude the hidden rows and columns from the 2D array
    for (let i = 0; i < hiddenRows.length; i++){
        clipboardArray.splice(hiddenRows[i] - minRowIndex - i, 1);
    }
    for (let i = 0; i < virtualHiddenCols.length; i++){
        clipboardArray.forEach(row => {
            row.splice(virtualHiddenCols[i] - minColIndex - i, 1);
        });
    }

    // Convert the 2D array to TSV format (Tab-Separated Values)
    const textToCopy = clipboardArray.map(row => row.join('\t')).join('\n');

    // Use the Clipboard API to copy the text to the clipboard
    navigator.clipboard.writeText(textToCopy)
        .catch(err => console.error('Error copying text: ', err));                   
}

/**
 * Given a header cell, this function finds the top left virtual index of the
 * cells covered by the header cell (in case there are cells in the thead spanning
 * over multiple rows/columns).
 * 
 * @param {HTMLTableCellElement} th the header cell
 * @param {Map} inverseHeaderMapping the inverse header mapping of the table object
 * @returns {Object} an object containing the 'row' and 'col' of the top left virtual cell
 */
function getTopLeftVirtualIndex(th, inverseHeaderMapping){
    const index = JSON.stringify({ row: th.parentElement.rowIndex, col: th.cellIndex });
    const coveredIndices = inverseHeaderMapping.get(index);

    const cols = [];
    const rows = [];
    coveredIndices.forEach(index => {
        rows.push(JSON.parse(index).row);
        cols.push(JSON.parse(index).col);
    });
    return {row: Math.min(...rows), col: Math.min(...cols)};
}

/** 
 * This functions sorts the given cells by their row index in descending order.
 * 
 * @param {HTMLTableCellElement[]} cells the cells to sort
 * @returns {HTMLTableCellElement[]} the sorted cells
*/
function sortCellsByByRowDesc(cells) {
    let sortedCells = Array.from(cells);
    sortedCells.sort((a, b) => {
        if (a.parentElement.rowIndex < b.parentElement.rowIndex) return 1;
        if (a.parentElement.rowIndex > b.parentElement.rowIndex) return -1;
        return 0;
    });
    return sortedCells;
}

/** 
 * This finds the ratio of text characters to the number of numeric characters
 * in a given cell.
 * @param {String} cell the cell to analyze
 * @returns {Number} the ratio of text characters to numeric characters
*/
function textToNumberRatio(cell) {
    cell = cell.toString();
    let textChars = [...cell].filter(c => isNaN(parseInt(c)) && /[a-zA-Z]/.test(c)).length;
    let numberChars = [...cell].filter(c => !isNaN(parseInt(c))).length;
    return numberChars > 0 ? textChars / numberChars : 0;
}

/** 
 * This function analyzes the given column and returns an array of features.
 * The features are:
 * - average text to number ratio
 * - ratio of unique values to total number of values
 * - minimum value (if numeric)
 * - maximum value (if numeric)
 * - mean value (if numeric)
 * - median value (if numeric)
 * - standard deviation (if numeric)
 * - minimum string length (if non-numeric)
 * - maximum string length (if non-numeric)
 * - mean string length (if non-numeric)
 * - median string length (if non-numeric)
 * - standard deviation of string length (if non-numeric)
 * 
 * @param {Array<string>} array the column to analyze
 * @returns {Array<Number>} an array of 12 features
*/
function analyzeArray(array) {
    // Apply the ratio calculation to each cell and then find the average
    let avgTextToNumberRatio = array.map(textToNumberRatio)
                                        .reduce((a, b) => a + b, 0) / array.length;

    // Ratio of number of unique values to total number of values
    let uniqueValues = new Set(array).size;
    let uniqueToTotalRatio = uniqueValues / array.length;

    // Convert dataCells to numeric where possible
    let numericColumn = array.map(cell => parseFloat(cell)).filter(cell => !isNaN(cell));

    // Calculate the percentage of non-NaN values
    let percentageNonNaN = numericColumn.length / array.length * 100;

    // Initialize default values
    let minVal, maxVal, meanVal, medianVal, stdVal, minStrLength, maxStrLength, meanStrLength, medianStrLength, stdStrLength;

    if (percentageNonNaN >= 80) {
        ({minVal, maxVal, meanVal, medianVal, stdVal} = getStats(numericColumn));
        minStrLength = maxStrLength = meanStrLength = medianStrLength = stdStrLength = 0;
    } else {
        // String length calculations for non-numeric data
        minVal = maxVal = meanVal = medianVal = stdVal = 0;
        let strLengths = array.map(cell => cell.toString().length);
        minStrLength = Math.min(...strLengths);
        maxStrLength = Math.max(...strLengths);
        meanStrLength = strLengths.reduce((a, b) => a + b, 0) / strLengths.length;

        let sortedStrLengths = [...strLengths].sort((a, b) => a - b);
        let mid = Math.floor(sortedStrLengths.length / 2);
        medianStrLength = sortedStrLengths.length % 2 !== 0 ? sortedStrLengths[mid] : (sortedStrLengths[mid - 1] + sortedStrLengths[mid]) / 2;
        
        stdStrLength = Math.sqrt(strLengths.map(val => (val - meanStrLength) ** 2).reduce((a, b) => a + b, 0) / strLengths.length);
    }

    return [
        avgTextToNumberRatio, uniqueToTotalRatio,
        minVal, maxVal, meanVal, medianVal, stdVal,
        minStrLength, maxStrLength, meanStrLength, medianStrLength, stdStrLength
    ];
}

/**
 * Calculate the min, max, mean, median,standard deviation, 25th percentile, 
 * and 75th percentile of an array of numbers.
 * 
 * @param {Array<Number>} numericColumn the array of numbers to analyze
 * @returns {Object} An object with the following properties:
 *  - minVal: The minimum value.
 *  - maxVal: The maximum value.
 *  - medianVal: The median value.
 *  - meanVal: The mean value.
 *  - stdVal: The standard deviation.
 *  - q1: The first quartile.
 *  - q3: The third quartile.
 */
function getStats(numericColumn){
    const minVal = Math.min(...numericColumn);
    const maxVal = Math.max(...numericColumn);
    const meanVal = numericColumn.reduce((a, b) => a + b, 0) / numericColumn.length;

    const sortedNumeric = [...numericColumn].sort((a, b) => a - b);
    const mid = Math.floor(sortedNumeric.length / 2);
    const medianVal = sortedNumeric.length % 2 !== 0 ? sortedNumeric[mid] : (sortedNumeric[mid - 1] + sortedNumeric[mid]) / 2;

    // claculate the 25th and 75th percentiles
    const q1 = sortedNumeric[Math.floor(sortedNumeric.length * 0.25)];
    const q3 = sortedNumeric[Math.floor(sortedNumeric.length * 0.75)];

    const stdVal = Math.sqrt(numericColumn.map(val => (val - meanVal) ** 2).reduce((a, b) => a + b, 0) / (numericColumn.length-1));
    return {minVal: minVal, maxVal: maxVal, medianVal: medianVal, meanVal: meanVal, stdVal: stdVal, q1: q1, q3: q3};
}

/** 
 * This function classifies the given column and returns the predicted data type.
 * @param {Array<string>} array the column to classify
 * @returns {String} the predicted data type
*/
async function classifyArray(array) {
    session = await classifierPromise;
    // Convert the array to a Float32Array to meet the input requirements of the model
    const features = Float32Array.from(analyzeArray(array));

    // Create a tensor for the input data
    const inputTensor = new ort.Tensor("float32", features, [1, features.length]); // [1, 12]

    // Create a tensor for the output data. This is needed as the model has more than one output.
    const fetches = {'output_label': new ort.Tensor("string", [''], [1])};    

    // Run the model
    const feeds = { [session.inputNames[0]]: inputTensor };
    const results = await session.run(feeds, fetches);

    // Extract and return the label from the results
    return results[session.outputNames[0]].data[0];
}

/**
 * Gets the selected columns and finds their data types.
 * 
 * @returns {Array<Array>} an array of 2 arrays. Each sub-array contains the header, data type and data of a column.
 */
async function getDataToPlot(){
    const temp = getSelectedCellsData();
    if (!temp) return;
    const [xLabel, x, yLabel, y] = temp;
    
    const col1DataType = await classifyArray(x);

    if (typeof yLabel === 'undefined')
        return [[xLabel, col1DataType, x],
                 null];
    
    const col2DataType = await classifyArray(y);

    return [[xLabel, col1DataType, x],
            [yLabel, col2DataType, y]]; 
}

/** 
 * This is used when no column headers are selected. It finds the first two
 * columns that contain selected cells and returns the selected data in 
 * first column along with the corresponding data (with same index) in the
 * second column.
 * 
 * @returns {Array<Array>} an array of 4 elements: column 1 header, column 1
 *                         content, column 2 header, column 2 content.
 */
function getSelectedCellsData(){
    let selectedCells = Array.from(document.querySelectorAll('tbody .selectedTableObjCell'))
                            .filter(cell => cell.tagName === 'TD');
    if (selectedCells.length === 0) return;

    const table = selectedCells[0].parentElement.parentElement.parentElement; // table -> tbody -> tr -> td

    // Get the number of distinct rows in the selected cells
    const distinctRows = new Set(selectedCells.map(cell => cell.parentElement.rowIndex));

    if (distinctRows.size === 1){
        // Get the tableObj instance
        const tableObj = tableObjects.get(table.id);

        // Get the headers of the selected cells
        const row1 = [];
        selectedCells.forEach(cell => {
            const cellIndex = cell.cellIndex;
            // Get the header of the selected cell and select it
            const header = tableObj.findColumnHeader(tableObj.tbody.rows[0].cells[cellIndex]);
            header.classList.add('selectedTableObjCell');

            // If the cell is not in the first 3 columns, add it to the row1 array
            if (cellIndex > 2)
                row1.push(header);
        });

        // Filter the cells that has index less than 3
        selectedCells = selectedCells.filter(cell => cell.cellIndex > 2);

        // Get the content of the selected cells
        const row1ContentArray = row1.map(cell => cell.textContent);
        const row2ContentArray = selectedCells.map(cell => cell.textContent);

        return ['row 1', row1ContentArray, 'row 2', row2ContentArray];
    }
    else if (distinctRows.size === 2){
        // Separate the selected cells into two rows
        let row1 = selectedCells.filter(cell => cell.parentElement.rowIndex === Array.from(distinctRows)[0]);
        let row2 = selectedCells.filter(cell => cell.parentElement.rowIndex === Array.from(distinctRows)[1]);

        // Filter the cells that has index less than 3
        row1 = row1.filter(cell => cell.cellIndex > 2);
        row2 = row2.filter(cell => cell.cellIndex > 2);

        // Get the content of the selected cells
        const row1ContentArray = row1.map(cell => cell.textContent);
        const row2ContentArray = row2.map(cell => cell.textContent);

        // Get the header of the selected cells
        const row1Header = row1[0].parentElement.cells[2].textContent;
        const row2Header = row2[0].parentElement.cells[2].textContent;

        return [row1Header, row1ContentArray, row2Header, row2ContentArray];
    }
    else {
        // Get the index of the first column. This is the lowest index of the selected cells
        const col1Index = selectedCells.reduce((minIndex, cell) => Math.min(minIndex, cell.cellIndex), Infinity);

        // Get the selected cells in the first column
        const col1Cells = selectedCells.filter(cell => cell.cellIndex === col1Index);
        const col1ContentArray = col1Cells.map(cell => cell.textContent);

        // Get the header cell of the first column
        const col1Header = col1Cells[0].title;

        // Get the first cell that is not in the same column
        const col2 = selectedCells
            .filter(cell => cell.cellIndex !== col1Index)
            .reduce((minCell, currentCell) => (minCell === null || currentCell.cellIndex < minCell.cellIndex) ? currentCell : minCell, null);

        if (!col2){
            return [col1Header, col1ContentArray, undefined, undefined];
        }
        else {
            // Get the selected cells in the second column that are in the same row as the selected cells in the first column
            const col2ContentArray = [];
            col1Cells.forEach(cell1 => {
                const cell2 = table.rows[cell1.parentElement.rowIndex].cells[col2.cellIndex];
                col2ContentArray.push(cell2.textContent);
            });

            // Get the header cell of the second column
            const col2Header = col2.title;

            if (col1Index > col2.cellIndex)
                return [col2Header, col2ContentArray, col1Header, col1ContentArray];
            else
                return [col1Header, col1ContentArray, col2Header, col2ContentArray];
        }
    }
}

/** 
 * Toggle the sort direction stored in the header
 * 
 * @param {HTMLTableCellElement} header the header cell to toggle
 * @returns {Boolean} true if the sort direction is ascending, false if descending
 */
function toggleSortDirection(header) {
    const isAscending = header.getAttribute('TableObj-col-sort-asc') === 'true';
    header.setAttribute('TableObj-col-sort-asc', !isAscending);
    return isAscending;
}

/**
 * 
 * @param {HTMLTableSectionElement} thead the thead of the table
 * @param {HTMLTableCellElement} header the header cell that was clicked
 * @param {boolean} isAscending a boolean indicating the sort direction
 */
function updateSortArrows(thead, header, isAscending){
    // Get the sort buttons in the thead
    const sortButtons = Array.from(thead.querySelectorAll('.sortButton'));
    
    // Get the sort button inside the clicked header
    const sortButton = header.querySelector('.sortButton');
    if (isAscending)        // Set the sort button to the ascending state
        sortButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M182.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"/></svg>';
    else                    // set the sort button to the descending state
        sortButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M182.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128z"/></svg>';

    // Remove the clicked button from the array then set the sort buttons to the default state
    sortButtons.splice(sortButtons.indexOf(sortButton), 1);
    sortButtons.forEach(sortButton => {
        sortButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>';
        sortButton.parentElement.setAttribute('TableObj-col-sort-asc', 'true');
    });
}

/** 
 * Sort the table by the selected column
 * 
 * @param {HTMLTableElement} table the table to sort
 * @param {Number} columnIndex the index of the column in the tbody to sort by
 * @param {HTMLTableCellElement} header the header cell that was clicked
*/
function sortTableByColumn(table, columnIndex, header) {
    const ascending = toggleSortDirection(header);
    updateSortArrows(table.tHead, header, ascending)

    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    // This function compares two rows based on the content of the selected column
    const compareFunction = (rowA, rowB) => {
        const dataType = header.getAttribute('TableObj-col-sort-type');
        const cellA = rowA.cells[columnIndex].textContent.trim();
        const cellB = rowB.cells[columnIndex].textContent.trim();
        let valueA, valueB;

        if (dataType === 'Numerical'){
            valueA = cellA.replace(/−/g, '-');
            valueB = cellB.replace(/−/g, '-');
            valueA = +valueA.replace(/[^0-9.-]/g, '');
            valueB = +valueB.replace(/[^0-9.-]/g, '');

            if (valueA === '' || isNaN(valueA)) valueA = -Infinity;
            if (valueB === '' || isNaN(valueB)) valueB = -Infinity;
        }
        else if (dataType === 'Date'){
            valueA = luxon.DateTime.fromISO(cellA).toISODate();
            valueB = luxon.DateTime.fromISO(cellB).toISODate();
        }
        else {
            valueA = cellA.toLowerCase();
            valueB = cellB.toLowerCase();
        }

        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    };

    // Sort rows
    const sortedRows = rows.sort(compareFunction);

    // Re-add rows to tbody
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    sortedRows.forEach(row => tbody.appendChild(row));

    // Update the settings menu
    updateRowsSettingsMenu(table);
}

/**
 * 
 * @param {Array<HTMLTableCellElement>} column cells in the column
 * @returns {String} the data type of the column
 */
async function getSortType(column){
    const ContentArray = column.map(cell => cell.textContent.trim())
                               .filter(cell => cell !== '');
    let dataType = await classifyArray(ContentArray);

    const cell1 = column[0].textContent;

    if (dataType === 'Numerical'){
        if (isNaN(cell1) && luxon.DateTime.fromISO(cell1).isValid)
            dataType = 'Date';
    } 
    else {
        if (luxon.DateTime.fromISO(cell1).isValid)
            dataType = 'Date';
        else
            dataType = 'Textual';
    }

    return dataType;
}

function updateRowsSettingsMenu(table){
    const settingsMenu = document.getElementById(`settingsMenu-${table.id}`);
    if (settingsMenu){
        const rows = Array.from(table.tBodies[0].rows);
        const rowCheckboxes = settingsMenu.querySelectorAll('.rowCheckbox');
        for (let i = 0; i < rows.length; i++){
            rowCheckboxes[i].nextElementSibling.textContent = rows[i].cells[1].textContent;
        }
    }
}

function getLiIndex(li, ul) {
    // Get all the LI elements within the UL
    const lis = Array.from(ul.querySelectorAll('li'));
    
    // Find the index of the specific LI element
    const index = lis.indexOf(li);
    
    return index;
}

/**
 * Given a table with no thead, this function counts the number of rows
 * that should be considered as headers. It does this by checking the first
 * few rows to see if they contain only TH elements.
 * 
 * @param {HTMLTableElement} table 
 * @returns {Number} sthe number of rows that should be considered as headers
 */
function countHeaderRowsWithTH(table) {
    let numRows = table.rows.length;
    let headerCount = 0;
  
    for (let i = 0; i < numRows; i++) {
        let row = table.rows[i];
        let allHeaders = true;
    
        for (let j = 0; j < row.cells.length; j++) {
            if (row.cells[j].tagName !== 'TH') {
            allHeaders = false;
            break;
            }
        }
    
        if (allHeaders)
            headerCount++;
        else
            break;
    }
    return headerCount;
}

/**
 * Given a table with no thead, this function counts the number of rows
 * that should be considered as headers. It does this by checking the first
 * few rows to see if they have colspans.
 * 
 * @param {HTMLTableElement} table 
 * @returns {Number} the number of rows that should be considered as headers
 */
function countHeaderRowsWithSpans(table) {
    let numRows = table.rows.length;
    if (numRows === 0) return 0;

    let headerRows = 1;

    for (let i = 0; i < numRows; i++) {
        let row = table.rows[i];

        // If a cell has colspan > 1, go to the next row
        for (let j = 0; j < row.cells.length; j++) {
            let cell = row.cells[j];
            let colspan = cell.hasAttribute('colspan') ? parseInt(cell.getAttribute('colspan'), 10) : 1;
            if (colspan > 1) {
                headerRows++;
                break;
            }
        }
    }

    return headerRows;
}

async function loadONNXScript() {
    const ortScript = GM_addElement('script', {src: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/ort.min.js'});
    ortScript.onload = function() {
        console.log('ONNX Runtime Web script loaded successfully');
    };
    ortScript.onerror = function() {
        console.error('Error loading ONNX Runtime Web script');
    };

    return ortScript;
}

async function loadChartJSScript() {
    const chartjsScript = GM_addElement('script', {src: 'https://cdn.jsdelivr.net/npm/chart.js'});
    chartjsScript.onload = function() {
        console.log('Chart.js script loaded successfully');
    };
    chartjsScript.onerror = function() {
        console.error('Error loading Chart.js script');
    };
}

async function loadLuxonScript() {
    const luxonScript = GM_addElement('script', {src: 'https://cdn.jsdelivr.net/npm/luxon'});
    luxonScript.onload = function() {
        console.log('Luxon script loaded successfully');
    };
    luxonScript.onerror = function() {
        console.error('Error loading Luxon script');
    };
}

async function loadOnnxModel(ortScript) {
    return new Promise((resolve, reject) => {
        // Fetch the ONNX model using GM_xmlhttpRequest
        ortScript.onload = async function() {
            console.log('ONNX Runtime Web script loaded successfully');
            GM_xmlhttpRequest({
                method: 'GET',
                url: GM_getResourceURL("ONNX_MODEL"),
                responseType: 'arraybuffer', // Important for binary files like ONNX models
                onload: async function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            const session = await ort.InferenceSession.create(response.response);
                            resolve(session);
                        } 
                        catch (error) {
                            reject(error);
                        }
                    } 
                    else {
                        reject(new Error('Failed to load ONNX model'));
                    }
                },
                onerror: function(error) {
                    reject(new Error('Error fetching ONNX model: ' + error));
                }
            });
        }
        ortScript.onerror = function() {
            reject(new Error('Script failed to load'));
        }
    });
}

/**
 * Add a document keydown event listener which calls the copying function
 * when the user presses Ctrl+C.
 */
function addDocumentKeydownListener(){
    
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'c') {
            if (document.activeElement.closest('.lib-tabl'))
                copySelectedCellsAsTSV();
            else
                document.execCommand('copy');
        }
    });
}

/** 
 * Add a document click event listener which updates the graph options if the
 * graph tab is open and the user clicks outside the toolbar and the chart container.
*/
function addDocumentClickListener(){
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#TableObjToolbar')
            && !event.target.closest('#chartContainer')){
            // Update the graphs options if the graphs tab is open
            const toolbar = document.getElementById('TableObjToolbar');
            if (!toolbar.graphOptionsHidden)
                toolbar.updateSelectedColumns();
        }
    });
    
}