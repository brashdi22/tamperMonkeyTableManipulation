class TableObj {
    static tablesCount = 0;

    constructor(tableElem){
        TableObj.tablesCount++;
        this.table = tableElem;
    
        this.tbody = this.table.tBodies[0];
        this.thead = this.table.tHead;

        if (this.thead === null)
            this.createThead();

        this.addRowSelectors();
        this.addTableId();
        this.addTableSettingsMenu();
        
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

    // Add an id to the table if it does not have one.
    addTableId(){
        if (!this.table.id){
            this.table.id = `TableObj-table${TableObj.tablesCount}`;
        }
    }

    addRowSelectors(){
        const th = document.createElement("th");
        th.className = "rowSelector";
        th.textContent = "";
        this.thead.rows[0].insertBefore(th, this.thead.rows[0].firstElementChild);

        const rows = Array.from(this.tbody.rows);

        for (let i = 0; i < rows.length; i++){
            const cell = rows[i].insertCell(0);
            cell.textContent = i + 1;
            cell.className = "rowSelector";
        }
        
    }

    // Add table settings dropdown menu above each table
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
            // TO DO: the rowSelectors should be hidden/shown as well

        });
        nestedLi.appendChild(checkbox);
        nestedLi.appendChild(label);
        submenue.appendChild(nestedLi);


        columns = Array.from(this.thead.rows[0].cells).slice(1);

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