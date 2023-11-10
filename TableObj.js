class TableObj {
    constructor(tableElem){
        this.table = tableElem;
    
        this.tbody = this.table.tBodies[0];
        this.thead = this.table.tHead;

        if (this.thead === null)
            this.createThead();

        this.addRowSelectors();
        
        // this.table.className = "";
        this.table.classList.add("lib-tabl");

        this.mouseDown = false;
        this.startCell = null;
        this.endCell = null;
        this.OldEndCell = null;
        this.mouseDownH = false;
        this.mouseDownR = false;

        this.selectedCells = [];
        this.selectedHeaders = new Array(this.thead.rows[0].cells.length).fill(false);
        this.selectedRows = [];
        this.toggleSelect = true;

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

    addRowSelectors(){
        const th = document.createElement("th");
        th.className = "rowSelector";
        th.textContent = "";
        this.thead.rows[0].insertBefore(th, this.thead.rows[0].firstElementChild);

        const rows = Array.from(this.tbody.rows);
        rows.forEach(row => {
            const cell = row.insertCell(0);
            cell.textContent = "\t";
            cell.className = "rowSelector";
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
        let minCol = Math.min(this.startCell.cellIndex, this.endCell.cellIndex);
        const maxCol = Math.max(this.startCell.cellIndex, this.endCell.cellIndex);

        // This prevents selecting the first cell of each row (you could
        // select the whole row by selecting this cell).
        minCol = Math.max(minCol, 1);


        if (this.toggleSelect){
            const selectedCells = this.tbody.querySelectorAll('.selectedTableObjCell');
            selectedCells.forEach(cell => {
                if (!this.selectedCells.includes(cell))
                cell.classList.remove('selectedTableObjCell');
            });
    
            // Loop through rows
            for (let i = minRow; i <= maxRow; i++) {
                const cells = rows[i].getElementsByTagName("td");
    
                // Loop through cells in the row
                for (let j = minCol; j < maxCol + 1; j++) {
                    cells[j].classList.add("selectedTableObjCell");
                }
            }
        } 
        else {
            for (let i = minRow; i <= maxRow; i++) {
                const cells = rows[i].getElementsByTagName("td");

                for (let j = minCol; j < maxCol + 1; j++) {
                    cells[j].classList.remove("selectedTableObjCell");
                }
            }

            this.selectedCells.forEach(cell => {
                const rowIndex = cell.parentElement.rowIndex - 1;
                const colIndex = cell.cellIndex;
                if (rowIndex < minRow || rowIndex > maxRow
                    || colIndex < minCol || colIndex > maxCol){
                        cell.classList.add('selectedTableObjCell');
                }
            });
        }
    }

    selectColumns() {
        if (!this.startCell || !this.endCell) return;

        // First header should be excluded from column selection.
        const minCol = Math.max(Math.min(this.startCell.cellIndex, this.endCell.cellIndex), 1);
        const maxCol = Math.max(this.startCell.cellIndex, this.endCell.cellIndex);            

        if (this.toggleSelect){
            for (let i = minCol; i < maxCol + 1; i++){
                const cells = this.table.querySelectorAll(`td:nth-child(${i+1}), th:nth-child(${i+1})`);
                for (let i = 0; i < cells.length; i++) {
                    cells[i].classList.add('selectedTableObjCell');
                }
            }

            const cells = this.table.querySelectorAll('.selectedTableObjCell');
            for (let i = 0; i < cells.length; i++){
                if (!this.selectedCells.includes(cells[i]) && (cells[i].cellIndex < minCol || cells[i].cellIndex > maxCol))
                    cells[i].classList.remove('selectedTableObjCell');
            }
        }
        else {
            for (let i = minCol; i < maxCol + 1; i++){
                const cells = this.table.querySelectorAll(`td:nth-child(${i+1}), th:nth-child(${i+1})`);
                for (let i = 0; i < cells.length; i++) {
                    cells[i].classList.remove('selectedTableObjCell');
                }
            }

            this.selectedCells.forEach(cell => {
                if (cell.cellIndex < minCol || cell.cellIndex > maxCol){
                    cell.classList.add('selectedTableObjCell');
                }
            });
        }      
    }

    selectRows() {
        if (!this.startCell || !this.endCell) return;

        const minRow = Math.min(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex);
        const maxRow = Math.max(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex);

        if (this.toggleSelect){    
            for (let i = minRow; i <= maxRow; i++){
                const row = this.table.rows[i];
                for (let j = 0; j < row.cells.length; j++) {
                    row.cells[j].classList.add("selectedTableObjCell");
                }
            }

            const cells = this.table.querySelectorAll('.selectedTableObjCell');
            for (let i = 0; i < cells.length; i++){
                const cell = cells[i];
                if (!this.selectedCells.includes(cell) && 
                    (cell.parentElement.rowIndex < minRow || cell.parentElement.rowIndex > maxRow)){
                        cell.classList.remove('selectedTableObjCell');
                }
            }
        }
        else {
            for (let i = minRow; i <= maxRow; i++){
                const row = this.table.rows[i];
                for (let j = 0; j < row.cells.length; j++) {
                    row.cells[j].classList.remove("selectedTableObjCell");
                }
            }

            this.selectedCells.forEach(cell => {
                if (cell.parentElement.rowIndex < minRow || cell.parentElement.rowIndex > maxRow){
                    cell.classList.add('selectedTableObjCell');
                }
            });
        }
        
    }

    selecetWholeTable(){
        if (this.toggleSelect){
            this.table.querySelectorAll('td, th').forEach(cell => {
                cell.classList.add('selectedTableObjCell');
            });
        }
        else {
            this.table.querySelectorAll('td, th').forEach(cell => {
                cell.classList.remove('selectedTableObjCell');
            });
        }
    }

    findClosestCell(x, y) {
        const rows = this.findClosestRow(y, Array.from(this.tbody.rows));
        const cells = Array.from(rows.cells);
        return this.findClosestCol(x, cells);
    }

    findClosestRow(y, rows) {
        while (rows.length > 1) {
            const midIndex = Math.floor(rows.length / 2);
            const midRow = rows[midIndex];
            const midRowBounds = midRow.getBoundingClientRect();
    
            if (y < midRowBounds.top)
                rows = rows.slice(0, midIndex);
            else if (y > midRowBounds.bottom){
                if (midIndex + 1 < rows.length) {
                    rows = rows.slice(midIndex + 1);
                } else {
                    return midRow;
                }
            }
            else {
                return midRow;
            }
        }
    
        return rows[0];
    }

    findClosestCol(x, cells) {
        while (cells.length > 1) {
            const midIndex = Math.floor(cells.length / 2);
            const midCell = cells[midIndex];
            const midCellBounds = midCell.getBoundingClientRect();
    
            if (x < midCellBounds.left)
                cells = cells.slice(0, midIndex);
            else if (x > midCellBounds.right)
                cells = cells.slice(midIndex + 1);
            else
                return midCell;
        }
    
        return cells[0];
    }

    // In case the table cell contains a nested HTML element.
    findParentCell(element, tag){
        if (element.tagName === tag) return element;
        return this.findParentCell(element.parentNode, tag);
    }

    checkAllCellsInColumnSelected(){
        let changed = false;
        for (let i = 0; i < this.selectedHeaders.length; i++){
            if (this.selectedHeaders[i]){
                const cells = this.tbody.querySelectorAll(`td:nth-child(${i+1})`);
                for (let j = 0; j < cells.length; j++) {
                    if (!cells[j].classList.contains('selectedTableObjCell')) {
                        this.selectedHeaders[i] = false;
                        this.thead.rows[0].cells[i].classList.remove('selectedTableObjCell');
                        changed = true;
                        break;
                    }
                }
            }
        }

        if (changed)
            this.selectedCells = Array.from(this.table.querySelectorAll('.selectedTableObjCell'));
    }

    checkAllCellsInRowSelected(){
        let changed = false;
        const tempArr = [];
        for (let i = 0; i < this.selectedRows.length; i++){
            const row = this.table.rows[this.selectedRows[i]];
            let selected = true;
            for (let j = 0; j < row.cells.length; j++) {
                if (!row.cells[j].classList.contains('selectedTableObjCell')) {
                    // this.selectedRows.splice(i, 1);
                    this.table.rows[this.selectedRows[i]].cells[0].classList.remove('selectedTableObjCell');
                    selected = false;
                    changed = true;
                    break;
                }
            }
            if (selected)
                tempArr.push(this.selectedRows[i]);
        }
        this.selectedRows = tempArr;

        if (changed)
            this.selectedCells = Array.from(this.table.querySelectorAll('.selectedTableObjCell'));
    }

    addEventListeners() {
        // Select columns.
        this.thead.addEventListener("mousedown", (event) => {
            if (!event.ctrlKey){
                this.table.querySelectorAll('.selectedTableObjCell').forEach(cell =>
                    cell.classList.remove('selectedTableObjCell'));
                this.selectedCells = [];
            }
            
            this.startCell = this.findParentCell(event.target, "TH");
            this.endCell = this.startCell;
            this.mouseDownH = true;

            if (this.endCell.classList.contains("selectedTableObjCell"))
                this.toggleSelect = false;
            else
                this.toggleSelect = true;

            if (this.endCell.cellIndex === 0)
                this.selecetWholeTable();
            else
                this.selectColumns();
        });

        // Select rows and cells.
        this.tbody.addEventListener("mousedown", (event) => {
            if (!event.ctrlKey){
                this.table.querySelectorAll('.selectedTableObjCell').forEach(cell =>
                    cell.classList.remove('selectedTableObjCell'));
                this.selectedCells = [];
                this.selectedRows = [];
            }
                
            this.startCell = this.findParentCell(event.target, "TD");
            this.endCell = this.startCell;

            if (this.endCell.classList.contains("selectedTableObjCell"))
                this.toggleSelect = false;
            else
                this.toggleSelect = true;

            if (this.endCell.cellIndex === 0){
                this.mouseDownR = true;
                this.selectRows();
            }
            else {
                this.mouseDown = true;
                this.selectCells();     
            }
        });
        // window.addEventListener("mousemove", handleMousemove);

        // Track mouse movement to select cells/columns.
        document.addEventListener("mousemove", (event) => {
            if (!this.mouseDownH && !this.mouseDownR && !this.mouseDown) return;
            
            if (this.mouseDownH) {
                if (event.target.closest("thead") !== this.thead){
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findClosestCol(event.clientX, Array.from(this.thead.rows[0].cells));
                } 
                else {
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findParentCell(event.target, "TH");
                }
                    
                if (this.OldEndCell === this.endCell) return;
                this.selectColumns();
            }

            else if (this.mouseDownR) {
                if (event.target.closest("tbody") !== this.tbody){
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findClosestRow(event.clientY, Array.from(this.tbody.rows)).cells[0];
                }  
                else{
                    this.OldEndCell = this.endCell;
                    this.endCell = this.findParentCell(event.target, "TD");
                }
                if (this.OldEndCell === this.endCell) return;
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

                if (this.OldEndCell === this.endCell) return;

                this.selectCells();
            }
        });

        // Stop selecting when the mouse is released.
        document.addEventListener("mouseup", () => {
            if (!this.mouseDownH && !this.mouseDownR && !this.mouseDown) return;

            // Update selected columns
            const cells = this.thead.rows[0].cells;
            for (let i = 0; i < cells.length; i++){
                this.selectedHeaders[i] = cells[i].classList.contains("selectedTableObjCell") ? true : false;
            }

            // Update selected rows
            this.selectedRows = Array.from(this.tbody.querySelectorAll("td:nth-child(1).selectedTableObjCell"))
                .map(td => td.parentNode.rowIndex);

            // Update selected cells
            this.selectedCells = Array.from(this.table.querySelectorAll('.selectedTableObjCell'));

            this.mouseDown = false;
            this.mouseDownH = false;
            this.mouseDownR = false;

            this.checkAllCellsInColumnSelected();
            this.checkAllCellsInRowSelected();
            
            // window.removeEventListener("mousemove", handleMousemove);
        });

        // Uneselect when clicked outside the table.
        document.addEventListener("mousedown", (event) => {
            if (!this.table.contains(event.target)
                && event.target !== document.documentElement
                && !event.target.closest('#TableObjToolbar')) {
                this.table.querySelectorAll('.selectedTableObjCell').forEach(cell =>
                                                                 cell.classList.remove('selectedTableObjCell'));
                
                this.selectedCells = [];
                this.selectedHeaders = new Array(this.thead.rows[0].cells.length).fill(false);
                this.selectedRows = [];
            }
        });
    }
}