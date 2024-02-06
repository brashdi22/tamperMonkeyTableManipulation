// setTimeout(function() {
//     'use strict';

//     // This try-catch block is used to catch errors when the script is injected directly
//     // into the page (during testing) rather than using Tampermonkey.  
//     try{
//         // Get the CSS text from the imported CSS file
//         const styleSheet = GM_getResourceText("IMPORTED_CSS");

//         // Add the stylesheet to the page
//         GM_addStyle(styleSheet);
        
//     } catch (e) {console.log(e);}

//     // Add ONNX Runtime Web script to the page
//     const ortScript = document.createElement('script');
//     ortScript.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
//     document.head.appendChild(ortScript);

//     // Add chart.js to the page
//     const chartjsScript = document.createElement('script');
//     chartjsScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
//     document.head.appendChild(chartjsScript);

//     // Retrieve the tables from the page
//     const tables = document.getElementsByTagName("table");
//     let tableObjects = [];

//     // Create an instance of TableObj for each table
//     Array.from(tables).forEach(table => tableObjects.push(new TableObj(table)));


//     // Define the custom toolbar element using the TableObjToolbar class
//     customElements.define('table-obj-toolbar', TableObjToolbar);
    
//     // Create the toolbar and add to the page
//     const toolbar = document.createElement('table-obj-toolbar');
//     toolbar.id = 'TableObjToolbar';
//     document.body.appendChild(toolbar);


//     // Add an event listener to copy the selected cells to the clipboard
//     document.addEventListener('keydown', (event) => {
//         if (event.ctrlKey && event.key === 'c') {
//             if (document.activeElement.closest('.lib-tabl'))
//                 copySelectedCellsAsTSV();
//             else
//                 document.execCommand('copy');
//         }
//     });
    
//     // Create a promise to load the onnx model(column data type classifier) after 
//     // the ONNX Runtime Web script has loaded.
//     classifierPromise = new Promise((resolve, reject) => {
//         ortScript.onload = async function() {
//             // Fetch the ONNX model from the userscripts resources
//             const modelUrl = GM_getResourceURL("ONNX_MODEL");
//             const response = await fetch(modelUrl);

//             // Create a buffer for the model file
//             const onnxFileBuffer = await response.arrayBuffer();

//             // Use the buffer to create an ONNX Runtime Web session (this is the classifier)
//             const session = await ort.InferenceSession.create(onnxFileBuffer)

//             resolve(session);
//         };
    
//         ortScript.onerror = function() {
//             reject("Script failed to load");
//         };
//     });

// }, 1);


// setTimeout(function() {
//     let somethingChanged = false;
//     let mainCalled = false;
//     // Select the target table to observe for mutations
//     targetTable = document.getElementsByTagName("table")[0];

//     // // wait for 1 second then check if something changed
//     // setTimeout(function() {
//     //     if (somethingChanged) {
//     //         console.log('Something changed');
//     //     }
//     // }, 1000);

//     // Debounce function to delay execution of main until after a delay of no changes
//     let debounceTimeout = null;
//     const debounceDelay = 1000; // Delay in milliseconds, adjust as needed

//     function debounceMainCall() {
//         if (debounceTimeout) clearTimeout(debounceTimeout); // Reset the timer on every call
//         debounceTimeout = setTimeout(() => {
//             main(); // Call main() after the delay period if no more mutations
//             observer.disconnect();
//         }, debounceDelay);
//     }

//     function callMainOnce(){
//         if (!mainCalled){
//             main();
//             mainCalled = true;
//         } 
//     }

//     // Set an initial delay for execution
//     const initialDelay = 1000;
//     let timeoutId = setTimeout(callMainOnce, initialDelay);

//     // Create a callback function to execute when mutations are observed
//     const callback = function(mutationsList, observer) {
//         // for (let mutation of mutationsList) {
//         //     if (mutation.type === 'childList') {
//         //         // Detects child elements being added or removed
//         //         console.log('A child node has been added or removed.');
//         //     } else if (mutation.type === 'attributes') {
//         //         // Detects changes to attributes of the table or its descendants
//         //         console.log(`The ${mutation.attributeName} attribute was modified.`);
//         //     }
//         //     debounceMainCall();
//         // }
//         clearTimeout(timeoutId);
//         timeoutId = setTimeout(callMainOnce, initialDelay);
//         // debounceMainCall();
//         // somethingChanged = true;
//     };

//     // Create an instance of MutationObserver with the callback function
//     const observer = new MutationObserver(callback);

//     // Options for the observer (which mutations to observe)
//     const config = { 
//         attributes: true, // Set to true if you want to observe attribute changes
//         childList: true, // Observe direct children additions/removals
//         subtree: true, // Observe all descendants (not just direct children)
//         attributeOldValue: true, // Include the previous value of the attribute
//         characterData: true, // Observe changes to text content or node data
//         characterDataOldValue: true // Include the previous data of the changed node
//     };

//     // Start observing the target table for configured mutations
//     if (targetTable)
//         observer.observe(targetTable, config);

// }, 2000);

setTimeout(function() {
    // Select the target table to observe for mutations
    targetTable = document.getElementsByTagName("table")[0];

    function callMainOnce(){
        main();
        observer.disconnect();     // Stop observing the target table for mutations
    }

    // Set an initial delay for execution
    const initialDelay = 1000;
    let timeoutId = setTimeout(callMainOnce, initialDelay);

    // Create a callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(callMainOnce, initialDelay);
    };

    // Create an instance of MutationObserver with the callback function
    const observer = new MutationObserver(callback);

    // Options for the observer (which mutations to observe)
    const config = { 
        attributes: true,
        childList: true,
        subtree: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true
    };

    // Start observing the target table for configured mutations
    if (targetTable)
        observer.observe(targetTable, config);

}, 1000);

function main() {
    'use strict';

    // This try-catch block is used to catch errors when the script is injected directly
    // into the page (during testing) rather than using Tampermonkey.  
    try{
        // Get the CSS text from the imported CSS file
        const styleSheet = GM_getResourceText("IMPORTED_CSS");

        // Add the stylesheet to the page
        GM_addStyle(styleSheet);
        
    } catch (e) {console.log(e);}

    // Add ONNX Runtime Web script to the page
    const ortScript = document.createElement('script');
    ortScript.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/ort.min.js';
    document.head.appendChild(ortScript);

    // Add chart.js to the page
    const chartjsScript = document.createElement('script');
    chartjsScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(chartjsScript);

    // Retrieve the tables from the page
    const tables = document.getElementsByTagName("table");
    let tableObjects = [];

    // Create an instance of TableObj for each table
    Array.from(tables).forEach(table => tableObjects.push(new TableObj(table)));


    // Define the custom toolbar element using the TableObjToolbar class
    customElements.define('table-obj-toolbar', TableObjToolbar);
    
    // Create the toolbar and add to the page
    const toolbar = document.createElement('table-obj-toolbar');
    toolbar.id = 'TableObjToolbar';
    document.body.appendChild(toolbar);


    // Add an event listener to copy the selected cells to the clipboard
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'c') {
            if (document.activeElement.closest('.lib-tabl'))
                copySelectedCellsAsTSV();
            else
                document.execCommand('copy');
        }
    });
    
    // Create a promise to load the onnx model(column data type classifier) after 
    // the ONNX Runtime Web script has loaded.
    classifierPromise = new Promise((resolve, reject) => {
        ortScript.onload = async function() {
            // Fetch the ONNX model from the userscripts resources
            const modelUrl = GM_getResourceURL("ONNX_MODEL");
            const response = await fetch(modelUrl);

            // Create a buffer for the model file
            const onnxFileBuffer = await response.arrayBuffer();

            // Use the buffer to create an ONNX Runtime Web session (this is the classifier)
            const session = await ort.InferenceSession.create(onnxFileBuffer)

            resolve(session);
        };
    
        ortScript.onerror = function() {
            reject("Script failed to load");
        };
    });

}

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

        // The id of the respective checkbox: `${table.id}-row${index}`
        // Get the checkbox and uncheck it
        const checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-row${cell.parentElement.rowIndex - 2}`);
        checkbox.checked = false;
    });

    // Hide the selected columns
    const columns = document.querySelectorAll('table thead tr th.selectedTableObjCell');
    columns.forEach(cell => {
        hideCol(cell);

        // The id of the respective checkbox: `${table.id}-col${index}`
        // Get the checkbox and uncheck it
        const checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-col${cell.cellIndex}`);
        checkbox.checked = false;
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

        // The id of the respective checkbox: `${table.id}-row${index}`
        // Get the checkbox and check it
        const checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-row${cell.parentElement.rowIndex - 2}`);
        checkbox.checked = true;
    });

    // Show the hidden columns
    const columns = document.querySelectorAll('table thead tr th.hiddenColumn');
    columns.forEach(cell => {
        showCol(cell);

        // The id of the respective checkbox: `${table.id}-col${index}`
        // Get the checkbox and check it
        const checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-col${cell.cellIndex}`);
        checkbox.checked = true;
    });
}

/**
 * Hide a column given the header.
 * @param {HTMLTableCellElement} cell the header of the column to hide
 */
function hideCol(cell){
    cell.classList.add('hiddenColumn');
    const index = cell.cellIndex;
    const table = cell.parentElement.parentElement.parentElement; // table -> thead -> tr -> th
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        // This takes into account rows with a colspan
        try{
            row.cells[index].style.display = 'none';
        } catch (e) {}
    });
}

/**
 * Show a column given the header.
 * @param {HTMLTableCellElement} cell the header of the column to show
 */
function showCol(cell){
    cell.classList.remove('hiddenColumn');
    const index = cell.cellIndex;
    const table = cell.parentElement.parentElement.parentElement; // table -> thead -> tr -> th
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        try{
            row.cells[index].style.display = '';
        } catch (e) {}
    });
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
    const cells = document.querySelectorAll('table tbody td:not(:first-child), table thead tr:not(:first-child) th:not(:first-child)');
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

    // Get the minimum and maximum row and column index of the selected cells
    const minRowIndex = Math.min(...selectedCells.map(cell => cell.parentNode.rowIndex));
    const maxRowIndex = Math.max(...selectedCells.map(cell => cell.parentNode.rowIndex));
    const minColIndex = Math.min(...selectedCells.map(cell => cell.cellIndex));
    const maxColIndex = Math.max(...selectedCells.map(cell => cell.cellIndex));

    // Create a 2D array with empty strings
    const rows = Array.from({ length: maxRowIndex - minRowIndex + 1 }, () => Array(maxColIndex - minColIndex + 1).fill(''));

    // Put the text content of the selected cells in the 2D array
    for (const cell of selectedCells) {
        rows[cell.parentNode.rowIndex - minRowIndex][cell.cellIndex - minColIndex] = cell.textContent.replace(/[\n\t]/g, "");
    }

    // Convert the 2D array to TSV format (Tab-Separated Values)
    const textToCopy = rows.map(row => row.join('\t')).join('\n');

    // Use the Clipboard API to copy the text to the clipboard
    navigator.clipboard.writeText(textToCopy)
        .catch(err => console.error('Error copying text: ', err));                   
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
 * @param {Array<string>} column the column to analyze
 * @returns {Array<Number>} an array of 12 features
*/
function analyzeColumn(column) {
    let dataCells = column.slice(1, column.length);
    
    // Apply the ratio calculation to each cell and then find the average
    let avgTextToNumberRatio = dataCells.map(textToNumberRatio)
                                        .reduce((a, b) => a + b, 0) / dataCells.length;

    // Ratio of number of unique values to total number of values
    let uniqueValues = new Set(dataCells).size;
    let uniqueToTotalRatio = uniqueValues / dataCells.length;

    // Convert dataCells to numeric where possible
    let numericColumn = dataCells.map(cell => parseFloat(cell)).filter(cell => !isNaN(cell));

    // Calculate the percentage of non-NaN values
    let percentageNonNaN = numericColumn.length / dataCells.length * 100;

    // Initialize default values
    let minVal, maxVal, meanVal, medianVal, stdVal, minStrLength, maxStrLength, meanStrLength, medianStrLength, stdStrLength;

    if (percentageNonNaN >= 80) {
        // Numeric calculations
        minVal = Math.min(...numericColumn);
        maxVal = Math.max(...numericColumn);
        meanVal = numericColumn.reduce((a, b) => a + b, 0) / numericColumn.length;

        let sortedNumeric = [...numericColumn].sort((a, b) => a - b);
        let mid = Math.floor(sortedNumeric.length / 2);
        medianVal = sortedNumeric.length % 2 !== 0 ? sortedNumeric[mid] : (sortedNumeric[mid - 1] + sortedNumeric[mid]) / 2;
        
        stdVal = Math.sqrt(numericColumn.map(val => (val - meanVal) ** 2).reduce((a, b) => a + b, 0) / (numericColumn.length-1));
        minStrLength = maxStrLength = meanStrLength = medianStrLength = stdStrLength = 0;
    } else {
        // String length calculations for non-numeric data
        minVal = maxVal = meanVal = medianVal = stdVal = 0;
        let strLengths = dataCells.map(cell => cell.toString().length);
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
 * This function classifies the given column and returns the predicted data type.
 * @param {Array<string>} column the column to classify
 * @returns {String} the predicted data type
*/
async function classifyColumn(column) {
    session = await classifierPromise;
    // Convert the column to a Float32Array to meet the input requirements of the model
    const features = Float32Array.from(analyzeColumn(column));

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
async function getColumnsToPlot(){
    const columns = document.querySelectorAll('table thead tr:nth-child(2) th.selectedTableObjCell');

    let col1Header, col2Header;
    let col1ContentArray = [], col2ContentArray = [];

    if (columns.length === 0){
        const temp = getSelectedCellsAsColumns();
        if (!temp) return;
        [col1Header, col1ContentArray, col2Header, col2ContentArray] = temp;
    }
    else {
        let col1, col2;
        const table = columns[0].parentElement.parentElement.parentElement; // table -> thead -> tr -> th
    
        if (columns.length === 1){
            col1 = columns[0].cellIndex;
            col2 = null;
        }
        else {
            col1 = columns[0].cellIndex;
            col2 = columns[1].cellIndex;
        }
        
        table.querySelectorAll(`tbody td:nth-child(${col1 + 1})`).forEach(cell => {
            col1ContentArray.push(cell.textContent);
        });

        if (col2){
            table.querySelectorAll(`tbody td:nth-child(${col2 + 1})`).forEach(cell => {
                col2ContentArray.push(cell.textContent);
            });
            col2Header = table.rows[1].cells[col2].textContent;
        }
        col1Header = table.rows[1].cells[col1].textContent;
    }
    
    const col1DataType = await classifyColumn(col1ContentArray);

    if (typeof col2Header === 'undefined')
        return [[col1Header, col1DataType, col1ContentArray],
                 null];
    
    const col2DataType = await classifyColumn(col2ContentArray);

    return [[col1Header, col1DataType, col1ContentArray],
            [col2Header, col2DataType, col2ContentArray]]; 
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
function getSelectedCellsAsColumns(){
    const selectedCells = Array.from(document.querySelectorAll('.selectedTableObjCell'));
    if (selectedCells.length === 0) return;

    const table = selectedCells[0].parentElement.parentElement.parentElement; // table -> tbody -> tr -> td

    // Get the index of the first column. This is the lowest index of the selected cells
    const col1Index = selectedCells.reduce((minIndex, cell) => Math.min(minIndex, cell.cellIndex), Infinity);

    // Get the selected cells in the first column
    const col1Cells = selectedCells.filter(cell => cell.cellIndex === col1Index);
    const col1ContentArray = col1Cells.map(cell => cell.textContent);

    // Get the header cell of the first column
    const col1Header = table.rows[1].cells[col1Index].textContent;

    // Get the first cell that is not in the same column
    const col2Index = selectedCells
        .filter(cell => cell.cellIndex !== col1Index)
        .reduce((minIndex, cell) => Math.min(minIndex, cell.cellIndex), Infinity);

    if (col2Index === Infinity){
        return [col1Header, col1ContentArray, undefined, undefined];
    }
    else {
        // Get the selected cells in the second column that are in the same row as the selected cells in the first column
        const col2ContentArray = [];
        col1Cells.forEach(cell1 => {
            const cell2 = table.rows[cell1.parentElement.rowIndex].cells[col2Index];
            col2ContentArray.push(cell2.textContent);
        });

        // Get the header cell of the second column
        const col2Header = table.rows[1].cells[col2Index].textContent;

        if (col1Index > col2Index)
            return [col2Header, col2ContentArray, col1Header, col1ContentArray];
        else
            return [col1Header, col1ContentArray, col2Header, col2ContentArray];
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

function updateSortArrows(thead, columnIndex, isAscending){
    // Get the cells in the header
    const cells = Array.from(thead.rows[thead.rows.length - 1].cells);    
    
    // Get the sort button inside the clicked header
    const sortButton = cells[columnIndex].querySelector('.sortButton');
    if (isAscending)        // Set the sort button to the ascending state
        sortButton.innerHTML = '<span class="arrow" style="transform: rotate(-90deg); display: block;">&gt;</span>';
    else                    // set the sort button to the descending state
        sortButton.innerHTML = '<span class="arrow" style="transform: rotate(-90deg); display: block;">&lt;</span>';

    // Remove the clicked cell from the array then set the sort button to the default state
    cells.splice(columnIndex, 1);
    cells.forEach(cell => {
        const sortButton = cell.querySelector('.sortButton');
        if (sortButton)
            sortButton.innerHTML = `
            <span class="arrow" style="transform: rotate(-90deg); display: block;">&gt;</span>
            <span class="arrow" style="transform: rotate(-90deg); display: block;">&lt;</span>`;

        cell.setAttribute('TableObj-col-sort-asc', 'true');
    });
}

/** 
 * Sort the table by the selected column
 * 
 * @param {HTMLTableElement} table the table to sort
 * @param {Number} columnIndex the index of the column to sort by
*/
function sortTableByColumn(table, columnIndex) {
    // Get the sort direction from the header
    const header = table.tHead.rows[table.tHead.rows.length - 1].cells[columnIndex];
    ascending = toggleSortDirection(header);
    updateSortArrows(table.tHead, columnIndex, ascending)

    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    // This function compares two rows based on the content of the selected column
    const compareFunction = (rowA, rowB) => {
        const cellA = rowA.cells[columnIndex].textContent.trim();
        const cellB = rowB.cells[columnIndex].textContent.trim();
        let valueA, valueB;

        if (!isNaN(cellA) && !isNaN(cellB)){  // Both cells contain numbers
            valueA = +cellA;
            valueB = +cellB;
        }
        else {
            // Attempt to convert cell content to a date
            let dateA = new Date(cellA);
            let dateB = new Date(cellB);

            // Check if both dates are valid
            let isDateAValid = !isNaN(dateA.getTime());
            let isDateBValid = !isNaN(dateB.getTime());

            if (isDateAValid && isDateBValid) {
                valueA = dateA;
                valueB = dateB;
            } else {
                valueA = cellA.toLowerCase();
                valueB = cellB.toLowerCase();
            }
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
}