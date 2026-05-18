                                                                                                                                                                                                                                                                                                                                                                                                          const students = [
  {
    name: "Ram Sharma",
    class: "10",
    studentPhone: "9811111111",
    parentPhone: "9822222222"
  },
  {
    name: "Sita Thapa",
    class: "9",
    studentPhone: "9841234567",
    parentPhone: "9859876543"
  },
  {
    name: "Bikash Gurung",
    class: "8",
    studentPhone: "9861122334",
    parentPhone: "9804455667"
  },                                                                                                                                             
  {
    name: "Anita Magar",
    class: "7",
    studentPhone: "9823344556",
    parentPhone: "9817766554"
  },
  {
    name: "Nabin Chaudhary",
    class: "6",
    studentPhone: "9801234567",
    parentPhone: "9847654321"
  },
  {
    name: "Puja Bhandari",
    class: "5",
    studentPhone: "9867788990",
    parentPhone: "9812233445"
  }
];

const teachers = [
  {
    name: "Sita Magar",
    subject: "Math",
    phone: "9800000000",
    password: "admin123"
  },
  {
    name: "Hari Prasad Sharma",
    subject: "Science",
    phone: "9812345678",
    password: "teacher123"
  },
  {
    name: "Mina Gurung",
    subject: "English",
    phone: "9823456789",
    password: "staff123"
  },
  {
    name: "Ramesh Thapa",
    subject: "Nepali",
    phone: "9844567890",
    password: "guest123"
  },
  {
    name: "Kabita Adhikari",
    subject: "Social Studies",
    phone: "9855678901",
    password: "social123"
  }
];

// Allowed users are teachers; derive credentials from the teachers list
const allowedUsers = teachers.map(t => ({ phone: t.phone, password: t.password }));
const allowedUserCount = allowedUsers.length;

const authKey = "grid2081-contact-auth";
let activeSection = "students";
let searchTerm = "";

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const phoneInput = document.getElementById("phoneInput");
const passwordInput = document.getElementById("passwordInput");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const directoryGrid = document.getElementById("directoryGrid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");
const sectionTitle = document.getElementById("sectionTitle");
const activeEyebrow = document.getElementById("activeEyebrow");
const toast = document.getElementById("toast");
const classFilter = document.getElementById("classFilter");
let activeClassFilter = "";

function showLoader() {
  // Loader removed from new design
}

function hideLoader() {
  // Loader removed from new design
}

function isLoggedIn() {
  return localStorage.getItem(authKey) === "true";
}

function showLogin() {
  if (dashboardView && dashboardView.classList) dashboardView.classList.add("hidden");
  if (loginView && loginView.classList) {
    loginView.classList.remove("hidden");
    document.body.style.overflow = "";
  }
}

function showDashboard() {
  if (loginView && loginView.classList) loginView.classList.add("hidden");
  if (dashboardView && dashboardView.classList) {
    dashboardView.classList.remove("hidden");
    populateClassFilter();
    renderDirectory();
  }
}

function setMessage(message, type = "error") {
  loginMessage.textContent = message;
  loginMessage.style.color = type === "success" ? "#16A34A" : "#DC2626";
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

function handleLogin(event) {
  event.preventDefault();
  const phone = normalizePhone(phoneInput.value.trim());
  const password = passwordInput.value.trim();

  if (!phone || !password) {
    setMessage("Please enter both phone number and password.");
    return;
  }

  const validUser = allowedUsers.some(user => user.phone === phone && user.password === password);

  if (!validUser) {
    setMessage("Incorrect phone number or password. Please try again.");
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  setMessage("Login successful. Loading dashboard...", "success");
  localStorage.setItem(authKey, "true");
  setTimeout(() => {
    showDashboard();
    loginForm.reset();
  }, 450);
}

function handleLogout() {
  localStorage.removeItem(authKey);
  setTimeout(() => {
    showLogin();
  }, 350);
}

function matchesSearch(item) {
  const value = Object.values(item).join(" ").toLowerCase();
  return value.includes(searchTerm.toLowerCase());
}

function createPhoneActions(phone, label) {
  return `
    <div class="contact-actions">
      <a class="icon-btn call" href="tel:${phone}" title="Call ${label}"><i class="fas fa-phone"></i></a>
      <a class="icon-btn wa" href="https://wa.me/${phone}" target="_blank" rel="noopener" title="WhatsApp ${label}"><i class="fab fa-whatsapp"></i></a>
      <button class="icon-btn copy" type="button" data-phone="${phone}" title="Copy ${label} number"><i class="fas fa-copy"></i></button>
    </div>
  `;
}

function studentCard(student) {
  const initials = student.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
  return `
    <article class="contact-card" data-name="${student.name}">
      <div class="avatar" aria-hidden="true">${initials}</div>
      <div class="card-body">
        <div class="card-title">${student.name}</div>
        <div class="card-meta">Class <strong>${student.class}</strong></div>
        <div class="card-row">
          <div class="card-phones">
            <div class="phone-item"><small class="muted">Parent</small><div class="phone-value">${student.parentPhone}</div></div>
          </div>
          <div class="card-actions">
            ${createPhoneActions(student.parentPhone, `${student.name} parent`)}
          </div>
        </div>
      </div>
    </article>
  `;
}

function teacherCard(teacher) {
  const initials = teacher.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
  return `
    <article class="contact-card" data-name="${teacher.name}">
      <div class="avatar" aria-hidden="true">${initials}</div>
      <div class="card-body">
        <div class="card-title">${teacher.name}</div>
        <div class="card-meta">${teacher.subject} <strong>Teacher</strong></div>
        <div class="card-row">
          <div class="card-phones">
            <div class="phone-item"><small class="muted">Phone</small><div class="phone-value">${teacher.phone}</div></div>
          </div>
          <div class="card-actions">
            ${createPhoneActions(teacher.phone, teacher.name)}
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderDirectory() {
  const source = activeSection === "students" ? students : teachers;
  const filtered = source.filter(item => {
    // text search match
    if (!matchesSearch(item)) return false;
    // class filter (only for students)
    if (activeSection === 'students' && activeClassFilter) {
      return item.class === activeClassFilter;
    }
    return true;
  });
  const title = activeSection === "students" ? "Students" : "Teachers";
  const eyebrow = activeSection === "students" ? "Student List" : "Teacher List";

  sectionTitle.textContent = title;
  activeEyebrow.textContent = eyebrow;
  resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  directoryGrid.innerHTML = filtered.map(item => activeSection === "students" ? studentCard(item) : teacherCard(item)).join("");
  emptyState.classList.toggle("hidden", filtered.length !== 0);
  directoryGrid.classList.toggle("hidden", filtered.length === 0);
  // show/hide class filter depending on active section
  if (classFilter) {
    classFilter.style.display = activeSection === 'students' ? '' : 'none';
  }
}

function populateClassFilter() {
  if (!classFilter) return;
  const classes = Array.from(new Set(students.map(s => s.class))).sort((a, b) => Number(a) - Number(b));
  classFilter.innerHTML = '<option value="">All classes</option>' + classes.map(c => `<option value="${c}">Class ${c}</option>`).join('');
  classFilter.value = activeClassFilter || '';
}

function setActiveSection(section) {
  activeSection = section;
  document.querySelectorAll("[data-section]").forEach(button => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  renderDirectory();
}

async function copyPhone(phone) {
  try {
    await navigator.clipboard.writeText(phone);
    showToast(`Copied ${phone}`);
  } catch (error) {
    const tempInput = document.createElement("input");
    tempInput.value = phone;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    tempInput.remove();
    showToast(`Copied ${phone}`);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

// Mobile menu toggle for login view
const menuToggle1 = document.getElementById('menuToggle');
const mobileMenu1 = document.getElementById('mobileMenu');
const menuOverlay1 = document.getElementById('menuOverlay');

function toggleMenu1() {
  if (menuToggle1 && mobileMenu1 && menuOverlay1) {
    menuToggle1.classList.toggle('active');
    mobileMenu1.classList.toggle('active');
    menuOverlay1.classList.toggle('active');
  }
}

// Mobile menu toggle for dashboard view
const menuToggle2 = document.getElementById('menuToggle2');
const mobileMenu2 = document.getElementById('mobileMenu2');
const menuOverlay2 = document.getElementById('menuOverlay2');

function toggleMenu2() {
  if (menuToggle2 && mobileMenu2 && menuOverlay2) {
    menuToggle2.classList.toggle('active');
    mobileMenu2.classList.toggle('active');
    menuOverlay2.classList.toggle('active');
  }
}

function toggleSection(sectionId) {
  const sectionContent = document.getElementById(sectionId);
  if (sectionContent) {
    const section = sectionContent.parentElement;
    
    // Close all other sections first (accordion behavior)
    document.querySelectorAll('.menu-section').forEach(otherSection => {
      if (otherSection !== section) {
        otherSection.classList.remove('expanded');
      }
    });
    
    // Toggle current section
    section.classList.toggle('expanded');
  }
}

if (menuToggle1) menuToggle1.addEventListener('click', toggleMenu1);
if (menuOverlay1) menuOverlay1.addEventListener('click', toggleMenu1);
if (mobileMenu1) {
  mobileMenu1.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      toggleMenu1();
    }
  });
}

if (menuToggle2) menuToggle2.addEventListener('click', toggleMenu2);
if (menuOverlay2) menuOverlay2.addEventListener('click', toggleMenu2);
if (mobileMenu2) {
  mobileMenu2.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      toggleMenu2();
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
} else {
  console.warn('Login form not found: #loginForm');
}

// class filter change
if (classFilter) {
  classFilter.addEventListener('change', (e) => {
    activeClassFilter = e.target.value;
    renderDirectory();
  });
}

// Handle both logout buttons
document.addEventListener("click", event => {
  const logoutButton = event.target.closest(".logout-btn") || event.target.closest(".logout-btn-mobile");
  if (logoutButton) {
    handleLogout();
  }
});

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value.trim();
  renderDirectory();
});

document.addEventListener("click", event => {
  const sectionButton = event.target.closest("[data-section]");
  const copyButton = event.target.closest("[data-phone]");

  if (sectionButton) {
    setActiveSection(sectionButton.dataset.section);
  }

  if (copyButton) {
    copyPhone(copyButton.dataset.phone);
  }

  // edit/delete removed — actions handled elsewhere if needed
});

showLoader();
// small UX: show loading overlay then dashboard
if (isLoggedIn()) {
  document.getElementById('loadingOverlay')?.classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
    showDashboard();
  }, 450);
} else {
  showLogin();
}
hideLoader();

/* Theme toggling (sync with main site) */
const themeToggleBtn = document.getElementById('themeToggle');
const rootEl = document.documentElement;
const storedTheme = localStorage.getItem('grid2081-theme');

const applyTheme = (theme) => {
  rootEl.setAttribute('data-theme', theme);
  localStorage.setItem('grid2081-theme', theme);
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    const text = themeToggleBtn.querySelector('.theme-toggle-text');
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      if (text) text.textContent = 'Light Mode';
      themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      icon.className = 'fas fa-moon';
      if (text) text.textContent = 'Dark Mode';
      themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }
};

const toggleTheme = () => {
  const nextTheme = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
};

if (storedTheme) {
  applyTheme(storedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  applyTheme('dark');
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// populate class filter when dashboard becomes visible
document.addEventListener('DOMContentLoaded', () => {
  populateClassFilter();
});
