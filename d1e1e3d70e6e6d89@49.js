function _chart(d3,data)
{
  const width = 400, height = 600;
  const margin = {top: 20, right: 80, bottom: 60, left: 80};

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "Inter, sans-serif")
    .style("background", "transparent");

  const processed = data.map(d => ({
    ...d,
    budget: d.budget / 1e6,
    revenue: d.revenue / 1e6,
    profit: d.profit / 1e6,
    roi: d.ROI
  }));

  const x = d3.scaleLinear()
    .domain([0, 80])
    .range([margin.left, width - margin.right]);

  const yMax = d3.max(processed, d => d.revenue);
  const y = d3.scaleLinear()
    .domain([0, Math.ceil(yMax / 20) * 20])
    .range([height - margin.bottom, margin.top]);

  const r = d3.scaleSqrt()
    .domain([0, d3.max(processed, d => d.profit)])
    .range([3, 25]);

  // 🎨 Updated gradient based on the image
  const color = d3.scaleSequential()
    .domain([0, d3.max(processed, d => d.roi)])
    .interpolator(d3.interpolateRgbBasis([
  "#000000",  // black
  "#3300cc",  // purple
  "#00ccff",  // cyan
  "#00cc66",  // green   
  "#ffee00",  // yellow
  "#ff4000",  // orange-red
  "#ff0066",  // pink
    ]));

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(g => {
      g.call(d3.axisBottom(x).tickFormat(d => `$${d}M`).ticks(8));
      g.select(".domain").remove();
      g.selectAll("line").remove();
    });

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(g => {
      g.call(d3.axisLeft(y)
        .tickFormat(d => `$${d}M`)
        .tickValues(d3.range(0, y.domain()[1] + 1, 20)));
      g.select(".domain").remove();
      g.selectAll("line").remove();
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Budget (in millions)");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Revenue (in millions)");

  // Tooltip
  const tooltipGroup = svg.append("g").style("display", "none");
  const tooltipBg = tooltipGroup.append("rect")
    .attr("fill", "rgba(0,0,0,0.85)")
    .attr("rx", 4).attr("ry", 4)
    .attr("width", 220).attr("height", 80);
  const tooltipText = tooltipGroup.append("text")
    .attr("x", 10).attr("y", 20)
    .attr("fill", "white")
    .style("font-size", "13px");

  const bubbles = svg.append("g")
    .selectAll("circle")
    .data(processed)
    .join("circle")
    .attr("cx", d => x(d.budget))
    .attr("cy", d => y(d.revenue))
    .attr("r", d => r(d.profit))
    .attr("fill", d => d3.color(color(d.roi)).copy({opacity: 0.2}))
    .attr("stroke", d => color(d.roi))
    .attr("stroke-width", 1.5);

  // Hover = tooltip only
  bubbles
    .on("mouseover", function(event, d) {
      const lines = [
        `${d.title}`,
        `💰 Revenue: $${d.revenue.toFixed(1)}M`,
        `🧾 Budget: $${d.budget.toFixed(1)}M`,
        `💵 Profit: $${d.profit.toFixed(1)}M`,
        `🔁 ROI: ${d.roi.toFixed(1)}%`
      ];
      tooltipText.selectAll("tspan").remove();
      lines.forEach((line, i) => {
        tooltipText.append("tspan")
          .attr("x", 10)
          .attr("dy", i === 0 ? 0 : 15)
          .text(line);
      });
      tooltipBg.attr("height", 15 * lines.length + 15);
      tooltipGroup.style("display", null);
    })
    .on("mousemove", function(event) {
      const [xPos, yPos] = d3.pointer(event);
      tooltipGroup.attr("transform", `translate(${xPos + 20},${yPos})`);
    })
    .on("mouseout", function() {
      tooltipGroup.style("display", "none");
    })
    .on("click", function() {
      const bubble = d3.select(this);
      const originalCy = +bubble.attr("cy");

      function bounce(times) {
        if (times <= 0) return;
        bubble.transition()
          .duration(150)
          .attr("cy", originalCy - 5)
          .transition()
          .duration(150)
          .attr("cy", originalCy)
          .on("end", () => bounce(times - 1));
      }

      bounce(3);
    });

  // Legend (gradient matches new color scheme)
  const legendHeight = y.range()[0] - y.range()[1];
  const legendWidth = 15;
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);

  const legendScale = d3.scaleLinear()
    .domain(color.domain())
    .range([legendHeight, 0]);

  const legendAxis = d3.axisRight(legendScale)
    .tickFormat(d => `${d}%`)
    .ticks(6);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");

  for (let i = 0; i <= 1; i += 0.01) {
    linearGradient.append("stop")
      .attr("offset", `${i * 100}%`)
      .attr("stop-color", color(color.domain()[0] + i * (color.domain()[1] - color.domain()[0])));
  }

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  legend.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

  legend.append("text")
    .attr("x", -5)
    .attr("y", legendHeight + 20)
    .style("font-size", "12px")
    .style("text-anchor", "start")
    .text("R.O.I.");

  return svg.node();
}


function _data(FileAttachment){return(
FileAttachment("a24_budget_revenue_scatter.json").json()
)}

function _a24_budget_revenue_scatter(FileAttachment){return(
FileAttachment("a24_budget_revenue_scatter.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["a24_budget_revenue_scatter.json", {url: new URL("./files/7204eb987583bf3856801395dbacc406c8c8a1a8c4ccbc4580456f0fbb20258497d509a493d5f3fd4260e943539a6ac35199c1411e0528262b82724abf270289.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("a24_budget_revenue_scatter")).define("a24_budget_revenue_scatter", ["FileAttachment"], _a24_budget_revenue_scatter);
  return main;
}
