import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
const projects = await fetchJSON('./lib/projects.json');

const basePath = window.location.pathname.includes('portfolio') ? '/portfolio' : '';
const latestProjects = projects.slice(0, 3).map(project => ({
    ...project,
    image: `${basePath}${project.image}`
}));
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');


const githubData = await fetchGitHubData('Kevin-Wu-12');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
        <h3>My GitHub Stats</h3>
        <dl class="profile-grid">
            <dt>Followers</dt><dd>${githubData.followers}</dd>
            <dt>Following</dt><dd>${githubData.following}</dd>
            <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        </dl>
    `;
}

  
  