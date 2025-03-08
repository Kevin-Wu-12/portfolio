let data = [];
let commits = [];
let xScale, yScale; 
let rScale;
let brushSelection = null; 
let dots;

let selectedCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let filteredCommits = [];
let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

let NUM_FILE_ITEMS = 50; 
let FILE_ITEM_HEIGHT = 30;
let FILE_VISIBLE_COUNT = 10;
let totalFileHeight = (NUM_FILE_ITEMS - 1) * FILE_ITEM_HEIGHT;
let files = [];

const scrollContainerFiles = d3.select('#scroll-container-files');
const spacerFiles = d3.select('#spacer-files');
spacerFiles.style('height', `${totalFileHeight}px`);
const itemsContainerFiles = d3.select('#items-container-files');


async function loadData() {
  data = await d3.csv("https://raw.githubusercontent.com/Kevin-Wu-12/portfolio/main/meta/loc.csv?", (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
  }));
  
  processCommits(); 
  displayStats();
  timeScale = d3.scaleTime()
      .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
      .range([0, 100]);

  commitMaxTime = timeScale.invert(commitProgress);
  
  filterCommitsByTime();  
  updateScatterplot(filteredCommits); 
  updateFileVisualization();
  
  renderItems(0);  
  renderFileItems(0);  
}


function filterCommitsByTime() {
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateFileVisualization();
  displayStats();
}

function updateFileVisualization() {
  let lines = filteredCommits.flatMap((d) => d.lines);
  files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({ name, lines }));

  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');

  filesContainer.append('dt').append('code').text(d => d.name);
  filesContainer.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));

  renderFileItems(0);
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
              lines
          };

          return ret;
      });

  // ✅ Sort commits by datetime (oldest to newest)
  commits = d3.sort(commits, (a, b) => d3.ascending(a.datetime, b.datetime));
}


function displayStats() {
  d3.select("#stats").html("");
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  dl.append("dt").html("Total <abbr title='Lines of code'>LOC</abbr>");
  dl.append("dd").text(filteredCommits.flatMap(d => d.lines).length);

  dl.append("dt").text("Total Commits");
  dl.append("dd").text(filteredCommits.length);

  const numFiles = d3.groups(filteredCommits.flatMap(d => d.lines), d => d.file).length;
  dl.append("dt").text("Number of Files");
  dl.append("dd").text(numFiles);

  const avgLineLength = d3.mean(filteredCommits.flatMap(d => d.lines), d => d.length);
  dl.append("dt").text("Average Line Length (chars)");
  dl.append("dd").text(avgLineLength ? avgLineLength.toFixed(2) : "N/A");
}
function updateScatterplot(filteredCommits) {
  d3.select(".brush").remove();
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

  d3.select("#chart").html("");
  d3.select("svg").remove();
  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

  xScale = d3.scaleTime()
      .domain(d3.extent(filteredCommits, (d) => d.datetime))
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

  const dots = svg.append("g").attr("class", "dots");

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  dots.selectAll("circle")
      .data(filteredCommits, d => d.id)
      .join("circle")
      .attr("cy", d => yScale(d.hourFrac))
      .attr("r", d => rScale(d.totalLines))
      .attr("fill", "steelblue")
      .style("fill-opacity", 0.7)
      .attr("cx", d3.max(xScale.range()))
      .on("mouseenter", function (event, commit) {
          d3.select(this).style("fill-opacity", 1);
          console.log("Hovered on commit:", commit.id);  // ✅ Debugging log
          updateTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
      })
      .on("mousemove", function (event) { 
          updateTooltipPosition(event); // Update position on move
      })
      .on("mouseleave", function () {
          d3.select(this).style("fill-opacity", 0.7);
          updateTooltipContent({});
          updateTooltipVisibility(false);
      })
      .transition()
      .duration(150)
      .ease(d3.easeLinear)
      .attr("cx", d => xScale(d.datetime));
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!tooltip) return;

  let x = event.clientX + 15; // Add offset to avoid overlap with cursor
  let y = event.clientY + 15;

  // Prevent tooltip from overflowing the viewport
  if (x + tooltip.offsetWidth > window.innerWidth) {
    x = window.innerWidth - tooltip.offsetWidth - 15;
  }
  if (y + tooltip.offsetHeight > window.innerHeight) {
    y = window.innerHeight - tooltip.offsetHeight - 15;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}



function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const author = document.getElementById('commit-author');
  const lines_edited = document.getElementById('commit-lines');

  if (!link || !date || !author || !lines_edited) return; // ✅ Prevents errors

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  author.textContent = commit.author;
  lines_edited.textContent = `${commit.totalLines} lines edited`;

}


function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  
  if (isVisible) {
    tooltip.classList.add('visible');
  } else {
    tooltip.classList.remove('visible');
  }
}



document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  d3.select("#commit-slider").on("input", function() {
    commitProgress = +this.value;
    filterCommits();
    updateScatterplot(filteredCommits);
  });

  updateScatterplot(filteredCommits);
});



function filterCommits() {
  commitMaxTime = timeScale.invert(commitProgress); // Convert progress to datetime
  selectedCommits = commits.filter(d => d.datetime <= commitMaxTime);

  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function applyBrush() {
  const brush = d3.brush()
      .extent([[80, 50], [1000, 600]]) // Ensure brush size matches scatterplot dimensions
      .on("brush", brushed)
      .on("end", brushed);

  d3.select("#chart svg").append("g")
      .attr("class", "brush")
      .call(brush);
}

const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        let x = xScale(commit.date);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });
}
  
function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
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

let NUM_ITEMS = 100;
let ITEM_HEIGHT = 30;
let VISIBLE_COUNT = 10;
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');

scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));


  filteredCommits = commits.slice(startIndex, startIndex + VISIBLE_COUNT);

  renderFileItems(startIndex);  
  updateScatterplot(filteredCommits);
});


scrollContainerFiles.on('scroll', () => {
  const scrollTop = scrollContainerFiles.property('scrollTop');
  let startIndex = Math.floor(scrollTop / FILE_ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, files.length - FILE_VISIBLE_COUNT));
  
  renderFileItems(startIndex);  
});


function renderFileItems(startIndex) {
  itemsContainerFiles.selectAll('.item').remove(); 

  const endIndex = Math.min(startIndex + FILE_VISIBLE_COUNT, files.length);
  let fileSlice = files.slice(startIndex, endIndex);  

  displayCommitFiles(fileSlice); 

  itemsContainerFiles.selectAll('.item')
      .data(fileSlice)
      .enter()
      .append('div')
      .attr('class', 'item')
      .html(file => `
          <p>
              <code>${file.name}</code> had <strong>${file.lines.length}</strong> lines edited.
              It was one of the most changed files during development.
          </p>
      `);
}



function renderItems(startIndex) {
  itemsContainer.selectAll('.item').remove();

  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex); // ✅ Ensures correct order

  updateScatterplot(newCommitSlice);  

  itemsContainer.selectAll('.item')
      .data(newCommitSlice)
      .enter()
      .append('div')
      .attr('class', 'item')
      .html(commit => `
          <p>
              On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made 
              <a href="${commit.url}" target="_blank">
                  ${startIndex > 0 ? 'another commit' : 'my first commit, and it was exciting'}
              </a>. I edited ${commit.totalLines} lines across 
              ${d3.rollups(commit.lines, D => D.length, d => d.file).length} files.
          </p>
      `);
}


function displayCommitFiles() {
  const lines = filteredCommits.flatMap((d) => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
    return { name, lines };
  });
  files = d3.sort(files, (d) => -d.lines.length);
  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
  filesContainer.append('dt').html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  filesContainer.append('dd')
                .selectAll('div')
                .data(d => d.lines)
                .enter()
                .append('div')
                .attr('class', 'line')
                .style('background', d => fileTypeColors(d.type));
}