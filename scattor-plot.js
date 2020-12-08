async function drawScatter() {

  // 1. Access data
  let dataset = await d3.csv("sentiment_per_post.csv")

  const dateParser = d3.timeParse('%Y-%m-%d');
  const xAccessor = d => dateParser(d['timestamp']);
  const yAccessor = d => +d.calculated_sentiment
//   const colorAccessor = d => d.upvote_ratio
  const flair = d => d.flair
  const flairColorMap = new Map([["Support", '#224dab'], 
                                 ["Discussion", '#3168b6'], 
                                 ["Question", '#3f83c0'], 
                                 ["Firsthand Account", '#4e9eca'], 
                                 ["News", '#63b9d3'], 
                                 ["NA", '#82d3dc'],
                                 ["Trigger Warning", '#dfdfdf'],
                                 ["Resources", '#decace'],
                                 ["Good News", '#c1a9b4'],
                                 ["Misinformation - debunked", '#a48a95'],
                                 ["Missleading and incorrect title", '#866d76'],
                                 ["Deperate Mod", '#695257'],
                                 ["The answer is NO.", '#4d3839']]);

  // 2. Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.9,
    window.innerHeight * 0.9,
  ])
  let dimensions = {
    width: 1200,
    height: width,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 50,
    },
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
      .style("transform", `translate(${
        dimensions.margin.left
      }px, ${
        dimensions.margin.top
      }px)`)

  // 4. Create scales

  const xExtent = d3.extent(dataset, xAccessor);
  const xScale = d3
    .scaleTime()
    .domain([xExtent[0], xExtent[1] * 1])
    .range([0, dimensions.boundedWidth]);


  const yScale = d3.scaleLinear()
    .domain([-1, d3.max(dataset, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

//   const colorScale = d3.scaleLinear()
//     .domain(d3.extent(dataset, colorAccessor))
//     .range(["skyblue", "darkslategrey"])

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
        .attr("r", 4)

    const oldDots = dots.exit()
        .remove()
  }
  drawDots(dataset)

//   const dots = bounds.selectAll("circle")
//     .data(dataset)
//     .enter().append("circle")
//       .attr("cx", d => xScale(xAccessor(d)))
//       .attr("cy", d => yScale(yAccessor(d)))
//       .attr("r", 4)
//       .attr("fill", d => colorScale(colorAccessor(d)))
//       .attr("tabindex", "0")

  // 6. Draw peripherals

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .html("Month")

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4)

  const yAxis = bounds.append("g")
      .call(yAxisGenerator)

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .text("Sentiment")
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
      .attr("stroke", "cornflowerblue")
      .on("mouseenter", onMouseEnter)
      .on("mouseleave", onMouseLeave)

  const tooltip = d3.select("#tooltip")

  function onMouseEnter(datum) {
  console.log(datum)
    const postDot = bounds.append("circle")
        .attr("class", "tooltipDot")
        .attr("cx", d => xScale(xAccessor(datum)))
        .attr("cy", d => yScale(yAccessor(datum)))
        .attr("r", 7)
        .style("fill", "maroon")
        .style("pointer-events", "none")

    const formatSentiment = d3.format(".2f")
    tooltip.select("#sentitment")
        .text(formatSentiment(yAccessor(datum)))

    // const dateParser = d3.timeParse("%Y-%m-%d")
    const formatDate = d3.timeFormat("%Y-%m-%d")
    tooltip.select("#date")
        .text(formatDate(dateParser(xAccessor(datum))))

    // const x = xScale(xAccessor(datum))
    //   + dimensions.margin.left
    // const y = yScale(yAccessor(datum))
    //   + dimensions.margin.top

    // tooltip.style("transform", `translate(`
    //   + `calc( -50% + ${x}px),`
    //   + `calc(-100% + ${y}px)`
    //   + `)`)

    tooltip.style("opacity", 1)
  }

  function onMouseLeave() {
    d3.selectAll(".tooltipDot")
      .remove()

    tooltip.style("opacity", 0)
  }
}
drawScatter()