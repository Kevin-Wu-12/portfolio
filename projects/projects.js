import { fetchJSON, renderProjects, fetchGitHubData} from '../global.js';


document.addEventListener("DOMContentLoaded", async function () {
    const projectsContainer = document.querySelector(".projects");
    const projectCount = document.getElementById("project-count");

    try {
        // Fetch projects from JSON file
        const projects = await fetchJSON("../lib/projects.json");

        // Ensure each project includes an image when rendered
        projectsContainer.innerHTML = projects.map(project => `
            <article>
                <img src="${project.image}" alt="${project.title}">
                <h2>${project.title}</h2>
                <p>${project.description}</p>
            </article>
        `).join('');

        // Update project count
        projectCount.textContent = `${projects.length}`;

    } catch (error) {
        console.error("Error loading projects:", error);
        projectCount.textContent = "(Error)";
    }
});
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let svg = d3.select("svg");
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let legend = d3.select(".legend");
let searchInput = document.querySelector(".searchBar");
let projectsContainer = document.querySelector(".projects");

let projects = [];
let selectedIndex = -1;
let query = "";
let pieData = []; // Store pie chart data globally

// Function to render the pie chart based on filtered projects
function renderPieChart(projectsGiven) {
    svg.selectAll("*").remove();
    legend.selectAll("*").remove();

    if (projectsGiven.length === 0) return;

    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    pieData = rolledData.map(([year, count]) => ({
        value: count,
        label: String(year)
    }));

    let pieGenerator = d3.pie().value((d) => d.value);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let arcs = pieGenerator(pieData);

    let paths = svg.selectAll("path")
        .data(arcs)
        .enter()
        .append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => colors(i))
        .attr("class", "wedge")
        .style("cursor", "pointer")
        .on("click", function (_, i) {
            selectedIndex = selectedIndex === i ? -1 : i;
            update();
        });

    let legendItems = legend.selectAll("li")
        .data(pieData)
        .enter()
        .append("li")
        .attr("style", (d, i) => `--color:${colors(i)}`)
        .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", function (_, i) {
            selectedIndex = selectedIndex === i ? -1 : i;
            update();
        });

    highlightSelection(paths, legendItems);
}

// Function to highlight the selected pie slice and legend
function highlightSelection(paths, legendItems) {
    paths.attr("fill", (d, i) => (i === selectedIndex ? "#ff9800" : colors(i)));
    legendItems.classed("selected", (_, i) => i === selectedIndex);
}

// Function to filter projects dynamically based on search and pie selection
function update() {
    let selectedYear = selectedIndex !== -1 && pieData[selectedIndex] ? pieData[selectedIndex].label : null;
    let queryLower = query.trim().toLowerCase();

    let filteredProjects = projects.filter((project) => {
        let matchesYear = selectedYear ? String(project.year) === selectedYear : true;
        let values = Object.values(project).join(" ").toLowerCase();
        let matchesSearch = queryLower ? values.includes(queryLower) : true;
        return matchesYear && matchesSearch;
    });

    renderProjects(filteredProjects, projectsContainer, "h2");
    renderPieChart(filteredProjects);
}

// Fetch projects and initialize page
fetch("../lib/projects.json")
    .then((response) => response.json())
    .then((data) => {
        projects = data;
        renderProjects(projects, projectsContainer, "h2");
        renderPieChart(projects);
    });

// Search input event listener
searchInput.addEventListener("input", (event) => {
    query = event.target.value.toLowerCase();
    update();
});
