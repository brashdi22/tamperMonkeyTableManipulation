class TableObj {
    static tablesCount = 0;

    constructor(tableElem){
        TableObj.tablesCount++;
        this.originalTable = tableElem;
        // Clone the table and replace the original with the clone
        this.table = tableElem.cloneNode(true);
        tableElem.parentElement.replaceChild(this.table, tableElem);
        this.addTableId();

        this.init();
    }

    init(){
        this.tbody = this.table.tBodies[0];
        this.thead = this.table.tHead;
        this.table.tabIndex = 0;

        if (this.thead === null)
            this.createThead();
        
        this.ensureTheadCellsAreThs();
        this.addColumnDragHandles();

        this.headerRowIndex = this.thead.rows.length - 1;
        this.colDragHandlesRowIndex = 0;

        // this.replaceHeaders();
        this.addRowSelectors();
        this.addRowDragHandles();

        this.theadCopy = this.thead.cloneNode(true);

        this.headerMapping = this.mapTableHeaderIndices();
        this.inverseHeaderMapping = this.invertMap(this.headerMapping);

        this.ensureAllColumnsHaveHeaders();
        this.showColNameOnHover();
        this.addSortButtons();
        this.addTableSettingsMenu();
        this.ensureTbodyCellsAreTds();

        // this.table.className = "";
        // this.table.classList.add("lib-table");
        this.table.classList.add("lib-tabl");

        this.addDocumentEventListeners();
        this.initialiseTableSpecificVariablesAndListeners();
    }

    /** 
     * This function initialises the variables and event listeners that need to reset
     * when the user hits the reset button. This id used during the first initialisation
     * and when the user hits the reset button.
    */
    initialiseTableSpecificVariablesAndListeners(){
        this.sourceRow = null;
        this.sourceColumn = null;

        this.targetRow = null;
        this.targetColumn = null;
        this.allowDrag = true;

        this.mouseDown = false;
        this.mouseDownH = false;
        this.mouseDownR = false;
        this.startCell = null;
        this.endCell = null;
        this.OldEndCell = null;

        this.selectedCells = [];
        this.selectedHeaders = new Array(this.thead.rows[this.headerRowIndex].cells.length).fill(false);
        this.selectedRows = [];

        this.toggleSelect = true;
        // this.scrollInterval = null;

        this.addTableSpecificEventListeners();
    }

    /**
     * Decides which rows from the tbody should be the thead, 
     * then creates the thead and removes these rows from the tbody.
     */
    createThead(){
        const headerRowsUsingTh = countHeaderRowsWithTH(this.table);
        const headerRowsUsingSpan = countHeaderRowsWithSpans(this.table);
        const lastHeaderRowIndex = Math.max(headerRowsUsingTh, headerRowsUsingSpan, 1) - 1;

        const thead = document.createElement("thead");
        this.thead = thead;
        this.table.insertBefore(thead, this.tbody);

        for (let i = lastHeaderRowIndex; i >= 0; i--){
            const removedRow = this.tbody.rows[i].parentNode.removeChild(this.tbody.rows[i]);
            thead.insertBefore(removedRow, thead.firstChild);
        }
    }

    /**
     * Replaces the headers with a clone of their selves.
     * This is to remove any existing event listeners.
     */
    replaceHeaders(){
        // Get the last row of the thead
        const headers = Array.from(this.thead.rows[this.headerRowIndex].cells);
        headers.forEach(header => {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
        });
    }

    /**
     * Ensures all cells in the thead are 'th's.
     */
    ensureTheadCellsAreThs(){
        // Query all td elements in the thead and replace them with th elements
        const tds = this.thead.querySelectorAll('td');
        tds.forEach(td => {
            const th = document.createElement('th');
            th.innerHTML = td.innerHTML;
            th.style.cssText = td.style.cssText;

            // Copy all attributes from the original cell to the new 'th' element
            for (let i = 0; i < td.attributes.length; i++) {
                let attr = td.attributes[i];
                th.setAttribute(attr.name, attr.value);
            }
            td.parentElement.replaceChild(th, td);
        });
    }

    /**
     * Ensures all cells in the tbody are 'td's.
     */
    ensureTbodyCellsAreTds(){
        // Query all th elements in the tbody and replace them with td elements
        const ths = this.tbody.querySelectorAll('th');
        ths.forEach(th => {
            const td = document.createElement('td');
            td.innerHTML = th.innerHTML;
            td.style.cssText = th.style.cssText;

            // Copy all attributes from the original cell to the new 'td' element
            for (let i = 0; i < th.attributes.length; i++) {
                let attr = th.attributes[i];
                td.setAttribute(attr.name, attr.value);
            }
            th.parentElement.replaceChild(td, th);
        });
    }

    /**
     * Ensures all columns in the tbody have a header cell in the thead.
     */
    ensureAllColumnsHaveHeaders(){
        // Get the length of the first row in the tbody
        const numOfCols = this.tbody.rows[0].cells.length;
        // Starting from the last cell in the row, decrement the index by 1
        for (let i = numOfCols - 1; i >= 0; i--){
            // For each index, try to get the header cell from the thead.
            // Use the headerMapping to get the actual index of the header cell.
            const headerCell = this.headerMapping.get(JSON.stringify({row: this.headerRowIndex, col: i}));
            // If the header cell does not exist, create a new one, and update the headerMapping
            if (!headerCell){
                const th = document.createElement('th');
                this.thead.rows[this.headerRowIndex].appendChild(th);
                const index = JSON.stringify({row: this.headerRowIndex, col: i});
                this.headerMapping.set(index, index);
                this.inverseHeaderMapping.set(index, index);
            }
            else
                break;
        }
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
     * Returns a map of the possible indices to the actual indices. So if a 
     * thead has 2 rows and the first row of the table has 4 cells, the possible 
     * indices will be [(0,0), (0,1), (0,2), (0,3), (1,0), (1,1), (1,2), (1,3)].
     * 
     * In complex theads, cells can have rowspan and colspan, so the actual
     * indices will be different from the possible indices. 
     * 
     * Assume the first cell in the first row in the actual thead has rowspan=2,
     * in this case (0,0) and (1,0) should be mapped to (0,0). Assume the second
     * cell in the first row in the actual thead has colspan=2, in this case (0,1)
     * and (0,2) should be mapped to (0,1).
     * 
     * @returns {Map<string, string>} A map of string => string. Each string is an index in the form '(row,col)'.
    */
    mapTableHeaderIndices() {
        const rows = this.theadCopy.rows;
        let matrix = [];
        let mapping = new Map();

        // Initialize matrix to accommodate for all rows and virtual columns
        for (let i = 0; i < rows.length; i++) {
            matrix[i] = [];
        }

        // Populate the matrix with actual header positions, considering rowspan and colspan
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            let actualColIndex = 0; // Correctly scope actualColIndex for each row
            for (let colIndex = 0; colIndex < rows[rowIndex].cells.length; colIndex++) {
                while (matrix[rowIndex][actualColIndex] !== undefined) {
                    actualColIndex++;
                }
                const cell = rows[rowIndex].cells[colIndex];
                const rowspan = cell.rowSpan;
                const colspan = cell.colSpan;

                for (let i = 0; i < rowspan; i++) {
                    for (let j = 0; j < colspan; j++) {
                        // Ensure the target row in the matrix exists before assignment
                        if (matrix[rowIndex + i] !== undefined) {
                            matrix[rowIndex + i][actualColIndex + j] = { row: rowIndex, col: colIndex };
                            // Direct mapping for each cell's position
                            mapping.set(JSON.stringify({ row: rowIndex + i, col: actualColIndex + j }), JSON.stringify({ row: rowIndex, col: colIndex }));
                        }
                    }
                }
                actualColIndex += colspan; // Increment to move past the current cell, including its colspan
            }
        }

        return mapping;
    }

    /**
     * Returns inverse of an input map. Given map<a, b> returns map<b, a>.
     * 
     * @param {Map<string, string>} map - The map to be inversed.
     * @returns {Map<string, string>} The inversed map.
     */
    invertMap(originalMap) {
        let inverseMap = new Map();
        for (let [key, value] of originalMap.entries()) {
            if (!inverseMap.has(value)) {
                inverseMap.set(value, [key]);
            } else {
                inverseMap.get(value).push(key);
            }
        }
        return inverseMap;
    }

    /**
     * Adds an extra cell to the left of each row to be used as a row selector.
     * 
     * When this cell is selected, the whole row will be selected.
     */
    addRowSelectors(){
        // Add an empty cell to the left of the top row (column drag handles row)
        const th0 = document.createElement("th");
        th0.style.cursor = 'default';
        this.thead.rows[0].insertBefore(th0, this.thead.rows[0].firstElementChild);

        // Add the 'Index' header cell to the headers row
        const indexTH = document.createElement("th");
        indexTH.className = "rowSelector";
        indexTH.textContent = "Index";
        indexTH.rowSpan = this.thead.rows.length - 1;
        this.thead.rows[1].insertBefore(indexTH, this.thead.rows[1].firstElementChild);

        // Add row selectors to the tbody
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
        for (let i = 0; i < this.tbody.rows[0].cells.length; i++) {
            const headerOfColI = this.findColumnHeader(this.tbody.rows[0].cells[i]);
            for (let j = 0; j < this.tbody.rows.length; j++) {
                try {
                    this.tbody.rows[j].cells[i].title = headerOfColI;
                } catch (e) {}
            }
        }
    }

    /**
     * Adds an extra cell to the left of each row to be used as a drag handle
     * and adds event listeners to the cells.
     */
    addRowDragHandles(){
        // Add an empty cell to the left of the top row (column drag handles row)
        const th0 = document.createElement("th");
        th0.rowSpan = this.thead.rows.length;
        th0.style.cursor = 'default';
        this.thead.rows[0].insertBefore(th0, this.thead.rows[0].firstElementChild);

        // Add row drag handles to the tbody
        const rows = Array.from(this.tbody.rows);
        for (let i = 0; i < rows.length; i++){
            // Create a cell
            const cell = rows[i].insertCell(0);
            cell.className = 'rowDragHandle';
            cell.draggable = true;

            // Create a div to hold the drag icon, this is so we can centre the icon
            const div = document.createElement('div');
            div.className = 'dragSVG';
            div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="10" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M96 32H32C14.3 32 0 46.3 0 64v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32zm0 160H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm0 160H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zM288 32h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32zm0 160h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm0 160h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32z"/></svg>';
            
            // Append the div to the cell
            cell.appendChild(div);
        }
    }

    /**
     * Adds an extra cell above each column to be used as a drag handle
     * and adds event listeners to the cells.
     */
    addColumnDragHandles(){
        // Get the cells in the first row of the thead
        const cells = Array.from(this.thead.rows[0].cells);

        const tr = document.createElement("tr");
        // insert the row before the first row in the thead
        this.thead.insertBefore(tr, this.thead.rows[0]);

        const numOfCols = cells.length;
        for (let i = 0; i < numOfCols; i++){
            // Create a cell
            const cell = document.createElement("th");
            cell.colSpan = cells[i].colSpan || 1;
            cell.style.display = window.getComputedStyle(cells[i]).display;
            
            cell.className = 'columnDragHandle';
            cell.draggable = true; 

            // Create a div to hold the drag icon, this is so we can centre the icon
            const div = document.createElement("div");
            div.className = 'dragSVG';
            div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M96 288H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zM96 96H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32zm160 0h-64c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32z"/></svg>';
            
            // Append the div to the cell, then the cell to the row
            cell.appendChild(div);
            tr.appendChild(cell);
             
        }
    }

    /** 
     * Adds the event listener that is responsible for initialising the row drag operation.
     */
    addRowDragHandlesListeners(){
        const rowDragHandles = document.querySelectorAll(`#${this.table.id} .rowDragHandle`);
        rowDragHandles.forEach(handle => {
            handle.addEventListener('dragstart', (event) => {
                this.sourceRow = event.target.parentElement;
                event.dataTransfer.setDragImage(this.sourceRow,event.target.getBoundingClientRect().width/2, event.target.getBoundingClientRect().height/2);
            });
        });
    }

    /**
     * Adds the event listener that is responsible for initialising the column drag operation.
     */
    addColumnDragHandlesListeners(){
        const columnDragHandles = document.querySelectorAll(`#${this.table.id} .columnDragHandle`);
        columnDragHandles.forEach(handle => {
            handle.addEventListener('dragstart', (event) => {
                this.sourceColumn = event.target;
            });
        });
    }

    addSortButtons(){
        // Get the length of the first row in the tbody
        const numOfCols = this.tbody.rows[0].cells.length;

        // Create a set of cells that a button will be added to
        let cells = new Set();
        for (let i = 1; i < numOfCols; i++){
            const index = JSON.stringify({row: this.headerRowIndex, col: i});
            cells.add(this.headerMapping.get(index));
        }

        cells = this.getCellsFromObjectIndices(cells);
        cells.forEach(cell => {
            const button = document.createElement('button');
            button.className = 'sortButton';
            cell.appendChild(button);
        });
    }

    addFunctionsToSortButtons(){
        const buttons = this.table.querySelectorAll('.sortButton');
        buttons.forEach(button => {
            const header = button.parentElement;
            const cellIndex = JSON.stringify({row: header.parentElement.rowIndex, col: header.cellIndex});

            // Get the index of the column in the tbody that the button is supposed to sort
            const coveredIndices = this.inverseHeaderMapping.get(cellIndex);
            const colIndex = JSON.parse(coveredIndices[0]).col;

            header.setAttribute('TableObj-col-sort-asc', 'true');
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>';
            button.onclick = () => {
                sortTableByColumn(this.table, colIndex, header);
            }
        });

        // change the innerHTML of the 'index' column to indicate that the
        // table is sorted by this column by default
        buttons[0].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M182.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"/></svg>';
        buttons[0].parentElement.setAttribute('TableObj-col-sort-asc', 'false');
    }

    /**
     * Adds a dropdown menu above the table to show/hide columns and rows.
     */
    addTableSettingsMenu(){
        // Add a button to be clicked to show the menu
        const settingsButton = document.createElement('button');
        settingsButton.className = 'TableObjMenuButton';
        settingsButton.innerHTML = 'Table Settings';
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
        let submenu = document.createElement('ul');
        submenu.className = 'TableObjSubMenu';

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
        label.appendChild(document.createTextNode('All columns'));
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
        submenu.appendChild(nestedLi);

        let columns = new Set();
        for (let i = 1; i < this.tbody.rows[0].cells.length; i++){
            const index = JSON.parse(this.headerMapping.get(JSON.stringify({row: this.headerRowIndex, col: i})));
            columns.add(this.thead.rows[index.row].cells[index.col]);
        }

        [...columns].forEach((column, index) => {
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
                    showCol(this.getColFromLiIndex(getLiIndex(nestedLi, nestedLi.parentElement)));
                    if (this.allColumnCheckboxesChecked())
                        document.getElementById(`${this.table.id}-col0`).checked = true;
                }
                else {
                    // Hide the column
                    hideCol(this.getColFromLiIndex(getLiIndex(nestedLi, nestedLi.parentElement)));
                    if (!this.allColumnCheckboxesChecked())
                        document.getElementById(`${this.table.id}-col0`).checked = false;
                }
            });

            nestedLi.appendChild(checkbox);
            nestedLi.appendChild(label);
            submenu.appendChild(nestedLi);
        });

        li.appendChild(submenu);
        settingsMenu.appendChild(li);

        // Add event listener to the submenu to toggle the checkbox
        submenu.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() === 'li') {
                let checkbox = event.target.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
        // ================================= Columns option =================================

        // ================================= Rows option =================================
        li = document.createElement('li');
        li.textContent = 'Show/Hide Rows';
        submenu = document.createElement('ul');
        submenu.className = 'TableObjSubMenu';
        const rows = Array.from(this.tbody.rows);

        rows.forEach(row => {
            let nestedLi = document.createElement('li');

            // Create the checkbox
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${this.table.id}-row${row.rowIndex}`;
            checkbox.className = 'rowCheckbox';
            checkbox.checked = true;
            checkbox.value = row.rowIndex;
            let label = document.createElement('label');
            label.htmlFor = `${this.table.id}-row${row.rowIndex}`;
            label.appendChild(document.createTextNode(row.cells[1].textContent));

            checkbox.addEventListener('change', () => {
                if (checkbox.checked)
                    showRow(this.tbody.rows[getLiIndex(nestedLi, nestedLi.parentElement)].cells[1]);
                else
                    hideRow(this.tbody.rows[getLiIndex(nestedLi, nestedLi.parentElement)].cells[1]);
            });

            nestedLi.appendChild(checkbox);
            nestedLi.appendChild(label);
            submenu.appendChild(nestedLi);
        });

        li.appendChild(submenu);
        settingsMenu.appendChild(li);

        // Add event listener to the submenu to toggle the checkbox
        submenu.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() === 'li') {
                let checkbox = event.target.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
        // ================================= Rows option =================================

        // ================================= Reset option =================================
        li = document.createElement('li');
        li.textContent = 'Reset';
        li.className = 'TableObjResetButton';
        li.style.cursor = 'pointer';
        li.addEventListener('mousedown', () => {li.style.backgroundColor = '#949090';});
        li.addEventListener('mouseup', () => {li.style.backgroundColor = '';});
        li.addEventListener('click', () => {
            // Reset the table to its original state
            const temp = this.originalTable.cloneNode(true);
            temp.id = this.table.id;
            this.table.parentElement.replaceChild(temp, this.table);
            this.table = temp;

            // Delete the menu container (to reinitialise the event listeners)
            const container = document.getElementById(`${this.table.id}-menuContainer`);
            container.parentElement.removeChild(container);

            this.init();
        });
        settingsMenu.appendChild(li);
        // ================================= Reset option =================================

        // create a container
        const container = document.createElement('div');
        container.className = 'TableObjMenuContainer';
        container.id = `${this.table.id}-menuContainer`;
        container.appendChild(settingsButton);
        container.appendChild(settingsMenu);
        this.table.parentElement.insertBefore(container, this.table);
    }

    /** 
     * Returns an actual header cell at a given virtual index.
     * 
     * @param {number} liIndex - The virtual index of the header cell.
     * @returns {HTMLTableCellElement} The actual header cell.
    */
    getColFromLiIndex(liIndex) {
        const index = JSON.parse(this.headerMapping.get(JSON.stringify({row: this.headerRowIndex, col: liIndex})));
        return this.thead.rows[index.row].cells[index.col];
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
            // If the checkbox is not checked, check it
            if (!checkboxes[i].checked){
                checkboxes[i].checked = true;
                checkboxes[i].dispatchEvent(new Event('change'));
            }
        }

        // Show the first column (rowSelectors)
        showCol(this.thead.rows[this.colDragHandlesRowIndex].cells[0]);
    }

    /**
     * Hides the column and unchecks its corresponding checkbox.
     */
    hideColAndUncheckCheckbox(){
        const checkboxes = document.querySelectorAll(`#${this.table.id}-menuContainer input.columnCheckbox`);
        for (let i = 0; i < checkboxes.length; i++){
            // If the checkbox is checked, uncheck it
            if (checkboxes[i].checked){
                checkboxes[i].checked = false;
                checkboxes[i].dispatchEvent(new Event('change'));
            }
        }

        // Hide the first column (rowSelectors)
        hideCol(this.thead.rows[this.colDragHandlesRowIndex].cells[0]);
    }

    addDocumentEventListeners(){
        document.addEventListener("mousemove", this.documentMouseMove.bind(this));
        document.addEventListener("mouseup", this.documentMouseUp.bind(this));
        document.addEventListener("mousedown", this.documentMouseDown.bind(this));
        document.addEventListener("dragend", this.documentDragEnd.bind(this));
        document.addEventListener("dragover", this.documentDragOver.bind(this));
        document.addEventListener("click", this.documentClick.bind(this));
    }

    addTableSpecificEventListeners(){
        this.thead.addEventListener("mousedown", this.theadMouseDown.bind(this), true);
        this.tbody.addEventListener("mousedown", this.tbodyMouseDown.bind(this), true);
        this.addRowDragHandlesListeners();
        this.addColumnDragHandlesListeners();
        this.addFunctionsToSortButtons();
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
                if (rows[i].style.display === 'none') continue;
                const cells = rows[i].getElementsByTagName("td");
    
                // Loop through cells in the row
                for (let j = minCol; j < maxCol + 1; j++) {
                    if (cells[j].style.display !== 'none')
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

        // First 2 headers should be excluded from column selection (row darg handles and index columns).
        const minCol = Math.max(Math.min(this.startCell.col, this.endCell.col), 2);
        const maxCol = Math.max(this.startCell.col, this.endCell.col);
        // Exclude the first row in the thead (column drag handles)
        const minRow = Math.max(Math.min(this.startCell.row, this.endCell.row), 1);
        const maxRow = Math.max(this.startCell.row, this.endCell.row);

        const headersToCheck = this.getCellsBetween2Headers(minRow, maxRow, minCol, maxCol);
        let theadCells = [];
        let tbodyCells = [];
        if (this.toggleSelect){
            headersToCheck.forEach(header => {
                const [headers, cellsO] = this.getCellsUnderHeader(header);
                theadCells.push(...headers);
                tbodyCells.push(...cellsO);
                const cells = [...headers, ...cellsO];
                for (let i = 0; i < cells.length; i++) {
                    if (cells[i].style.display !== 'none')
                        cells[i].classList.add('selectedTableObjCell');
                }
            });


            theadCells = [...(new Set(theadCells))];
            const selectedTheadCells = this.thead.querySelectorAll('.selectedTableObjCell');
            for (let i = 0; i < selectedTheadCells.length; i++){
                if (!this.selectedCells.includes(selectedTheadCells[i]) && !theadCells.includes(selectedTheadCells[i]))
                    selectedTheadCells[i].classList.remove('selectedTableObjCell');
            }

            tbodyCells = [...(new Set(tbodyCells))];
            const cells = this.tbody.querySelectorAll('.selectedTableObjCell');
            for (let i = 0; i < cells.length; i++){
                if (!this.selectedCells.includes(cells[i]) && !tbodyCells.includes(cells[i]))
                    cells[i].classList.remove('selectedTableObjCell');
            }
        }
        else {
            let allCells = [];
            headersToCheck.forEach(header => {
                const [headers, cellsO] = this.getCellsUnderHeader(header);
                const cells = [...headers, ...cellsO];
                allCells.push(...cells);
                cells.forEach(cell => {
                    cell.classList.remove('selectedTableObjCell');
                });
            });

            allCells = [...(new Set(allCells))];
            this.selectedCells.forEach(cell => {
                if (!allCells.includes(cell)){
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
                if (row.style.display !== 'none'){
                    for (let j = 1; j < row.cells.length; j++) {
                        row.cells[j].classList.add("selectedTableObjCell");
                    }
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
            this.table.querySelectorAll('tbody tr td:not(:first-child), tr:not(:first-child) th').forEach(cell => {
                if (cell.style.display !== 'none' && cell.parentElement.style.display !== 'none')
                    cell.classList.add('selectedTableObjCell');
            });
        }
        else {
            this.table.querySelectorAll('tbody tr td:not(:first-child), tr:not(:first-child) th').forEach(cell => {
                cell.classList.remove('selectedTableObjCell');
            });
        }
    }

    /**
     * Given a header cell (possibly with row or col span), returns the cells that are under it.
     * 
     * @param {HTMLTableCellElement} headerCell 
     * @returns {Array<HTMLTableCellElement>} An array of the header and all cells beneath it.
     */
    getCellsUnderHeader(headerCell){
        // Turn the index of the header cell into a string to be used as a key in the inverseHeaderMapping
        const headerCellIndex = JSON.stringify({row: headerCell.parentElement.rowIndex, col: headerCell.cellIndex});
        // Get the virtual indices that the header cell is spanning over.
        // If the header is located at (0,0) and has rowspan=2, the covered indices will be (0,0) and (1,0).
        const InitialCoveredIndices = this.inverseHeaderMapping.get(headerCellIndex);

        // Create a set to hold the indices of the cells that are under the header cell inside the thead
        const cellsSet = new Set();
        // Add the header cell index to the set
        cellsSet.add(headerCellIndex);

        // Create a set to hold the column indices that the header cell is spanning over
        const columns = new Set();

        // For each virtual index that the header cell is spanning over
        InitialCoveredIndices.forEach((index) => {
            // Parse the index from a string to an object
            const cellIndex = JSON.parse(index);

            // Add the column index to the columns array
            columns.add(cellIndex.col);

            // Increment the row index by 1 so we move to the next row
            let row = cellIndex.row + 1;
            // While the row is less than the number of rows in the thead
            while (row < this.thead.rows.length){
                // Create a new index in the form of a string (this is a virtual index)
                const newIndex = JSON.stringify({row: row, col: cellIndex.col});

                // Get the actual index of the cell in the tbody
                cellsSet.add(this.headerMapping.get(newIndex));

                row++;
            }
        });

        const headers = this.getCellsFromObjectIndices([...cellsSet]);

        // Get the cells from the set of indices
        const cells = [];

        // Get the cells in the tbody using the column indices in the columns set
        columns.forEach((col) => {
            cells.push(...this.getCellsInColumn(col));
        });

        return [headers, cells];
    }

    /**
     * Takes an array of indices in the form of strings, parses into objects and
     * returns the HTMLTable cells in these indices.
     * 
     * @param {Array<string>} indices Strings produced by JSON.stringify({row: number, col: number}).
     * @returns {Array<HTMLTableCellElement>} An array of HTMLTableCellElements.
     */
    getCellsFromObjectIndices(indices){
        const cells = [];
        indices.forEach((index) => {
            const obj = JSON.parse(index);
            const cell = this.table.rows[obj.row].cells[obj.col];
            cells.push(cell);
        });
        return cells;
    }

    /**
     * Returns the HTMLTableCellElements in the given column. Returns the cells in the 
     * tbody only, not the whole table.
     * 
     * @param {number} colIndex 
     * @returns {Array<HTMLTableCellElement>} An array of HTMLTableCellElements.
     */
    getCellsInColumn(colIndex){
        const cells = [];
        for (let i = 0; i < this.tbody.rows.length; i++){
            cells.push(this.tbody.rows[i].cells[colIndex]);
        }
        return cells;
    }

    /**
     * Finds the column header for a given cell in a table.
     * 
     * @param {HTMLTableCellElement} cell - The table cell (td) whose header you want to find.
     * @return {string} The text content of the header cell.
    */
    findColumnHeader(cell) {
        let headerIndex = this.headerMapping.get(JSON.stringify({row: this.headerRowIndex, col: cell.cellIndex}));
        headerIndex = JSON.parse(headerIndex);
        return this.thead.rows[headerIndex.row].cells[headerIndex.col].textContent.trim();
    }

    /**
     * Get the minimum and maximum virtual column indices of the given cell.
     * E.g., if the cell is located at (0,0) and has colspan=2, the output will
     * be min=0 and max=1.
     * 
     * @param {HTMLTableCellElement} cell a table header cell.
     * @returns {number[]} An array of two numbers, min and max respectively.
     */
    getMinAndMaxColIndices(cell){
        const coveredIndices = this.inverseHeaderMapping.get(JSON.stringify({row: cell.parentElement.rowIndex, col: cell.cellIndex}));

        const colIndices = [];
        coveredIndices.forEach(index => {
            colIndices.push(JSON.parse(index).col);
        });

        return [Math.min(...colIndices), Math.max(...colIndices)];
    }

    /** 
     * Returns the cells between two headers. It iterates over the virtual indices 
     * between the two headers and gets the actual indices from the headerMapping.
     * 
     * @param {number} minRow The row index of the first header.
     * @param {number} maxRow The row index of the second header.
     * @param {number} minCol The column index of the first header.
     * @param {number} maxCol The column index of the second header.
     * @returns {Array<HTMLTableCellElement>} An array of header cells.
    */
    getCellsBetween2Headers(minRow, maxRow, minCol, maxCol){
        const cellsSet = new Set();
        for (let i = minRow; i <= maxRow; i++){
            for (let j = minCol; j <= maxCol; j++){
                const newCell = this.headerMapping.get(JSON.stringify({row: i, col: j}));
                cellsSet.add(newCell);
            }
        }
        return this.getCellsFromObjectIndices([...cellsSet]);
    }

    /** 
     * Returns the position of the virtual sub-cell relative to the original cell.
     * If the original cell is located at (0,0) and has rowspan=colspan=2, and say
     * the mouse is located at the bottom right corner of the original cell, the output will be
     * {row: 1, col: 1}.
     * 
     * @param {HTMLTableCellElement} originalCell The original cell.
     * @param {MouseEvent} mouseEvent The mouse event.
     * @returns {Object} A virtual index.
    */
    getSubCellPosition(originalCell, mouseEvent) {
        const { left, top, width, height } = originalCell.getBoundingClientRect();
        const colspan = originalCell.colSpan;
        const rowspan = originalCell.rowSpan;

        // Calculate the size of each sub-cell
        const subCellWidth = width / colspan;
        const subCellHeight = height / rowspan;
    
        // Calculate mouse position relative to the original cell
        const mouseXRelativeToCell = mouseEvent.clientX - left;
        const mouseYRelativeToCell = mouseEvent.clientY - top;
    
        // Determine the sub-cell's column and row based on mouse position
        const colIndex = Math.floor(mouseXRelativeToCell / subCellWidth);
        const rowIndex = Math.floor(mouseYRelativeToCell / subCellHeight);

        // Get the cells covered by the original cell
        const coveredIndices = this.inverseHeaderMapping.get(
            JSON.stringify({row: originalCell.parentElement.rowIndex, col: originalCell.cellIndex}));

        // Get the top left cell
        const originalCellIndex = JSON.parse(coveredIndices[0]);
    
        // Return the position of the sub-cell relative to the original cell
        let subCellRow = originalCellIndex.row + rowIndex;
        let subCellCol = originalCellIndex.col + colIndex;

        // If the sub-cell is outside the original cell, set it to the original cell.
        // This might occur if the coords of the mouse are not captured accurately
        // or they do not reflect the coords as they are seen in the GUI.
        if (subCellRow > originalCellIndex.row + rowspan - 1) 
            subCellRow = originalCellIndex.row + rowspan - 1;
        else if (subCellRow < originalCellIndex.row)
            subCellRow = originalCellIndex.row;
        if (subCellCol > originalCellIndex.col + colspan - 1)  
            subCellCol = originalCellIndex.col + colspan - 1;
        else if (subCellCol < originalCellIndex.col)
            subCellCol = originalCellIndex.col;

        return { row: subCellRow, col: subCellCol };
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
        cells.shift(); cells.shift();
        return this.findClosestCol(x, cells);
    }

    /**
     * Finds the closest column to the mouse cursor if the it is not directly over a column.
     * @param {Number} x x coordinate of the mouse cursor
     * @param {Array<HTMLTableCellElement>} cells the cells in a table row 
     * @returns {HTMLTableCellElement} HTMLTableCellElement, either a th or a td
     */
    findClosestCol(x, cells) {
        // Remove the hidden cells
        cells = cells.filter(cell => cell.style.display !== 'none');

        // Do a binary search to find the closest cell
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
        // Remove the hidden rows
        rows = rows.filter(row => row.style.display !== 'none');

        // Do a binary search to find the closest row
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

    findClosestHeader(x, y) {
        const row = this.findClosestRow(y, Array.from(this.thead.rows));
        let cells = Array.from(this.tbody.rows[0].cells);
        // Remove the first 2 cells (drag handles and row selectors)
        cells.shift(); cells.shift();

        return {row: row.rowIndex, col: this.findClosestCol(x, cells).cellIndex};
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
                for (let j = 0; j < cells.length; j++) {
                    if (!cells[j].classList.contains('selectedTableObjCell')
                        && cells[j].parentElement.style.display !== 'none') {
                        this.selectedHeaders[i] = false;
                        this.thead.rows[this.colDragHandlesRowIndex].cells[i].classList.remove('selectedTableObjCell');
                        this.thead.rows[this.headerRowIndex].cells[i].classList.remove('selectedTableObjCell');
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
                if (!row.cells[j].classList.contains('selectedTableObjCell')
                    && row.cells[j].style.display !== 'none') {
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

    // ====================================== Event Listeners' Functions ======================================
    theadMouseDown(event){
        if (event.target.closest(".sortButton")) return;

        document.body.classList.add('cursor-crosshair');

        if (!event.ctrlKey){
            this.table.querySelectorAll('.selectedTableObjCell').forEach(cell =>
                cell.classList.remove('selectedTableObjCell'));
            this.selectedCells = [];
        }
        
        this.startCell = this.findParentCell(event.target, "TH");

        if (this.startCell.classList.contains("selectedTableObjCell"))
            this.toggleSelect = false;
        else
            this.toggleSelect = true;

        const [minCol, maxCol] = this.getMinAndMaxColIndices(this.startCell);
        

        // Virtual cell index
        const subCellIndex = this.getSubCellPosition(this.startCell, event);

        this.startCell = {row: subCellIndex.row, col: minCol};
        this.endCell = {row: this.startCell.row, col: maxCol};

        if (this.startCell.row === 0){
            if (this.startCell.col !== 0 && this.startCell.col !== 1){
                const [theadCells, tbodyCells] = this.getCellsUnderHeader(this.findParentCell(event.target, "TH"));
                const cells = [...theadCells, ...tbodyCells];
                for (let i = 0; i < cells.length; i++) {
                    cells[i].classList.add('selectedTableObjCell');
                }
            }
        } 
        else {
            if (this.endCell.col === 1){
                this.selecetWholeTable();
            }
            else if (this.endCell.col !== 0){
                this.mouseDownH = true;
                this.selectColumns();
            }
        }
    }

    tbodyMouseDown(event){
        document.body.classList.add('cursor-crosshair');
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
    }

    documentMouseMove(event){
        if (!this.mouseDownH && !this.mouseDownR && !this.mouseDown) return;
        
        if (this.mouseDownH) {
            if (event.target.closest("thead") !== this.thead){
                this.OldEndCell = this.endCell;
                this.endCell = this.findClosestHeader(event.clientX, event.clientY);
            } 
            else {
                this.OldEndCell = this.endCell;
                this.endCell = this.getSubCellPosition(this.findParentCell(event.target, "TH"), event);
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
    }

    documentMouseUp(){
        if (!this.mouseDownH && !this.mouseDownR && !this.mouseDown) return;
        document.body.classList.remove('cursor-crosshair');

        // Update selected columns
        const cells = this.thead.rows[this.headerRowIndex].cells;
        for (let i = 0; i < cells.length; i++){
            this.selectedHeaders[i] = cells[i].classList.contains("selectedTableObjCell") ? true : false;
        }

        // Update selected rows
        this.selectedRows = Array.from(this.tbody.querySelectorAll("td:nth-child(2).selectedTableObjCell"))
            .map(td => td.parentNode.rowIndex);

        // Update selected cells
        this.selectedCells = Array.from(this.table.querySelectorAll('.selectedTableObjCell'));

        // Update the graphs options if the graphs tab is open
        const toolbar = document.getElementById('TableObjToolbar');
        if (!toolbar.graphOptionsHidden)
            toolbar.updateSelectedColumns();

        this.mouseDown = this.mouseDownH = this.mouseDownR = false;

        // this.checkAllCellsInRowSelected();
        // this.checkAllCellsInColumnSelected();
        
        
        // window.removeEventListener("mousemove", handleMousemove);
    }

    documentMouseDown(event){
        if (!this.table.contains(event.target)
            && event.target !== document.documentElement
            && !event.target.closest('#TableObjToolbar')
            && !event.target.closest('#chartContainer')) {
            this.table.querySelectorAll('.selectedTableObjCell').forEach(cell =>
                                                                cell.classList.remove('selectedTableObjCell'));
            
            this.selectedCells = [];
            this.selectedHeaders = new Array(this.thead.rows[this.colDragHandlesRowIndex].cells.length).fill(false);
            this.selectedRows = [];
        }

        // If the click is not on a settings button, settings menu, or 
        // settings submenu, hide the settings menus.
        if (!event.target.closest('.TableObjMenu')
            && !event.target.closest('.TableObjSubMenu')
            && !event.target.classList.contains('TableObjMenuButton')) {
            const menus = document.querySelectorAll('.TableObjMenu');
            menus.forEach(menu => {
                menu.style.display = 'none';
            });
        }
    }

    documentClick(event){
        if (!event.target.closest('#TableObjToolbar')
            && !event.target.closest('#chartContainer')){
            // Update the graphs options if the graphs tab is open
            const toolbar = document.getElementById('TableObjToolbar');
            if (!toolbar.graphOptionsHidden)
                toolbar.updateSelectedColumns();
        }
    }

    documentDragEnd(){
        if (this.sourceRow && this.targetRow){        // Move the source row to the target row
            if (this.sourceRow !== this.targetRow){

                const checkBoxes = document.querySelectorAll(`#settingsMenu-${this.table.id} .rowCheckbox`);
                const sourceCheckbox = checkBoxes[this.sourceRow.rowIndex - this.thead.rows.length].parentElement;
                const targetCheckbox = checkBoxes[this.targetRow.rowIndex - this.thead.rows.length].parentElement;
                
                if (this.targetRow.classList.contains('rowDragLineTop')){
                    this.targetRow.before(this.sourceRow);
                    targetCheckbox.before(sourceCheckbox);
                }
                else {
                    this.targetRow.after(this.sourceRow);
                    targetCheckbox.after(sourceCheckbox);
                }
            }

            this.targetRow.classList.remove('rowDragLineTop', 'rowDragLineBottom');
            this.sourceRow = this.targetRow = null;
        }

        else if (this.sourceColumn && this.targetColumn){
            if (this.targetColumn.classList.contains('columnDragLineLeft')){
                this.targetColumn.classList.remove('columnDragLineLeft');
                // Get the cell to the left of the target cell
                this.targetColumn = this.targetColumn.previousElementSibling;
            }

            if (this.sourceColumn.cellIndex !== this.targetColumn.cellIndex){
                const [sourceMinCol, sourceMaxCol] = this.getMinAndMaxColIndices(this.sourceColumn);
                const [targetMinCol, targetMaxCol] = this.getMinAndMaxColIndices(this.targetColumn);

                // Move the checkboxes to the new positions first
                const checkBoxes = Array.from(document.querySelectorAll(`#settingsMenu-${this.table.id} .columnCheckbox`));
                const checkBoxesToMove = checkBoxes.slice(sourceMinCol - 1, sourceMaxCol);
                // insert them at the position of targetMaxCol in reverse order
                checkBoxesToMove.reverse().forEach(checkbox => {
                    checkBoxes[targetMaxCol - 1].parentElement.after(checkbox.parentElement);
                });

                // Then move the columns
                // Get the cells under the source header
                const [headers, cells] = this.getCellsUnderHeader(this.sourceColumn);

                const headersToMove = [];
                const placeholderes = [];
                const headersToMoveC = [];

                // Get the headers and store them with their new indices in headersToMove
                headers.forEach(cell => {
                    const [currentMinCol, currentMaxCol] = this.getMinAndMaxColIndices(cell);

                    // Calculate the column offset of the cell from the source cell (the row index is
                    // the same as the current row)
                    const colOffset = currentMinCol - sourceMinCol;

                    // Get the new cell's virtual index
                    const newCellIndex = { row: cell.parentElement.rowIndex, col: targetMaxCol + colOffset };

                    headersToMove.push({ cell: cell, row: newCellIndex.row, col: newCellIndex.col, oldCol: cell.cellIndex });

                    // Do the same for the theadCopy
                    const cellCopy = this.theadCopy.rows[cell.parentElement.rowIndex].cells[cell.cellIndex];
                    headersToMoveC.push({ cell: cellCopy, row: newCellIndex.row, col: newCellIndex.col, oldCol: cell.cellIndex });
                });

                // Replace the headers to move with placeholders, and store the placeholders in 
                // the placeholderes array
                [headersToMove, headersToMoveC].forEach(headersArray => {
                    headersArray.forEach(cell => {
                        // Remove the cell from the table
                        const row = cell.cell.parentElement;
                        row.removeChild(cell.cell);

                        // Insert a placeholder in the cell's position
                        const placeholder = row.insertCell(cell.oldCol);

                        // Set the spans to be the same as the cell's
                        placeholder.rowSpan = cell.cell.rowSpan;
                        placeholder.colSpan = cell.cell.colSpan;

                        placeholderes.push(placeholder);
                    });
                });

                // Insert the cells in the correct position
                headersToMove.forEach(sourceCell => {
                    // The index of the cell is a virtual index, so we need to get the actual index 
                    // from the headerMapping 
                    let virtual = { row: sourceCell.row, col: sourceCell.col };
                    let actual = JSON.parse(this.headerMapping.get(JSON.stringify(virtual)));

                    // The virtual index and the actual index should have the same row index,
                    // this is to place the cell in the correct position even if some of the 
                    // previous cells are spanning multiple rows.
                    while (virtual.row !== actual.row && virtual.col !== 0){
                        virtual = { row: sourceCell.row, col: virtual.col - 1 };
                        actual = JSON.parse(this.headerMapping.get(JSON.stringify(virtual)));
                    }

                    if (virtual.col === 0 ){
                        // insert the at the start of the row
                        this.table.rows[sourceCell.row].insertBefore(sourceCell.cell, this.table.rows[sourceCell.row].firstElementChild);

                        // Do the same for the theadCopy
                        this.theadCopy.rows[sourceCell.row].insertBefore(headersToMoveC[headersToMove.indexOf(sourceCell)].cell, this.theadCopy.rows[sourceCell.row].firstElementChild);
                    }
                    else {
                        // Get the target cell and insert the source cell in the correct position
                        let targetCell = this.table.rows[sourceCell.row].cells[actual.col];
                        targetCell.after(sourceCell.cell);

                        // Do the same for the theadCopy
                        let targetCellC = this.theadCopy.rows[sourceCell.row].cells[actual.col];
                        targetCellC.after(headersToMoveC[headersToMove.indexOf(sourceCell)].cell);
                    }

                    // Update the headerMapping and the inverseHeaderMapping
                    this.headerMapping = this.mapTableHeaderIndices();
                    this.inverseHeaderMapping = this.invertMap(this.headerMapping);
                });

                // Move the cells in the body. This is simpler than moving the cells in the header
                // because we are assuming that the cells in the body are not spanning multiple rows
                // nor columns.
                cells.forEach(sourceCell => {
                    // Calculate the column offset of the cell from the source cell
                    const colOffset = sourceCell.cellIndex - sourceMinCol;

                    // Get the new cell index
                    const newCellIndex = { row: sourceCell.parentElement.rowIndex, col: targetMaxCol + colOffset };
                    
                    // Get the target cell
                    const tragetCell = this.table.rows[newCellIndex.row].cells[newCellIndex.col];

                    // Remove the source cell from the table
                    const removedCell = sourceCell.parentElement.removeChild(sourceCell);

                    // Insert the cell at the new position
                    tragetCell.after(removedCell);
                });

                // Remove the placeholders
                placeholderes.forEach(placeholder => {
                    placeholder.remove();
                });

            }

            this.headerMapping = this.mapTableHeaderIndices();
            this.inverseHeaderMapping = this.invertMap(this.headerMapping);

            this.targetColumn.classList.remove('columnDragLineRight');
            this.sourceColumn = this.targetColumn = null;
        }
    }

    documentDragOver(event){
        if (!this.sourceRow && !this.sourceColumn) return;

        event.preventDefault();

        if (this.sourceRow){
            if (!this.allowDrag) return;
            this.allowDrag = false;

            // Remove the line drawn by the previous drag
            if (this.targetRow)
                this.targetRow.classList.remove('rowDragLineTop', 'rowDragLineBottom');
            
            // Update the target row
            this.targetRow = this.findClosestRow(event.clientY, Array.from(this.tbody.rows));

            // Get the centre of the target row
            const targetRowBounds = this.targetRow.getBoundingClientRect();
            const targetRowCentre = (targetRowBounds.top + targetRowBounds.bottom) / 2;

            // Draw a line at the top or bottom of the target row
            if (event.clientY < targetRowCentre) {
                this.targetRow.classList.add('rowDragLineTop');
            } else {
                this.targetRow.classList.add('rowDragLineBottom');
            }

            // This is to prevent the event from firing multiple times
            setTimeout(() => {
                this.allowDrag = true;
            }, 10);
        }
        else {
            if (!this.allowDrag) return;
            this.allowDrag = false;

            // Get the headers and remove the first 2 cells
            const headers = Array.from(this.thead.rows[this.colDragHandlesRowIndex].cells);
            headers.shift(); headers.shift();

            // Remove the line drawn by the previous drag
            if (this.targetColumn){
                this.targetColumn.classList.remove('columnDragLineLeft');
                this.targetColumn.classList.remove('columnDragLineRight');
            }
            
            // Update the target column
            this.targetColumn = this.findClosestCol(event.clientX, headers);

            // Get the centre of the target column
            const targetColumnBounds = this.targetColumn.getBoundingClientRect();
            const targetColumnCentre = (targetColumnBounds.left + targetColumnBounds.right) / 2;

            // Draw a line to the left or right of the target column
            if (event.clientX < targetColumnCentre) {
                this.targetColumn.classList.add('columnDragLineLeft');
            } else {
                this.targetColumn.classList.add('columnDragLineRight');
            }

            // This is to prevent the event from firing multiple times
            setTimeout(() => {
                this.allowDrag = true;
            }, 10);
        }
        
    }
    // ====================================== Event Listeners' Functions ======================================
}