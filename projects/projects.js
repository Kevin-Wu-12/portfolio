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
