async drawBar(){
    let data = [
        {words: "Social distancing", count: 293},
        {words: "Mental health", count: 233},
        {words: "Tested  positive", count: 133},
        {words: "Wearing masks", count: 114},
        {words: "Wear masks", count: 109},
        {words: "Grocery store", count: 81},
        {words: "Sore throat", count: 77},
        {words: "2 weeks", count: 75},
        {words: "Stay home", count:  74},
        {words: "Social distance", count: 73},
        {words: "Days ago", count: 67},
        {words: "Weeks  ago", count: 56},
        {words: "Health issues", count: 54},
        {words: "Social media", count:  50},
        {words: "Immune system", count: 48},
    ];
    
    const xAccessor = +d.count
    const yAccessor = d.words

    const margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 640 - margin.left - margin.right,
    height = 380 - margin.top - margin.bottom;

    const x = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return xAccessor.length - 1; })])
    .range([0, width]);

    const y = d3.scale.linear()
    .domain([d3.min(data, function(d) { return d3.min(yAccessor); }),
             d3.max(data, function(d) { return d3.max(yAccessor); })])
    .range([height, 0]);
}