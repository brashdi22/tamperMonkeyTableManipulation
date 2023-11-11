setTimeout(function() {
    'use strict';

    // Get the CSS text from the imported CSS file
    const styleSheet = GM_getResourceText("IMPORTED_CSS");

    // Add the stylesheet to the page
    GM_addStyle(styleSheet);

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
    // Get the rowSelectors
    let rows = document.querySelectorAll('table td:first-child.selectedTableObjCell');

    // Hide the selected rows
    rows.forEach(cell => {
        cell.parentElement.style.display = 'none';
        cell.classList.add('hiddenRow');
    });

    // Get the column headers
    let columns = document.querySelectorAll('table thead tr th.selectedTableObjCell');

    // Hide the selected columns
    columns.forEach(cell => {
        cell.classList.add('hiddenColumn');
        let index = cell.cellIndex;
        let table = cell.parentElement.parentElement.parentElement; // table -> thead -> tr -> th
        let rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            // This takes into account rows with a colspan
            try{
                row.cells[index].style.display = 'none';
            } catch (e) {}
        });
    });
}

function showColsRows(){
    // Get the hidden rows
    let rows = document.querySelectorAll('table td:first-child.hiddenRow');

    // Show the hidden rows
    rows.forEach(cell => {
        cell.parentElement.style.display = '';
        cell.classList.remove('hiddenRow');
    });

    // Get the hidden columns
    let columns = document.querySelectorAll('table thead tr th.hiddenColumn');

    // Show the hidden columns
    columns.forEach(cell => {
        cell.classList.remove('hiddenColumn');
        let index = cell.cellIndex;
        let table = cell.parentElement.parentElement.parentElement; // table -> thead -> tr -> th
        let rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            try{
                row.cells[index].style.display = '';
            } catch (e) {}
        });
    });
}

const coloursMap = {
    '#ebe052': 'yellow',
    '#d5e6ed': 'blue',
    '#9bd49e': 'green',
    'white': 'white'
};
