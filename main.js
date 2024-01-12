setTimeout(function() {
    'use strict';

    // This try-catch block is used to catch errors when the script is injected directly
    // into the page (during testing) rather than using Tampermonkey.  
    try{
        // Get the CSS text from the imported CSS file
        const styleSheet = GM_getResourceText("IMPORTED_CSS");

        // Add the stylesheet to the page
        GM_addStyle(styleSheet);
        
    } catch (e) {console.log(e);}

    // Retrieve the tables from the page
    const tables = document.getElementsByTagName("table");
    let tableObjects = [];

    // Create an instance of TableObj for each table
    Array.from(tables).forEach(table =>
                               tableObjects.push(new TableObj(table)));


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
}, 1);

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
        rows[cell.parentNode.rowIndex - minRowIndex][cell.cellIndex - minColIndex] = cell.textContent;
    }

    // Convert the 2D array to TSV format (Tab-Separated Values)
    const textToCopy = rows.map(row => row.join('\t')).join('\n');

    // Use the Clipboard API to copy the text to the clipboard
    navigator.clipboard.writeText(textToCopy)
        .catch(err => console.error('Error copying text: ', err));                   
}

const coloursMap = {
    '#ebe052': 'yellow',
    '#d5e6ed': 'blue',
    '#9bd49e': 'green',
    'white': 'white'
};
