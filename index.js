// radius
const MAX_RADIUS = 50;
const MIN_RADIUS = 4;

const TRANS_DURATION = 1000; //transition duration
const PADDING = 60; //padding

//svg dimensions
var width = 0.675 * $(window).width();
var height = 0.9 * $(window).height();

//colors
const MAP_COLOR = "#54B435";
const MAP_HOVER = "#379237";
const MARKER_COLOR = "red";
const SVG_COLOR = "#005493";
const BAR_COLOR = "rgb(0,150,100)";
const BAR_HOVER = "rgb(0,100,220)";
const CHART_COLOR = "rgb(0,128,128)";
const HOVER_TEXT_COLOR = "#fff";

//heights for bar graphs
const BAR_HEIGHT = 30;
const TEXT_PADDING_BOTTOM = 10;
const BAR_AND_TEXT_MARGIN = 0.5;

//global variables
var worldStats;
var uniqueYears;
var markerHover;
var clickMeLabel;
var selectedYear;
var selectedColumn;
var lineGraph;
var lineGraphOpen = false;
var selectedCountry;
var continentNames;
var filteredDataByContinent;
var selectedContinent;
var svg;

var continentOpen = false;

// When the body is loaded call the Anonymous function which draws visualization
$("body").ready(() => {
  appendVizOption(); //append options to select type of visualization
  appendHvrLbl(); //append the label for marker
  addHiddenCloseBtn(); //add hidden close button
  d3.csv("data.csv").then((data) => {
    worldStats = data;
    appendSelectYear(); //append year dropdown, selection operator
    appendSelectColumn(); //append column dropdown, selection operator
    drawDonutChartTitle(); //appends donut chart title
    draw(); //draw the visualization

    // on changing type of viz, the year and column redraw the visualization
    $("#select> #year,#column").on("change", function () {
      if (continentOpen) {
        appendContinentGraph();
      }
      if (lineGraphOpen) {
        drawLineGraph(selectedCountry);
      }
      draw(); //draw
    });
    $("#vizLabel>select").on("change", function () {
      if (lineGraphOpen) {
        lineGraph
          .transition()
          .duration(TRANS_DURATION / 2)
          .style("left", 0 - width + "px")
          .remove();
      }
      $("#slide").css("display", "none");
      markerHover.style("display", "none");
      lineGraphOpen = false;
      draw(); //draw
    });
  });
});

/**
 * Draws the whole visualization
 */
function draw() {
  //show the titles of world population
  $(".title1> #vizLabel").css("display", "inline-block");
  $(".title1> #world").css({ display: "none" });
  $("#select > #to").css("display", "inline-block");
  $("#dataOf").html("the World in");

  d3.selectAll("svg").remove(); //remove svg if any

  // filter the data according to the selected year
  const filteredDataByYear = filterDataByYear();

  //select only the interested column values
  const selectedColumnData = selectColData(filteredDataByYear);
  continentNames = filteredDataByYear.map((each) => {
    return each.Continent;
  });
  continentNames = Array.from(new Set(continentNames));

  // Get max and min of filtered data
  var MIN_VAL = Math.min(...selectedColumnData);
  var MAX_VAL = Math.max(...selectedColumnData);

  //Scale function for marker radius
  const scaleRad = d3
    .scaleLinear()
    .domain([MIN_VAL, MAX_VAL])
    .range([MIN_RADIUS, MAX_RADIUS]);

  //append svg to draw
  svg = d3
    .select(".main")
    .style("padding", "8px")
    .append("svg")
    .attr("class", "scatterPlot")
    .attr("width", width)
    .attr("height", height);

  if (lineGraphOpen) {
    //show line graph
    drawLineGraph(selectedCountry);
  }
  if (continentOpen) {
    //show continent bar chart
    appendContinentGraph();
  }
  const viz = $("#vizLabel >select option:selected").val();

  if (viz == "ScatterPlot") {
    //if scatter plot is selected draw scatter plot
    drawScatterPlot(svg, filteredDataByYear, scaleRad);
  } else {
    //else draw bar graph
    drawBarGraph(svg, filteredDataByYear, MAX_VAL, MIN_VAL);
  }

  //draw continet donut chart
  drawDonutChart(filteredDataByYear);
}

/**
 * Draws scatter plot on the map which shows the selected
 * column value for each countries when hovered on markers
 * placed at capital city's co-ordinates
 * @param {*} svg
 * @param {*} filteredDataByYear
 * @param {*} scaleRad
 */
function drawScatterPlot(svg, filteredDataByYear, scaleRad) {
  //projection for world map
  const projection = d3
    .geoMercator()
    .scale(0.155 * width)
    .translate([width / 2, height / 1.45]);

  const path = d3.geoPath().projection(projection); //map path function

  const g = svg.style("background-color", SVG_COLOR).append("g"); //append group
  //if linegraph is already open and the selection changed open the line graph directly

  //world-110m.geojson to draw map
  d3.json("world-110m.geojson").then(
    (data) => {
      g.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", MAP_COLOR)
        .attr("stroke", "black")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("fill", MAP_HOVER); //on mouse hover change the color of country
        })
        .on("mouseout", function (event) {
          d3.select(this).attr("fill", MAP_COLOR); //on mouse out change the color of country to original
        });

      g.selectAll("svg")
        .data(filteredDataByYear) // append the filterd data
        .enter()
        .append("svg:circle")
        .attr("cx", function (d) {
          var c = [d.Longitude, d.Latitude];
          p = projection(c);
          return p[0]; //marker x cordinate of capital city
        })
        .attr("r", (d) => MIN_RADIUS) //radius of marker
        .attr("cy", function (d) {
          var c = [d.Longitude, d.Latitude];
          p = projection(c);
          return p[1]; //marker y cordinate of capital city
        })
        .style("fill", MARKER_COLOR)
        .style("cursor", "pointer")
        .style("stroke", "#fff")
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(TRANS_DURATION / 2)
            .attr("r", (d) => scaleRad(d[selectedColumn]))
            .attr("opacity", "0.7"); //increase radius of marker on mouse hover

          //show label with country name and the selectedColumn value
          markerHover
            .style("top", event.pageY + PADDING / 3 + "px")
            .style("left", event.pageX + PADDING / 10 + "px")
            .style("background-color", "#D64933")
            .style("padding", "3px")
            .style("display", "block")
            .text(`${d.Country}: ${d[selectedColumn]}`);
        })
        .on("mouseout", function (event) {
          d3.select(this)
            .transition()
            .duration(TRANS_DURATION / 2)
            .attr("r", MIN_RADIUS)
            .attr("opacity", "1"); //decrease radius to MIN_RADIUS on mouse out

          markerHover.style("display", "none"); //hide the label
        })
        .on("click", function (event, d) {
          // remove old lineGraph if any
          $(".lineGraph").remove();

          selectedCountry = d;
          // append yearly line graph to compare the selectedColumn stats of a country
          drawLineGraph(d);
        });
    }
  );
}

/**
 * Draw bar graph for all countries of the world
 *
 * @param {*} svg
 * @param {*} filteredDataByYear
 * @param {*} MAX_VAL
 * @param {*} MIN_VAL
 */
function drawBarGraph(svg, filteredDataByYear, MAX_VAL, MIN_VAL) {
  //sort data by the seelcted column value
  filteredDataByYear.sort((a, b) => {
    return b[selectedColumn] - a[selectedColumn];
  });
  const SVG_HEIGHT = filteredDataByYear.length * (BAR_HEIGHT + 2);

  svg
    .attr("class", "barGraph")
    .attr("width", width - 10)
    .attr("height", SVG_HEIGHT);

  //Append chart group
  var chart = svg.selectAll("g").data(filteredDataByYear).enter().append("g");

  // scale function
  const scaleBar = d3
    .scaleLinear()
    .domain([MIN_VAL, MAX_VAL], 2)
    .range([BAR_AND_TEXT_MARGIN, width / 1.5]);

  //append bar
  chart
    .append("rect")
    .attr("y", (d, i) => {
      return i * (BAR_HEIGHT + 2);
    })
    .attr("height", BAR_HEIGHT)
    .attr("x", () => {
      return BAR_AND_TEXT_MARGIN * 5;
    })
    .attr("width", () => {
      return 0;
    })
    .transition()
    .duration(TRANS_DURATION)
    .attr("width", (d, i) => {
      return `${scaleBar(d[selectedColumn])}`;
    })
    .attr("fill", CHART_COLOR)
    .style("cursor", "pointer");

  chart.on("mouseover", function (event, d) {
    //show label with country name and the selectedColumn value
    clickMeLabel
      .style("top", event.pageY + "px")
      .style("left", event.pageX + "px")
      .style("display", "block")
      .text(`Click for yearly data`);
  })
    .on("mouseout", function (event) {
      clickMeLabel.style("display", "none"); //hide the label
    }).on("click", function (event, d) {
      // remove old lineGraph if any
      $(".lineGraph").remove();

      selectedCountry = d;
      // append yearly line graph to compare the selectedColumn stats of a country
      drawLineGraph(d);
    });

  //append text
  chart
    .append("text")
    .attr("y", (d, i) => {
      return i * (BAR_HEIGHT + 2) + BAR_HEIGHT - TEXT_PADDING_BOTTOM;
    })
    .attr("x", (d) => {
      return 0;
    })
    .style("fill", "#fff")
    .transition()
    .duration(TRANS_DURATION)
    .attr("x", (d) => {
      return `${scaleBar(d[selectedColumn]) + BAR_AND_TEXT_MARGIN * 20}`;
    })
    .text((d, i) => {
      let val = d[selectedColumn];
      return "     " + d.Country + " (" + parseFloat(val).toFixed(2) + ")";
    })
    .style("cursor", "pointer");
}

/**
 * Draw donut for population of the continents
 * @param {*} filteredDataByYear
 */
function drawDonutChart(filteredDataByYear) {
  var continentPopn = [];

  //calculates the total population of each continent and pushes them to continentPopn
  continentNames.forEach((each) => {
    continentPopn.push(getContinentPopn(each));
  });

  //totalPopulation of the world
  let worldPopn = 0;
  continentPopn.forEach((each) => {
    worldPopn += each;
  });

  // COLORS
  const COLORS = [
    "#8C554B",
    "#9467BD",
    "#FF7F0E",
    "#1E76B4",
    "#2AA02A",
    "#D72627",
  ];

  // arc dimensions
  var arcWidth = width / 2.5;
  var arcHeight = height / 1.5;

  // radius
  const innerRad = arcWidth / 3.5;
  const outerRad = arcWidth / 2.25;

  // create svg element
  var svgPie = d3
    .select(".pie")
    .append("svg")
    .attr("class", "pie")
    .attr("height", arcHeight)
    .attr("width", arcWidth);

  //append total world population of the year
  $("#worldPopn")
    .html(`In ${selectedYear} the world population: <br> ${worldPopn}`);

  // create unsorted pie
  var pie_unsorted = d3
    .pie()
    .value((d) => d)
    .sort(null);

  // draw first pie sorted
  drawDonut(pie_unsorted, continentPopn, svgPie);

  /**
   * Draws donut according to the parameter passed,
   * if pie_unsorted is passed it will create unsorted pie
   *
   * it will also shift the position according to the position passed
   *
   * @param {*} pie
   * @param {*} continents
   * @param {*} svgPie
   */
  function drawDonut(pie, continentPopn, svgPie) {
    // create arc
    var arc = d3.arc().innerRadius(innerRad).outerRadius(outerRad);
    // let names = Object.keys(continentPopn); //array names of continents
    continentPopn = Object.values(continentPopn); //array of population of the continents

    // create svg group and append the pie with data
    var arcs = svgPie
      .selectAll("g.arc")
      .data(pie(continentPopn))
      .enter()
      .append("g")
      .attr(
        "transform",
        `translate(${outerRad + PADDING / 3},${outerRad * 1.1})`
      );

    // fill COLORS to the arcs
    arcs
      .append("path")
      .attr("fill", (d, i) => {
        return COLORS[i];
      })
      .attr("d", arc)
      .style("cursor", "pointer");

    // append values
    arcs
      .on("mouseover", function (event, d) {
        //show continenets population on hover
        $("#continentPopn")
          .html(
            `${continentNames[d.index]} in ${selectedYear}<br> : ${d.value} (${(
              (d.value * 100) /
              worldPopn
            ).toFixed(2)}%)`
          )
          .css({
            color: "#fff",
            display: "inline-block",
            // width: "12rem",
            position: "relative",
            "background-color": COLORS[d.index],
            top: 0,
            left: 0,
            padding: "5px",
          });
      })
      .on("mouseout", function (event) {
        //hide hover label
        $("#continentPopn").css({
          color: "#fff",
          display: "none",
          width: "initial",
          position: "absolute",
          "background-color": "transparent",
          padding: 0,
        });
      })
      .on("click", function (event, d) {
        if (lineGraphOpen) {
          lineGraph
            .transition()
            .duration(TRANS_DURATION / 2)
            .style("left", 0 - width + "px")
            .remove();
        }
        $("#slide").css("display", "none");
        markerHover.style("display", "none");
        lineGraphOpen = false;

        selectedContinent = d.index;
        appendContinentGraph();
      });
  }

  /**
   * Calculates the total population of a particular continent
   * @param {*} continent
   * @returns total population
   */
  function getContinentPopn(continent) {
    //total population of a particular continent
    return filteredDataByYear
      .filter((each) => each.Continent == continent)
      .map((each) => each.Population)
      .reduce(sum, 0);
  }

  /**
   * Calculates total sum
   *
   * @param {*} total
   * @param {*} num
   * @returns
   */
  function sum(total, num) {
    //sum
    return total + parseInt(num);
  }
}

/**
 *Filters the yearly data that belongs to the selected continent
 *
 */
function filterByContinent() {
  return filterDataByYear().filter((each) => {
    return each.Continent == continentNames[selectedContinent];
  });
}

/**
 * Appends bar graph of countries of the continent when clicked on Donut arc
 *
 */
function appendContinentGraph() {
  filteredDataByContinent = filterByContinent();
  //sort in descending order according to the selected column
  filteredDataByContinent.sort((a, b) => {
    return b[selectedColumn] - a[selectedColumn];
  });
  //set contitnent open true
  continentOpen = true;
  //hide the labels of world population
  $(".title1 > #vizLabel").css("display", "none");
  $(".title1>#world").remove();
  $("#select > #to").css("display", "none");
  //append button to go back to world Stats
  $(".title1").append(
    "<button id='world'>Close Line Graph</button>"
  );

  $("#dataOf").html(continentNames[selectedContinent] + " in ");

  const SVG_HEIGHT = filteredDataByContinent.length * (BAR_HEIGHT + 2);

  //hide scatter plot
  d3.selectAll(".scatterPlot").attr("display", "none");
  d3.selectAll(".barGraph").attr("display", "none");
  d3.selectAll(".continentBarGraph").remove();

  //svg for continent
  var continentSvg = d3
    .select(".main")
    .style("padding", "0.5rem")
    .append("svg")
    .attr("class", "continentBarGraph")
    .attr("width", width - 10)
    .attr("height", SVG_HEIGHT);

  //Append chart group
  var chart = continentSvg
    .selectAll("g")
    .data(filteredDataByContinent)
    .enter()
    .append("g");

  interestedCol = filteredDataByContinent.map((each) => each[selectedColumn]);
  //min and max values
  var MIN_VAL = Math.min(...interestedCol);
  var MAX_VAL = Math.max(...interestedCol);
  // scale function
  const scaleBar = d3
    .scaleLinear()
    .domain([MIN_VAL, MAX_VAL], 2)
    .range([BAR_AND_TEXT_MARGIN, width / 1.5]);

  //append bar
  chart
    .append("rect")
    .attr("y", (d, i) => {
      return i * (BAR_HEIGHT + 2);
    })
    .attr("height", BAR_HEIGHT)
    .attr("x", () => {
      return BAR_AND_TEXT_MARGIN * 5;
    })
    .attr("width", () => {
      return 0;
    })
    .transition()
    .duration(TRANS_DURATION)
    .attr("width", (d, i) => {
      return `${scaleBar(d[selectedColumn])}`;
    })
    .attr("fill", CHART_COLOR)
    .style("cursor", "pointer");

  chart.on("mouseover", function (event, d) {
    //show label with country name and the selectedColumn value
    clickMeLabel
      .style("top", event.pageY + "px")
      .style("left", event.pageX + PADDING + "px")
      .style("display", "block")
      .text(`Click for yearly data`);
  }).on("mouseout", function (event) {
    clickMeLabel.style("display", "none"); //hide the label
  }).on("click", function (event, d) {
    // remove old lineGraph if any
    $(".lineGraph").remove();
    //set selected country
    selectedCountry = d;
    // append yearly line graph to compare the selectedColumn stats of a country
    drawLineGraph(d);
  });

  //append text
  chart
    .append("text")
    .attr("y", (d, i) => {
      return i * (BAR_HEIGHT + 2) + BAR_HEIGHT - TEXT_PADDING_BOTTOM;
    })
    .attr("x", (d) => {
      return 0;
    })
    .style("fill", "#fff")
    .transition()
    .duration(TRANS_DURATION)
    .attr("x", (d) => {
      return `${scaleBar(d[selectedColumn]) + BAR_AND_TEXT_MARGIN * 20}`;
    })
    .text((d, i) => {
      let val = d[selectedColumn];
      return "     " + d.Country + " (" + parseFloat(val).toFixed(2) + ")";
    })
    .style("cursor", "pointer");

  $(".title1> #world").click(function () {
    if (lineGraphOpen) {
      lineGraph
        .transition()
        .duration(TRANS_DURATION / 2)
        .style("left", 0 - width + "px")
        .remove();
    }
    $("#slide").css("display", "none");
    markerHover.style("display", "none");
    lineGraphOpen = false;

    continentOpen = false; //continent open to false
    draw(); //draw
  });
}

/**
 * Appends line chart/graph year vs selected column data
 *
 * @param {*} d
 */
function drawLineGraph(d) {
  //append svg for line graph
  lineGraph = d3
    .select(".main")
    .append("svg")
    .attr("class", "lineGraph")
    .attr("width", width)
    .attr("height", height + PADDING / 4)
    .style("position", "absolute")
    .style("z-index", "100")
    .style("border", "1px solid #fff")
    .style("border-radius", "5px")
    .style("background-color", "lightgray")
    .style("top", PADDING / 1.25 + "px");

  // max and min for bar graph x-axis
  const MIN_X = Math.min(...uniqueYears);
  const MAX_X = Math.max(...uniqueYears);

  //select data for all years of a particular country
  let countryDataByYear = worldStats.filter(
    (eachTuple) => eachTuple.Country == d.Country
  );

  //selected column data by year for a particular country
  let selectedData = selectColData(countryDataByYear);

  // max and min for bar graph y-axis
  const MIN_Y = Math.min(...selectedData);
  const MAX_Y = Math.max(...selectedData);

  //Scale for X-AXIS
  let scale_X = d3
    .scaleTime()
    .domain([MIN_X, MAX_X])
    .range([PADDING / 3, width - PADDING * 1.5]);

  //Scale for Y-AXIS
  let scale_Y = d3
    .scaleLinear()
    .domain([MIN_Y, MAX_Y])
    .range([height - PADDING, PADDING]);

  //append the lines useing the yearly data
  appendLines(countryDataByYear, scale_Y, scale_X); //append the linegraphs

  //append X-AXIS
  let X_axis = d3
    .axisBottom()
    .scale(scale_X)
    .tickValues(Array.from(uniqueYears))
    .ticks(uniqueYears.size)
    .tickFormat(d3.format("d"));
  lineGraph
    .append("g")
    .call(X_axis)
    .attr("transform", `translate(${PADDING * 1.2},${height - PADDING / 1.1})`)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)");

  //append Y-AXIS
  let Y_axis = d3.axisLeft().scale(scale_Y);
  lineGraph
    .append("g")
    .call(Y_axis)
    .attr("stroke", "#000")
    .attr("transform", `translate(${PADDING * 1.5},0)`);
  lineGraph.selectAll("path").attr("stroke", "#000");
  lineGraph.selectAll("line").attr("stroke", "#000");
  lineGraph.selectAll("text").attr("stroke", "#000");

  //append X-axis label
  lineGraph
    .append("text")
    .style("font-weight", "900")
    .text("YEAR")
    .attr("x", width / 2)
    .attr("y", height - PADDING / 5);

  //append Y-axis label
  lineGraph
    .append("text")
    .style("text-anchor", "end")
    .style("font-weight", "900")
    .style("font-size", "1.4rem")
    .attr("transform", "rotate(-90)")
    .text(`${selectedColumn}`)
    .attr("x", -height / 3)
    .attr("y", PADDING / 3.5);

  //append Title
  lineGraph
    .append("text")
    .style("font-weight", "900")
    .style("text-transform", "uppercase")
    .text(`Yearly ${selectedColumn} (${d.Country})`)
    .attr("x", width / 2 - PADDING * 2)
    .attr("y", PADDING / 2);

  if (!lineGraphOpen) {
    //if line graph is not open, hide line graph to the left
    lineGraph
      .style("left", PADDING - width + "px")
      .transition()
      .duration(TRANS_DURATION / 2)
      .style("left", 0 + "px");
  } else {
    //if it is open show it directly
    lineGraph.style("left", 0 + "px");
  }

  displayCloseBtn(); //display close btn to close the line graph
}

/**
 * Appends lines to line chart which shows the yearly
 * data of the selected country for each years
 *
 * @param {*} countryDataByYear
 * @param {*} scale_Y
 * @param {*} scale_X
 */
function appendLines(countryDataByYear, scale_Y, scale_X) {
  lineGraph.selectAll("g").data(countryDataByYear).enter().append("g"); //append data to lineGraph
  var line = d3
    .line()
    .x(function (d, i) {
      return scale_X(d.Year) + PADDING * 1.2;
    }) // set the x values for the line generator
    .y(function (d) {
      return scale_Y(d[selectedColumn]);
    }); // set the y values for the line generator

  lineGraph
    .append("path") // Add the valueline path.
    .attr("class", "line")
    .attr("d", line(countryDataByYear));

  $(".line").css({
    fill: "none",
    stroke: BAR_COLOR,
    "stroke-width": "2",
    "shape-rendering": "smoothEdges",
  }); //styling for line

  lineGraph
    .selectAll("circle") //append markers
    .data(countryDataByYear)
    .enter()
    .append("circle")
    .style("fill", BAR_COLOR)
    .style("cursor", "pointer")
    .attr("r", 6)
    .attr("cx", function (d) {
      return scale_X(d.Year) + PADDING * 1.2; //x coordinte of marker
    })
    .attr("cy", function (d) {
      return scale_Y(d[selectedColumn]); //y coordinte of marker
    })
    .on("mouseover", function (event, d) {
      d3.select(this).style("fill", BAR_HOVER); //change marker color on hover

      //show a refrence line to show the data y-value
      lineGraph
        .append("line")
        .attr("class", "refLine")
        .attr("x1", PADDING * 1.5)
        .attr("y1", scale_Y(d[selectedColumn]) + 1)
        .attr("x2", scale_X(d.Year) + PADDING * 1.2)
        .attr("y2", scale_Y(d[selectedColumn]));

      //show a refrence line to show the data x-value(YEAR)
      lineGraph
        .append("line")
        .attr("class", "refLine")
        .attr("x1", scale_X(d.Year) + PADDING * 1.2)
        .attr("y1", height - PADDING)
        .attr("x2", scale_X(d.Year) + PADDING * 1.2)
        .attr("y2", scale_Y(d[selectedColumn]));

      //styling for the refrence line
      lineGraph
        .selectAll(".refLine")
        .style("stroke", BAR_HOVER)
        .style("stroke-width", 1)
        .style("stroke-dasharray", "3, 3");

      //show the label value at the marker
      markerHover
        .style("display", "block")
        .style("background-color", "transparent")
        .style("top", scale_Y(d[selectedColumn]) + PADDING / 3 + "px")
        .style("left", scale_X(d.Year) + PADDING / 15 + "px")
        .style("left", PADDING * 1.55 + "px")
        .text(`${d[selectedColumn]}`);
    })
    .on("mouseout", function (event) {
      lineGraph.selectAll(".refLine").remove(); //hide the refrence line
      d3.select(this).style("fill", BAR_COLOR); //originl color of marker
      markerHover.style("display", "none").style("left", PADDING + "px"); //hide label
    });
}

/**
 * Appends options to select between Scatter Plot and Bar Graph
 */
function appendVizOption() {
  //append radio button to select between scatter plot and bar graph
  $(".title1")
    .append(`<span id="vizLabel">Show <select ><option selected>ScatterPlot</option>
  <option>Bar Graph</option></select></span>`);
}
/**
 * Appends options to select the column
 */
function appendSelectColumn() {
  let options = "";

  let oneTuple = worldStats[0]; //get column name from one tuple
  let i = 0;

  //html tags for options
  Object.keys(oneTuple).forEach(function eachKey(key) {
    if (i >= 2 && i <= 8) {
      options += `<option ${key == "Population" ? "selected" : ""
        }>${key}</option>`;
    }
    i++;
  });

  $("#select>#columnSelect>#column").append(options); //append options
}

/**
 * Appends the option to select year
 */
function appendSelectYear() {
  //html tag for year selection
  $(".title1").append(
    `<!-- for scatter-plot world population option -->
    <span id="select">
    <span id="to">to visualize</span>
      <span id="columnSelect">
      <select name="column" id="column" ></select>
      </span>
      <label for="year">
      of <span id="dataOf"><span></label>
      <select name="year" id="year"></select>
    </span>
    `
  );

  // append year options
  let options = "";

  let years = worldStats.map((eachTuple) => eachTuple.Year); //get only the years
  uniqueYears = new Set(years); //unique years

  //html tags for options
  uniqueYears.forEach((eachYear) => {
    options += `<option ${eachYear == 2020 ? "selected" : ""
      }>${eachYear}</option>`;
  });

  $("select").css({
    "font-size": "1rem",
    "font-weight": "700",
  }); //styling for the dropdown

  $("#select>#year").append(options); //append options
}

/**
 * Appends title for donut chart
 */
function drawDonutChartTitle() {
  //append Donut chart title
  $(".title2").append("<div id='donutTitle'>Population of Continents</div>");
}

/**
 * Appends hidden close button
 */
function addHiddenCloseBtn() {
  //append button html
  $(".main").append("<button id='slide'><</button>");

  //styling
  $("#slide").css({
    border: "1px solid #fff",
    height: height + PADDING / 3.65,
    left: width + "px",
    top: PADDING / 1.25,
  });
}

/**
 * Displays the close button which slide line char to left
 * @param {*} type
 */
function displayCloseBtn() {
  //display close btn
  let closeBtn = d3.select("#slide");
  if (!lineGraphOpen) {
    closeBtn
      .style("left", 0)
      .transition()
      .duration(TRANS_DURATION / 5)
      .style("left", width + "px")
      .style("display", "block");
    lineGraphOpen = true;
  } else {
    closeBtn.style("left", width + "px");
    lineGraphOpen = true;
  }

  // onclick remove lineGraph and hide close btn
  closeBtn.on("click", (event) => {
    if (lineGraphOpen) {
      lineGraph
        .transition()
        .duration(TRANS_DURATION / 2)
        .style("left", 0 - width + "px")
        .remove();
    }
    $("#slide").css("display", "none");
    markerHover.style("display", "none");
    lineGraphOpen = false;
  });
}

/**
 * Appends the label for hover effects
 */
function appendHvrLbl() {
  //marker hover label
  markerHover = d3
    .select("body")
    .append("div")
    .attr("class", "markerHover")
    .style("position", "absolute")
    .style("z-index", "100")
    .style("font-weight", "900")
    .style("cursor", "pointer")
    .style("color", HOVER_TEXT_COLOR)
    .style("border-radius", "3px");

  //click me label
  clickMeLabel = d3
    .select("body")
    .append("div")
    .attr("class", "clickMeLabel")
    .style("position", "absolute")
    .style("z-index", "100")
    .style("font-weight", "900")
    .style("background-color", "#D64933")
    .style("color", HOVER_TEXT_COLOR)
    .style("cursor", "pointer")
    .style("padding", "3px")
    .style("border-radius", "3px");
}

/**
 * Filter the column data from the yearly data
 * @param {*} filteredDataByYear
 * @returns
 */
function selectColData(filteredDataByYear) {
  //get the user selected column
  selectedColumn = $("#column option:selected").val();

  //filter the column data
  return filteredDataByYear.map((eachValue) => eachValue[selectedColumn]);
}

/**
 * Filters the data by year
 *
 * @returns
 */
function filterDataByYear() {
  //get the user selected year
  selectedYear = $("#year option:selected").val();

  //filter the data of the year
  return worldStats.filter((eachValue) => {
    return eachValue.Year == selectedYear;
  });
}
$(window).resize(function () {
  width = 0.675 * $(window).width();
  height = 0.9 * $(window).height();
  draw();
});
