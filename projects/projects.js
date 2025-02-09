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
let legend = d3.select('.legend');
let query = '';
let searchInput = document.querySelector('.searchBar');
let projectsContainer = document.querySelector('.projects');
let projects = [];
let selectedIndex = -1;
let chartData = [];

function updatePieChartVisuals() {
    let selectedYear = selectedIndex === -1 ? null : String(chartData[selectedIndex]?.label);

    svg.selectAll("path")
        .attr("class", (_, i) => i === selectedIndex ? "wedge selected" : "wedge")
        .attr("opacity", (_, i) => (selectedIndex === -1 || String(chartData[i].label) === selectedYear) ? 1 : 0.3);

    legend.selectAll("li")
        .attr("class", (_, i) => i === selectedIndex ? "selected" : "");
}

function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    chartData = rolledData.map(([year, count]) => ({
        value: count,
        label: year
    }));

    svg.selectAll("*").remove();
    legend.selectAll("*").remove();

    let pieGenerator = d3.pie().value((d) => d.value);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let arcs = pieGenerator(chartData);

    arcs.forEach((arc, idx) => {
        svg.append("path")
            .attr("d", arcGenerator(arc))
            .attr("fill", colors(idx))
            .attr("class", "wedge")
            .style("cursor", "pointer")
            .on("click", function () {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                update();
            });
    });

    chartData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", function () {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                update();
            });
    });


    updatePieChartVisuals();
}

function update() {
    let queryLower = query.trim().toLowerCase();
    
  
    let searchFiltered = projects.filter(project => 
        queryLower ? Object.values(project).join(' ').toLowerCase().includes(queryLower) : true
    );

  
    if (selectedIndex === -1) {
        renderPieChart(searchFiltered);  
    }


    let selectedYear = selectedIndex === -1 ? null : String(chartData[selectedIndex]?.label);
    let displayFiltered = searchFiltered.filter(project =>
        selectedYear ? String(project.year) === selectedYear : true
    );

    renderProjects(displayFiltered, projectsContainer, 'h2');


    updatePieChartVisuals();
}

fetch('../lib/projects.json')
    .then(response => response.json())
    .then(data => {
        projects = data;
        renderProjects(projects, projectsContainer, 'h2');
        renderPieChart(projects);
    });

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    update();
});
