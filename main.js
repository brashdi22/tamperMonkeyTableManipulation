setTimeout(function() {
    'use strict';

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
        
    `

    let s = document.createElement("style");
    s.innerHTML = styleSheet;
    (document.head || document.documentElement).appendChild(s);

    let tables = document.getElementsByTagName("table");
    let tableObjects = [];

    Array.from(tables).forEach(table =>
                               tableObjects.push(new TableObj(table)));
}, 1);