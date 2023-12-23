class TableObjToolbar extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.magnify = false;

        // Add the stylesheet to the page
        const styleSheet = `
            button {
                padding: 0;
                margin: 0;
                width: 50%;
                height: 100%;
                cursor: pointer;
                background-color: #f8f9fa;
                border: 1px solid transparent;
                line-height: 1.5;
                border-radius: .25rem;
                transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
            }
            
            div {
                background-color: #f8f8f8;
                margin: 2px 0px;
                width: 40px;
                height: 20px;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 2px;
            }
            
            select {
                appearance: none;
                -moz-appearance: none;
                -webkit-appearance: none;
                background: transparent;
                width: 30%;
                height: 100%;
                border-radius: 5px;
            }
        `;
        let style = document.createElement('style');
        style.innerHTML = styleSheet;
        this.shadow.appendChild(style);
    }

    connectedCallback() {
        this.createToolBar();
    }

    createToolBar() {
        // Create a button to highlight selected cells
        let highlightButton = document.createElement('button');
        highlightButton.id = 'highlightButton';

        highlightButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 544 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M0 479.98L99.92 512l35.45-35.45-67.04-67.04L0 479.98zm124.61-240.01a36.592 36.592 0 0 0-10.79 38.1l13.05 42.83-50.93 50.94 96.23 96.23 50.86-50.86 42.74 13.08c13.73 4.2 28.65-.01 38.15-10.78l35.55-41.64-173.34-173.34-41.52 35.44zm403.31-160.7l-63.2-63.2c-20.49-20.49-53.38-21.52-75.12-2.35L190.55 183.68l169.77 169.78L530.27 154.4c19.18-21.74 18.15-54.63-2.35-75.13z"/></svg>';
        highlightButton.onclick = () => {
            highlight(coloursMap[this.shadow.getElementById('highlightColour').value]);
        };

        // Create the colour select dropdown
        let colourSelect = document.createElement('select');
        colourSelect.id = 'highlightColour';
        ['#ebe052', '#d5e6ed', '#9bd49e', 'white'].forEach(colour => {
            let option = document.createElement('option');
            option.value = colour;
            option.style.backgroundColor = colour;
            colourSelect.appendChild(option);
        });

        // Change the background colour of the select menu to the selected colour
        colourSelect.onchange = function() {
            this.style.backgroundColor = this.value;
        };

        // Select the first option by default
        colourSelect.selectedIndex = 0;
        colourSelect.style.backgroundColor = colourSelect.value;
        

        // Create a button to hide selected rows/columns
        let hideButton = document.createElement('button');
        hideButton.id = 'hideButton';
        hideButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"/></svg>'
        hideButton.onclick = hideColsRows;

        // Create a button to show hidden rows/columns
        let showButton = document.createElement('button');
        showButton.id = 'showButton';
        showButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/></svg>';
        showButton.onclick = showColsRows;
    
        // Create a button to toggle the magnifying glass
        let magnifyButton = document.createElement('button');
        magnifyButton.id = 'magnifyButton';
        magnifyButton.style.margin = '0 auto';
        magnifyButton.style.width = '90%';
        magnifyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M304 192v32c0 6.6-5.4 12-12 12h-56v56c0 6.6-5.4 12-12 12h-32c-6.6 0-12-5.4-12-12v-56h-56c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h56v-56c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v56h56c6.6 0 12 5.4 12 12zm201 284.7L476.7 505c-9.4 9.4-24.6 9.4-33.9 0L343 405.3c-4.5-4.5-7-10.6-7-17V372c-35.3 27.6-79.7 44-128 44C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208c0 48.3-16.4 92.7-44 128h16.3c6.4 0 12.5 2.5 17 7l99.7 99.7c9.3 9.4 9.3 24.6 0 34zM344 208c0-75.2-60.8-136-136-136S72 132.8 72 208s60.8 136 136 136 136-60.8 136-136z"/></svg>';
        magnifyButton.onclick = () => {
            this.magnify = !this.magnify;
            toggleMagnify(this.magnify);
        };

        // Create a button to determine the data type of the selected column
        let dataTypeButton = document.createElement('button');
        dataTypeButton.id = 'dataTypeButton';
        dataTypeButton.style.margin = '0 auto';
        dataTypeButton.style.width = '90%';
        dataTypeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><path d="M224 0C100.3 0 0 100.3 0 224s100.3 224 224 224 224-100.3 224-224S347.7 0 224 0zm0 416c-88.4 0-160-71.6-160-160 0-88.4 71.6-160 160-160 88.4 0 160 71.6 160 160 0 88.4-71.6 160-160 160z"/></svg>';
        dataTypeButton.onclick = async () => {
            const dataType = await getColumnCellsContent();
            if (dataType)
                console.log(dataType);
        };
        

        // Add the elements to the shadow root

        // Highlight
        let div = document.createElement('div');
        div.className = 'buttonsDiv';
        div.appendChild(highlightButton);
        div.appendChild(colourSelect);
        this.shadow.appendChild(div);

        // Show/Hide
        div = document.createElement('div');
        div.className = 'buttonsDiv';
        div.appendChild(hideButton);
        div.appendChild(showButton);
        this.shadow.appendChild(div);

        // Magnify
        div = document.createElement('div');
        div.className = 'buttonsDiv';
        div.appendChild(magnifyButton);
        this.shadow.appendChild(div);

        // Data Type
        div = document.createElement('div');
        div.className = 'buttonsDiv';
        div.appendChild(dataTypeButton);
        this.shadow.appendChild(div);
    }
}