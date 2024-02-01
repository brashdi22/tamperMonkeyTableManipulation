class chart {
    constructor(chartType, xData, yData, xLabel, yLabel) {
        this.chartType = chartType;
        this.xLabel = xLabel;
        this.yLabel = yLabel;

        if (isNaN(xData[0]))
            this.xScale = 'category';
        else
            this.xScale = 'linear';

        if (isNaN(yData[0]))
            this.yScale = 'category';
        else
            this.yScale = 'linear';

        this.data = this.parseData(xData, yData);
        this.margin = {top: 40, right: 40, bottom: 60, left: 70};
        this.createChartContainer();
        this.plot();

    }

    parseData(xData, yData){
        // Create an array of objects from xData and yData
        return xData.map((e, i) => {
            return {x: e, y: yData[i]};
        });
    }

    createChartContainer() {
        // Delete the existing chart container if it exists
        const oldContainer = document.getElementById('chartContainer');
        if (oldContainer) oldContainer.remove();
    
        const chartContainer = document.createElement('div');
        chartContainer.id = 'chartContainer';
        
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
        canvas.width = chartContainer.style.width;
        canvas.height = chartContainer.style.height;
        chartContainer.appendChild(canvas);
    
        chartContainer.appendChild(closeButton);
        document.body.appendChild(chartContainer);
    }
    
    plot(){
        let ctx = document.getElementById('chartCanvas').getContext('2d');

        if (this.chartType === 'scatter' || this.chartType === 'line' || this.chartType === 'bar') {
            // Create the scatter chart
            new Chart(ctx, {
                type: this.chartType,
                data: {
                    datasets: [{
                        label: this.yLabel,
                        data: this.data,
                        backgroundColor: 'rgba(255, 99, 132, 1)',
                        borderColor: 'rgba(255, 99, 132, 1)'
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
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Removes any non-numerical characters.
     * 
     * @param {Array} data An array of strings
     * @returns {cleanedData} The data with only numerical characters
     */
    cleanNumericalData(data){
        const cleanedData = [];
        data.forEach(row => {
            row = row.replace(/[^0-9.]/g, '');
            cleanedData.push(row);
        });
        return cleanedData;
    }

    /**
     * Returns the number of occurences of each unique value in the data.
     * 
     * @param {Array<string>} data An array of strings
     * @returns {Array<Array>} An array of 2 arrays. The first array contains the unique values, and the second array contains the number of occurences of each unique value.
     */
    getOccurences(data) {
        // Get the unique values
        const uniqueValues = [...new Set(data)];

        // Create a map of the unique values and their occurences
        const occurences = new Map();
        uniqueValues.forEach(value => {
            occurences.set(value, 0);
        });

        data.forEach(row => {
            occurences.set(row, occurences.get(row) + 1);
        });

        // Convert the map to 2 arrays
        const uniqueValuesArray = [];
        const occurencesArray = [];
        occurences.forEach((value, key) => {
            uniqueValuesArray.push(key);
            occurencesArray.push(value);
        });

        return [uniqueValuesArray, occurencesArray];
    }

    /** 
     * Divides the given numerical data into ranges then calculates the frequency of each range.
     * 
     * @param {Array<number>} data An array of numbers
     * @param {number} numberOfBins The number of ranges to divide the data into
     * @returns {Array<Array>} An array of 2 arrays. The first array contains the ranges, and the second array contains the frequency of each range.
    */
    calculateFrequency(data, numberOfBins=6) {
        if (data.length === 0 || numberOfBins <= 0) {
            return new Map();
        }
    
        const min = Math.min(...data);
        const max = Math.max(...data);
        const rangeSize = (max - min) / numberOfBins;
    
        let frequency = new Map();
    
        // Initialize frequency map with ranges
        for (let i = 0; i < numberOfBins; i++) {
            const rangeStart = min + i * rangeSize;
            const rangeEnd = rangeStart + rangeSize;
            frequency.set(`${rangeStart.toFixed(2)}-${rangeEnd.toFixed(2)}`, 0);
        }
    
        // Count frequencies
        for (let num of data) {
            const index = Math.min(Math.floor((num - min) / rangeSize), numberOfBins - 1);
            const rangeStart = min + index * rangeSize;
            const rangeEnd = rangeStart + rangeSize;
            const key = `${rangeStart.toFixed(2)}-${rangeEnd.toFixed(2)}`;
            frequency.set(key, frequency.get(key) + 1);
        }

        // Convert the map to 2 arrays
        const uniqueValuesArray = [];
        const occurencesArray = [];
        frequency.forEach((value, key) => {
            uniqueValuesArray.push(key);
            occurencesArray.push(value);
        });
    
        return [uniqueValuesArray, occurencesArray];
    }
}