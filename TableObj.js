class TableObj {
    static tablesCount = 0;

    constructor(tableElem){
        TableObj.tablesCount++;
        this.table = tableElem;
        this.tbody = this.table.tBodies[0];
        this.thead = this.table.tHead;

        if (this.thead === null)
            this.createThead();

        this.addTableId();
        this.addRowSelectors();
        this.showColNameOnHover();
        this.addRowDragHandles();
        this.addColumnDragHandles();
        this.addTableSettingsMenu();
        
        // this.table.className = "";
        this.table.classList.add("lib-tabl");

        this.mouseDown = false;
        this.mouseDownH = false;
        this.mouseDownR = false;
        this.startCell = null;
        this.endCell = null;
        this.OldEndCell = null;

        this.selectedCells = [];
        this.selectedHeaders = new Array(this.thead.rows[0].cells.length).fill(false);
        this.selectedRows = [];

        this.toggleSelect = true;
        // this.scrollInterval = null;

        this.addEventListeners();
    }

    /**
     * Creates a thead element and copies the first row of the table to it,
     * then removes the copied row from the tbody.
     */
    createThead(){
        const headerRow = this.table.rows[0];
        const thead = document.createElement("thead");
        this.table.insertBefore(thead, this.tbody);
        thead.appendChild(headerRow.cloneNode(true));
        this.tbody.removeChild(this.tbody.rows[0]);
        this.thead = thead;
    }

    /**
     * Adds an id to the table if it does not have one.
     * 
     * The id will be 'TableObj-table{n}' where n is the number of 
     * tables rendered in the page so far.
     */
    addTableId(){
        if (!this.table.id){
            this.table.id = `TableObj-table${TableObj.tablesCount}`;
        }
    }

    /**
     * Adds an extra cell to the left of each row to be used as a row selector.
     * 
     * When this cell is selected, the whole row will be selected.
     */
    addRowSelectors(){
        const th = document.createElement("th");
        th.className = "rowSelector";
        th.textContent = "Index";
        this.thead.rows[0].insertBefore(th, this.thead.rows[0].firstElementChild);

        const rows = Array.from(this.tbody.rows);

        for (let i = 0; i < rows.length; i++){
            const cell = rows[i].insertCell(0);
            cell.textContent = i + 1;
            cell.className = "rowSelector";
        }
        
    }

    /** 
     * Adds a title attribute to each cell to show the column name on hover
    */
    showColNameOnHover(){
        const colour = this.findBackgroundColor(this.table);
        for (let i = 0; i < this.table.rows.length; i++) {
            const row = this.table.rows[i];
            for (let j = 0; j < row.cells.length; j++) {
                row.cells[j].title = this.thead.rows[0].cells[j].textContent;
            }
        }
    }

    /**
     * Adds an extra cell to the left of each row to be used as a drag handle
     * and adds event listeners to the cells.
     */
    addRowDragHandles(){
        let sourceRow;
        const th = document.createElement("th");
        this.thead.rows[0].insertBefore(th, this.thead.rows[0].firstElementChild);
        const rows = Array.from(this.tbody.rows);

        for (let i = 0; i < rows.length; i++){
            const cell = rows[i].insertCell(0);
            cell.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="10" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M96 32H32C14.3 32 0 46.3 0 64v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32zm0 160H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm0 160H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zM288 32h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32zm0 160h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm0 160h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32z"/></svg>';
            cell.className = 'rowDragHandle';

            cell.draggable = true;

            cell.addEventListener('dragstart', (event) => {
                sourceRow = event.target.parentElement;
                event.dataTransfer.setDragImage(sourceRow,event.target.getBoundingClientRect().width/2, event.target.getBoundingClientRect().height/2);
            });

            // cell.addEventListener('dragend', (event) => {
            //     sourceRow.classList.remove('selectedTableObjCell');
            // });
        }
        document.addEventListener('dragend', (event) => {sourceRow = null;});

        document.addEventListener('dragover', (event) => {
            if (!sourceRow) return;
            event.preventDefault();

            let targetRow = this.findClosestRow(event.clientY, Array.from(this.tbody.rows));

            if (sourceRow.rowIndex !== targetRow.rowIndex){
                if (targetRow.rowIndex > sourceRow.rowIndex)
                    targetRow.after(sourceRow);
                else
                    targetRow.before(sourceRow);
            }
        });
    }

    /**
     * Adds an extra cell above each column to be used as a drag handle
     * and adds event listeners to the cells.
     */
    addColumnDragHandles(){
        let sourceColumn;
        // add a new row to the thead
        const tr = document.createElement("tr");
        this.thead.insertBefore(tr, this.thead.rows[0]);
        tr.appendChild(document.createElement("th"));
        tr.appendChild(document.createElement("th"));
        const numOfCols = this.thead.rows[1].cells.length;
        for (let i = 0; i < numOfCols-2; i++){
            const cell = document.createElement("th");
            cell.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M96 288H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zM96 96H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32z"/></svg>';
            cell.className = 'columnDragHandle';
            tr.appendChild(cell);

            cell.draggable = true;

            cell.addEventListener('dragstart', (event) => {
                sourceColumn = event.target.cellIndex;
                // event.dataTransfer.setDragImage(sourceRow,event.target.getBoundingClientRect().width/2, event.target.getBoundingClientRect().height/2);
            });
        }

        document.addEventListener('dragend', (event) => {sourceColumn = null;});

        document.addEventListener('dragover', (event) => {
            if (!sourceColumn) return;
            event.preventDefault();
            const targetColumn = this.findClosestCol(event.clientX, Array.from(this.thead.rows[0].cells)).cellIndex;

            if (sourceColumn !== targetColumn && targetColumn > 1){
                const rows = this.table.rows;
                for (let i = 0; i < rows.length; i++){
                    const cell1 = rows[i].cells[sourceColumn];
                    const cell2 = rows[i].cells[targetColumn];

                    // Remove the source cell from the row
                    const removedCell = rows[i].removeChild(cell1);
                    if (targetColumn > sourceColumn)
                        cell2.after(removedCell);
                    else
                        cell2.before(removedCell);
                }
                sourceColumn = targetColumn;
            }
        });
    }

    /**
     * Adds a dropdown menu above the table to show/hide columns and rows.
     */
    addTableSettingsMenu(){
        // Add a button to be clicked to show the menu
        const settingsButton = document.createElement('button');
        settingsButton.innerHTML = 'Table Settings';
        // settingsButton.id = 'settingsButton';
        // settingsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M256 48C141.12 48 48 141.12 48 256s93.12 208 208 208 208-93.12 208-208S370.88 48 256 48zm0 384c-88.22 0-160-71.78-160-160 0-88.22 71.78-160 160-160 88.22 0 160 71.78 160 160 0 88.22-71.78 160-160 160z"/></svg>';
        settingsButton.onclick = () => {
            const menu = document.getElementById(`settingsMenu-${this.table.id}`);
            if (menu.style.display === 'none')
                menu.style.display = '';
            else
                menu.style.display = 'none';
        };

        // Add a 'ul' to hold the menu options
        const settingsMenu = document.createElement('ul');
        settingsMenu.id = `settingsMenu-${this.table.id}`;
        settingsMenu.className = 'TableObjMenu';
        settingsMenu.style.display = 'none';

        // ================================= Columns option =================================
        let li = document.createElement('li');
        li.textContent = 'Show/Hide Columns';
        let submenue = document.createElement('ul');
        submenue.className = 'TableObjSubMenu';
        let columns = Array.from(this.thead.rows[0].cells).slice(1);
        // Add an 'li' and a checkbox for the first column (whole table selector)
        let nestedLi = document.createElement('li');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${this.table.id}-col0`;
        checkbox.className = 'tableCheckbox';
        checkbox.checked = true;
        checkbox.value = 0;
        let label = document.createElement('label');
        label.htmlFor = `${this.table.id}-col0`;
        label.appendChild(document.createTextNode('Whole Table'));
        checkbox.addEventListener('change', () => {
            if (checkbox.checked){
                this.showColAndCheckCheckbox();
            }
            else {
                this.hideColAndUncheckCheckbox();
            }
        });
        nestedLi.appendChild(checkbox);
        nestedLi.appendChild(label);
        submenue.appendChild(nestedLi);


        columns = Array.from(this.thead.rows[1].cells).slice(1);

        columns.forEach((column, index) => {
            let nestedLi = document.createElement('li');

            // Create the checkbox
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${this.table.id}-col${index + 1}`;
            checkbox.className = 'columnCheckbox';
            checkbox.checked = true;
            checkbox.value = index + 1;
            let label = document.createElement('label');
            label.htmlFor = `${this.table.id}-col${index + 1}`;
            label.appendChild(document.createTextNode(column.textContent));

            checkbox.addEventListener('change', () => {
                if (checkbox.checked){
                    // Show the column
                    showCol(column);
                    if (this.allColumnCheckboxesChecked()){
                        document.getElementById(`${this.table.id}-col0`).checked = true;
                    }
                }
                    
                else {
                    // Hide the column
                    hideCol(column);
                    if (!this.allColumnCheckboxesChecked()){
                        document.getElementById(`${this.table.id}-col0`).checked = false;
                    }
                }
            });

            nestedLi.appendChild(checkbox);
            nestedLi.appendChild(label);
            submenue.appendChild(nestedLi);
        });

        li.appendChild(submenue);
        settingsMenu.appendChild(li);

        // Add event listener to the submenu to toggle the checkbox
        submenue.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() === 'li') {
                let checkbox = event.target.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;

                    // If the class of the checkbox is 'tableCheckbox', use the same functionality as above
                    if (checkbox.classList.contains('tableCheckbox')){
                        if (checkbox.checked)
                            this.showColAndCheckCheckbox();
                        else
                            this.hideColAndUncheckCheckbox();
                    }
                    else {
                        if (checkbox.checked){
                            showCol(this.thead.rows[0].cells[checkbox.value]);
                            if (this.allColumnCheckboxesChecked()){
                                document.getElementById(`${this.table.id}-col0`).checked = true;
                            }
                        }
                        else {
                            hideCol(this.thead.rows[0].cells[checkbox.value]);
                            if (!this.allColumnCheckboxesChecked()){
                                document.getElementById(`${this.table.id}-col0`).checked = false;
                            }
                        }
                    }
                }
            }
        });
        // ================================= Columns option =================================

        // ================================= Rows option =================================
        li = document.createElement('li');
        li.textContent = 'Show/Hide Rows';
        submenue = document.createElement('ul');
        submenue.className = 'TableObjSubMenu';
        const rows = Array.from(this.tbody.rows);

        rows.forEach((row, index) => {
            let nestedLi = document.createElement('li');

            // Create the checkbox
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${this.table.id}-row${index}`;
            checkbox.className = 'rowCheckbox';
            checkbox.checked = true;
            checkbox.value = index;
            let label = document.createElement('label');
            label.htmlFor = `${this.table.id}-row${index}`;
            label.appendChild(document.createTextNode(row.cells[1].textContent));

            checkbox.addEventListener('change', () => {
                if (checkbox.checked)
                    showRow(row.cells[0]);
                else
                    hideRow(row.cells[0]);
            });

            nestedLi.appendChild(checkbox);
            nestedLi.appendChild(label);
            submenue.appendChild(nestedLi);
        });

        li.appendChild(submenue);
        settingsMenu.appendChild(li);

        // Add event listener to the submenu to toggle the checkbox
        submenue.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() === 'li') {
                let checkbox = event.target.querySelector('input[type="checkbox"]');
                // If the id of the checkbox is `row0-col0`
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;

                    if (checkbox.checked)
                        showRow(this.tbody.rows[checkbox.value].cells[0]);
                    else
                        hideRow(this.tbody.rows[checkbox.value].cells[0]);
                }
            }
        });
        // ================================= Rows option =================================

        // create a container
        const container = document.createElement('div');
        container.className = 'TableObjMenuContainer';
        container.id = `${this.table.id}-menuContainer`;
        container.appendChild(settingsButton);
        container.appendChild(settingsMenu);
        this.table.parentElement.insertBefore(container, this.table);
    }

    /**
     * Checks if all the column checkboxes are checked.
     * @returns {Boolean} true if all the column checkboxes are checked, false otherwise.
     */
    allColumnCheckboxesChecked(){
        let checkboxes = document.querySelectorAll(`#${this.table.id}-menuContainer input.columnCheckbox`);
        let allChecked = true;
        for (let i = 0; i < checkboxes.length; i++){
            if (!checkboxes[i].checked){
                allChecked = false;
                break;
            }
        }
        return allChecked;
    }

    /**
     * Shows the column and checks its corresponding checkbox.
     */
    showColAndCheckCheckbox(){
        const checkboxes = document.querySelectorAll(`#${this.table.id}-menuContainer input.columnCheckbox`);
        for (let i = 0; i < checkboxes.length; i++){
            // If the checkbox is not checked, show the column and check the box
            if (!checkboxes[i].checked){
                showCol(this.thead.rows[0].cells[i+1]);
                checkboxes[i].checked = true;
            }
        }

        // Show the first column (rowSelectors)
        showCol(this.thead.rows[0].cells[0]);
    }

    /**
     * Hides the column and unchecks its corresponding checkbox.
     */
    hideColAndUncheckCheckbox(){
        const checkboxes = document.querySelectorAll(`#${this.table.id}-menuContainer input.columnCheckbox`);
        for (let i = 0; i < checkboxes.length; i++){
            // If the checkbox is checked, hide the column and uncheck the box
            if (checkboxes[i].checked){
                hideCol(this.thead.rows[0].cells[i+1]);
                checkboxes[i].checked = false;
            }
        }

        // Hide the first column (rowSelectors)
        hideCol(this.thead.rows[0].cells[0]);
    }

    /**
     * Selects the cells between startCell and the endCell.
     */
    selectCells() {
        if (!this.startCell || !this.endCell) return;

        const rows = this.tbody.rows;

        // cell.parentElement.rowIndex returns the row index within the whole table.
        // We need the index within the tbody, so we subtract the number of rows in the thead.
        const minRow = Math.min(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex) - this.thead.rows.length;
        const maxRow = Math.max(this.startCell.parentElement.rowIndex, this.endCell.parentElement.rowIndex) - this.thead.rows.length;
        let minCol = Math.min(this.startCell.cellIndex, this.endCell.cellIndex);
        const maxCol = Math.max(this.startCell.cellIndex, this.endCell.cellIndex);

        // This prevents selecting the first cell of each row (you could
        // select the whole row by selecting this cell).
        minCol = Math.max(minCol, 2);


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
                const rowIndex = cell.parentElement.rowIndex - this.thead.rows.length;
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

        // First 2 headers should be excluded from column selection.
        const minCol = Math.max(Math.min(this.startCell.cellIndex, this.endCell.cellIndex), 2);
        const maxCol = Math.max(this.startCell.cellIndex, this.endCell.cellIndex);            

        if (this.toggleSelect){
            for (let i = minCol; i < maxCol + 1; i++){
                const cells = this.table.querySelectorAll(`td:nth-child(${i+1}), thead tr:nth-child(n+2) th:nth-child(${i+1})`);
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
                for (let j = 1; j < row.cells.length; j++) {
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
                for (let j = 1; j < row.cells.length; j++) {
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
            this.table.querySelectorAll('tbody td:nth-child(n+2), thead tr:nth-child(n+2) th:nth-child(n+2)').forEach(cell => {
                cell.classList.add('selectedTableObjCell');
            });
        }
        else {
            this.table.querySelectorAll('tbody td:nth-child(n+2), thead tr:nth-child(n+2) th:nth-child(n+2)').forEach(cell => {
                cell.classList.remove('selectedTableObjCell');
            });
        }
    }

    /**
     * Finds the closest cell to the mouse cursor if the it is not directly over a cell.
     * @param {Number} x x coordinate of the mouse cursor
     * @param {Number} y y coordinate of the mouse cursor
     * @returns {HTMLTableCellElement} HTMLTableCellElement, either a th or a td
     */
    findClosestCell(x, y) {
        const row = this.findClosestRow(y, Array.from(this.tbody.rows));
        let cells = Array.from(row.cells);
        // Remove the first 2 cells (drag handles and row selectors)
        cells.shift();
        cells.shift();
        return this.findClosestCol(x, cells);
    }

    /**
     * Finds the closest column to the mouse cursor if the it is not directly over a column.
     * @param {Number} x x coordinate of the mouse cursor
     * @param {Array<HTMLTableCellElement>} cells the cells in a table row 
     * @returns {HTMLTableCellElement} HTMLTableCellElement, either a th or a td
     */
    findClosestCol(x, cells) {
        while (cells.length > 1) {
            const midIndex = Math.floor(cells.length / 2);
            const midCell = cells[midIndex];
            const midCellBounds = midCell.getBoundingClientRect();
    
            if (x < midCellBounds.left)
                cells = cells.slice(0, midIndex);
            else if (x > midCellBounds.right){
                cells = cells.slice(midIndex + 1);
                if (cells.length === 0) return midCell;
            }
            else
                return midCell;
        }
        
        return cells[0];
    }

    /**
     * Finds the closest row to the mouse cursor if the it is not directly over a row.
     * @param {Number} y y coordinate of the mouse cursor
     * @param {Array<HTMLTableRowElement>} rows the rows in a table body
     * @returns {HTMLTableRowElement} HTMLTableRowElement
     */
    findClosestRow(y, rows) {
        while (rows.length > 1) {
            const midIndex = Math.floor(rows.length / 2);
            const midRow = rows[midIndex];
            const midRowBounds = midRow.getBoundingClientRect();
    
            if (y < midRowBounds.top)
                rows = rows.slice(0, midIndex);
            else if (y > midRowBounds.bottom){
                if (midIndex + 1 < rows.length)
                    rows = rows.slice(midIndex + 1);
                else
                    return midRow;
            }
            else
                return midRow;
        }
    
        return rows[0];
    }

    /**
     * Finds the parent cell.
     * Used in case the table cell contains a nested HTML element.
     * @param {HTMLElement} element 
     * @param {String} tag 
     * @returns {HTMLTableCellElement} HTMLTableCellElement, either a th or a td
     */
    findParentCell(element, tag){
        if (element.tagName === tag) return element;
        return this.findParentCell(element.parentNode, tag);
    }

    /**
     * Updates the selected columns. If a column is not fully selected, the column
     * header will be deselected.
     */
    checkAllCellsInColumnSelected(){
        let changed = false;
        for (let i = 0; i < this.selectedHeaders.length; i++){
            if (this.selectedHeaders[i]){
                const cells = this.tbody.querySelectorAll(`td:nth-child(${i+1})`);
                for (let j = 1; j < cells.length; j++) {
                    if (!cells[j].classList.contains('selectedTableObjCell')) {
                        this.selectedHeaders[i] = false;
                        this.thead.rows[0].cells[i].classList.remove('selectedTableObjCell');
                        this.thead.rows[1].cells[i].classList.remove('selectedTableObjCell');
                        changed = true;
                        break;
                    }
                }
            }
        }

        if (changed)
            this.selectedCells = Array.from(this.table.querySelectorAll('.selectedTableObjCell'));
    }

    /**
     * Updates the selected rows. If a row is not fully selected, the row
     * selector will be deselected.
     */
    checkAllCellsInRowSelected(){
        let changed = false;
        const tempArr = [];
        for (let i = 0; i < this.selectedRows.length; i++){
            const row = this.table.rows[this.selectedRows[i]];
            let selected = true;
            for (let j = 1; j < row.cells.length; j++) {
                if (!row.cells[j].classList.contains('selectedTableObjCell')) {
                    this.table.rows[this.selectedRows[i]].cells[0].classList.remove('selectedTableObjCell');
                    this.table.rows[this.selectedRows[i]].cells[1].classList.remove('selectedTableObjCell');
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

            if (this.endCell.classList.contains("selectedTableObjCell"))
                this.toggleSelect = false;
            else
                this.toggleSelect = true;

            if (this.endCell.parentElement.rowIndex === 0){
                
                if (this.endCell.cellIndex !== 0 && this.endCell.cellIndex !== 1){
                    const cells = this.table.querySelectorAll(`td:nth-child(${this.endCell.cellIndex+1}), th:nth-child(${this.endCell.cellIndex+1})`);
                    for (let i = 0; i < cells.length; i++) {
                        cells[i].classList.add('selectedTableObjCell');
                    }
                }
            } 
            else {
                if (this.endCell.cellIndex === 1)
                    this.selecetWholeTable();
                else if (this.endCell.cellIndex !== 0){
                    this.mouseDownH = true;
                    this.selectColumns();
                }
            }
            
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

            if (this.endCell.cellIndex === 1){
                this.mouseDownR = true;
                this.selectRows();
            }
            else if (this.endCell.cellIndex === 0){
                const row = this.startCell.parentElement;
                for (let i = 0; i < row.cells.length; i++) {
                    row.cells[i].classList.add("selectedTableObjCell");
                }
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
            const cells = this.thead.rows[1].cells;
            for (let i = 0; i < cells.length; i++){
                this.selectedHeaders[i] = cells[i].classList.contains("selectedTableObjCell") ? true : false;
            }

            // Update selected rows
            this.selectedRows = Array.from(this.tbody.querySelectorAll("td:nth-child(2).selectedTableObjCell"))
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

        // Deselect when clicked outside the table.
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

            // If the click is not on a settings button, settings menu, or 
            // settings submenu, hide the settings menus.
            if (!event.target.closest('.TableObjMenu')
                && !event.target.closest('.TableObjSubMenu')) {
                const menus = document.querySelectorAll('.TableObjMenu');
                menus.forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }
}