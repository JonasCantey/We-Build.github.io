const STORAGE_KEY = "we-build-projects-v1";

const seedProjects = [
  { id: "wb-001", name: "Riverside Innovation Hub", client: "Northstar Development", location: "Pittsburgh, PA", type: "Commercial", status: "In progress", budget: 12800000, completion: 68 },
  { id: "wb-002", name: "Foundry Row Residences", client: "Keystone Living", location: "Pittsburgh, PA", type: "Residential", status: "In progress", budget: 8400000, completion: 42 },
  { id: "wb-003", name: "Allegheny Greenway", client: "City of Pittsburgh", location: "Pittsburgh, PA", type: "Infrastructure", status: "Planning", budget: 5600000, completion: 12 },
  { id: "wb-004", name: "Mercy Health Pavilion", client: "Mercy Health Network", location: "Cranberry, PA", type: "Healthcare", status: "Completed", budget: 14700000, completion: 100 }
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1
});

let projects = loadProjects();
let toastTimer;

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [...seedProjects];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Saved project data is not a list.");
    return parsed;
  } catch (error) {
    console.error("Unable to load saved We-Build projects.", error);
    return [...seedProjects];
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Unable to save We-Build projects.", error);
    showToast("Could not save project changes. Check your browser storage.");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function formatBudget(value, compact = false) {
  return (compact ? compactCurrencyFormatter : currencyFormatter).format(value);
}

function setRoute(route) {
  const validRoute = document.querySelector(`[data-page="${route}"]`) ? route : "home";
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.dataset.page === validRoute);
  });
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.dataset.route === validRoute;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.getElementById("page-crumb").textContent = {
    home: "OVERVIEW",
    about: "ABOUT US",
    projects: "PROJECT CONTROL",
    analytics: "DATA ANALYTICS"
  }[validRoute];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function renderHome() {
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const activeProjects = projects.filter(project => project.status === "In progress").length;
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.completion || 0), 0) / projects.length)
    : 0;
  const planningProjects = projects.filter(project => project.status === "Planning").length;

  document.getElementById("home-active").textContent = String(activeProjects).padStart(2, "0");
  document.getElementById("home-budget").textContent = formatBudget(totalBudget, true);
  document.getElementById("home-completion").textContent = `${averageProgress}%`;
  document.getElementById("home-upcoming").textContent = String(planningProjects).padStart(2, "0");
  document.getElementById("nav-project-count").textContent = String(projects.length).padStart(2, "0");

  const featured = projects
    .filter(project => project.status === "In progress")
    .slice(0, 3);
  const items = featured.length ? featured : projects.slice(0, 3);
  document.getElementById("featured-projects").innerHTML = items.length
    ? items.map(project => `
      <div class="featured-row">
        <div><div class="featured-project-name">${escapeHtml(project.name)}</div><div class="featured-project-meta">${escapeHtml(project.location)}</div></div>
        <span class="status-badge status-${statusClass(project.status)}">${escapeHtml(project.status)}</span>
        <div class="mini-progress" aria-label="${project.completion}% complete"><span style="width:${project.completion}%"></span></div>
      </div>`).join("")
    : '<div class="empty-state"><p>No projects yet. Add your first project to get started.</p><button class="button button-dark" type="button" data-open-project>Add a project ＋</button></div>';
}

function renderProjects() {
  const search = document.getElementById("project-search").value.trim().toLowerCase();
  const status = document.getElementById("status-filter").value;
  const filtered = projects.filter(project => {
    const matchesSearch = [project.name, project.client, project.location, project.type]
      .some(value => String(value).toLowerCase().includes(search));
    return matchesSearch && (status === "all" || project.status === status);
  });

  document.getElementById("project-result-count").textContent = `${filtered.length} ${filtered.length === 1 ? "PROJECT" : "PROJECTS"}`;
  document.getElementById("empty-projects").hidden = filtered.length !== 0;
  document.querySelector(".project-table").hidden = filtered.length === 0;
  document.getElementById("project-table-body").innerHTML = filtered.map(project => `
    <tr>
      <td><div class="project-main-name">${escapeHtml(project.name)}</div><div class="project-client">${escapeHtml(project.client)}</div></td>
      <td>${escapeHtml(project.location)}</td>
      <td>${escapeHtml(project.type)}</td>
      <td><span class="status-badge status-${statusClass(project.status)}">${escapeHtml(project.status)}</span></td>
      <td><div class="table-progress"><div class="mini-progress" aria-label="${project.completion}% complete"><span style="width:${project.completion}%"></span></div><span>${project.completion}%</span></div></td>
      <td><span class="project-budget">${formatBudget(project.budget)}</span></td>
      <td><div class="row-actions"><button class="row-action" type="button" data-edit="${escapeHtml(project.id)}" aria-label="Edit ${escapeHtml(project.name)}" title="Edit project">✎</button><button class="row-action delete" type="button" data-delete="${escapeHtml(project.id)}" aria-label="Delete ${escapeHtml(project.name)}" title="Delete project">×</button></div></td>
    </tr>`).join("");
}

function renderAnalytics() {
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const weightedProgress = totalBudget
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.budget || 0) * Number(project.completion || 0), 0) / totalBudget)
    : 0;

  document.getElementById("analytics-budget").textContent = formatBudget(totalBudget, true);
  document.getElementById("analytics-count").textContent = String(projects.length).padStart(2, "0");
  document.getElementById("analytics-progress").textContent = `${weightedProgress}%`;

  const statuses = ["In progress", "Planning", "On hold", "Completed"];
  const counts = statuses.map(status => ({
    status,
    count: projects.filter(project => project.status === status).length
  }));
  const maxCount = Math.max(1, ...counts.map(item => item.count));
  document.getElementById("status-chart").innerHTML = counts.map(item => `
    <div class="status-chart-row">
      <span class="status-chart-label">${item.status}</span>
      <div class="status-chart-track"><div class="status-chart-fill status-${statusClass(item.status)}" style="width:${item.count ? Math.max(4, item.count / maxCount * 100) : 0}%"></div></div>
      <span class="status-chart-value">${item.count}</span>
    </div>`).join("");

  const budgetProjects = [...projects].sort((a, b) => b.budget - a.budget).slice(0, 5);
  const highestBudget = Math.max(1, ...budgetProjects.map(project => Number(project.budget) || 0));
  document.getElementById("budget-chart").innerHTML = budgetProjects.length
    ? budgetProjects.map(project => `
      <div class="budget-chart-row">
        <span class="budget-chart-name" title="${escapeHtml(project.name)}">${escapeHtml(project.name)}</span>
        <div class="budget-chart-track"><div class="budget-chart-fill" style="width:${Math.max(2, project.budget / highestBudget * 100)}%"></div></div>
        <span class="budget-chart-value">${formatBudget(project.budget, true)}</span>
      </div>`).join("")
    : '<p class="chart-footnote">Add projects to see budget comparisons.</p>';

  const completed = projects.filter(project => project.status === "Completed").length;
  const inProgress = projects.filter(project => project.status === "In progress").length;
  const types = new Set(projects.map(project => project.type));
  const largestProject = [...projects].sort((a, b) => b.budget - a.budget)[0];
  const insights = [
    { label: "ACTIVE BUILDS", value: String(inProgress).padStart(2, "0") },
    { label: "COMPLETED", value: String(completed).padStart(2, "0") },
    { label: "PROJECT TYPES", value: String(types.size).padStart(2, "0") },
    { label: "LARGEST PROJECT", value: largestProject ? formatBudget(largestProject.budget, true) : "—" }
  ];
  document.getElementById("portfolio-insights").innerHTML = insights.map(item => `
    <div class="insight-item"><div class="insight-item-label">${item.label}</div><div class="insight-item-value">${item.value}</div></div>`).join("");
}

function renderAll() {
  renderHome();
  renderProjects();
  renderAnalytics();
}

function openProjectDialog(project) {
  const form = document.getElementById("project-form");
  form.reset();
  document.getElementById("project-id").value = project ? project.id : "";
  document.getElementById("dialog-title").textContent = project ? "Edit project" : "New project";
  document.getElementById("project-submit").innerHTML = project
    ? 'Save changes <span aria-hidden="true">↗</span>'
    : 'Add project <span aria-hidden="true">↗</span>';
  if (project) {
    document.getElementById("project-name").value = project.name;
    document.getElementById("project-client").value = project.client;
    document.getElementById("project-location").value = project.location;
    document.getElementById("project-type").value = project.type;
    document.getElementById("project-status").value = project.status;
    document.getElementById("project-budget").value = project.budget;
    document.getElementById("project-completion").value = project.completion;
  }
  document.getElementById("project-dialog").showModal();
  document.getElementById("project-name").focus();
}

function handleProjectSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const id = document.getElementById("project-id").value;
  const project = {
    id: id || `wb-${Date.now().toString(36)}`,
    name: document.getElementById("project-name").value.trim(),
    client: document.getElementById("project-client").value.trim(),
    location: document.getElementById("project-location").value.trim(),
    type: document.getElementById("project-type").value,
    status: document.getElementById("project-status").value,
    budget: Number(document.getElementById("project-budget").value),
    completion: Number(document.getElementById("project-completion").value)
  };
  if (!Number.isFinite(project.budget) || project.budget < 0 || !Number.isInteger(project.completion) || project.completion < 0 || project.completion > 100) {
    showToast("Enter a valid budget and completion percentage.");
    return;
  }

  const existingIndex = projects.findIndex(item => item.id === id);
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
    showToast("Project updated.");
  } else {
    projects.unshift(project);
    showToast("Project added to your pipeline.");
  }
  saveProjects();
  renderAll();
  document.getElementById("project-dialog").close();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("copyright-year").textContent = String(new Date().getFullYear());
  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date()).toUpperCase();

  renderAll();
  setRoute(window.location.hash.slice(1) || "home");

  window.addEventListener("hashchange", () => setRoute(window.location.hash.slice(1)));
  document.getElementById("project-search").addEventListener("input", renderProjects);
  document.getElementById("status-filter").addEventListener("change", renderProjects);
  document.getElementById("new-project-button").addEventListener("click", () => openProjectDialog());
  document.getElementById("empty-add-button").addEventListener("click", () => openProjectDialog());
  document.getElementById("project-form").addEventListener("submit", handleProjectSubmit);
  document.getElementById("dialog-close").addEventListener("click", () => document.getElementById("project-dialog").close());
  document.getElementById("dialog-cancel").addEventListener("click", () => document.getElementById("project-dialog").close());

  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-open-project]");
    if (addButton) {
      window.location.hash = "projects";
      openProjectDialog();
      return;
    }
    const editButton = event.target.closest("[data-edit]");
    if (editButton) {
      const project = projects.find(item => item.id === editButton.dataset.edit);
      if (project) openProjectDialog(project);
      return;
    }
    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      const project = projects.find(item => item.id === deleteButton.dataset.delete);
      if (!project) return;
      if (window.confirm(`Delete "${project.name}" from your project list?`)) {
        projects = projects.filter(item => item.id !== project.id);
        saveProjects();
        renderAll();
        showToast("Project deleted.");
      }
    }
  });
});
