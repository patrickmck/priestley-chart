// import * as d3 from 'd3'
const row_width = 2
const row_height = 20

const opacity_low = 0.6
const opacity_high = 0.8

fetch('./grid_contents.json')
  .then(response => response.json())
  .then(chart_data => {
    // console.log(chart_data);

	// var gridtext = chart_data.data;
	// var borders = chart_data.borders;
	var num_rows = chart_data.num_rows;
	var num_cols = chart_data.num_cols;
	var colourmap = chart_data.colours;
	// var row_names = chart_data.row_names;
	var row_numbers = chart_data.row_numbers;
	// var gridpoints = chart_data.gridpoints;
	var polydata = chart_data.polydata;
	console.log(colourmap)

	function sortAxisAlignedPolygon(points) {
		const path = [points[0]]
		const remaining = points.slice(1)
		let useX = true
		while (path.length < points.length) {
			const current_point = path[path.length-1]
			const candidates = remaining.filter(p => useX ? p[0]==current_point[0] : p[1]==current_point[1])
			if (candidates.length == 0) {
				throw new Error(`No remaining point shares ${useX ? 'x' : 'y'} with current point.`);
			}
			
			 // Pick the one with minimal distance along the varying axis
			let next_point = candidates.reduce((closest, p) => {
				const [x0,y0] = current_point;
				const closestDist = useX ? Math.abs(closest[0] - x0) : Math.abs(closest[1] - y0);
				const currentDist = useX ? Math.abs(p[0] - x0) : Math.abs(p[1] - y0);
				return currentDist < closestDist ? p : closest;
			});
			path.push(next_point);

			// Remove chosen point from remaining
			const idx = remaining.findIndex(p => p[0] == next_point[0] && p[1] == next_point[1]);
			remaining.splice(idx, 1);

			useX = !useX;
		}
		// console.log(path)
		return path;
	}

	var grid_width = row_width*num_cols;
	var grid_height = row_height*num_rows;
	console.log("Width: " + grid_width);
	console.log("Height: " + grid_height);


	var grid = d3.select("#grid")
		.append("svg")
		.attr("width",grid_width + "px")
		.attr("height",grid_height + "px");

	let tooltip = d3.select("body")
		.append('div')
		.attr('class', 'tooltip')
		.style("background-color", "#FCF8F0")
		.style("border", "solid")
		.style("border-width", "2px")
		.style("border-radius", "5px")

	// Three function that change the tooltip when user hover / move / leave a cell
	let mouseover = function(d) {
		tooltip
			.style("opacity", 1)
		d3.select(this)
    		.attr("stroke-width", 1.5)
			.attr("opacity", opacity_high)
		// d3.selectAll('.poly')
		// .filter(d => d.id.includes(this.getAttribute('name')))
	}
	let mousemove = function(event, d) {
		tooltip
			.html(make_node_tooltip_content(this, event))
			.style('transform', `translate(${event.pageX+10}px, ${event.pageY-grid_height+5}px)`)
	}
	let mouseleave = function(d) {
		tooltip
			.style("opacity", 0)
		d3.select(this)
    		.attr("stroke-width", 1)
			.attr("opacity", opacity_low)
	}

	// Function to generate tooltip html content, given a node selection
	let make_node_tooltip_content = (node, event) => {
		let this_year = 1200+Math.round(event.pageX/row_width);
		let this_row = Math.floor(event.pageY/row_height);
		let output_html = `<b>${node.__data__.name}</b><br/>\
		(${this_year}, ${row_numbers[this_row]})`
		return output_html
	}
	

	var poly = grid.selectAll(".poly")
		.data(polydata)
		.enter().append("polygon")
		.attr("class", ".poly")
		.attr("points", function(d) {
			const sorted = sortAxisAlignedPolygon(d.points);
			return sorted.map(p => [p[0]*row_width, p[1]*row_height].join(",")).join(" ");})
		.style("fill", function(d) { return colourmap[d.name]; })
		.attr("stroke", "black")
    	.attr("opacity", opacity_low)
    	.attr("stroke-width", 1)
		.on("mouseover", mouseover)
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave);

	// var point = grid.selectAll(".point")
	// 	.data(gridpoints)
	// 	.enter().append("circle")
	// 	.attr("class","point")
	// 	.attr("cx", d => 1+d[0]*row_width)
	// 	.attr("cy", d => 1+d[1]*row_height)
	// 	.attr("r", 2.5)
	// 	.style("fill", "black")

	// var pointlabel = grid.selectAll(".pointlabel")
	// 	.data(gridpoints)
	// 	.enter().append("text")
	// 	.attr("class", "pointlabel")
	// 	.attr("x", d => 1+d[0]*row_width)
	// 	.attr("y", d => 1+d[1]*row_height)
	// 	.attr("dx", 1) // horizontal offset
	// 	.attr("dy", -1) // vertical offset (move up)
	// 	.text(d => `(${d[0]}, ${d[1]+1200})`)
	// 	.attr("font-size", "8px")
	// 	.attr("fill", "#333")
	// 	.attr("text-anchor", "start");

	})
	.catch(error => {
		console.error('Error loading the JSON file:', error);
	});