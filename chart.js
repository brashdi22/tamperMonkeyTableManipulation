// class Chart {
//     constructor(chartType, xData, yData, xLabel, yLabel) {
//         this.chartType = chartType;
//         this.data = this.parseData(xData, yData);
//         this.margin = {top: 40, right: 40, bottom: 60, left: 70};

//         this.createChartContainer();
//         this.setChartDimensions();
//         this.setRangesAndDomains();
//         this.setChartSvgAndAxes();
//         this.appendTitleAndLabels(xLabel, yLabel);

//         this.plot();
//     }

//     parseData(xData, yData){
//         // Create an array of objects from xData and yData
//         return xData.map((e, i) => {
//             return {x: e, y: yData[i]};
//         });
//     }

//     setChartDimensions(){
//         const chartContainer = document.getElementById('chartContainer');
//         const containerWidth = chartContainer.clientWidth;
//         const containerHeight = chartContainer.clientHeight;

//         this.width = containerWidth - this.margin.left - this.margin.right,
//         this.height = containerHeight - this.margin.top - this.margin.bottom;
//     }

//     setRangesAndDomains(){
//         // Set the domains and ranges
//         if (isNaN(this.data[0].x)) {
//             this.x = d3.scaleBand()
//                 .domain(this.data.map(d => d.x))
//                 .range([0, this.width])
//                 .padding(0.1);
//         }
//         else {
//             this.x = d3.scaleLinear()
//                 .domain(d3.extent(this.data, d => +d.x))
//                 .range([0, this.width]);
//         }
        
//         this.y = d3.scaleLinear()
//             .domain(d3.extent(this.data, d => +d.y))
//             .range([this.height, 0]);
//     }

//     setChartSvgAndAxes(){
//         // Append the svg object to the body of the page
//         this.svg = d3.select("#chartContainer")
//             .append("svg")
//             .attr("width", this.width + this.margin.left + this.margin.right)
//             .attr("height", this.height + this.margin.top + this.margin.bottom)
//         .append("g")
//             .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

//         // Add the X Axis
//         if (isNaN(this.data[0].x)) {
//             this.svg.append("g")
//                 .attr("transform", `translate(0,${this.height})`)
//                 .call(d3.axisBottom(this.x))
//                 .selectAll("text")
//                 .style("text-anchor", "end")
//                 .attr("dx", "-1em")
//                 .attr("dy", "-0.65em")
//                 .attr("transform", "rotate(-90)");
//         }
//         else {
//             this.svg.append("g")
//                 .attr("transform", `translate(0,${this.height})`)
//                 .call(d3.axisBottom(this.x));
//         }
            

//         // Add the Y Axis
//         this.svg.append("g")
//             .call(d3.axisLeft(this.y));
//     }

//     appendTitleAndLabels(xLabel, yLabel){
//         // Add the x axis label
//         this.svg.append("text")
//             .attr("text-anchor", "middle")
//             .attr("transform", `translate(${this.width / 2}, ${this.height + 40})`)
//             .text(xLabel);

//         // Add the y axis label
//         this.svg.append("text")
//             .attr("text-anchor", "middle")
//             .attr("transform", `translate(-50, ${this.height / 2}) rotate(-90)`)
//             .text(yLabel);

//         // Add the title
//         const title = `${yLabel} vs ${xLabel}`;
//         this.svg.append("text")
//         .attr("x", (this.width / 2))             
//         .attr("y", 0 - (this.margin.top / 2))
//         .attr("text-anchor", "middle")  
//         .style("font-size", "16px") 
//         .style("text-decoration", "underline")  
//         .text(title);

//     }


//     createChartContainer(){
//         // Delete the existing chart container if it exists
//         const oldContainer = document.getElementById('chartContainer');
//         if (oldContainer) oldContainer.remove();
    
//         const chartContainer = document.createElement('div');
//         chartContainer.id = 'chartContainer';
        
//         const closeButton = document.createElement('button');
//         closeButton.id = 'chartCloseButton';
//         closeButton.textContent = 'x';
//         closeButton.onclick = function() {
//             chartContainer.remove();
//         };
    
//         // Get the dimensions of the screen 
//         const screenWidth = window.innerWidth;
//         const screenHeight = window.innerHeight;
//         // Set the width and height of the chart container
//         chartContainer.style.width = `${screenWidth * 0.6}px`;
//         chartContainer.style.height = `${screenHeight * 0.8}px`;
    
//         chartContainer.appendChild(closeButton);
//         document.body.appendChild(chartContainer);
//     }

//     plot(){
//         if (this.chartType === 'scatter') {
//             this.plotScatter();
//         } else if (this.chartType === 'line') {
//             this.plotLine();
//         }
//     }

//     plotScatter(){
//         // Add dots
//         this.svg.append('g')
//             .selectAll("dot")
//             .data(this.data)
//             .enter()
//             .append("circle")
//                 .attr("cx", d => { return this.x(d.x); })
//                 .attr("cy", d => { return this.y(d.y); })
//                 .attr("r", 5)
//                 .style("fill", "#69b3a2");
//     }

//     plotLine(){
//         const line = d3.line()
//             .x(d => this.x(d.x))
//             .y(d => this.y(d.y));

//         // Add the line
//         this.svg.append("path")
//             .datum(this.data)
//             .attr("fill", "none")
//             .attr("stroke", "steelblue")
//             .attr("stroke-width", 1.5)
//             .attr("d", line);
//     }  
// }

class chrt {
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
            let myScatterChart = new Chart(ctx, {
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
}