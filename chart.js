class chart {
    constructor(chartType, xData, yData, xLabel, yLabel, xType, yType) {
        this.chartType = chartType;
        this.xLabel = xLabel;
        this.yLabel = yLabel;

        if (xType !== 'numerical')
            this.xScale = 'category';
        else
            this.xScale = 'linear';

        if (yType !== 'numerical')
            this.yScale = 'category';
        else
            this.yScale = 'linear';

        this.data = this.parseData(xData, yData);
        this.margin = {top: 40, right: 40, bottom: 60, left: 70};
        this.createChartContainer();
        this.plot();

    }

    /**
     * Parses the data into an array of objects with x and y properties.
     * 
     * @param {Array} xData 
     * @param {Array} yData 
     * @returns {object} an array with n objects, each with an x and y property. 
     *                   object[i].x = xData[i], object[i].y = yData[i].
     */
    parseData(xData, yData){
        return xData.map((e, i) => {
            return {x: e, y: yData[i]};
        });
    }

    createChartContainer() {
        // Delete the existing chart container if it exists
        const oldContainer = document.getElementById('chartContainer');
        if (oldContainer) oldContainer.remove();
        
        // Create a new chart container
        const chartContainer = document.createElement('div');
        chartContainer.id = 'chartContainer';
        
        // Create a close button
        const closeButton = document.createElement('button');
        closeButton.id = 'chartCloseButton';
        closeButton.textContent = 'x';
        closeButton.onclick = function() {
            chartContainer.remove();
        };
    
        // Set the width and height of the chart container then centre
        // it. (using the normal way to centre this div - which uses
        // transalte - makes the graph look blurry)
        const width = window.innerWidth * 0.6;
        const height = window.innerHeight * 0.8;
        chartContainer.style.width = `${width}px`;
        chartContainer.style.height = `${height}px`;
        chartContainer.style.marginLeft = `${-width / 2}px`;
        chartContainer.style.marginTop = `${-height / 2}px`;

        // Insert a canvas element inside the chart container
        const canvas = document.createElement('canvas');
        canvas.id = 'chartCanvas';
        canvas.width = parseInt(chartContainer.style.width, 10);
        canvas.height = parseInt(chartContainer.style.height, 10);
        canvas.style.display = 'block';
        canvas.style.margin = 'auto';
        chartContainer.appendChild(canvas);
    
        // Insert the close button and chart container into the DOM
        chartContainer.appendChild(closeButton);
        document.body.appendChild(chartContainer);
    }
    
    plot(){
        let ctx = document.getElementById('chartCanvas').getContext('2d');

        if (this.chartType === 'scatter' || this.chartType === 'line' || this.chartType === 'bar') {
            new Chart(ctx, {
                type: this.chartType,
                data: {
                    datasets: [{
                        label: 'Set 1',
                        data: this.data,
                        backgroundColor: 'rgba(0, 123, 255, 0.5)',
                        borderColor: 'rgba(0, 123, 255, 1)'
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: this.xScale,
                            title: {
                                display: true,
                                text: this.xLabel
                            },
                            ticks: {
                                callback: function(value, index, values) {
                                    return value.toLocaleString();
                                }
                            }
                        },
                        y: {
                            type: this.yScale,
                            title: {
                                display: true,
                                text: this.yLabel
                            },
                            ticks: {
                                callback: function(value, index, values) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
        else if (this.chartType === 'histogram') {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.data.map(e => e.x),
                    datasets: [{
                        label: 'Set 1',
                        data: this.data.map(e => e.y),
                        backgroundColor: 'rgba(0, 123, 255, 0.5)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1,
                        barPercentage: 1.0,
                        categoryPercentage: 1.0
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: this.xScale,
                            title: {
                                display: true,
                                text: this.xLabel
                            },
                        },
                        y: {
                            type: this.yScale,
                            title: {
                                display: true,
                                text: this.yLabel
                            },
                            beginAtZero: true,
                            ticks: {
                                precision: 0 // Only whole numbers
                            }
                        }
                    }
                }
            });
        }
        else {
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: this.data.map(e => e.x),
                    datasets: [{
                        label: 'Set 1',
                        data: this.data.map(e => e.y)
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => {
                                    let label = context.label || '';
            
                                    if (label) label += ': ';
                                    if (context.parsed !== null) {
                                        const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                        const percentage = (context.parsed * 100 / total).toFixed(2) + '%';
                                        label += percentage;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

}