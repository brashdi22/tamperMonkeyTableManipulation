class TableObjToolbar extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.magnify = false;
        this.graphOptionsHidden = true;

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
                font-family: Arial, Helvetica, sans-serif;
                font-size: 12px;
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

            .inputFieldContainer select {
                appearance: auto;
                background-color: white;
                padding: 0 3px;
            }

            h6 {
                font-size: 12px;
                margin: 0;
                padding: 0;
                text-align: center;
            }

            #graphOptionsContainer {
                position: fixed;
                border: 1px solid black;
                border-radius: 5px;
                margin: 0;
                padding: 5px;
                width: 300px;
                height: 200px;
                background-color: #f8f8f8;
                top: -1px;
                left: -2px;
                transform: translateX(-100%);
                display: none;
            }

            form {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .inputFieldContainer {
                width: 100%;
                display: flex;
                flex-direction: row;
                gap: 5px;
            }

            label {
                min-width: 100px;
                background-color: transparent;
            }

            input {
                width:100%;
            }

            i {
                position: relative;
                padding: 0px 4px;
                border: 1px solid black;
                background-color: #ecdf7c;
                border-radius: 50%;
                cursor: context-menu;
            }

            .tooltip {
                position: absolute;
                background-color: white;
                border: 1px solid black;
                border-radius: 5px;
                padding: 5px;
                width: 200px;
                height: 100px;
                transform: translateX(-100%);
                top: 0;
                left: -1px;
            }

            #graphOptionsContainer .buttonsDiv {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                gap: 5px;
                width: 100%;
                height: 25px;
            }

            #graphOptionsContainer .buttonsDiv button {
                padding: 0px 2px;
                margin: 2px;
                width: 15%;
                cursor: pointer;
                background-color: white;
                border: 1px solid black;
            }

        `;
        let style = document.createElement('style');
        style.innerHTML = styleSheet;
        this.shadow.appendChild(style);
    }

    connectedCallback() {
        this.createToolBar();
        this.createGraphOptionsContainer();
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
        dataTypeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-288 0h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.8-7.2-16-16-16H16C7.2 64 0 71.2 0 80v336c0 17.7 14.3 32 32 32h464c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16z"/></svg>';
        dataTypeButton.onclick = async () => {
            if (this.graphOptionsHidden) {
                // Display the graphOptionsContainer
                this.graphOptionsHidden = false;
                this.shadow.getElementById('graphOptionsContainer').style.display = 'block';

                // Get the data type of the selected columns
                const dataType = await getColumnsToPlot();
                if (dataType){
                    const col1Name = this.shadow.getElementById('col1Name');
                    const col2Name = this.shadow.getElementById('col2Name');
                    // select the correct option in the select menu
                    col1Name.value = dataType[0][1];
                    col2Name.value = dataType[1][1];
                    // get the labels for the input fields
                    const label1 = col1Name.previousSibling;
                    const label2 = col2Name.previousSibling;
                    label1.innerHTML = dataType[0][0];
                    label2.innerHTML = dataType[1][0];
                }
            }
            else {
                // Hide the graphOptionsContainer
                this.graphOptionsHidden = true;
                this.shadow.getElementById('graphOptionsContainer').style.display = 'none';
                return;
            }                
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

    createGraphOptionsContainer() {
        // Create the container
        const container = document.createElement('div');
        container.id = 'graphOptionsContainer';

        // Create the title
        const title = document.createElement('h6');
        title.innerHTML = 'Graph Options';
        container.appendChild(title);

        // create a p tag to display
        const p = document.createElement('p');
        p.innerHTML = 'Confirm the data type of the selected columns: ';
        // Create an info icon
        const infoIcon = document.createElement('i');
        infoIcon.style.border = '1px solid black';
        infoIcon.className = 'info-icon';
        infoIcon.textContent = 'ℹ️';

        // Create a tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'This is some info about the data types';
        // Hide the tooltip by default
        tooltip.style.display = 'none';

        // Show the tooltip when the info icon is hovered over
        infoIcon.addEventListener('mouseover', () => {
            tooltip.style.display = 'block';
        });

        // Hide the tooltip when the mouse leaves the info icon
        infoIcon.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });

        infoIcon.appendChild(tooltip);
        p.appendChild(infoIcon);
        container.appendChild(p);

        container.appendChild(this.createDataTypesForm());

        const p2 = document.createElement('p');
        p2.innerHTML = 'Select the type of graph to plot: ';
        container.appendChild(p2);

        // Create a div to hold the buttons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttonsDiv';
        // Create the buttons
        const buttons = ['scatter', 'line', 'bar', 'histogram','pie'];
        buttons.forEach(button => {
            const buttonElement = document.createElement('button');
            buttonElement.type = 'button';
            buttonElement.id = `${button}Button`;
            buttonElement.innerHTML = button;
            buttonElement.disabled = true;
            buttonElement.onclick = () => {
                console.log(button);
            };
            buttonsDiv.appendChild(buttonElement);
        });

        container.appendChild(buttonsDiv);
        
        // Add the container to the shadow root
        this.shadow.appendChild(container);
    }

    createDataTypesForm() {
        const form = document.createElement('form');
        form.id = 'graphOptionsForm';

        // Create the first input field
        const div1 = document.createElement('div');
        div1.className = "inputFieldContainer";
        const input1 = document.createElement('select');
        input1.id = 'col1Name';
        // create a label for the input field
        const label1 = document.createElement('label');
        label1.innerHTML = 'Column 1';

        // Add the select options ('numerical', 'textual', 'ordinal', 'nominal')
        const options = ['numerical', 'textual', 'ordinal', 'nominal'];
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.innerHTML = option;
            input1.appendChild(optionElement);
        });

        div1.appendChild(label1);
        div1.appendChild(input1);
        form.appendChild(div1);


        // Create the second input field
        const div2 = document.createElement('div');
        div2.className = "inputFieldContainer";
        const input2 = document.createElement('select');
        input2.id = 'col2Name';
        // create a label for the input field
        const label2 = document.createElement('label');
        label2.innerHTML = 'Column 2';

        // Add the select options ('numerical', 'textual', 'ordinal', 'nominal')
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.innerHTML = option;
            input2.appendChild(optionElement);
        });

        div2.appendChild(label2);
        div2.appendChild(input2);
        form.appendChild(div2);

        // Add event listeners to the input fields to update
        // the available graph types.
        input1.addEventListener('change', () => {
            this.updateAvailableGraphs(input1.value, input2.value);
        });
        input2.addEventListener('change', () => {
            this.updateAvailableGraphs(input1.value, input2.value);
        });

        return form;
    }

    updateAvailableGraphs(type1, type2) {
        console.log(type1, type2);
        let enable = [];
        let disable = [];

        if (type1 === 'numerical' && type2 === 'numerical') {
            enable = ['scatter', 'line'];
            disable = ['bar', 'pie', 'histogram'];
        }
        else if (type1 === 'numerical' && type2 === 'textual' || type1 === 'textual' && type2 === 'numerical') {
            enable = ['bar', 'line', 'scatter'];
            disable = ['pie', 'histogram'];
        }
        else if (type1 === 'numerical' && (type2 === 'ordinal' || type2 === 'nominal') || type2 === 'numerical' && (type1 === 'ordinal' || type1 === 'nominal')) {
            enable = ['bar', 'histogram'];
            disable = ['pie', 'line', 'scatter'];
        }
        else {
            disable = ['bar', 'line', 'scatter', 'pie', 'histogram'];
        }

        // Enable
        enable.forEach(button => {
            this.shadow.getElementById(`${button}Button`).disabled = false;
        });

        // Disable
        disable.forEach(button => {
            this.shadow.getElementById(`${button}Button`).disabled = true;
        });
    }
}