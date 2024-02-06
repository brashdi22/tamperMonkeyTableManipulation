class TableObj {
    static tablesCount = 0;

    constructor(tableElem){
        TableObj.tablesCount++;
        this.table = tableElem;

        this.tbody = this.table.tBodies[0];
        this.thead = this.table.tHead;

        if (this.thead === null)
            this.createThead();

        this.table.tabIndex = 0;

        this.ensureTheadCellsAreThs();
        this.replaceHeaders();
        this.addTableId();
        this.addRowSelectors();
        this.showColNameOnHover();
        this.addRowDragHandles();
        this.addColumnDragHandles();
        this.addSortButtons();
        this.addTableSettingsMenu();
        
        
        // this.table.className = "";
        this.table.classList.add("lib-tabl");

        // Create a copy of the table to be used if the user hits the reset button
        this.originalTable = this.table.cloneNode(true);

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

        this.addTableSpecificEventListeners();
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
     * Replaces the headers with a clone of their selves.
     * This is to remove any existing event listeners.
     */
    replaceHeaders(){
        // Get the last row of the thead
        const headers = Array.from(this.thead.rows[this.thead.rows.length - 1].cells);
        headers.forEach(header => {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
        });
    }

    /**
     * Ensure all cells in the thead are 'th's.
     */
    ensureTheadCellsAreThs(){
        const rows = Array.from(this.thead.rows);
        rows.forEach(row => {
            const cells = Array.from(row.cells);
            cells.forEach(cell => {
                if (cell.tagName !== 'TH'){
                    const th = document.createElement('th');
                    th.innerHTML = cell.innerHTML;
                    th.style.cssText = cell.style.cssText;
                    row.replaceChild(th, cell);
                }
            });
        });
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
        const th = document.createElement("th");
        th.style.cursor = 'default';
        this.thead.rows[0].insertBefore(th, this.thead.rows[0].firstElementChild);
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
        const tr = document.createElement("tr");
        this.thead.insertBefore(tr, this.thead.rows[0]);

        for (let i = 0; i < 2; i++){
            const cell = document.createElement("th");
            cell.style.cursor = 'default';
            tr.appendChild(cell);
        }

        const numOfCols = this.thead.rows[1].cells.length;
        for (let i = 0; i < numOfCols-2; i++){
            // Create a cell
            const cell = document.createElement("th");
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
                this.sourceColumn = event.target.cellIndex;
            });
        });
    }

    addSortButtons(){
        // Get the last row of the thead
        const row = this.thead.rows[this.thead.rows.length - 1];
        const cells = Array.from(row.cells);
        cells.shift();
        // Add a button to each cell
        cells.forEach(cell => {
            const button = document.createElement('button');
            button.className = 'sortButton';
            cell.appendChild(button);
        });
    }

    addFunctionsToSortButtons(){
        const buttons = this.table.querySelectorAll('.sortButton');
        buttons.forEach(button => {
            const cell = button.parentElement;
            cell.setAttribute('TableObj-col-sort-asc', 'true');
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"/></svg>';
            button.onclick = () => {
                sortTableByColumn(this.table, cell.cellIndex);
            }
        });

        // change the innerHTML of the 'index' column to indicate that it the
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

        // ================================= Reset option =================================
        li = document.createElement('li');
        li.textContent = 'Reset';
        li.className = 'TableObjResetButton';
        li.style.cursor = 'pointer';
        li.addEventListener('mousedown', () => {li.style.backgroundColor = '#949090';});
        li.addEventListener('mouseup', () => {li.style.backgroundColor = '';});
        li.addEventListener('click', () => {
            this.table.parentElement.replaceChild(this.originalTable, this.table);
            this.table = this.originalTable;
            this.originalTable = this.table.cloneNode(true);
            this.tbody = this.table.tBodies[0];
            this.thead = this.table.tHead;

            // Delete the menu container and create a new one (to reinitialise the event listeners)
            const container = document.getElementById(`${this.table.id}-menuContainer`);
            container.parentElement.removeChild(container);
            this.addTableSettingsMenu();

            this.initialiseTableSpecificVariablesAndListeners();
               
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
                for (let j = 0; j < cells.length; j++) {
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
            this.mouseDownH = true;
            if (this.endCell.cellIndex === 1)
                this.selecetWholeTable();
            else if (this.endCell.cellIndex !== 0){
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
    }

    documentMouseUp(){
        if (!this.mouseDownH && !this.mouseDownR && !this.mouseDown) return;
        document.body.classList.remove('cursor-crosshair');

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

        // Update the graphs options if the graphs tab is open
        const toolbar = document.getElementById('TableObjToolbar');
        if (!toolbar.graphOptionsHidden)
            toolbar.updateSelectedColumns();

        this.mouseDown = false;
        this.mouseDownH = false;
        this.mouseDownR = false;

        this.checkAllCellsInRowSelected();
        this.checkAllCellsInColumnSelected();
        
        
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
            this.selectedHeaders = new Array(this.thead.rows[0].cells.length).fill(false);
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
        this.sourceRow = null;
        this.sourceColumn = null;
    }

    documentDragOver(event){
        if (!this.sourceRow && !this.sourceColumn) return;

        event.preventDefault();

        if (this.sourceRow){
            let targetRow = this.findClosestRow(event.clientY, Array.from(this.tbody.rows));

            if (this.sourceRow.rowIndex !== targetRow.rowIndex){
                if (targetRow.rowIndex > this.sourceRow.rowIndex)
                    targetRow.after(this.sourceRow);
                else
                    targetRow.before(this.sourceRow);
            }
        }
        else {
            const targetColumn = this.findClosestCol(event.clientX, Array.from(this.thead.rows[0].cells)).cellIndex;

            if (this.sourceColumn !== targetColumn && targetColumn > 1){
                const rows = this.table.rows;
                for (let i = 0; i < rows.length; i++){
                    const cell1 = rows[i].cells[this.sourceColumn];
                    const cell2 = rows[i].cells[targetColumn];

                    // Remove the source cell from the row
                    const removedCell = rows[i].removeChild(cell1);
                    if (targetColumn > this.sourceColumn)
                        cell2.after(removedCell);
                    else
                        cell2.before(removedCell);
                }
                this.sourceColumn = targetColumn;
            }
        }
    }
    // ====================================== Event Listeners' Functions ======================================

}