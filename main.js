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
        const checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-row${cell.parentElement.rowIndex - 1}`);
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
        const checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-row${cell.parentElement.rowIndex - 1}`);
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

const coloursMap = {
    '#ebe052': 'yellow',
    '#d5e6ed': 'blue',
    '#9bd49e': 'green',
    'white': 'white'
};
