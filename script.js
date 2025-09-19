const apiEndpoints = {
  resourcepacks: "https://api.modrinth.com/v2/search?facets=[[\"project_type:resourcepack\"]]&limit=100",
  mods: "https://api.modrinth.com/v2/search?facets=[[\"project_type:mod\"]]&limit=100",
  shaders: "https://api.modrinth.com/v2/search?facets=[[\"project_type:shader\"]]&limit=100",
  datapacks: "https://api.modrinth.com/v2/search?facets=[[\"project_type:datapack\"]]&limit=100"
};

let currentCategory = "resourcepacks";
let currentPage = 0;
let currentSearch = "";
const perPage = 100;

// Fetch files from API
async function fetchFiles(category, page = 0, search = "") {
  const container = document.getElementById(category);
  
  // Fade out current content
  container.style.opacity = 0;
  container.style.transform = "translateY(20px)";

  try {
    const offset = page * perPage;
    let url = `${apiEndpoints[category]}&offset=${offset}`;
    if (search) url += `&query=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const data = await res.json();

    const files = data.hits.map(file => ({
      url: `https://modrinth.com/${file.project_type}/${file.slug}`,
      name: file.title,
      description: file.description,
      logo: file.icon_url || "https://img.icons8.com/ios/100/minecraft-pickaxe.png"
    }));

    setTimeout(() => {
      renderFiles(files, category);
      renderPagination("pagination-global", category, page, Math.ceil(data.total_hits / perPage));
      renderPagination("pagination-top", category, page, Math.ceil(data.total_hits / perPage));

      // Fade in new content
      container.style.opacity = 1;
      container.style.transform = "translateY(0)";

      // Scroll to the top of the page/title
      document.querySelector("header").scrollIntoView({ behavior: "smooth" });
    }, 300);

  } catch (err) {
    console.error("Failed to fetch files:", err);
    container.innerHTML = `<p style="color:red;text-align:center;margin-top:20px;">Failed to load files</p>`;
    container.style.opacity = 1;
    container.style.transform = "translateY(0)";
  }
}

// Render files in the category
function renderFiles(files, category) {
  const container = document.getElementById(category);
  document.querySelectorAll(".file-list").forEach(f => f.classList.add("hidden"));
  container.classList.remove("hidden");
  container.innerHTML = "";

  files.forEach(file => {
    const card = document.createElement("div");
    card.className = "file-card";
    card.innerHTML = `
      <img src="${file.logo}" alt="${file.name}" />
      <div class="file-info">
        <h3>${file.name}</h3>
        <p>${file.description}</p>
      </div>
      <button class="file-btn" data-url="${file.url}">Open</button>
    `;
    container.appendChild(card);

    // Animate each card
    card.style.opacity = 0;
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "0.5s ease";
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    }, 50);
  });
}

// Render pagination buttons
function renderPagination(containerId, category, activePage, totalPages) {
  const pagination = document.getElementById(containerId);
  pagination.innerHTML = "";
  if (totalPages <= 1) return;

  const createButton = (page) => {
    const btn = document.createElement("button");
    btn.textContent = page + 1;
    if (page === activePage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = page;
      fetchFiles(category, page, currentSearch);
    });
    return btn;
  };

  const prev = document.createElement("button");
  prev.textContent = "«";
  prev.disabled = activePage === 0;
  prev.addEventListener("click", () => {
    if (activePage > 0) {
      currentPage = activePage - 1;
      fetchFiles(category, currentPage, currentSearch);
    }
  });
  pagination.appendChild(prev);

  pagination.appendChild(createButton(0));

  if (activePage > 3) {
    const dots = document.createElement("span");
    dots.textContent = "...";
    pagination.appendChild(dots);
  }

  const start = Math.max(1, activePage - 2);
  const end = Math.min(totalPages - 2, activePage + 2);
  for (let i = start; i <= end; i++) {
    pagination.appendChild(createButton(i));
  }

  if (activePage < totalPages - 4) {
    const dots = document.createElement("span");
    dots.textContent = "...";
    pagination.appendChild(dots);
  }

  if (totalPages > 1) pagination.appendChild(createButton(totalPages - 1));

  const next = document.createElement("button");
  next.textContent = "»";
  next.disabled = activePage === totalPages - 1;
  next.addEventListener("click", () => {
    if (activePage < totalPages - 1) {
      currentPage = activePage + 1;
      fetchFiles(category, currentPage, currentSearch);
    }
  });
  pagination.appendChild(next);
}

// Switch categories
document.querySelectorAll(".category").forEach(cat => {
  cat.addEventListener("click", () => {
    document.querySelectorAll(".category").forEach(c => c.classList.remove("active"));
    cat.classList.add("active");
    currentCategory = cat.dataset.tab;
    currentPage = 0;
    currentSearch = "";
    document.getElementById("search-global").value = "";
    fetchFiles(currentCategory, currentPage);
  });
});

// Global search
document.getElementById("search-global").addEventListener("input", e => {
  currentSearch = e.target.value;
  currentPage = 0;
  fetchFiles(currentCategory, currentPage, currentSearch);
});

// Open file links in new tab
document.body.addEventListener("click", e => {
  if (e.target.classList.contains("file-btn")) {
    window.open(e.target.dataset.url, "_blank");
  }
});

// Initial load
fetchFiles(currentCategory, currentPage);
