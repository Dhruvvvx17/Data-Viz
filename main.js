// DHRUV VOHRA
// ASU ID: 1224859051

// svg utilities
var margin = { top: 30, right: 30, left: 30, bottom: 30 };
var width = 1495 - margin.left - margin.right;
var height = 1675 - margin.top - margin.bottom;
var mainSvg;

// data stores
var selectivePlanetData;
var gasGiantselection;
var neptuneLikeSelection;

var tooltip;

// event listener called once the HTML page is fully loaded by the browser
document.addEventListener("DOMContentLoaded", () => {
    loadCSVData();
})

/**
 * method called on document load complete.
 * creates the basic svg, xAxis and yAxis,
 * preprocesses the data.
 * plot the visualization.
 */
function loadCSVData() {

    mainSvg = d3.select(".uniquePlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("data.csv").then(function (data) {

        // filter only Neptune-like and Gas Giant planets
        selectivePlanetData = data.filter(function (d) {
            if ((d.planet_type === "Neptune-like" || d.planet_type === "Gas Giant") && (+d.discovery_year >= 2004 && +d.discovery_year <= 2013))
                return true;
            else
                return false;
        })

        selectivePlanetData.forEach(function (d) {
            d.name = d.name;
            d.distance = d.distance;
            d.discovery_year = +d.discovery_year;
            d.stellar_magnitude = +d.stellar_magnitude;
            d.radius_multiplier = +d.radius_multiplier;
            d.radius_wrt = d.radius_wrt;
        })

        console.log(selectivePlanetData);


        // gas giant data only
        gasGiantsData = selectivePlanetData.filter(function (d) {
            return (d.planet_type === "Gas Giant") ? true : false;
        })

        // neptune data only
        neptuneLikeData = selectivePlanetData.filter(function (d) {
            return (d.planet_type === "Neptune-like" && d.radius_multiplier <= 1.5) ? true : false;
        })

        // common yScale
        var yScale = d3.scaleLinear()
            .domain([2013, 2004])
            .range([height - margin.bottom, margin.top]);

        const xScale = d3.scaleBand()
            .domain(['Gas Giant', 'Neptune-like'])
            .range([margin.left, width - margin.right])
            .padding(0.5);

        // Y axis for gas giants
        const yAxisGasGiants = d3.axisRight(yScale).tickValues([]).tickSize(0);
        mainSvg.append("g")
            .attr("class", "y-axis-gasGiants")
            .attr("transform", `translate(${width / 2 - 20}, 0)`)
            .call(yAxisGasGiants);

        // Y axis for neptune like
        const yAxisNeptuneLike = d3.axisLeft(yScale).tickFormat(d => d).tickSize(0).tickPadding(5);
        mainSvg.append("g")
            .attr("class", "y-axis-neptuneLike")
            .attr("transform", `translate(${width / 2 + 20}, 0)`)
            .call(yAxisNeptuneLike);

        mainSvg.selectAll(".y-axis-neptuneLike text")
            .style("font-size", "14px")

        console.log(gasGiantsData)
        console.log(neptuneLikeData)

        // Plot data for Gas Giants
        gasGiantselection = mainSvg.selectAll(".gasGaint")
            .data(gasGiantsData)
            .enter()
            .append("circle")
            .attr("class", "gasGaint")
            .attr("r", d => 7 * d.radius_multiplier)
            .attr("fill", "#bd162c")
            .style("stroke", "#FFBA0D")
            .style("stroke-width", d => 0.4 * d.stellar_magnitude)
            .on("mouseover", onMouseOver)
            .on("mousemove", onMouseMove)
            .on("mouseleave", onMouseLeave)
            .on("click", onMouseClick);


        // Plot data for Neptune Like
        neptuneLikeSelection = mainSvg.selectAll(".neptuneLike")
            .data(neptuneLikeData)
            .enter()
            .append("circle")
            .attr("class", "neptuneLike")
            .attr("r", d => 21 * d.radius_multiplier)
            .attr("fill", "#123DB3")
            .style("stroke", "#FFBA0D")
            .style("stroke-width", d => 0.4 * d.stellar_magnitude)
            .on("mouseover", onMouseOver)
            .on("mousemove", onMouseMove)
            .on("mouseleave", onMouseLeave)
            .on("click", onMouseClick);

        const gasGiantSimulation = d3.forceSimulation(gasGiantsData)
            .force("x", d3.forceX(d => xScale(d.planet_type) + 200).strength(0.05))
            .force("y", d3.forceY(d => yScale(d.discovery_year)).strength(0.5))
            .force("collide", d3.forceCollide(12))
            .on("tick", () => {
                gasGiantselection
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
            })

        const neptuneLikeSimulation = d3.forceSimulation(neptuneLikeData)
            .force("x", d3.forceX(d => xScale(d.planet_type) + 200).strength(0.1))
            .force("y", d3.forceY(d => yScale(d.discovery_year)).strength(0.5))
            .force("collide", d3.forceCollide(11))
            .on("tick", function () {
                neptuneLikeSelection
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
            })

        gasGiantSimulation.nodes(gasGiantsData).alpha(0.4).restart();
        neptuneLikeSimulation.nodes(neptuneLikeData).alpha(0.4).restart();

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
    });


    function onMouseOver(d, i) {
        var planetName = i.name;
        var distance = i.distance;
        var discoveryYear = i.discovery_year;
        var planetType = i.planet_type;
        var radiusMultiplier = i.radius_multiplier;
        var radiusWrt = i.radius_wrt;
        var stellarMagnitude = i.stellar_magnitude;

        console.log(i)

        tooltip
            .html("<b>Planet: </b>" + planetName +
                "<br>" +
                "<b>Distance from Earth: </b>" + distance + " light years" +
                "<br>" +
                "<b>Disovery Year: </b>" + discoveryYear +
                "<br>" +
                "<b>Size: </b>" + radiusMultiplier + " times " + radiusWrt +
                "<br>" +
                "<b>Stellar Magnitude (Brightness): </b>" + stellarMagnitude
            )
            .style("opacity", 1)
            .style("visibility", "visible")
            .style("border-color", d => (planetType === "Gas Giant") ? "#bd162c" : "#123DB3");
    }

    function onMouseLeave() {
        tooltip
            .style("opacity", 0)
            .style("visibility", "hidden")
    }

    function onMouseMove(event, d) {
        tooltip
            .style("left", (event.pageX + 20) + "px")
            .style("top", event.pageY + "px")
    }

    function onMouseClick(d, i) {
        var planetName = i.name;
        window.open(`https://en.wikipedia.org/wiki/${planetName}`, '_blank', 'noopener');
    }
}

/**
 * method called on button click.
 * updates the radius of neptune-like data points as per the toggle side
 */
function buttonClick() {
    var myBtn = document.getElementById("myBtn");

    if (myBtn.innerText === "Show actual planet size") {
        myBtn.innerText = "Increase neptune-like planet size";
        d3.selectAll(".neptuneLike")
            .attr("r", d => 7 * d.radius_multiplier)
    }
    else if (myBtn.innerText === "Increase neptune-like planet size") {
        myBtn.innerText = "Show actual planet size";
        d3.selectAll(".neptuneLike")
            .attr("r", d => 21 * d.radius_multiplier)
    }
}