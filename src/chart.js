class chart {
    constructor(chartType, xData, yData, xLabel, yLabel, xType, yType, slider=false) {
        this.chartType = chartType;
        this.xLabel = xLabel;
        this.yLabel = yLabel;
        this.data = this.parseData(xData, yData);

        this.colours = [
            '#FF6384', '#36A2EB', '#FFCE56', '#99ff00', '#9966FF',
            '#58ca49', '#24607a', '#C9CB3F', '#e00000', '#FA6900',
            '#E0E4CC', '#F38630', '#A7DBD8', '#D3FFCE', '#EB7E7F'
          ];

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
        this.createChartContainer(slider);
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

    assignColours(dataLength) {
        const assignedColours = [];
        for (let i = 0; i < dataLength; i++) {
          assignedColours.push(this.colours[i % this.colours.length]);
        }
        return assignedColours;
      }

    createChartContainer(slider) {
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

        // Add a slider to to change the number of bins histograms and pie charts
        if (this.chartType === 'histogram' && slider) {
            chartContainer.appendSlider(height, true);
            chartContainer.style.paddingRight = '60px';
        }
        else if (this.chartType === 'pie' && slider)
            chartContainer.appendSlider(height, false);


        this.ctx = chartContainer.appendCanvas(width, height).getContext('2d');
    }
    
    plot(){
        let chart;
        if (this.chartType === 'scatter' || this.chartType === 'line' || this.chartType === 'bar') {
            chart = new Chart(this.ctx, {
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
                    onClick: (event, elements) => {
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
            chart = new Chart(this.ctx, {
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
                    onClick: (event, elements) => {
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
            chart = new Chart(this.ctx, {
                type: 'pie',
                data: {
                    labels: this.data.map(e => e.x),
                    datasets: [{
                        label: 'Set 1',
                        data: this.data.map(e => e.y),
                        backgroundColor: this.assignColours(this.data.map(e => e.y).length)
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
        this.chart = chart;
    }

}