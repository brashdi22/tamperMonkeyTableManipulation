setTimeout(function() {
    'use strict';

    function highlight(colour){
        if (colour === 'white'){
            document.querySelectorAll('.selected').forEach(cell => {
                cell.classList.remove('highlighted');
                // remove any class that ends with -highlighted
                cell.className = cell.className.replace(/\w+-highlighted/g, '');
            });
        }
        else{
            document.querySelectorAll('.selected').forEach(cell => {
                cell.className = cell.className.replace(/\w+-highlighted/g, '');
                // cell.classList.remove('selected');

                cell.classList.add('highlighted');
                cell.classList.add(`${colour}-highlighted`);
            });
        }
        
    }

    function createToolBar(){
        let toolbar = document.createElement('div');
        toolbar.id = 'TableObjToolbar';
    
        let button1 = document.createElement('button');
        button1.id = 'highlightButton';
        button1.innerHTML = '<i class="fas fa-highlighter"></i>';
        button1.onclick = function() {
            highlight(coloursMap[document.getElementById('highlightColour').value]);
        };
        toolbar.appendChild(button1);
    
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

        toolbar.appendChild(colourSelect);
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

    .lib-table .selected th {
        background-color: antiquewhite;
    }

    .selected {
        background-color: antiquewhite !important;
    }

    .selected.highlighted {
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
        flex-direction: row;
        align-items: center;
        gap: 2px;
        transform: translateY(-50%);
    }

    #TableObjToolbar button {
        padding: 0;
        margin: 0;
    }

    #highlightColour {
        appearance: none;
        -moz-appearance: none;
        -webkit-appearance: none;
        background: transparent;
        width: 15px;
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