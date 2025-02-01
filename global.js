console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );

//   if (currentLink) {
//     // or if (currentLink !== undefined)
//     currentLink?.classList.add('current');
//   }

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/Kevin-Wu-12', title: 'Github Link' }
    // add the rest of your pages here
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);



for (let p of pages) {
    let url = p.url;
    let title = p.title;
    const ARE_WE_HOME = document.documentElement.classList.contains('Home');
    // TODO create link and add it to nav
    // Create link and add it to nav
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
    }
  

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (p.url.startsWith('https')) {
      a.target = '_blank';
    }
    
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    
  }

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
      </label>`
  );

  matchMedia("(prefers-color-scheme: dark)").matches

  const select = document.querySelector('select');
  

  if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);  
    select.value = savedScheme;
  }

  select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value
  });


const form = document.querySelector('form');


form?.addEventListener('submit', function(event) {
  event.preventDefault();
 
  const data = new FormData(form);
  const url = new URL(form.action); 
  const params = new URLSearchParams();
  

  for (let [name, value] of data) {
    params.append(name, encodeURIComponent(value)); 
    console.log(name, encodeURIComponent(value));  
  }


  url.search = params.toString();

  location.href = url;
});

export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    console.log(response)
    const data = await response.json();
    return data; 
    


  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
  
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    // Ensure container exists
    if (!containerElement) {
        console.error('Container element not found.');
        return;
    }

    // Clear existing content
    containerElement.innerHTML = '';

    // Validate headingLevel
    const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadings.includes(headingLevel)) {
        console.error(`Invalid heading level: ${headingLevel}. Defaulting to h2.`);
        headingLevel = 'h2';
    }

    // Ensure projects is an array
    if (!Array.isArray(projects)) {
        console.error('Expected an array of projects.');
        return;
    }

    // Iterate over projects and create elements
    projects.forEach(project => {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image || 'default-image.jpg'}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    });
}
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
