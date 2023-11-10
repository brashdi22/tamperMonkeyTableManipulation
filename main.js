setTimeout(function() {
    'use strict';

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

    function createToolBar(){
        let toolbar = document.createElement('div');
        toolbar.id = 'TableObjToolbar';
    
        let highlightButton = document.createElement('button');
        highlightButton.id = 'highlightButton';
        highlightButton.innerHTML = '<i class="fas fa-highlighter"></i>';
        highlightButton.onclick = function() {
            highlight(coloursMap[document.getElementById('highlightColour').value]);
        };

        // Create a button to hide selected rows/columns
        let hideButton = document.createElement('button');
        hideButton.id = 'hideButton';
        hideButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
        hideButton.onclick = hideColsRows;

        // Create a button to show hidden rows/columns
        let showButton = document.createElement('button');
        showButton.id = 'showButton';
        showButton.innerHTML = '<i class="fas fa-eye"></i>';
        showButton.onclick = showColsRows;
    
        // Create the colour select dropdown
        let colourSelect = document.createElement('select');
        colourSelect.id = 'highlightColour';
        ['#ebe052', '#d5e6ed', '#9bd49e', 'white'].forEach(colour => {
            let option = document.createElement('option');
            option.value = colour;
            option.style.backgroundColor = colour;
            colourSelect.appendChild(option);
        });

        // Change the background color of the select menu to the selected color
        colourSelect.onchange = function() {
            this.style.backgroundColor = this.value;
        };

        // Select the first option by default
        colourSelect.selectedIndex = 0;
        colourSelect.style.backgroundColor = colourSelect.value;


        // Highlight
        let div = document.createElement('div');
        div.appendChild(highlightButton);
        div.appendChild(colourSelect);
        toolbar.appendChild(div);

        // Show/Hide
        div = document.createElement('div');
        div.appendChild(hideButton);
        div.appendChild(showButton);
        toolbar.appendChild(div);

        document.body.appendChild(toolbar);
    }

    const coloursMap = {
        '#ebe052': 'yellow',
        '#d5e6ed': 'blue',
        '#9bd49e': 'green',
        'white': 'white'
    };

    let styleSheet = `
    .lib-tabl {
        user-select: none;
    }
    .lib-table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 10px;
        user-select: none;
    }
    
    table.lib-table th {
        background-color: #f2f2f2;
        font-weight: bold;
        text-align: left;
        padding: 8px;
        border: 1px solid #ddd;
    }
    
    .lib-table td {
        padding: 8px;
        border: 1px solid #ddd;
    }

    .lib-table .selectedTableObjCell th {
        background-color: antiquewhite;
    }

    .selectedTableObjCell {
        background-color: antiquewhite !important;
    }

    .selectedTableObjCell.highlightedTableObjCell {
        background-color: #abbdc4 !important;
    }

    .yellow-highlighted {
        background-color: #faf06b !important;
    }

    .blue-highlighted {
        background-color: #d5e6ed !important;
    }

    .green-highlighted {
        background-color: #9bd49e !important;
    }

    #TableObjToolbar {
        position: fixed;
        top: 50%;
        right: 0;
        background-color: #f8f8f8;
        padding: 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        transform: translateY(-50%);
    }

    #TableObjToolbar button {
        padding: 0;
        margin: 0;
        width: 50%;
        height: 100%;
    }

    #TableObjToolbar div {
        background-color: #f8f8f8;
        margin: 2px 0px;
        width: 40px;
        height: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 2px;
    }

    #highlightColour {
        appearance: none;
        -moz-appearance: none;
        -webkit-appearance: none;
        background: transparent;
        width: 30%;
        height: 100%;
        border-radius: 5px;
    }
    `;

    // Add the stylesheet to the page
    let s = document.createElement("style");
    s.innerHTML = styleSheet;
    (document.head || document.documentElement).appendChild(s);

    // Add font awesome stylesheet to the page
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);


    // Retrieve the tables from the page
    let tables = document.getElementsByTagName("table");
    let tableObjects = [];

    // Create an instance of TableObj for each table
    Array.from(tables).forEach(table =>
                               tableObjects.push(new TableObj(table)));


    createToolBar();
}, 1);