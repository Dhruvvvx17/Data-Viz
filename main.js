// Name: Dhruv Vohra
// ASU ID: 1224859051
// E-mail: dvohra1@asu.edu

// margin variables
const svgWidth = 580;
const svgHeight = 400;
const svgMargin = 50;
const barPadding = 5;
const outerRadiusMargin = 0.45;
const innerRadiusMargin = 0.30;

// data stores
var vowelDict = {};
var consonantDict = {};
var specialDict = {};
var totalDict = [];
var vowelCount = 0;
var consonantCount = 0;
var specialCount = 0;

// barchart categories
const vowelSymbols = ["a", "e", "i", "o", "u", "y"]
const consonantSymbols = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "z"]
const specialSymbols = ['.', ',', '?', '!', ':', ';']

// tooltip utilities
var tooltip;
var selectedCharLabel;
var selectedCharFreq;
var tempLable;
var tempFreq;

// color scheme
var colors = d3
	.scaleOrdinal()
	.domain(totalDict)
	.range(d3.schemeSet3);

/**
 * Resets the dictionaries, lists and counter variables to process the next vizualization
 */
function resetDataStores() {
	vowelDict = {}
	consonantDict = {}
	specialDict = {}
	vowelCount = 0
	consonantCount = 0
	specialCount = 0
	totalDict = []
}

/**
 * Processes the input text to fetch the vowels, consonants and punctuations.
 * Updates the data store variables.
 * Triggered on button press.
 */
function submitText() {

	resetDataStores();

	// fetch input text
	var text = document.getElementById("wordbox").value;

	// clear the previous donut chart and bar chart
	d3.select("#bar_svg").selectAll("*").remove();
	d3.select("#pie_svg").selectAll("*").remove();

	selectedCharLabel = d3.select("#character-label").html("____");
	selectedCharFreq = d3.select("#character-name").html("NONE");

	// return on empty string
	if (!text) return;

	text = text.toLowerCase();

	// iterate over the lowercase string, update vowel, consonants and punctuation counts
	for (var i = 0; i < text.length; i++) {
		if (isVowel(text[i])) {
			vowelDict[text[i]] = vowelDict[text[i]] ? vowelDict[text[i]] + 1 : 1;
			vowelCount++;
		}
		else if (isConsonant(text[i])) {
			consonantDict[text[i]] = consonantDict[text[i]] ? consonantDict[text[i]] + 1 : 1;
			consonantCount++;
		}
		else if (isSpecial(text[i])) {
			specialDict[text[i]] = specialDict[text[i]] ? specialDict[text[i]] + 1 : 1;
			specialCount++;
		}
	}

	// update dictionaries
	totalDict.push({ "label": "vowels", "count": vowelCount, "payload": vowelDict, index: 0 });
	totalDict.push({ "label": "consonants", "count": consonantCount, "payload": consonantDict, index: 1 });
	totalDict.push({ "label": "punctuations", "count": specialCount, "payload": specialDict, index: 2 });

	// vizualize the donut chart
	updatedonutChart();
}

/**
 * Vizualizes the donut chart based on processed input data.
 * Adds hover and onclick feature to further vizualize a bar chart.
 * Triggered on button press, post data processing.
 */
function updatedonutChart() {

	// basic template arc for the donut
	var arc = d3
		.arc()
		.outerRadius(svgHeight * outerRadiusMargin)
		.innerRadius(svgHeight * innerRadiusMargin);

	// configure donut chart size - height and width
	var donutChart = d3
		.select("#pie_svg")
		.append("g")
		.attr("transform", "translate(" + svgWidth / 2 + " " + svgHeight / 2 + ")")

	// template for donut (constructed with arc template) 0 to 2PI radians
	donutChart
		.append("path")
		.attr("class", "backgroundArc")
		.attr("d", arc({ startAngle: 0, endAngle: 2 * Math.PI }));

	// set padding between arcs, unset sorting arcs by value	
	var donut = d3.pie()
		.padAngle(0.005)
		.sort(null)
		.value(function (d) {
			return d.count;
		});

	// generate arcs based on processed data
	var arcs = donut(totalDict)

	// create arcElements out of arcs
	var arcElements = donutChart
		.selectAll(".arc")
		.data(arcs);

	// create entire donut, merge arcElements, add mouse movement functionalities 
	arcElements.enter()
		.append("path")
		.attr("class", "arc")
		.style("fill", function (d, i) { return colors(i) })
		.style("stroke", "black")
		.style("stroke-width", 1)
		.merge(arcElements)
		.on("mouseover", function (d, i) {
			// increase the border size
			d3.select(this)
				.style("stroke", "black")
				.style("stroke-width", 4);

			// show text at the donut center
			var highlightText = donutChart.selectAll(".center").data([d]);
			highlightText.enter()
				.append("text")
				.attr("class", "center")
				.style("text-anchor", "middle")
				.merge(highlightText)
				.text(`${i.data.label + ":" + i.data.count}`)
				.style("font-size", "25px");
		})
		.on("mouseout", function () {
			// decrease the border size
			d3.select(this)
				.style("stroke", "black")
				.style("stroke-width", 1);

			// remove text from donut center
			donutChart.selectAll(".center").text("");
		})
		.on("click", function (d, i) {
			// remove previous bar chart
			d3.select("#bar_svg").selectAll("*").remove();
			// create new bar chart
			selectedCharLabel = d3.select("#character-label").html(i.data.label);
			selectedCharFreq = d3.select("#character-name").html(i.data.count);
			updateBarChart(i.data);
		})
		.transition()
		.ease(d3.easeCircle)
		.duration(2000)
		.attr("d", arc)
}

/**
 * Vizualizes the bar chart based on selected donut arc.
 * Adds hover and onclick feature to further vizualize a tooltip.
 * Triggered on donut arc press.
 * 
 * @param {object} data data representing the selected arc of the donut.
 */
function updateBarChart(data) {

	var payload = data.payload;
	var frequencyData = []
	var symbols = []
	var maxFreq = 0

	// identify category of data
	if (data.label == "vowels")
		symbols = vowelSymbols;
	else if (data.label == "consonants")
		symbols = consonantSymbols;
	else
		symbols = specialSymbols

	// iterate over payload, store character and count in new object
	for (var key in payload) {
		temp = {}
		temp["symbol"] = key
		temp["frequency"] = payload[key]
		frequencyData.push(temp);
		maxFreq = (payload[key] > maxFreq) ? payload[key] : maxFreq;
	}

	// set Y axis
	var yaxis = d3
		.select("#bar_svg")
		.append("g")
		.attr("transform", `translate(${svgMargin},0)`);

	// set X axis
	var xaxis = d3
		.select("#bar_svg")
		.append("g")
		.attr("transform", `translate(0,${svgHeight - svgMargin})`);


	// set Y scale (linear)
	const yScale = d3
		.scaleLinear()
		.domain([0, maxFreq])
		.range([svgHeight - svgMargin, svgMargin]);

	// set X scale (categorical)
	const xScale = d3
		.scaleBand()
		.domain(symbols)
		.range([svgMargin, svgWidth - svgMargin])
		.padding(0.1);

	// format Y axis ticks -> integers only
	const yAxisTicks = yScale.ticks()
		.filter(tick => Number.isInteger(tick));

	// call Y axis
	yaxis.call(
		d3.axisLeft(yScale)
			.tickValues(yAxisTicks)
			.tickFormat(d3.format('d'))
	);

	// call X axis
	xaxis.call(
		d3.axisBottom(xScale)
	);


	// plot bar chart
	var bar = d3.select("#bar_svg").selectAll(".bar").data(frequencyData);

	bar
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", d => xScale(d.symbol))
		.attr("y", d => yScale(d.frequency))
		.attr("width", xScale.bandwidth())
		.attr("height", d => svgHeight - yScale(d.frequency) - svgMargin)
		.attr("fill", colors(data.index))
		.style("stroke", "black")
		.style("stroke-width", 1)
		.on("mouseover", onMouseOver)
		.on("mousemove", onMouseMove)
		.on("mouseleave", onMouseLeave);

	// create tooltip
	tooltip = d3.select("#tooltip_div")
		.attr("class", "tooltip")
		.style('position', 'absolute')
		.style("visibility", "hidden")
		.style("background-color", "white")
		.style("border", "solid")
		.style("border-width", "medium")
		.style("border-radius", "5px")
		.style("padding", "10px")
		.style("opacity", 0)
}

/**
 * Displays tooltip when mouse hovers over the bar.
 * 
 */
function onMouseOver(d, i) {
	var symbol = i.symbol;
	var freq = i.frequency;

	// update tooltip data, set it to visible 
	tooltip
		.html("Character: " + symbol + "<br>" + "Count: " + freq)
		.style("opacity", 1)
		.style("visibility", "visible");

	tempLable = d3.select("#character-label").text()
	tempFreq = d3.select("#character-name").text()

	selectedCharLabel = d3.select("#character-label")
		.html(symbol);

	selectedCharFreq = d3.select("#character-name")
		.html(freq);
}

/**
 * Updates tooltip position according to mouse pointer position
 * 
 */
function onMouseMove(event, d) {
	tooltip
		.style("left", (event.pageX + 20) + "px")
		.style("top", event.pageY + "px")
}

/**
 * Hides tooltip when mouse is no longer over the bar
 * 
 */
function onMouseLeave(d) {
	tooltip
		.style("opacity", 0)
		.style("visibility", "hidden")

	selectedCharLabel.html(tempLable);
	selectedCharFreq.html(tempFreq);
}

/**
 * Check if given char is a vowel
 * 
 * @param {string} char
 * @return boolean
 */
function isVowel(char) {
	var res = char == 'a' || char == 'e' || char == 'i' || char == 'o' || char == 'u' || char == 'y';
	return res;
}

/**
 * Check if given char is a consonant
 * 
 * @param {string} char
 * @return boolean
 */
function isConsonant(char) {
	return char.match(/[a-z]/i);
}

/**
 * Check if given char is a punctuation
 * 
 * @param {string} char
 * @return boolean
 */
function isSpecial(char) {
	var res = char == '.' || char == ',' || char == '?' || char == '!' || char == ':' || char == ';';
	return res;
}
