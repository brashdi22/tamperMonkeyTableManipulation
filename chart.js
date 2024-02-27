class chart {
    constructor(chartType, xData, yData, xLabel, yLabel, xType, yType) {
        this.chartType = chartType;
        this.xLabel = xLabel;
        this.yLabel = yLabel;
        this.data = this.parseData(xData, yData);

        if (xType !== 'Numerical')
            this.xScale = 'category';
        else {
            this.xScale = 'linear';
            if (chartType === 'line')
                this.sortByX();
        }

        if (yType !== 'Numerical')
            this.yScale = 'category';
        else
            this.yScale = 'linear';

        
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

    /**
     * Sorts the data by the x values.
     */
    sortByX(){
        this.data.sort((a, b) => a.x - b.x);
    }

    createChartContainer() {
        // Delete the existing chart container if it exists
        const oldContainer = document.getElementById('chartContainer');
        if (oldContainer) oldContainer.remove();
        
        // Create a new chart container
        const chartContainer = document.createElement('chart-container');
        chartContainer.id = 'chartContainer';
        document.body.appendChild(chartContainer);
    
        // Set the width and height of the chart container then centre
        // it. (using the normal way to centre this div - which uses
        // transalte - makes the graph look blurry)
        const width = window.innerWidth * 0.6;
        const height = window.innerHeight * 0.8;
        chartContainer.style.width = `${width}px`;
        chartContainer.style.height = `${height}px`;
        chartContainer.style.marginLeft = `${-width / 2}px`;
        chartContainer.style.marginTop = `${-height / 2}px`;

        this.ctx = chartContainer.appendCanvas(width, height).getContext('2d');
    }
    
    plot(){
        if (this.chartType === 'scatter' || this.chartType === 'line' || this.chartType === 'bar') {
            let chart = new Chart(this.ctx, {
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
                                callback: (value, index, values) => {
                                    if (this.xScale === 'category') return this.data[index].x;
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
                                callback: (value, index, values) => {
                                    if (this.yScale === 'category') return this.data[index].y;
                                    return value.toLocaleString();
                                }
                            }
                        }
                    },
                    onClick: function(event, elements) {
                        if (elements.length) {
                            let clickedIndex = elements[0].index;
                            chart.data.datasets[0].data.splice(clickedIndex, 1);
                            chart.update();
                        }
                    }
                }
            });
        }
        else if (this.chartType === 'histogram') {
            let chart = new Chart(this.ctx, {
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
                    },
                    onClick: function(event, elements) {
                        if (elements.length) {
                            let clickedIndex = elements[0].index;
                            chart.data.datasets[0].data.splice(clickedIndex, 1);
                            chart.update();
                        }
                    }
                }
            });
        }
        else {
            let chart = new Chart(this.ctx, {
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