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
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'resume/index.html', title: 'Resume' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'https://github.com/Kevin-Wu-12', title: 'Github Link' }
    // add the rest of your pages here
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('Home');

for (let p of pages) {
    let url = p.url;
    let title = p.title;
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
