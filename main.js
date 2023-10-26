class TableObj {
    constructor(tableElem){
        this.table = tableElem;
    
        this.tbody = this.table.tBodies[0];
        this.thead = this.table.tHead;

        if (this.thead === null)
            this.createThead();

        this.addCellToSelectRows();
        
        // this.table.className = "";
        this.table.classList.add("lib-tabl");

        this.mouseDown = false;
        this.startCell = null;
        this.endCell = null;
        this.OldEndCell = null;
        this.mouseDownH = false;
        this.mouseDownR = false;

        this.scrollInterval = null;

        this.addEventListeners();
    }

    // Let the first row of the 'tbody' be the 'thead' if the table
    // does not have a 'thead'.
    createThead(){
        const headerRow = this.table.rows[0];
        const thead = document.createElement("thead");
        this.table.insertBefore(thead, this.tbody);
        thead.appendChild(headerRow.cloneNode(true));
        this.tbody.removeChild(this.tbody.rows[0]);
        this.thead = thead;
    }

    addCellToSelectRows(){
        const th = document.createElement("th");
        th.textContent = "";
        this.thead.rows[0].insertBefore(th, this.thead.rows[0].firstElementChild);

        const rows = Array.from(this.tbody.rows);
        rows.forEach(row => {
            const cell = row.insertCell(0);
            cell.textContent = "\t";
        });
        
    }

    // Function to highlight selected cells
    selectCells() {
        if (!this.startCell || !this.endCell) return;

        const rows = this.tbody.rows;

        // cell.parentElement.rowIndex returns the row index within the whole table.
        // We need the index within the tbody, so we subtract 1.
        const minRow = Math.min(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex) - 1;
        const maxRow = Math.max(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex) - 1;
        const minCol = Math.min(this.startCell.cellIndex, this.endCell.cellIndex);
        const maxCol = Math.max(this.startCell.cellIndex, this.endCell.cellIndex);

        const selectedCells = this.tbody.querySelectorAll('.selected');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            // const rowIndex = cell.parentElement.rowIndex;
            // const columnIndex = cell.cellIndex;
            // if (rowIndex < minRow || rowIndex > maxRow 
            //     || columnIndex < minCol || columnIndex > maxCol){
            //         cell.classList.remove('selected');
            //     }
        });

        // Loop through rows
        for (let i = minRow; i <= maxRow; i++) {
            const cells = rows[i].getElementsByTagName("td");

            // Loop through cells in the row
            for (let j = minCol; j < maxCol + 1; j++) {
                const cell = cells[j];
                cell.classList.add("selected");
            }
        }
    }

    selectColumns() {
        if (!this.startCell || !this.endCell) return;

        const minCol = Math.min(this.startCell.cellIndex, this.endCell.cellIndex);
        const maxCol = Math.max(this.startCell.cellIndex, this.endCell.cellIndex);

        if (minCol === 0){
            for (let i = 0; i < this.table.rows.length; i++){
                this.selectRow(i);
            } 
            return;
        }
            

        const selectedHeaders = this.thead.querySelectorAll('.selected');
        selectedHeaders.forEach(header => {
            const columnIndex = header.cellIndex;
            if (columnIndex < minCol || columnIndex > maxCol)
                this.deselectColumn(columnIndex);
        });

        const headers = Array.from(this.thead.getElementsByTagName("th"));
        for (let i = minCol; i < maxCol + 1; i++){
            const columnIndex = headers.indexOf(headers[i]);
            this.selectColumn(columnIndex);
        }
    }

    selectRows() {
        if (!this.startCell || !this.endCell) return;

        const minRow = Math.min(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex);
        const maxRow = Math.max(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex);

        const selectedRows = this.tbody.querySelectorAll("td:nth-child(1).selected");
        
        selectedRows.forEach(cell => {
            const rowIndex = cell.parentElement.rowIndex;
            if (rowIndex < minRow || rowIndex > maxRow)
                this.deselectRow(rowIndex);
                
        });

        for (let i = minRow; i <= maxRow; i++){
            this.selectRow(i);
        }
    }

    selectRow(rowIndex) {
        const row = this.table.rows[rowIndex];
        for (let i = 0; i < row.cells.length; i++) {
            row.cells[i].classList.add("selected");
        }
    }

    deselectRow(rowIndex) {
        const row = this.table.rows[rowIndex];
        for (let i = 0; i < row.cells.length; i++) {
            row.cells[i].classList.remove("selected");
        }
    }

    selectColumn(columnIndex) {
        this.thead.getElementsByTagName("th")[columnIndex].classList.add("selected");
        const rows = this.tbody.getElementsByTagName("tr");
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].getElementsByTagName("td")[columnIndex];
            cell.classList.add("selected");
        }
    }

    deselectColumn(columnIndex) {
        this.thead.getElementsByTagName("th")[columnIndex].classList.remove("selected");
        const rows = this.tbody.getElementsByTagName("tr");
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].getElementsByTagName("td")[columnIndex];
            if (cell) {
                cell.classList.remove("selected");
            }
        }
    }

    findClosestCell(x, y) {
        const rows = this.findClosestRow(y, Array.from(this.tbody.rows));
        const cells = Array.from(rows[0].cells);
        return this.findClosestCol(x, cells);
    }

    findClosestRow(y, rows){
        while (rows.length > 1){
            // Vertical distance from the cursor to the top row.
            const row1 = rows[0];
            const row1Bounds = row1.getBoundingClientRect();
            // This if-statement takes into account the rows of different heights.
            if (y >= row1Bounds.top && y <= row1Bounds.bottom){
                rows = rows.slice(0, 1);
                break;
            }
            const d1 = Math.abs(row1Bounds.top - y);

            // Vertical distance from the cursor to the bottom row.
            const row2 = rows[rows.length - 1];
            const row2Bounds = row2.getBoundingClientRect();
            if (y >= row2Bounds.top && y <= row2Bounds.bottom){
                rows = rows.slice(rows.length - 1, rows.length);
                break;
            }
            const d2 = Math.abs(row2Bounds.bottom - y);


            if (d1 <= d2)
                rows = rows.slice(0, Math.ceil(rows.length/2));
            else
                rows = rows.slice(Math.floor(rows.length/2), rows.length + 1);
        }
        return rows;
    }

    findClosestCol(x, cells){
        while (cells.length > 1){
            // Horizontal distance from the cursor to the leftmost cell.
            const cell1 = cells[0];
            const cell1Bounds = cell1.getBoundingClientRect();
            // This if-statement takes into account the cells of different widths.
            if (x >= cell1Bounds.left && x <= cell1Bounds.right){
                cells = cells.slice(0, 1);
                break;
            }
            const d1 = Math.abs(cell1Bounds.left - x);

            // Horizontal distance from the cursor to rightPtr the rightmost cell.
            const cell2 = cells[cells.length - 1];
            const cell2Bounds = cell2.getBoundingClientRect();
            if (x >= cell2Bounds.left && x <= cell2Bounds.right){
                cells = cells.slice(cells.length - 1, cells.length);
                break;
            }
            const d2 = Math.abs(cell2Bounds.right - x);

            if (d1 <= d2)
                cells = cells.slice(0, Math.ceil(cells.length/2));
            else
                cells = cells.slice(Math.floor(cells.length/2), cells.length + 1);
        }
        return cells[0];
    }

    // In case the table cell contains a nested HTML element.
    findParentCell(element, tag){
        if (element.tagName === tag) return element;
        return this.findParentCell(element.parentNode, tag);
    }

    addEventListeners() {
        // Select columns.
        this.thead.addEventListener("mousedown", (event) => {
            this.tbody.querySelectorAll('.selected').forEach(cell =>
                cell.classList.remove('selected'));
            this.mouseDownH = true;
            this.startCell = this.findParentCell(event.target, "TH");
            this.endCell = this.startCell;
            this.selectColumns();
        });

        // Select cells.
        this.tbody.addEventListener("mousedown", (event) => {
            this.table.querySelectorAll('.selected').forEach(cell =>
                                                            cell.classList.remove('selected'));
            
            this.startCell = this.findParentCell(event.target, "TD");
            this.endCell = this.startCell;
            if (this.endCell.cellIndex === 0){
                this.mouseDownR = true;
                this.selectRows();
            }
            else{
                this.mouseDown = true;
                this.selectCells();
            }
        });
        // window.addEventListener("mousemove", handleMousemove);

        // Track mouse movement to select cells/columns.
        document.addEventListener("mousemove", (event) => {
            if (!this.mouseDownH && !this.mouseDownR && !this.mouseDown) return;
            // if (this.OldEndCell === this.endCell) return;
            
            if (this.mouseDownH) {
                if (event.target.closest("thead") !== this.thead){
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findClosestCol(event.clientX, Array.from(this.thead.rows[0].cells));
                } 
                else {
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findParentCell(event.target, "TH");
                }
                    

                this.selectColumns();
            }

            else if (this.mouseDownR) {
                if (event.target.closest("tbody") !== this.tbody){
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findClosestRow(event.clientY, Array.from(this.tbody.rows))[0].cells[0];
                }
                    
                else{
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findParentCell(event.target, "TD");
                }
                    
                this.selectRows();
            }
            
            else if (this.mouseDown) {
                if (event.target.closest("tbody") !== this.tbody){
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findClosestCell(event.clientX, event.clientY);
                }     
                else{
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findParentCell(event.target, "TD");
                }
                    
                this.selectCells();
            }
        });

        // Stop selecting when the mouse is released.
        document.addEventListener("mouseup", () => {
            this.mouseDown = false;
            this.mouseDownH = false;
            this.mouseDownR = false;
            this.startCell = null;
            this.endCell = null;
            // window.removeEventListener("mousemove", handleMousemove);
        });

        // Deselect when clicked outside the table.
        document.addEventListener("mousedown", (event) => {
            if (!this.table.contains(event.target)
                && event.target !== document.documentElement) {
                this.table.querySelectorAll('.selected').forEach(cell =>
                                                                 cell.classList.remove('selected'));
            }
        });
    }
}

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

