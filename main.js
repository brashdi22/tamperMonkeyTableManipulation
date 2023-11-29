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
    let tables = document.getElementsByTagName("table");
    let tableObjects = [];

    // Create an instance of TableObj for each table
    Array.from(tables).forEach(table =>
                               tableObjects.push(new TableObj(table)));


    // Define the custom toolbar element using the TableObjToolbar class
    customElements.define('table-obj-toolbar', TableObjToolbar);
    
    // Create the toolbar and add to the page
    let toolbar = document.createElement('table-obj-toolbar');
    toolbar.id = 'TableObjToolbar';
    document.body.appendChild(toolbar);
}, 1);

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

function hideColsRows(){
    // Hide the selected rows
    let rows = document.querySelectorAll('table tbody td:first-child.selectedTableObjCell');
    rows.forEach(cell => {
        hideRow(cell);

        // The id of the respective checkbox: `${table.id}-row${index}`
        // Get the checkbox and uncheck it
        let checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-row${cell.parentElement.rowIndex - 1}`);
        checkbox.checked = false;
    });

    // Hide the selected columns
    let columns = document.querySelectorAll('table thead tr th.selectedTableObjCell');
    columns.forEach(cell => {
        hideCol(cell);

        // The id of the respective checkbox: `${table.id}-col${index}`
        // Get the checkbox and uncheck it
        let checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-col${cell.cellIndex}`);
        checkbox.checked = false;
    });
}

function showColsRows(){
    // Show the hidden rows
    let rows = document.querySelectorAll('table tbody td:first-child.hiddenRow');
    rows.forEach(cell => {
        showRow(cell);

        // The id of the respective checkbox: `${table.id}-row${index}`
        // Get the checkbox and check it
        let checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-row${cell.parentElement.rowIndex - 1}`);
        checkbox.checked = true;
    });

    // Show the hidden columns
    let columns = document.querySelectorAll('table thead tr th.hiddenColumn');
    columns.forEach(cell => {
        showCol(cell);

        // The id of the respective checkbox: `${table.id}-col${index}`
        // Get the checkbox and check it
        let checkbox = document.getElementById(`${cell.parentElement.parentElement.parentElement.id}-col${cell.cellIndex}`);
        checkbox.checked = true;
    });
}

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

function hideRow(cell){
    cell.parentElement.style.display = 'none';
    cell.classList.add('hiddenRow');
}

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
