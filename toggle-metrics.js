async function toggleMetrics(yMetric, xMetric) {
  $('svg').remove();
  // 1. Access data
  let dataset = await d3.csv("sentiment_per_post.csv")

  const dateParser = d3.timeParse('%Y-%m-%d');
  const xAccessor = d => dateParser(d['timestamp']);
  // const xAccessor = d => +d.score;
  const yAccessor = d => d[`${yMetric}`];

  // const yAccessor = d => +d.upvote_ratio
//   const colorAccessor = d => +d.upvote_ratio
  const flairAccessor = d => d.flair;
  const flairColorMap = new Map([["Support", '#0000a4'], 
                                 ["Discussion", '#cac0d9'], 
                                 ["Questions", '#c0adde'], 
                                 ["Firsthand Account", '#512ed7'], 
                                 ["News", '#7951e2'], 
                                 ["NA", '#d4d4d4'],
                                 ["Trigger Warning", '#8a63e4'],
                                 ["Resources", '#9a75e4'],
                                 ["Good News", '#a888e3'],
                                 ["Misinformation - debunked", '#b49ae1'],
                                 ["Misleading and incorrect title", '#391dcd'],
                                 ["Deperate mod", '#0a3262'],
                                 ["The answer is NO.", '#1c0abe']]);

  // 2. Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.9,
    window.innerHeight * 0.8,
  ])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 100,
      right: 10,
      bottom: 50,
      left: 50,
    },
  }
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // 3. Draw canvas

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("viewBox", "0 0 800 800") 
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("class", "svg-content")
                        
    
    // .attr("width", dimensions.width)
    // .attr("height", dimensions.height)

  const bounds = wrapper
    .append("g")
    .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)


  // 4. Create scales

  const xExtent = d3.extent(dataset, xAccessor);
  const xScale = d3
    .scaleTime()
    .domain([xExtent[0], xExtent[1] * 1])
    .range([0, dimensions.boundedWidth]);
    // const xScale = d3
    // .scaleLinear()
    // .domain([xExtent[0], xExtent[1] * 1])
    // .range([0, dimensions.boundedWidth])
    // .nice();


  const yExtent = d3.extent(dataset, yAccessor);
  const yScale = d3
    .scaleLinear()
    .domain([yExtent[0], yExtent[1]])
    .range([dimensions.boundedHeight, 0])
    .nice();

const drawDots = (dataset) => {

    // 5. Draw data

    const dots = bounds.selectAll("circle")
      .data(dataset, d => d[0])

    const newDots = dots.enter().append("circle")

    const allDots = newDots.merge(dots)
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessor(d)))
        .attr("stroke", d => flairColorMap.get(d['flair']))
        .attr("fill", d => flairColorMap.get(d['flair']))
        .attr("fill-opacity", 0.45)
        .attr("r", 4)

    const oldDots = dots
        .exit()
        .remove()
  }
  drawDots(dataset)

  // 6. Draw peripherals

  const xAxisGenerator = d3
    .axisBottom()
    .scale(xScale)

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom)
    .html("month")


  const yAxisGenerator = d3
    .axisLeft()
    .scale(yScale)
    .ticks(5)

  const yAxis = bounds
    .append("g")
    .call(yAxisGenerator)

  const yAxisLabel = yAxis
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .text(`${yMetric}`)
    .style("text-anchor", "middle")


// 7. Set up interactions

  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  )

  const voronoi = delaunay.voronoi()
  voronoi.xmax = dimensions.boundedWidth
  voronoi.ymax = dimensions.boundedHeight

  bounds.selectAll(".voronoi")
    .data(dataset)
    .enter()
    .append("path")
      .attr("class", "voronoi")
      .attr("d", (d,i) => voronoi.renderCell(i))
      // .attr("stroke", "cornflowerblue")
      .on("mouseenter", onMouseEnter)
      .on("mouseleave", onMouseLeave)

  const tooltip = d3.select("#tooltip")

  function onMouseEnter(mouseenter, datum) {

    const postDot = bounds.append("circle")
        .attr("class", "tooltipDot")
        .attr("cx", xScale(xAccessor(datum)))
        .attr("cy", yScale(yAccessor(datum)))
        .attr("r", 7)
        .style("fill", "orange")
        .style("pointer-events", "none")

    const formatSentiment = d3.format(".2f")
    tooltip.select("#sentiment")
        .text(formatSentiment(datum.calculated_sentiment))

    tooltip
        .select("#title")
        .text(datum.title)

    if (datum.body != "NA") {
        tooltip.select("#body").text(datum.body)
    } else {
        tooltip.select("#body").text("")
    }
    
    tooltip.select("#url")
        .html(`<a href="${datum.url}">View post</a>`)

    tooltip.select("#flair")
        .text(datum.flair)
        .style("background-color", d => flairColorMap.get(datum['flair']))
        .attr("class", "btn")

    const dateParser = d3.timeParse("%Y-%m-%d")
    const formatDate = d3.timeFormat("%B %-d, %Y")
    tooltip
        .select("#date")
        .text(formatDate(dateParser(datum.timestamp)))

    const x = xScale(xAccessor(datum)) + dimensions.margin.left
    const y = yScale(yAccessor(datum)) + dimensions.margin.top

    tooltip.style("transform", `translate(`
      + `calc( -50% + ${x}px),`
      + `calc(-100% + ${y}px)`
      + `)`)

    tooltip.style("opacity", 1)
  }

  function onMouseLeave() {
    d3.selectAll(".tooltipDot")
      .remove()

    tooltip.style("opacity", 0)
  }

  // const legend = d3
  //   .select("#legend")
  //   .attr("height", "100%")
  //   .attr("width", "100%")

  const datasetByFalir = d3.group(dataset, flairAccessor)
//   console.log(datasetByFalir.values())

  // const flairList = d3
  //   .select(`#legend`)
  //   .selectAll('p')
  //   .data(datasetByFalir)
  //   .enter()
  //   .append('p')
  //   .attr("class", "legendText")

  // flairList
  //   .html(d => d[0])
  //   .sort()
  //   .style("font-size", "0.9em")
  //   .attr("alignment-baseline","middle")
  //   .on("click", function(click, d){
  //       d3.selectAll(".legendText").style("opacity",1)
  //   })

  // flairDot = legend
  //   .selectAll("circle")
  //   .data(datasetByFalir)
    
  // flairDot.enter()
  //   .append("circle")
  //   .attr('cx',20 )
  //   .attr('cy', 160 )
  //   .attr('r', 6) 
  //   .style("fill", d => { flairColorMap.get(d["flair"]) })



}
toggleMetrics('score')

const setGraph = () => {
  toggleMetrics($('#y-value').val());
  // console.log($('#y-value').val())
}

