// const chart_data = require('../output.json')

const row_width = 2
const row_height = 10

fetch('./output.json')
  .then(response => response.json())
  .then(chart_data => {
    // console.log(chart_data);

	var gridtext = chart_data.data;
	var borders = chart_data.borders;
	var num_rows = chart_data.num_rows;
	var num_cols = chart_data.num_cols;
	var colourmap = chart_data.colours;
	var row_names = chart_data.row_names;
	console.log(colourmap)

	function gridData() {
		var gridarray = new Array();
		var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
		var ypos = 1;
		var width = row_width;
		var height = row_height;
		var click = 0;
		
		// iterate for rows	
		for (var row = 0; row < num_rows; row++) {
			gridarray.push( new Array() );
			
			// iterate for cells/columns inside rows
			for (var column = 0; column < num_cols; column++) {
				gridarray[row].push({
					x: xpos,
					y: ypos,
					row: row,
					col: column,
					width: width,
					height: height,
					click: click,
					label: gridtext[row][column],
					row_name: row_names[row],
					top: borders[row][column][0],
					right: borders[row][column][1],
					bottom: borders[row][column][2],
					left: borders[row][column][3],
				})
				// increment the x position. I.e. move it over by 50 (width variable)
				xpos += width;
			}
			// reset the x position after a row is complete
			xpos = 1;
			// increment the y position for the next row. Move it down 50 (height variable)
			ypos += height;	
		}
		return gridarray;
	}

	var gridData = gridData();
	console.log(gridData);

	var grid_width = row_width*num_cols + "px";
	var grid_height = row_height*num_rows + "px";
	console.log("Width: " + grid_width);
	console.log("Height: " + grid_height);


	var grid = d3.select("#grid")
		.append("svg")
		.attr("width",grid_width)
		.attr("height",grid_height);
		
	var row = grid.selectAll(".row")
		.data(gridData)
		.enter().append("g")
		.attr("class", "row");
		
	var column = row.selectAll(".square")
		.data(function(d) { return d; })
		.enter().append("rect")
		.attr("class","square")
		.attr("x", function(d) { return d.x; })
		.attr("y", function(d) { return d.y; })
		.attr("width", function(d) { return d.width; })
		.attr("height", function(d) { return d.height; })
		.style("fill", function(d) { return colourmap[d.label]; })
		.attr("fill-opacity", function(d) { return d.label==null ? 0.2 : 1.0; })
		// .style("stroke", "#222");

	var row_label = row.selectAll(".row_label")
		.data(function (d) { return d; })
		.enter().append("text")
		.attr("class", "row_label")
		.attr("x", row_width / 2)
		.attr("y", function(d) { return d.y + d.height / 2; })
		// .attr("fill", "black")
		.style("font-size", "8px")
		.text(function(d) { return d.col==0 ? d.row_name : null; });


	var top_border = row.selectAll(".top_border")
		.data(function (d) { return d; })
		.enter().append("line")
		.attr("class", "top_border")
		.attr("x1", function(d) {return d.x})
		.attr("y1", function(d) {return d.y})
		.attr("x2", function(d) {return d.x+d.width})
		.attr("y2", function(d) {return d.y})
		.style("stroke", "#222")
		.style("stroke-width", function(d) {return d.top ? 1 : 0});

	var right_border = row.selectAll(".right_border")
		.data(function (d) { return d; })
		.enter().append("line")
		.attr("class", "right_border")
		.attr("x1", function(d) {return d.x+d.width})
		.attr("y1", function(d) {return d.y})
		.attr("x2", function(d) {return d.x+d.width})
		.attr("y2", function(d) {return d.y+d.height})
		.style("stroke", "#222")
		.style("stroke-width", function(d) {return d.right ? 1 : 0});
	
	// var bottom_border = row.selectAll(".top_border")
	// 	.data(function (d) { return d; })  // Bind data only if the border should be present
	// 	.enter().append("line")
	// 	.attr("class", "top_border")
	// 	.attr("x1", function(d) {return d.x})
	// 	.attr("y1", function(d) {return d.y})
	// 	.attr("x2", function(d) {return d.x+d.width})
	// 	.attr("y2", function(d) {return d.y})
	// 	.style("stroke", "#222")
	// 	.style("stroke-width", function(d) {return d.top ? 1 : 0});

	// var left_border = row.selectAll(".top_border")
	// 	.data(function (d) { return d; })  // Bind data only if the border should be present
	// 	.enter().append("line")
	// 	.attr("class", "top_border")
	// 	.attr("x1", function(d) {return d.x})
	// 	.attr("y1", function(d) {return d.y})
	// 	.attr("x2", function(d) {return d.x+d.width})
	// 	.attr("y2", function(d) {return d.y})
	// 	.style("stroke", "#222")
	// 	.style("stroke-width", function(d) {return d.top ? 1 : 0});

	})
	.catch(error => {
		console.error('Error loading the JSON file:', error);
	});