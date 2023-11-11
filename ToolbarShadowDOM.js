class TableObjToolbar extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });

        // Include fontawesome
        const fontAwesome = document.createElement('link');
        fontAwesome.setAttribute('rel', 'stylesheet');
        fontAwesome.setAttribute('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
        this.shadow.appendChild(fontAwesome);

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
        highlightButton.innerHTML = '<i class="fas fa-highlighter"></i>';
        highlightButton.onclick = () => {
            highlight(coloursMap[this.shadow.getElementById('highlightColour').value]);
        };

        // Create a button to hide selected rows/columns
        let hideButton = document.createElement('button');
        hideButton.id = 'hideButton';
        hideButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
        hideButton.onclick = hideColsRows;

        // Create a button to show hidden rows/columns
        let showButton = document.createElement('button');
        showButton.id = 'showButton';
        showButton.innerHTML = '<i class="fas fa-eye"></i>';
        showButton.onclick = showColsRows;
    
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
    }
}