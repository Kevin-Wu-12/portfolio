let data = [];
let commits = [];
let xScale, yScale;  // Make scales global
let rScale;
let brushSelection = null; 
let dots;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    processCommits();
    displayStats();
    createScatterplot();
}

function processCommits() {
    commits = d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: `https://github.com/vis-society/lab-7/commit/${commit}`,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                writable: false,
                enumerable: false,
                configurable: false
            });

            return ret;
        });
}

function displayStats() {
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  dl.append("dt").html("Total <abbr title='Lines of code'>LOC</abbr>");
  dl.append("dd").text(data.length);

  dl.append("dt").text("Total Commits");
  dl.append("dd").text(commits.length);

  const numFiles = d3.groups(data, (d) => d.file).length;
  dl.append("dt").text("Number of Files");
  dl.append("dd").text(numFiles);

  const avgLineLength = d3.mean(data, (d) => d.length);
  dl.append("dt").text("Average Line Length (chars)");
  dl.append("dd").text(avgLineLength.toFixed(2));
}

function createScatterplot() {
  const width = 1000, height = 600;
  const margin = { top: 50, right: 50, bottom: 60, left: 80 };

  const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
  };

  d3.select("#chart").html(""); // Clear previous chart before appending new

  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)  // Explicit width
      .attr("height", height) // Explicit height
      .style("overflow", "visible");

  // Define scales
 xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();

yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale).ticks(10);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => `${d.toFixed(0)}:00`);

  svg.append("g")
      .attr("transform", `translate(0, ${usableArea.bottom})`)
      .call(xAxis);

  svg.append("g")
      .attr("transform", `translate(${usableArea.left}, 0)`)
      .call(yAxis);

  const gridlines = svg.append("g")
      .attr("class", "gridlines")
      .attr("transform", `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));

  dots = svg.append("g").attr("class", "dots");


  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);


  rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);


  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);


  dots.selectAll("circle")
      .data(sortedCommits)
      .join("circle")
      .attr("cx", d => xScale(d.datetime))
      .attr("cy", d => yScale(d.hourFrac))
      .attr("r", d => rScale(d.totalLines)) 
      .attr("fill", "steelblue")
      .style("fill-opacity", 0.7)
      .on("mouseenter", function (event, commit) {
          d3.select(event.currentTarget).style("fill-opacity", 1); 
          updateTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
      })
      .on("mousemove", updateTooltipPosition)
      .on("mouseleave", function () {
          d3.select(event.currentTarget).style("fill-opacity", 0.7);
          updateTooltipVisibility(false);
      });
      
      function brushSelector() {
        const brush = d3.brush()
            .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
            .on("start brush end", brushed);

        svg.append("g")
            .attr("class", "brush")
            .call(brush)
            .lower(); // Send brush behind dots
    }

    brushSelector(); // ✅ Call brushSelector inside createScatterplot()
}

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

});


const sortedCommits = d3.sort(commits, (d) => -d.totalLines);


    
    function brushed(event) {
      brushSelection = event.selection;
      updateSelection()
      
      updateSelectionCount();
      updateLanguageBreakdown();
  }
  
function isCommitSelected(commit) {
  if (!brushSelection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] = brushSelection; // Get bounds of selection
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}


  function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
  }


  function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }


  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
  }
