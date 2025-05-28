// import * as d3 from 'd3'
const row_width = 1.5
const row_height = 20
const top_margin = 50
const bottom_margin = 100
const opacity_low = 0.5
const opacity_high = 0.9

fetch('./grid_contents.json')
  .then(response => response.json())
  .then(chart_data => {
    // console.log(chart_data);

	// var gridtext = chart_data.data;
	// var borders = chart_data.borders;
	var num_rows = chart_data.num_rows;
	var num_cols = chart_data.num_cols;
	var start_year = chart_data.start_year;
	var end_year = chart_data.end_year;

	var start_century = Math.floor(start_year/100)*100
	var timeline_centuries = []
	var timeline_decades = []
	for (let y=start_century; y < end_year; y += 100) {
		timeline_centuries.push(y);
		for (let d=y; d < y+100; d += 10) {
			timeline_decades.push(d)
		}
	}
	var colourmap = chart_data.colours;
	// var row_names = chart_data.row_names;
	var row_numbers = chart_data.row_numbers;
	// var gridpoints = chart_data.gridpoints;
	var polydata = chart_data.polydata;
	// console.log(polydata)
	// console.log(colourmap)

	function sortAxisAlignedPolygon(points, name) {
		let path = [points[0]]
		let remaining = points.slice(1)
		
		let useX = true
		while (path.length < points.length) {
			let current_point = path[path.length-1]
			// Choose next point from among those that share the same x or y coordinate to current point
			let candidates = remaining.filter(p => useX ? p[0]==current_point[0] : p[1]==current_point[1])
			if (candidates.length == 0) {
				console.log('Name:', name, 'Path:', path, 'Use X:', useX, 'Remaining:', remaining)
				throw new Error(`No remaining point shares ${useX ? 'x' : 'y'} with current point.`);
			}

			// Pick the one with minimal distance along the varying axis
			let next_point = candidates.reduce((closest, p) => {
				let [x0,y0] = current_point;
				let closestDist = useX ? Math.abs(closest[0] - x0) : Math.abs(closest[1] - y0);
				let currentDist = useX ? Math.abs(p[0] - x0) : Math.abs(p[1] - y0);
				return currentDist < closestDist ? p : closest;
			});
			path.push(next_point);

			// Remove chosen point from remaining
			const idx = remaining.findIndex(p => p[0] == next_point[0] && p[1] == next_point[1]);
			remaining.splice(idx, 1);

			useX = !useX;
		}
		if (name == "debug") {
			console.log('Points', points.map(p => [p[0]+start_year, p[1]]))
			console.log('Path', path.map(p => [p[0]+start_year, p[1]]))
		}
		return path;
	}

	var grid_width = row_width*num_cols;
	var grid_height = row_height*num_rows;
	var total_height = row_height*num_rows+top_margin+bottom_margin;
	console.log("Width: " + grid_width);
	console.log("Height: " + grid_height);

	let get_text_width = function(text) {
		let tmp_svg = d3.select('body').append('svg');
		let tmp_text = tmp_svg.append('text')
			.attr('font-size', '12px')
			.text(text);

		let tmp_text_width = tmp_text.node().getBBox().width;
		tmp_svg.remove();
		return tmp_text_width
	}

	// Function to generate tooltip html content, given a node selection
	let make_node_tooltip_content = function(node, event) {
		// console.log(event)
		// let this_year = start_year+Math.round(event.pageX/row_width);
		let this_name = node.__data__.name
		let this_year = start_year+Math.round(event.offsetX/row_width);
		let this_row = Math.floor((event.offsetY-top_margin)/row_height);
		let context_line = `(${this_year}, ${row_numbers[this_row]})`;
		let tooltip_width = Math.max(get_text_width(this_name), get_text_width(context_line));
		return {'content': `<b>${this_name}</b><br/>${context_line}`, 'width': tooltip_width}
	}


	var timeline_ypos = 25
	var timeline = d3.select("#fixed-timeline")
		.append('svg')
		// .attr('class', 'timeline')
		.attr("width",grid_width+"px")
		.attr("height",timeline_ypos+5+"px");
	
	window.addEventListener('scroll', () =>
		d3.select("#fixed-timeline").style("left", -window.scrollX + "px")
	);

	var grid = d3.select("#grid")
		.append("svg")
		.attr("width",grid_width+"px")
		.attr("height",grid_height+top_margin+bottom_margin+"px");

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
		d3.selectAll("polygon")
        	.filter(p => p.name == this.__data__.name)
    		.attr("stroke-width", 1.5)
			.attr("opacity", opacity_high)
	}
	let mousemove = function(event, d) {
		let fromRight = window.innerWidth - event.clientX;
		let tooltip_body = make_node_tooltip_content(this, event, start_year);
		// If within 200px of the right edge, shift tooltip to other side of cursor
		let xpos = fromRight <= 200 ? event.pageX-tooltip_body.width-20 : event.pageX+10;
		tooltip
			.html(tooltip_body.content)
			.style('transform', `translate(${xpos}px, ${event.pageY-total_height+5}px)`)
	}
	let mouseleave = function(d) {
		tooltip
			.style("opacity", 0)
		d3.selectAll("polygon")
        	.filter(p => p.name == this.__data__.name)
    		.attr("stroke-width", 1)
			.attr("opacity", opacity_low)
	}
	

	var poly = grid.selectAll(".poly")
		.data(polydata)
		.enter().append("polygon")
		.attr("class", ".poly")
		.attr("points", function(d) {
			let sorted = sortAxisAlignedPolygon(d.points, d.name);
			return sorted.map(p => [p[0]*row_width, top_margin+p[1]*row_height].join(",")).join(" ");})
		.style("fill", function(d) { return colourmap[d.name]; })
		.attr("stroke", "black")
    	.attr("opacity", opacity_low)
    	.attr("stroke-width", 1)
		.on("mouseover", mouseover)
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave);


	var yearlabel = timeline.selectAll(".yearlabel")
		.data(timeline_centuries)
		.enter().append("text")
		.attr("class", "yearlabel")
		.attr("position", "fixed")
		.attr("x", d => (d-start_year)*row_width)
		.attr("y", timeline_ypos)
		.attr("dx", -14) // horizontal offset
		.attr("dy", -10) // vertical offset (move up)
		.text(d => `${d}`)
		.attr("font-size", "14px")
		.attr("font-weight", "bold")
		.attr("fill", "#333")
		.attr("text-anchor", "start");

	var yearpoint = timeline.selectAll(".yearpoint")
		.data(timeline_centuries)
		.enter().append("circle")
		.attr("class","yearpoint")
		.attr("cx", d => (d-start_year)*row_width)
		.attr("cy", timeline_ypos)
		.attr("r", 3)
		.style("fill", "black")
	
	var yeartick = timeline.selectAll(".yeartick")
		.data(timeline_decades)
		.enter().append("line")
		.attr("class","yeartick")
		.style('stroke', 'grey')
		.style('stroke-width', `1px`)
		.attr("pointer-events", "none")
		.attr("x1", d => (d-start_year)*row_width)
		.attr("x2", d => (d-start_year)*row_width)
		.attr("y1", timeline_ypos-5)
		.attr("y2", timeline_ypos+5)

	var yearline = grid.selectAll(".yearline")
		.data(timeline_centuries)
		.enter().append("line")
		.attr("class","yearline")
		.style('stroke', 'grey')
		.style('stroke-width', `1px`)
		.style("stroke-dasharray", "3 10")
		.attr("pointer-events", "none")
		.attr("x1", d => (d-start_year)*row_width)
		.attr("x2", d => (d-start_year)*row_width)
		.attr("y1", timeline_ypos)
		.attr("y2", total_height)

	})
	.catch(error => {
		console.error('Error:', error);
	});