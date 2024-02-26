class ChartContainer extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        const styleSheet = `
            .chartContainer {
                width: 100%;
                height: 100%;
            }

            #chartCloseButton {
                width: 20px;
                height: 20px;
                background-color: red;
                border: none;
                border-radius: 50%;
                position: absolute;
                transform: translate(40%, -40%);
                right: 0;
                top: 0;
                cursor: pointer;
            }
        `;

        // Append the style to the shadow DOM
        let style = document.createElement('style');
        style.innerHTML = styleSheet;
        this.shadow.appendChild(style);

        // Create and append the close button
        const closeButton = document.createElement('button');
        closeButton.id = 'chartCloseButton';
        closeButton.innerText = 'x';
        closeButton.onclick = () => {
            this.remove();
        };
        this.shadow.appendChild(closeButton);
    }

    appendCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.id = 'chartCanvas';
        canvas.width = parseInt(width, 10);
        canvas.height = parseInt(height, 10);
        canvas.style.display = 'block';
        canvas.style.margin = 'auto';

        this.shadow.appendChild(canvas);

        return canvas;
    }
}