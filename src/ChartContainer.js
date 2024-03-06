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

            .slider {
                position: absolute;
                right: 10px;
                height: 20px;
                transform: rotate(270deg) translate(50%, 0%);
                transform-origin: right;
                z-index: 1;
            }

            .sliderLabel {
                font-size: 12px;
                position: absolute;
                right: 22px;
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

    appendSlider(width, histogram=true) {
        const slider = document.createElement('input');
        slider.className = 'slider';
        slider.type = 'range';
        slider.min = 2;
        slider.max = 10;
        slider.value = 6;
        slider.style.width = `${width/4}px`;
        slider.style.top = `${width/2}px`;

        // Add a label to the slider
        const label = document.createElement('label');
        label.className = 'sliderLabel';
        label.for = 'slider';
        label.innerText = 'Bins:\n' + slider.value;
        label.style.top = `${width/2}px`;

        if (histogram) {
            slider.oninput = () => {
                label.innerText = 'Bins:\n' + slider.value;
    
                // Get the toolbar to access its methods
                const toolbar = this.getRootNode().getElementById('TableObjToolbar');
    
                // Recalculate the frequency based on the new number of bins
                const [x, y] = toolbar.calculateFrequency(toolbar.cleanNumericalData(toolbar.col1data), slider.value);
                
                // Parse the data and update the chart
                const chartInstance = toolbar.chart;
                chartInstance.data = chartInstance.parseData(x, y);
                chartInstance.chart.data.datasets[0].data = chartInstance.data;
                chartInstance.chart.data.labels = x;
                chartInstance.chart.update();
            }
        }
        else {
            slider.oninput = () => {
                label.innerText = 'Bins:\n' + slider.value;
    
                // Get the toolbar to access its methods
                const toolbar = this.getRootNode().getElementById('TableObjToolbar');
    
                // Recalculate the frequency based on the new number of bins
                const [x, y] = toolbar.calculateFrequency(toolbar.cleanNumericalData(toolbar.col1data), slider.value);
                
                // Parse the data and update the chart
                const chartInstance = toolbar.chart;
                chartInstance.chart.data.datasets[0].data = y;
                chartInstance.chart.data.labels = x;
                chartInstance.chart.update();
            }
        }
        


        
        this.shadow.appendChild(label);
        this.shadow.appendChild(slider);

        return slider;
    }
}