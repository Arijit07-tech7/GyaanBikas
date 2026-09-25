import { supabase } from "./supabase.js?v=20260923-2";

/* =========================================================
   GYAANBIKAS — APPLICATION ENGINE
   Step 04 — js/app.js
   ========================================================= */

const ADMIN_EMAIL = "arijitgupta654321@gmail.com";

const SUBJECTS = [
  {
    name: "Machine Learning",
    icon: "✦",
    description: "Models, algorithms and intelligent systems.",
    available: true
  },
  {
    name: "Python",
    icon: "⌘",
    description: "Programming, automation and problem solving.",
    available: true
  },
  {
    name: "Java",
    icon: "◇",
    description: "Object-oriented programming and development.",
    available: true
  },
  {
    name: "Data Science",
    icon: "◒",
    description: "Data, statistics and analytical thinking.",
    available: true
  },
  {
    name: "Web Development",
    icon: "◎",
    description: "Modern frontend and backend development.",
    available: true
  }
];

const ACHIEVEMENTS = [
  {
    key: "first_note",
    icon: "📝",
    title: "First Note",
    description: "Create your first learning note.",
    test: state => state.notes.length >= 1
  },
  {
    key: "ten_notes",
    icon: "📚",
    title: "Knowledge Builder",
    description: "Create 10 learning notes.",
    test: state => state.notes.length >= 10
  },
  {
    key: "first_quiz",
    icon: "🧠",
    title: "First Challenge",
    description: "Complete your first quiz.",
    test: state => state.attempts.length >= 1
  },
  {
    key: "five_quizzes",
    icon: "🎯",
    title: "Quiz Explorer",
    description: "Complete 5 quiz attempts.",
    test: state => state.attempts.length >= 5
  },
  {
    key: "ninety_accuracy",
    icon: "🏆",
    title: "Sharp Mind",
    description: "Reach 90% or higher quiz accuracy.",
    test: state => bestAccuracy(state.attempts) >= 90
  },
  {
    key: "seven_streak",
    icon: "🔥",
    title: "7 Day Streak",
    description: "Build a 7-day learning streak.",
    test: state => calculateStreak(state) >= 7
  },
  {
    key: "twenty_notes",
    icon: "🚀",
    title: "Deep Learner",
    description: "Create 20 learning notes.",
    test: state => state.notes.length >= 20
  },
  {
    key: "subject_explorer",
    icon: "🌐",
    title: "Subject Explorer",
    description: "Study 3 different subjects.",
    test: state => new Set(state.notes.map(n => n.subject)).size >= 3
  }
];


/* =========================================================
   STATE
   ========================================================= */

const state = {
  currentUser: null,
  profile: null,

  isAdmin: false,

  authMode: "login",

  notes: [],
  quizzes: [],
  attempts: [],
  favorites: [],
  achievements: [],

  adminNotes: [],
  adminQuizzes: [],

  activeNoteId: null,
  editingNoteId: null,

  activeQuiz: null,
  activeQuizQuestions: [],
  activeQuizIndex: 0,
  activeQuizAnswers: {},
  activeQuizStartedAt: null,
  quizTimerInterval: null,

  selectedQuizResult: null,

  deferredInstallPrompt: null,

  initialized: false
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

const $$ = selector =>
  Array.from(document.querySelectorAll(selector));


/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function plain(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
}


function initials(name = "Learner") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join("") || "L"
  );
}


function fmtDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}


function todayISO() {
  return new Date().toISOString().slice(0, 10);
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
      .map(tag => String(tag).trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}


function toast(message, type = "success") {
  const el = $("toast");

  if (!el) return;

  const icon = $("toastIcon");
  const text = $("toastMessage");

  if (icon) {
    icon.textContent =
      type === "error" ? "!" :
      type === "warning" ? "!" :
      "✓";

    icon.style.color =
      type === "error" ? "var(--red)" :
      type === "warning" ? "var(--orange)" :
      "var(--green)";
  }

  if (text) {
    text.textContent = message;
  }

  el.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}


/* =========================================================
   SAFE NOTE HTML SANITIZER
   ========================================================= */

function sanitizeNoteHTML(html = "") {
  const template = document.createElement("template");

  template.innerHTML = html;

  const allowedTags = new Set([
    "P",
    "BR",
    "DIV",
    "SPAN",
    "STRONG",
    "B",
    "EM",
    "I",
    "U",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "UL",
    "OL",
    "LI",
    "BLOCKQUOTE",
    "PRE",
    "CODE",
    "A",
    "IMG"
  ]);

  const walker = document.createTreeWalker(
    template.content,
    NodeFilter.SHOW_ELEMENT
  );

  const elements = [];

  while (walker.nextNode()) {
    elements.push(walker.currentNode);
  }

  for (const element of elements) {
    if (!allowedTags.has(element.tagName)) {
      const parent = element.parentNode;

      if (parent) {
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }

        parent.removeChild(element);
      }

      continue;
    }

    const attributes = [...element.attributes];

    for (const attr of attributes) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      if (
        element.tagName === "A" &&
        ["href", "title", "target", "rel"].includes(name)
      ) {
        if (name === "href") {
          if (
            !/^https?:\/\//i.test(value) &&
            !/^mailto:/i.test(value)
          ) {
            element.removeAttribute(attr.name);
          }
        }

        continue;
      }

      if (
        element.tagName === "IMG" &&
        ["src", "alt", "title"].includes(name)
      ) {
        if (name === "src") {
          const safe =
            /^https?:\/\//i.test(value) ||
            /^data:image\//i.test(value);

          if (!safe) {
            element.removeAttribute(attr.name);
          }
        }

        continue;
      }

      element.removeAttribute(attr.name);
    }

    if (element.tagName === "A") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }

    if (element.tagName === "IMG") {
      element.setAttribute("loading", "lazy");
      element.setAttribute("decoding", "async");
    }
  }

  return template.innerHTML;
}


/* =========================================================
   AUTH / USER
   ========================================================= */

function updateAuthUI() {
  const login = state.authMode === "login";

  $("authEyebrow").textContent =
    login ? "WELCOME BACK" : "START LEARNING";

  $("authTitle").textContent =
    login
      ? "Continue learning."
      : "Create your learning space.";

  $("authSubtitle").textContent =
    login
      ? "Sign in to access your learning space."
      : "Create an account and start building your knowledge.";

  $("nameField").classList.toggle("hidden", login);

  $("authName").required = !login;

  $("authSubmitText").textContent =
    login ? "Sign in" : "Create account";

  $("switchText").textContent =
    login
      ? "Don't have an account?"
      : "Already have an account?";

  $("switchBtn").textContent =
    login ? "Create one" : "Sign in";
}


function setAuthLoading(loading) {
  $("authSubmit").disabled = loading;

  $("googleBtn").disabled = loading;

  $("authSubmitText").classList.toggle(
    "hidden",
    loading
  );

  $("authSubmitLoader").classList.toggle(
    "hidden",
    !loading
  );
}


function authErrorMessage(error) {
  const message =
    String(error?.message || "").toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (message.includes("user already registered")) {
    return "An account with this email already exists.";
  }

  if (message.includes("password")) {
    return error.message;
  }

  if (message.includes("rate limit")) {
    return "Too many attempts. Please wait a little.";
  }

  return error?.message || "Something went wrong.";
}


async function signInWithGoogle() {
  try {
    setAuthLoading(true);

    const redirectTo =
      new URL("./", window.location.href).href;

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo,

          queryParams: {
            access_type: "offline",
            prompt: "select_account"
          }
        }
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    setAuthLoading(false);
    toast(authErrorMessage(error), "error");
  }
}


async function handleAuthSubmit(event) {
  event.preventDefault();

  const email =
    $("authEmail").value.trim();

  const password =
    $("authPassword").value;

  const name =
    $("authName").value.trim();

  if (!email || !password) {
    toast("Please enter your email and password.", "warning");
    return;
  }

  if (
    state.authMode === "signup" &&
    !name
  ) {
    toast("Please enter your name.", "warning");
    return;
  }

  try {
    setAuthLoading(true);

    if (state.authMode === "signup") {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            data: {
              full_name: name
            },

            emailRedirectTo:
              new URL("./", window.location.href).href
          }
        });

      if (error) {
        throw error;
      }

      if (data.session) {
        toast("Account created successfully.");
      } else {
        toast(
          "Account created. Check your email to confirm it."
        );
      }
    } else {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      toast("Welcome back.");
    }

    $("authForm").reset();
  } catch (error) {
    toast(authErrorMessage(error), "error");
  } finally {
    setAuthLoading(false);
  }
}


async function signOut() {
  try {
    await supabase.auth.signOut();

    state.currentUser = null;
    state.profile = null;
    state.notes = [];
    state.quizzes = [];
    state.attempts = [];
    state.favorites = [];
    state.achievements = [];

    $("appView").classList.add("hidden");
    $("authView").classList.remove("hidden");

    showView("homeView");

    toast("Signed out.");
  } catch (error) {
    toast(error.message || "Could not sign out.", "error");
  }
}


/* =========================================================
   PROFILE
   ========================================================= */

async function loadProfile() {
  if (!state.currentUser) return;

  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", state.currentUser.id)
      .maybeSingle();

  if (error) {
    console.warn("Profile load:", error.message);
    return;
  }

  state.profile = data;

  if (!data) {
    const fallbackName =
      state.currentUser.user_metadata?.full_name ||
      state.currentUser.email?.split("@")[0] ||
      "Learner";

    const { data: created, error: createError } =
      await supabase
        .from("profiles")
        .insert({
          id: state.currentUser.id,
          full_name: fallbackName
        })
        .select()
        .single();

    if (!createError) {
      state.profile = created;
    }
  }

  renderProfile();
}


function renderProfile() {
  const name =
    state.profile?.full_name ||
    state.currentUser?.user_metadata?.full_name ||
    "Learner";

  const email =
    state.currentUser?.email || "—";

  const avatarText = initials(name);

  [
    $("sidebarName"),
    $("welcomeName"),
    $("settingsPreviewName")
  ].forEach(el => {
    if (el) el.textContent = name;
  });

  [
    $("sidebarEmail"),
    $("settingsPreviewEmail"),
    $("accountEmail")
  ].forEach(el => {
    if (el) el.textContent = email;
  });

  [
    $("sidebarAvatar"),
    $("topAvatarBtn"),
    $("settingsAvatar")
  ].forEach(el => {
    if (el) el.textContent = avatarText;
  });

  if ($("profileName")) {
    $("profileName").value =
      state.profile?.full_name || name;
  }

  if ($("profileUsername")) {
    $("profileUsername").value =
      state.profile?.username || "";
  }

  if ($("accountProvider")) {
    const provider =
      state.currentUser?.app_metadata?.provider ||
      state.currentUser?.identities?.[0]?.provider ||
      "email";

    $("accountProvider").textContent = provider;
  }
}


async function saveProfile(event) {
  event.preventDefault();

  if (!state.currentUser) return;

  const fullName =
    $("profileName").value.trim();

  const username =
    $("profileUsername").value.trim();

  if (!fullName) {
    toast("Please enter your name.", "warning");
    return;
  }

  const { data, error } =
    await supabase
      .from("profiles")
      .upsert({
        id: state.currentUser.id,
        full_name: fullName,
        username,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

  if (error) {
    toast(error.message, "error");
    return;
  }

  state.profile = data;

  renderProfile();

  toast("Profile updated.");
}


/* =========================================================
   ADMIN
   ========================================================= */

function determineAdmin() {
  state.isAdmin =
    String(state.currentUser?.email || "")
      .toLowerCase() === ADMIN_EMAIL.toLowerCase();

  $("adminActionsSection")
    .classList.toggle("hidden", !state.isAdmin);

  $("adminReadonlyMessage")
    .classList.toggle("hidden", state.isAdmin);

  $("adminAccessBadge").textContent =
    state.isAdmin ? "Administrator" : "Read only";

  $("adminBadge").textContent =
    state.isAdmin ? "ADMIN" : "VIEW";

  $("adminBadge").classList.toggle(
    "admin-live",
    state.isAdmin
  );
}


/* =========================================================
   NOTES
   ========================================================= */

async function loadNotes() {
  if (!state.currentUser) return;

  const { data, error } =
    await supabase
      .from("learning_notes")
      .select("*")
      .order("learning_date", {
        ascending: false
      })
      .order("created_at", {
        ascending: false
      });

  if (error) {
    toast(error.message, "error");
    return;
  }

  state.notes = data || [];

  renderAllNoteAreas();
}


async function loadAdminNotes() {
  if (!state.isAdmin) return;

  const { data, error } =
    await supabase
      .from("learning_notes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.warn("Admin notes:", error.message);
    return;
  }

  state.adminNotes = data || [];

  renderAdminMetrics();
}


function notePreview(note) {
  const text = plain(note.details);

  if (!text) {
    return "No preview available for this note.";
  }

  return text.length > 150
    ? `${text.slice(0, 150)}…`
    : text;
}


function noteMatches(note, query) {
  const q = query.toLowerCase();

  return [
    note.subject,
    note.topic,
    note.details,
    note.reference_url,
    ...(note.tags || [])
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}


function renderNoteCard(note) {
  const tags = normalizeTags(note.tags);

  return `
    <article
      class="note-card"
      data-note-id="${esc(note.id)}"
      tabindex="0"
      role="button"
      aria-label="Open ${esc(note.topic)}"
    >

      <div class="note-card-top">

        <span class="note-subject">
          ${esc(note.subject)}
        </span>

        <span class="note-date">
          ${esc(fmtDate(note.learning_date))}
        </span>

      </div>

      <h3>
        ${esc(note.topic)}
      </h3>

      <p class="note-preview">
        ${esc(notePreview(note))}
      </p>

      <div class="note-card-bottom">

        <div class="note-tags">

          ${tags.slice(0, 3).map(tag => `
            <span class="note-tag">
              #${esc(tag)}
            </span>
          `).join("")}

        </div>

        ${
          note.is_pinned
            ? `<span class="pin-mark">📌</span>`
            : ""
        }

      </div>

    </article>
  `;
}


function renderNotesGrid(container, notes) {
  if (!container) return;

  if (!notes.length) {
    container.innerHTML = `
      <div class="note-empty">
        <strong>No notes found</strong>
        <span>
          Start building your knowledge library.
        </span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    notes.map(renderNoteCard).join("");
}


function renderRecentNotes() {
  const recent =
    [...state.notes]
      .sort((a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
      )
      .slice(0, 6);

  renderNotesGrid(
    $("recentNotesGrid"),
    recent
  );
}


function renderSubjectCards() {
  const grid = $("subjectGrid");

  if (!grid) return;

  grid.innerHTML =
    SUBJECTS.map(subject => {

      const count =
        state.notes.filter(
          note => note.subject === subject.name
        ).length;

      return `
        <article
          class="subject-card"
          data-subject="${esc(subject.name)}"
        >

          <div class="subject-card-icon">
            ${subject.icon}
          </div>

          <h3>
            ${esc(subject.name)}
          </h3>

          <p>
            ${esc(subject.description)}
          </p>

          <p style="margin-top:12px;">
            ${count} note${count === 1 ? "" : "s"}
          </p>

        </article>
      `;
    }).join("");
}


function renderSubjectFilter() {
  const select = $("subjectFilter");

  if (!select) return;

  const current = select.value;

  select.innerHTML = `
    <option value="">All subjects</option>

    ${SUBJECTS.map(subject => `
      <option value="${esc(subject.name)}">
        ${esc(subject.name)}
      </option>
    `).join("")}
  `;

  select.value = current;
}


function renderAllNotes() {
  const query =
    $("notesSearch")?.value.trim().toLowerCase() || "";

  const subject =
    $("subjectFilter")?.value || "";

  let notes = [...state.notes];

  if (query) {
    notes = notes.filter(
      note => noteMatches(note, query)
    );
  }

  if (subject) {
    notes = notes.filter(
      note => note.subject === subject
    );
  }

  notes.sort((a, b) => {

    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }

    return (
      new Date(b.learning_date) -
      new Date(a.learning_date)
    );
  });

  renderNotesGrid(
    $("notesGrid"),
    notes
  );

  $("notesNavCount").textContent =
    state.notes.length;
}


function renderFavorites() {
  const favoriteIds =
    new Set(state.favorites.map(item => item.note_id));

  const notes =
    state.notes.filter(
      note => favoriteIds.has(note.id)
    );

  renderNotesGrid(
    $("favoritesGrid"),
    notes
  );
}


function renderAllNoteAreas() {
  renderSubjectCards();
  renderSubjectFilter();
  renderRecentNotes();
  renderAllNotes();
  renderFavorites();

  $("statNotes").textContent =
    state.notes.length;
}


function openNote(id) {
  const note =
    state.notes.find(item => item.id === id) ||
    state.adminNotes.find(item => item.id === id);

  if (!note) {
    toast("Note not found.", "error");
    return;
  }

  openReader(note);
}


function openReader(note) {
  state.activeNoteId = note.id;

  $("readerSubject").textContent =
    note.subject || "Note";

  $("readerTopic").textContent =
    note.topic || "Untitled";

  $("readerTitle").textContent =
    note.topic || "Untitled note";

  $("readerDate").textContent =
    fmtDate(note.learning_date);

  const text = plain(note.details);

  const words =
    text ? text.split(/\s+/).length : 0;

  const minutes =
    Math.max(1, Math.ceil(words / 200));

  $("readerReadingTime").textContent =
    `${minutes} min read`;

  $("readerPinBadge")
    .classList.toggle(
      "hidden",
      !note.is_pinned
    );

  const tags =
    normalizeTags(note.tags);

  $("readerTags").innerHTML =
    tags.map(tag => `
      <span class="reader-tag">
        #${esc(tag)}
      </span>
    `).join("");

  $("readerContent").innerHTML =
    sanitizeNoteHTML(note.details || "");

  buildReaderTOC();

  $("readerEditBtn")
    .classList.toggle(
      "hidden",
      !state.isAdmin
    );

  $("noteReader").classList.remove("hidden");
  $("noteReader").setAttribute("aria-hidden", "false");

  $("readerScroll").scrollTop = 0;

  updateReaderProgress();
}


function closeReader() {
  $("noteReader").classList.add("hidden");
  $("noteReader").setAttribute("aria-hidden", "true");

  state.activeNoteId = null;
}


function buildReaderTOC() {
  const content = $("readerContent");
  const toc = $("readerToc");
  const list = $("readerTocList");

  if (!content || !toc || !list) return;

  const headings =
    [...content.querySelectorAll("h1,h2,h3")];

  if (headings.length < 2) {
    toc.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  toc.classList.remove("hidden");

  list.innerHTML =
    headings.map((heading, index) => {

      const id = `reader-heading-${index}`;

      heading.id = id;

      return `
        <button
          type="button"
          data-toc-target="${id}"
        >
          ${esc(heading.textContent)}
        </button>
      `;
    }).join("");
}


function updateReaderProgress() {
  const scroll = $("readerScroll");

  if (!scroll) return;

  const max =
    scroll.scrollHeight -
    scroll.clientHeight;

  const progress =
    max <= 0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            (scroll.scrollTop / max) * 100
          )
        );

  $("readerProgressBar").style.width =
    `${progress}%`;

  $("readerProgressText").textContent =
    `${Math.round(progress)}%`;
}


function openEditNote(id) {
  if (!state.isAdmin) {
    toast("Only the administrator can edit notes.", "warning");
    return;
  }

  const note =
    state.notes.find(item => item.id === id) ||
    state.adminNotes.find(item => item.id === id);

  if (!note) {
    toast("Note not found.", "error");
    return;
  }

  state.editingNoteId = note.id;

  $("noteModalTitle").textContent =
    "Edit note";

  $("noteSubject").value =
    note.subject || "Machine Learning";

  $("noteDate").value =
    note.learning_date || todayISO();

  $("noteTopic").value =
    note.topic || "";

  $("noteEditor").innerHTML =
    note.details || "";

  $("noteTags").value =
    normalizeTags(note.tags).join(", ");

  $("noteReference").value =
    note.reference_url || "";

  $("notePinned").checked =
    Boolean(note.is_pinned);

  $("deleteNoteBtn").classList.remove("hidden");

  $("noteModal").classList.remove("hidden");
  $("noteModal").setAttribute("aria-hidden", "false");
}


function openNewNote() {
  if (!state.isAdmin) {
    toast(
      "Only the administrator can create managed notes.",
      "warning"
    );
    return;
  }

  state.editingNoteId = null;

  $("noteModalTitle").textContent =
    "Create note";

  $("noteForm").reset();

  $("noteDate").value = todayISO();

  $("noteSubject").value =
    "Machine Learning";

  $("noteEditor").innerHTML = "";

  $("deleteNoteBtn").classList.add("hidden");

  $("noteModal").classList.remove("hidden");
  $("noteModal").setAttribute("aria-hidden", "false");

  setTimeout(() => {
    $("noteTopic")?.focus();
  }, 50);
}


function closeNoteModal() {
  $("noteModal").classList.add("hidden");
  $("noteModal").setAttribute("aria-hidden", "true");

  state.editingNoteId = null;
}


async function saveNote(event) {
  event.preventDefault();

  if (!state.currentUser) return;

  if (!state.isAdmin) {
    toast(
      "Only the administrator can save managed notes.",
      "warning"
    );
    return;
  }

  const subject =
    $("noteSubject").value;

  const topic =
    $("noteTopic").value.trim();

  const learningDate =
    $("noteDate").value || todayISO();

  const details =
    $("noteEditor").innerHTML.trim();

  const tags =
    normalizeTags($("noteTags").value);

  const referenceUrl =
    $("noteReference").value.trim();

  const isPinned =
    $("notePinned").checked;

  if (!topic) {
    toast("Please enter a topic.", "warning");
    return;
  }

  if (!plain(details)) {
    toast("Please add some note content.", "warning");
    return;
  }

  const existing =
    state.editingNoteId
      ? (
          state.adminNotes.find(
            item => item.id === state.editingNoteId
          ) ||
          state.notes.find(
            item => item.id === state.editingNoteId
          )
        )
      : null;

  const payload = {
    subject,
    topic,
    learning_date: learningDate,
    details,
    tags,
    reference_url: referenceUrl || null,
    is_pinned: isPinned,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    payload.user_id = existing.user_id;
  } else {
    payload.user_id = state.currentUser.id;
  }

  $("saveNoteBtn").disabled = true;

  try {
    if (state.editingNoteId) {

      const { error } =
        await supabase
          .from("learning_notes")
          .update(payload)
          .eq("id", state.editingNoteId);

      if (error) throw error;

      toast("Note updated.");
    } else {

      const { error } =
        await supabase
          .from("learning_notes")
          .insert(payload);

      if (error) throw error;

      toast("Note created.");
    }

    closeNoteModal();

    await loadNotes();
    await loadAdminNotes();

    if (state.activeNoteId) {
      const updated =
        state.adminNotes.find(
          item => item.id === state.activeNoteId
        );

      if (updated) {
        openReader(updated);
      }
    }

    await checkAchievements();
  } catch (error) {
    toast(error.message || "Could not save note.", "error");
  } finally {
    $("saveNoteBtn").disabled = false;
  }
}


async function deleteNote() {
  if (!state.isAdmin || !state.editingNoteId) return;

  const confirmed =
    window.confirm(
      "Delete this note permanently?"
    );

  if (!confirmed) return;

  const { error } =
    await supabase
      .from("learning_notes")
      .delete()
      .eq("id", state.editingNoteId);

  if (error) {
    toast(error.message, "error");
    return;
  }

  const deletedId =
    state.editingNoteId;

  closeNoteModal();

  if (state.activeNoteId === deletedId) {
    closeReader();
  }

  await loadNotes();
  await loadAdminNotes();

  toast("Note deleted.");
}


/* =========================================================
   RICH EDITOR
   ========================================================= */

function execEditorCommand(command, value = null) {
  $("noteEditor").focus();

  if (command === "code") {
    document.execCommand(
      "formatBlock",
      false,
      "pre"
    );

    return;
  }

  if (command === "link") {
    const url =
      window.prompt(
        "Enter URL",
        "https://"
      );

    if (!url) return;

    if (
      !/^https?:\/\//i.test(url) &&
      !/^mailto:/i.test(url)
    ) {
      toast("Please enter a valid URL.", "warning");
      return;
    }

    document.execCommand(
      "createLink",
      false,
      url
    );

    return;
  }

  document.execCommand(
    command,
    false,
    value
  );
}


function insertImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    toast("Please choose an image file.", "warning");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    $("noteEditor").focus();

    document.execCommand(
      "insertImage",
      false,
      reader.result
    );
  };

  reader.readAsDataURL(file);
}


/* =========================================================
   FAVORITES
   ========================================================= */

async function loadFavorites() {
  if (!state.currentUser) return;

  const { data, error } =
    await supabase
      .from("note_favorites")
      .select("id,note_id")
      .eq("user_id", state.currentUser.id);

  if (error) {
    console.warn("Favorites:", error.message);
    return;
  }

  state.favorites = data || [];

  renderFavorites();
}


async function toggleFavorite(noteId) {
  if (!state.currentUser) return;

  const existing =
    state.favorites.find(
      item => item.note_id === noteId
    );

  if (existing) {
    const { error } =
      await supabase
        .from("note_favorites")
        .delete()
        .eq("id", existing.id);

    if (error) {
      toast(error.message, "error");
      return;
    }

    state.favorites =
      state.favorites.filter(
        item => item.id !== existing.id
      );

    toast("Removed from favorites.");
  } else {
    const { data, error } =
      await supabase
        .from("note_favorites")
        .insert({
          user_id: state.currentUser.id,
          note_id: noteId
        })
        .select("id,note_id")
        .single();

    if (error) {
      toast(error.message, "error");
      return;
    }

    state.favorites.push(data);

    toast("Added to favorites.");
  }

  renderFavorites();
}


/* =========================================================
   QUIZZES
   ========================================================= */

async function loadQuizzes() {
  if (!state.currentUser) return;

  const { data, error } =
    await supabase
      .from("quizzes")
      .select("*")
      .eq("is_published", true)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    toast(error.message, "error");
    return;
  }

  state.quizzes = data || [];

  renderQuizzes();
  renderHomeStats();
}


async function loadAttempts() {
  if (!state.currentUser) return;

  const { data, error } =
    await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", state.currentUser.id)
      .order("completed_at", {
        ascending: false
      });

  if (error) {
    console.warn("Attempts:", error.message);
    return;
  }

  state.attempts = data || [];

  renderQuizStats();
  renderHomeStats();
}


async function loadAdminQuizzes() {
  if (!state.isAdmin) return;

  const { data, error } =
    await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.warn("Admin quizzes:", error.message);
    return;
  }

  state.adminQuizzes = data || [];

  renderAdminMetrics();
  renderAdminQuizManager();
}


function bestAccuracy(attempts = []) {
  if (!attempts.length) return 0;

  return Math.max(
    ...attempts.map(attempt => {
      const total =
        Number(attempt.total_questions) || 0;

      if (!total) return 0;

      return (
        (Number(attempt.correct_answers) / total) *
        100
      );
    })
  );
}


function averageAccuracy(attempts = []) {
  if (!attempts.length) return 0;

  const values =
    attempts.map(attempt => {

      const total =
        Number(attempt.total_questions) || 0;

      if (!total) return 0;

      return (
        Number(attempt.correct_answers) /
        total *
        100
      );
    });

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}


function renderQuizStats() {
  $("availableQuizCount").textContent =
    state.quizzes.length;

  $("quizAttemptCount").textContent =
    state.attempts.length;

  const best =
    bestAccuracy(state.attempts);

  $("quizBestAccuracy").textContent =
    state.attempts.length
      ? `${Math.round(best)}%`
      : "—";

  $("statQuizzes").textContent =
    state.quizzes.length;

  $("statAccuracy").textContent =
    state.attempts.length
      ? `${Math.round(averageAccuracy(state.attempts))}%`
      : "—";
}


function renderQuizzes() {
  const grid = $("quizGrid");

  if (!grid) return;

  if (!state.quizzes.length) {
    grid.innerHTML = `
      <div class="note-empty">
        <strong>No published quizzes yet</strong>
        <span>
          New quizzes will appear here when the administrator publishes them.
        </span>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    state.quizzes.map(quiz => `
      <article class="quiz-card">

        <div class="quiz-card-meta">

          <span class="note-subject">
            ${esc(quiz.subject)}
          </span>

          <span class="quiz-difficulty ${esc(quiz.difficulty)}">
            ${esc(quiz.difficulty)}
          </span>

        </div>

        <h3>
          ${esc(quiz.title)}
        </h3>

        <p>
          ${esc(
            quiz.description ||
            `Practice ${quiz.topic}.`
          )}
        </p>

        <div class="quiz-card-footer">

          <span>
            ${esc(quiz.topic)}
          </span>

          <button
            class="primary-btn"
            type="button"
            data-start-quiz="${esc(quiz.id)}"
          >
            Start →
          </button>

        </div>

      </article>
    `).join("");
}


async function startQuiz(quizId) {
  const quiz =
    state.quizzes.find(
      item => item.id === quizId
    );

  if (!quiz) {
    toast("Quiz not found.", "error");
    return;
  }

  const { data, error } =
    await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("question_order", {
        ascending: true
      });

  if (error) {
    toast(error.message, "error");
    return;
  }

  if (!data?.length) {
    toast("This quiz has no questions yet.", "warning");
    return;
  }

  state.activeQuiz = quiz;

  state.activeQuizQuestions =
    [...data].sort(
      () => Math.random() - 0.5
    );

  state.activeQuizIndex = 0;
  state.activeQuizAnswers = {};
  state.activeQuizStartedAt = Date.now();

  $("quizGrid").classList.add("hidden");
  $("quizStats").classList.add("hidden");
  $("quizPlayer").classList.remove("hidden");
  $("quizResult").classList.add("hidden");

  startQuizTimer();

  renderQuizQuestion();
}


function startQuizTimer() {
  clearInterval(state.quizTimerInterval);

  updateQuizTimer();

  state.quizTimerInterval =
    setInterval(
      updateQuizTimer,
      1000
    );
}


function stopQuizTimer() {
  clearInterval(state.quizTimerInterval);

  state.quizTimerInterval = null;
}


function updateQuizTimer() {
  if (!state.activeQuizStartedAt) return;

  const elapsed =
    Math.floor(
      (Date.now() - state.activeQuizStartedAt) /
      1000
    );

  const limit =
    Number(
      state.activeQuiz?.time_limit_seconds
    ) || 0;

  const seconds =
    Math.max(0, limit ? limit - elapsed : elapsed);

  const minutes =
    Math.floor(seconds / 60);

  const remainder =
    seconds % 60;

  $("quizTimer").textContent =
    `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;

  if (limit && elapsed >= limit) {
    finishQuiz();
  }
}


function renderQuizQuestion() {
  const questions =
    state.activeQuizQuestions;

  const index =
    state.activeQuizIndex;

  const question =
    questions[index];

  if (!question) return;

  const total =
    questions.length;

  const progress =
    ((index + 1) / total) * 100;

  $("quizProgressText").textContent =
    `Question ${index + 1} / ${total}`;

  $("quizQuestionNumber").textContent =
    `QUESTION ${String(index + 1).padStart(2, "0")}`;

  $("quizQuestion").textContent =
    question.question;

  $("quizProgressBar").style.width =
    `${progress}%`;

  const selected =
    state.activeQuizAnswers[question.id];

  const options = [
    ["A", question.option_a],
    ["B", question.option_b],
    ["C", question.option_c],
    ["D", question.option_d]
  ];

  $("quizOptions").innerHTML =
    options.map(([letter, text]) => `
      <button
        class="quiz-option ${selected === letter ? "selected" : ""}"
        type="button"
        data-answer="${letter}"
      >
        <span class="quiz-option-letter">
          ${letter}
        </span>

        <span>
          ${esc(text)}
        </span>
      </button>
    `).join("");

  $("quizNextBtn").textContent =
    index === total - 1
      ? "Submit Quiz"
      : "Next →";
}


function selectQuizAnswer(letter) {
  const question =
    state.activeQuizQuestions[
      state.activeQuizIndex
    ];

  if (!question) return;

  state.activeQuizAnswers[
    question.id
  ] = letter;

  renderQuizQuestion();
}


async function nextQuizQuestion() {
  const question =
    state.activeQuizQuestions[
      state.activeQuizIndex
    ];

  if (!question) return;

  if (!state.activeQuizAnswers[question.id]) {
    toast(
      "Choose an answer first.",
      "warning"
    );

    return;
  }

  if (
    state.activeQuizIndex >=
    state.activeQuizQuestions.length - 1
  ) {
    await finishQuiz();
    return;
  }

  state.activeQuizIndex += 1;

  renderQuizQuestion();
}


async function finishQuiz() {
  if (!state.activeQuiz) return;

  stopQuizTimer();

  const questions =
    state.activeQuizQuestions;

  let correct = 0;

  const answers = {};

  for (const question of questions) {
    const selected =
      state.activeQuizAnswers[question.id] ||
      null;

    answers[question.id] = {
      selected,
      correct: question.correct_option,
      isCorrect:
        selected === question.correct_option
    };

    if (
      selected ===
      question.correct_option
    ) {
      correct++;
    }
  }

  const total =
    questions.length;

  const score =
    total
      ? Math.round((correct / total) * 100)
      : 0;

  const timeTaken =
    state.activeQuizStartedAt
      ? Math.floor(
          (Date.now() -
            state.activeQuizStartedAt) /
          1000
        )
      : null;

  const { data, error } =
    await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: state.activeQuiz.id,
        user_id: state.currentUser.id,
        score,
        total_questions: total,
        correct_answers: correct,
        time_taken_seconds: timeTaken,
        answers
      })
      .select()
      .single();

  if (error) {
    toast(error.message, "error");
    return;
  }

  state.selectedQuizResult = {
    attempt: data,
    questions,
    answers
  };

  $("quizPlayer").classList.add("hidden");
  $("quizResult").classList.remove("hidden");

  $("quizScore").textContent =
    `${correct} / ${total}`;

  $("resultCorrect").textContent =
    correct;

  $("resultIncorrect").textContent =
    total - correct;

  $("resultAccuracy").textContent =
    `${score}%`;

  $("quizResultMessage").textContent =
    quizMessage(score);

  await loadAttempts();
  await checkAchievements();
}


function quizMessage(score) {
  if (score >= 90) {
    return "Outstanding. Your understanding is really strong.";
  }

  if (score >= 75) {
    return "Great work. Keep strengthening the details.";
  }

  if (score >= 50) {
    return "Good start. Review the explanations and try again.";
  }

  return "Keep learning. Another attempt can make a big difference.";
}


function exitQuiz() {
  stopQuizTimer();

  state.activeQuiz = null;
  state.activeQuizQuestions = [];
  state.activeQuizAnswers = {};

  $("quizPlayer").classList.add("hidden");
  $("quizResult").classList.add("hidden");
  $("quizGrid").classList.remove("hidden");
  $("quizStats").classList.remove("hidden");
}


function retakeQuiz() {
  if (!state.activeQuiz) {
    if (state.selectedQuizResult?.attempt?.quiz_id) {
      startQuiz(
        state.selectedQuizResult.attempt.quiz_id
      );
    }

    return;
  }

  startQuiz(state.activeQuiz.id);
}


function reviewQuiz() {
  const result =
    state.selectedQuizResult;

  if (!result) return;

  const questions =
    result.questions;

  $("quizResult").classList.add("hidden");
  $("quizPlayer").classList.remove("hidden");

  stopQuizTimer();

  $("quizPlayerTop")?.classList.add("hidden");

  const player =
    $("quizPlayer");

  player.classList.add("review-mode");

  $("quizQuestion").textContent =
    "Review mode";

  $("quizOptions").innerHTML =
    questions.map((question, index) => {

      const answer =
        result.answers[question.id];

      const selected =
        answer?.selected || "Not answered";

      const isCorrect =
        answer?.isCorrect;

      return `
        <div
          style="
            padding:16px;
            border:1px solid var(--line);
            border-radius:14px;
            background:var(--surface-soft);
          "
        >

          <strong style="display:block;margin-bottom:8px;">
            ${index + 1}. ${esc(question.question)}
          </strong>

          <div style="font-size:11px;color:var(--muted);">
            Your answer:
            <strong style="color:${isCorrect ? "var(--green)" : "var(--red)"};">
              ${esc(selected)}
            </strong>
          </div>

          <div style="margin-top:5px;font-size:11px;">
            Correct answer:
            <strong>
              ${esc(question.correct_option)}
            </strong>
          </div>

          ${
            question.explanation
              ? `
                <div style="margin-top:10px;font-size:10px;color:var(--muted);">
                  💡 ${esc(question.explanation)}
                </div>
              `
              : ""
          }

        </div>
      `;
    }).join("");

  $("quizNextBtn").textContent = "Back to Quiz";

  $("quizNextBtn").onclick = () => {
    player.classList.remove("review-mode");

    $("quizResult").classList.remove("hidden");
    $("quizPlayer").classList.add("hidden");

    $("quizNextBtn").onclick = nextQuizQuestion;
  };
}


/* =========================================================
   ADMIN QUIZ CREATOR
   ========================================================= */

let questionBuilderCounter = 0;


function openQuizCreator() {
  if (!state.isAdmin) {
    toast("Administrator access required.", "warning");
    return;
  }

  $("quizCreatorForm").reset();

  $("quizQuestionBuilder").innerHTML = "";

  questionBuilderCounter = 0;

  addQuestionBuilder();

  $("quizCreatorModal").classList.remove("hidden");
  $("quizCreatorModal").setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeQuizCreator() {
  $("quizCreatorModal").classList.add("hidden");
  $("quizCreatorModal").setAttribute(
    "aria-hidden",
    "true"
  );
}


function addQuestionBuilder() {
  questionBuilderCounter++;

  const number =
    questionBuilderCounter;

  const card =
    document.createElement("div");

  card.className =
    "question-builder-card";

  card.dataset.questionNumber =
    number;

  card.innerHTML = `
    <div class="question-builder-card-header">

      <strong>
        Question ${number}
      </strong>

      <button
        type="button"
        class="question-remove"
        data-remove-question
      >
        Remove
      </button>

    </div>

    <div class="field-group">

      <label>
        Question
      </label>

      <textarea
        data-question-text
        rows="3"
        placeholder="Enter your question..."
        required
      ></textarea>

    </div>

    <div class="question-options-grid">

      ${["A", "B", "C", "D"].map(letter => `
        <div class="field-group">

          <label>
            Option ${letter}
          </label>

          <input
            type="text"
            data-option-${letter.toLowerCase()}
            placeholder="Option ${letter}"
            required
          />

        </div>
      `).join("")}

    </div>

    <div class="note-form-grid" style="margin-top:10px;">

      <div class="field-group">

        <label>
          Correct answer
        </label>

        <select data-correct-option>

          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>

        </select>

      </div>

      <div class="field-group">

        <label>
          Explanation
        </label>

        <input
          type="text"
          data-explanation
          placeholder="Why is this correct?"
        />

      </div>

    </div>
  `;

  $("quizQuestionBuilder").appendChild(card);
}


async function createQuiz(event) {
  event.preventDefault();

  if (!state.isAdmin) {
    toast("Administrator access required.", "warning");
    return;
  }

  const title =
    $("quizTitle").value.trim();

  const topic =
    $("quizTopic").value.trim();

  const subject =
    $("quizSubject").value;

  const difficulty =
    $("quizDifficulty").value;

  const description =
    $("quizDescription").value.trim();

  const minutes =
    Number($("quizTimeLimit").value) || 0;

  const publish =
    $("quizPublish").checked;

  const cards =
    [...$("quizQuestionBuilder").children];

  if (!title || !topic) {
    toast(
      "Enter the quiz title and topic.",
      "warning"
    );

    return;
  }

  if (!cards.length) {
    toast(
      "Add at least one question.",
      "warning"
    );

    return;
  }

  const questions =
    cards.map((card, index) => ({
      question_order: index + 1,

      question:
        card.querySelector(
          "[data-question-text]"
        ).value.trim(),

      option_a:
        card.querySelector(
          "[data-option-a]"
        ).value.trim(),

      option_b:
        card.querySelector(
          "[data-option-b]"
        ).value.trim(),

      option_c:
        card.querySelector(
          "[data-option-c]"
        ).value.trim(),

      option_d:
        card.querySelector(
          "[data-option-d]"
        ).value.trim(),

      correct_option:
        card.querySelector(
          "[data-correct-option]"
        ).value,

      explanation:
        card.querySelector(
          "[data-explanation]"
        ).value.trim()
    }));

  const invalid =
    questions.some(question =>
      !question.question ||
      !question.option_a ||
      !question.option_b ||
      !question.option_c ||
      !question.option_d
    );

  if (invalid) {
    toast(
      "Complete every question and option.",
      "warning"
    );

    return;
  }

  const { data: quiz, error } =
    await supabase
      .from("quizzes")
      .insert({
        created_by: state.currentUser.id,
        subject,
        topic,
        title,
        description,
        difficulty,
        time_limit_seconds:
          minutes > 0
            ? minutes * 60
            : null,
        is_published: publish
      })
      .select()
      .single();

  if (error) {
    toast(error.message, "error");
    return;
  }

  const questionPayload =
    questions.map(question => ({
      ...question,
      quiz_id: quiz.id
    }));

  const { error: questionError } =
    await supabase
      .from("quiz_questions")
      .insert(questionPayload);

  if (questionError) {
    await supabase
      .from("quizzes")
      .delete()
      .eq("id", quiz.id);

    toast(
      questionError.message,
      "error"
    );

    return;
  }

  closeQuizCreator();

  await loadQuizzes();
  await loadAdminQuizzes();

  toast(
    publish
      ? "Quiz published successfully."
      : "Quiz saved as draft."
  );
}


/* =========================================================
   ADMIN QUIZ MANAGER
   ========================================================= */

function renderAdminQuizManager() {
  const container =
    $("adminQuizManager");

  if (!container) return;

  if (!state.isAdmin) {
    container.innerHTML = "";
    return;
  }

  if (!state.adminQuizzes.length) {
    container.innerHTML = `
      <div class="note-empty">
        <strong>No quizzes yet</strong>
        <span>Create your first quiz.</span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.adminQuizzes.map(quiz => `
      <div class="admin-list-item">

        <div>
          <strong>
            ${esc(quiz.title)}
          </strong>

          <span>
            ${esc(quiz.subject)}
            ·
            ${esc(quiz.topic)}
            ·
            ${quiz.is_published ? "Published" : "Draft"}
          </span>
        </div>

        <div style="display:flex;gap:6px;">

          <button
            class="ghost-btn small-btn"
            type="button"
            data-toggle-quiz="${esc(quiz.id)}"
          >
            ${quiz.is_published ? "Unpublish" : "Publish"}
          </button>

          <button
            class="danger-btn small-btn"
            type="button"
            data-delete-quiz="${esc(quiz.id)}"
          >
            Delete
          </button>

        </div>

      </div>
    `).join("");
}


async function toggleQuizPublish(id) {
  if (!state.isAdmin) return;

  const quiz =
    state.adminQuizzes.find(
      item => item.id === id
    );

  if (!quiz) return;

  const { error } =
    await supabase
      .from("quizzes")
      .update({
        is_published: !quiz.is_published,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

  if (error) {
    toast(error.message, "error");
    return;
  }

  await loadQuizzes();
  await loadAdminQuizzes();

  toast(
    quiz.is_published
      ? "Quiz unpublished."
      : "Quiz published."
  );
}


async function deleteQuiz(id) {
  if (!state.isAdmin) return;

  if (
    !window.confirm(
      "Delete this quiz and all its questions?"
    )
  ) {
    return;
  }

  const { error } =
    await supabase
      .from("quizzes")
      .delete()
      .eq("id", id);

  if (error) {
    toast(error.message, "error");
    return;
  }

  await loadQuizzes();
  await loadAdminQuizzes();

  toast("Quiz deleted.");
}


/* =========================================================
   PROGRESS
   ========================================================= */

function calculateStreak(currentState = state) {
  const dates = new Set();

  currentState.notes.forEach(note => {
    if (note.learning_date) {
      dates.add(note.learning_date);
    }
  });

  currentState.attempts.forEach(attempt => {
    if (attempt.completed_at) {
      dates.add(
        new Date(attempt.completed_at)
          .toISOString()
          .slice(0, 10)
      );
    }
  });

  let streak = 0;

  const cursor = new Date();

  while (true) {
    const date =
      cursor.toISOString().slice(0, 10);

    if (!dates.has(date)) {
      break;
    }

    streak++;

    cursor.setDate(
      cursor.getDate() - 1
    );
  }

  return streak;
}


function renderProgress() {
  const streak =
    calculateStreak(state);

  $("progressStreak").textContent =
    streak;

  $("statStreak").textContent =
    `${streak} day${streak === 1 ? "" : "s"}`;

  const subjectCount =
    new Set(
      state.notes.map(note => note.subject)
    ).size;

  const totalSubjects =
    SUBJECTS.length;

  const progress =
    totalSubjects
      ? Math.min(
          100,
          Math.round(
            (subjectCount / totalSubjects) * 100
          )
        )
      : 0;

  $("overallProgressValue").textContent =
    `${progress}%`;

  $("overallProgressBar").style.width =
    `${progress}%`;

  $("progressSummary").textContent =
    subjectCount
      ? `You have started learning across ${subjectCount} subject${subjectCount === 1 ? "" : "s"}.`
      : "Create your first note to begin your journey.";

  renderLearningJourney();
  renderActivityHeatmap();
}


function renderLearningJourney() {
  const container =
    $("learningJourney");

  if (!container) return;

  container.innerHTML =
    SUBJECTS.map(subject => {

      const notes =
        state.notes.filter(
          note => note.subject === subject.name
        ).length;

      const quizzes =
        state.quizzes.filter(
          quiz => quiz.subject === subject.name
        ).length;

      const percentage =
        notes
          ? Math.min(
              100,
              Math.round(
                Math.min(notes, 10) / 10 * 100
              )
            )
          : 0;

      return `
        <div class="journey-item">

          <div class="journey-status">
            ${notes ? "✓" : "○"}
          </div>

          <div>
            <strong>
              ${esc(subject.name)}
            </strong>

            <span>
              ${notes} notes · ${quizzes} quizzes
            </span>
          </div>

          <div class="journey-progress">
            <span style="width:${percentage}%"></span>
          </div>

        </div>
      `;
    }).join("");
}


function renderActivityHeatmap() {
  const container =
    $("activityHeatmap");

  if (!container) return;

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setDate(
      date.getDate() - i
    );

    const key =
      date.toISOString().slice(0, 10);

    const notes =
      state.notes.filter(
        note => note.learning_date === key
      ).length;

    const attempts =
      state.attempts.filter(
        attempt =>
          attempt.completed_at &&
          new Date(attempt.completed_at)
            .toISOString()
            .slice(0, 10) === key
      ).length;

    days.push({
      key,
      count: notes + attempts,
      label:
        new Intl.DateTimeFormat(
          "en-IN",
          { weekday: "short" }
        ).format(date)
    });
  }

  const max =
    Math.max(
      1,
      ...days.map(day => day.count)
    );

  container.innerHTML = `
    <div
      style="
        display:grid;
        grid-template-columns:repeat(7,1fr);
        gap:10px;
      "
    >

      ${days.map(day => {

        const intensity =
          Math.round(
            day.count / max * 100
          );

        return `
          <div style="text-align:center;">

            <div
              title="${day.count} activities"
              style="
                height:70px;
                border-radius:10px;
                background:
                  linear-gradient(
                    180deg,
                    rgba(49,94,251,${Math.max(.08, intensity / 100)})
                    ,
                    rgba(124,77,255,${Math.max(.05, intensity / 160)})
                  );
                border:1px solid var(--line);
              "
            ></div>

            <small
              style="
                display:block;
                margin-top:7px;
                color:var(--muted);
                font-size:8px;
              "
            >
              ${esc(day.label)}
            </small>

          </div>
        `;
      }).join("")}

    </div>
  `;
}


/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

async function loadAchievements() {
  if (!state.currentUser) return;

  const { data, error } =
    await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", state.currentUser.id);

  if (error) {
    console.warn("Achievements:", error.message);
    return;
  }

  state.achievements = data || [];

  renderAchievements();
}


async function checkAchievements() {
  if (!state.currentUser) return;

  const unlocked =
    new Set(
      state.achievements.map(
        item => item.achievement_key
      )
    );

  for (const achievement of ACHIEVEMENTS) {
    if (
      unlocked.has(achievement.key)
    ) {
      continue;
    }

    if (!achievement.test(state)) {
      continue;
    }

    const { error } =
      await supabase
        .from("user_achievements")
        .insert({
          user_id: state.currentUser.id,
          achievement_key: achievement.key
        });

    if (!error) {
      state.achievements.push({
        achievement_key:
          achievement.key
      });

      toast(
        `Achievement unlocked: ${achievement.title}`
      );
    }
  }

  renderAchievements();
}


function renderAchievements() {
  const grid =
    $("achievementGrid");

  if (!grid) return;

  const unlocked =
    new Set(
      state.achievements.map(
        item => item.achievement_key
      )
    );

  grid.innerHTML =
    ACHIEVEMENTS.map(achievement => {

      const isUnlocked =
        unlocked.has(achievement.key);

      return `
        <article
          class="
            achievement-card
            ${isUnlocked ? "unlocked" : "locked"}
          "
        >

          <div class="achievement-icon">
            ${achievement.icon}
          </div>

          <h3>
            ${esc(achievement.title)}
          </h3>

          <p>
            ${esc(achievement.description)}
          </p>

          <span class="achievement-status">
            ${
              isUnlocked
                ? "✓ Unlocked"
                : "○ Locked"
            }
          </span>

        </article>
      `;
    }).join("");
}


/* =========================================================
   ADMIN INSIGHTS
   ========================================================= */

async function loadAdminStats() {
  if (!state.currentUser) return;

  if (state.isAdmin) {
    await loadAdminNotes();
    await loadAdminQuizzes();
  }

  renderAdminMetrics();
  renderActivityChart();
  renderAccuracyChart();
}


function renderAdminMetrics() {
  $("adminNotesCount").textContent =
    state.isAdmin
      ? state.adminNotes.length
      : state.notes.length;

  $("adminQuizzesCount").textContent =
    state.isAdmin
      ? state.adminQuizzes.length
      : state.quizzes.length;

  $("adminAttemptsCount").textContent =
    state.attempts.length;

  $("adminUsersCount").textContent =
    state.isAdmin
      ? "—"
      : "—";
}


function renderActivityChart() {
  const container =
    $("activityChart");

  if (!container) return;

  const values = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setDate(
      date.getDate() - i
    );

    const key =
      date.toISOString().slice(0, 10);

    const noteCount =
      (state.isAdmin
        ? state.adminNotes
        : state.notes
      ).filter(
        note => note.learning_date === key
      ).length;

    const attemptCount =
      state.attempts.filter(
        attempt =>
          attempt.completed_at &&
          new Date(attempt.completed_at)
            .toISOString()
            .slice(0, 10) === key
      ).length;

    values.push({
      label:
        new Intl.DateTimeFormat(
          "en-IN",
          { weekday: "short" }
        ).format(date),

      value:
        noteCount + attemptCount
    });
  }

  const max =
    Math.max(
      1,
      ...values.map(item => item.value)
    );

  container.innerHTML =
    values.map(item => `
      <div class="activity-column">

        <div
          class="activity-bar"
          style="
            height:${Math.max(
              6,
              item.value / max * 150
            )}px;
          "
          title="${item.value} activities"
        ></div>

        <div class="activity-bar-label">
          ${esc(item.label)}
        </div>

      </div>
    `).join("");
}


function renderAccuracyChart() {
  const container =
    $("accuracyChart");

  if (!container) return;

  const accuracy =
    Math.round(
      averageAccuracy(state.attempts)
    );

  container.innerHTML = `
    <div
      class="accuracy-ring"
      style="--accuracy:${accuracy}%"
    >
      <div class="accuracy-ring-content">

        <strong>
          ${accuracy}%
        </strong>

        <span>
          Average accuracy
        </span>

      </div>
    </div>
  `;
}


/* =========================================================
   SEARCH
   ========================================================= */

function performGlobalSearch() {
  const query =
    $("globalSearch")
      ?.value
      .trim()
      .toLowerCase() || "";

  if (!query) {
    $("searchResults").innerHTML = `
      <div class="note-empty">
        <strong>Search your knowledge</strong>
        <span>
          Try a topic, subject, tag or keyword.
        </span>
      </div>
    `;

    return;
  }

  const results =
    state.notes.filter(
      note => noteMatches(note, query)
    );

  renderNotesGrid(
    $("searchResults"),
    results
  );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showView(viewId) {
  $$(".page-view").forEach(view => {
    view.classList.toggle(
      "active",
      view.id === viewId
    );
  });

  $$(".nav-item").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.view === viewId
    );
  });

  const activeNav =
    $(`.nav-item[data-view="${viewId}"]`);

  $("pageBreadcrumb").textContent =
    activeNav?.querySelector("span:nth-child(2)")
      ?.textContent ||
    "GyaanBikas";

  $("sidebar").classList.remove("open");
  $("sidebarOverlay").classList.add("hidden");

  if (viewId === "progressView") {
    renderProgress();
  }

  if (viewId === "achievementsView") {
    renderAchievements();
  }

  if (viewId === "adminView") {
    loadAdminStats();
  }

  if (viewId === "quizView") {
    renderQuizzes();
  }
}


function navigateFromButton(button) {
  const target =
    button.dataset.viewTarget;

  if (target) {
    showView(target);
  }
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme(theme) {
  const dark =
    theme === "dark";

  document.body.classList.toggle(
    "dark",
    dark
  );

  localStorage.setItem(
    "gyaanbikas-theme",
    dark ? "dark" : "light"
  );

  $("themeToggle").textContent =
    dark ? "☀" : "☾";

  $$(".appearance-option").forEach(option => {
    option.classList.toggle(
      "active",
      option.dataset.themeChoice === theme
    );
  });
}


function loadTheme() {
  const theme =
    localStorage.getItem(
      "gyaanbikas-theme"
    ) || "light";

  applyTheme(theme);
}


/* =========================================================
   COMMAND PALETTE
   ========================================================= */

const COMMANDS = [
  {
    icon: "＋",
    title: "New Note",
    description: "Create a learning note",
    action: () => openNewNote()
  },
  {
    icon: "⌕",
    title: "Search Notes",
    description: "Search your knowledge",
    action: () => showView("searchView")
  },
  {
    icon: "✦",
    title: "Take a Quiz",
    description: "Practice what you learned",
    action: () => showView("quizView")
  },
  {
    icon: "◒",
    title: "My Progress",
    description: "View your learning journey",
    action: () => showView("progressView")
  },
  {
    icon: "◇",
    title: "Achievements",
    description: "View unlocked milestones",
    action: () => showView("achievementsView")
  },
  {
    icon: "♡",
    title: "Favorites",
    description: "Open saved notes",
    action: () => showView("favoritesView")
  },
  {
    icon: "◈",
    title: "Admin Insights",
    description: "Open analytics",
    action: () => showView("adminView")
  },
  {
    icon: "⚙",
    title: "Settings",
    description: "Manage your profile",
    action: () => showView("settingsView")
  },
  {
    icon: "☾",
    title: "Toggle Dark Mode",
    description: "Switch appearance",
    action: () => {
      const dark =
        document.body.classList.contains("dark");

      applyTheme(
        dark ? "light" : "dark"
      );
    }
  }
];


function renderCommandResults(query = "") {
  const container =
    $("commandResults");

  if (!container) return;

  const q =
    query.trim().toLowerCase();

  const results =
    COMMANDS.filter(command =>
      !q ||
      `${command.title} ${command.description}`
        .toLowerCase()
        .includes(q)
    );

  container.innerHTML =
    results.map((command, index) => `
      <button
        class="command-item ${index === 0 ? "active" : ""}"
        type="button"
        data-command-index="${COMMANDS.indexOf(command)}"
      >

        <span class="command-item-icon">
          ${command.icon}
        </span>

        <span>
          <strong>
            ${esc(command.title)}
          </strong>

          <small>
            ${esc(command.description)}
          </small>
        </span>

      </button>
    `).join("");
}


function openCommandPalette() {
  $("commandPalette").classList.remove("hidden");

  $("commandInput").value = "";

  renderCommandResults();

  setTimeout(() => {
    $("commandInput").focus();
  }, 30);
}


function closeCommandPalette() {
  $("commandPalette").classList.add("hidden");
}


function runCommand(index) {
  const command =
    COMMANDS[index];

  if (!command) return;

  closeCommandPalette();

  command.action();
}


/* =========================================================
   INSTALL APP
   ========================================================= */

function setupInstallPrompt() {
  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();

      state.deferredInstallPrompt =
        event;

      $("installAppBtn")
        .classList.remove("hidden");
    }
  );


  $("installAppBtn")
    .addEventListener(
      "click",
      async () => {

        if (!state.deferredInstallPrompt) {
          return;
        }

        state.deferredInstallPrompt.prompt();

        await state.deferredInstallPrompt.userChoice;

        state.deferredInstallPrompt = null;

        $("installAppBtn")
          .classList.add("hidden");
      }
    );
}


/* =========================================================
   SPLASH
   ========================================================= */

async function hideSplash() {
  const splash =
    $("splash");

  if (!splash) return;

  await sleep(1400);

  $("splashStatus").textContent =
    "Building your learning space";

  await sleep(900);

  $("splashStatus").textContent =
    "Ready";

  await sleep(450);

  splash.classList.add("is-hidden");

  await sleep(700);

  splash.remove();
}


/* =========================================================
   APP ENTRY
   ========================================================= */

async function enterApp(session) {
  state.currentUser =
    session.user;

  state.isAdmin =
    String(
      session.user.email || ""
    ).toLowerCase() ===
    ADMIN_EMAIL.toLowerCase();

  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  determineAdmin();

  await loadProfile();

  await Promise.all([
    loadNotes(),
    loadQuizzes(),
    loadAttempts(),
    loadFavorites(),
    loadAchievements()
  ]);

  if (state.isAdmin) {
    await Promise.all([
      loadAdminNotes(),
      loadAdminQuizzes()
    ]);
  }

  renderHomeStats();
  renderProgress();
  renderAdminMetrics();

  showView("homeView");

  await checkAchievements();
}


function renderHomeStats() {
  $("statNotes").textContent =
    state.notes.length;

  $("statQuizzes").textContent =
    state.quizzes.length;

  $("statAccuracy").textContent =
    state.attempts.length
      ? `${Math.round(
          averageAccuracy(state.attempts)
        )}%`
      : "—";

  const streak =
    calculateStreak(state);

  $("statStreak").textContent =
    `${streak} day${streak === 1 ? "" : "s"}`;
}


/* =========================================================
   SESSION HANDLING
   ========================================================= */

async function handleSession(session) {
  if (session) {
    await enterApp(session);
  } else {

    state.currentUser = null;
    state.profile = null;

    $("appView").classList.add("hidden");
    $("authView").classList.remove("hidden");

    updateAuthUI();
  }
}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

function setupDelegatedEvents() {

  document.addEventListener(
    "click",
    async event => {

      const noteCard =
        event.target.closest(
          ".note-card"
        );

      if (
        noteCard &&
        !event.target.closest("button")
      ) {
        openNote(
          noteCard.dataset.noteId
        );

        return;
      }


      const subjectCard =
        event.target.closest(
          ".subject-card"
        );

      if (subjectCard) {

        const subject =
          subjectCard.dataset.subject;

        showView("notesView");

        $("subjectFilter").value =
          subject;

        renderAllNotes();

        return;
      }


      const startQuizButton =
        event.target.closest(
          "[data-start-quiz]"
        );

      if (startQuizButton) {
        await startQuiz(
          startQuizButton.dataset.startQuiz
        );

        return;
      }


      const toggleQuizButton =
        event.target.closest(
          "[data-toggle-quiz]"
        );

      if (toggleQuizButton) {
        await toggleQuizPublish(
          toggleQuizButton.dataset.toggleQuiz
        );

        return;
      }


      const deleteQuizButton =
        event.target.closest(
          "[data-delete-quiz]"
        );

      if (deleteQuizButton) {
        await deleteQuiz(
          deleteQuizButton.dataset.deleteQuiz
        );

        return;
      }


      const tocButton =
        event.target.closest(
          "[data-toc-target]"
        );

      if (tocButton) {

        const target =
          document.getElementById(
            tocButton.dataset.tocTarget
          );

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }

        return;
      }


      const commandItem =
        event.target.closest(
          "[data-command-index]"
        );

      if (commandItem) {

        runCommand(
          Number(
            commandItem.dataset.commandIndex
          )
        );

        return;
      }


      const navItem =
        event.target.closest(
          ".nav-item"
        );

      if (navItem) {

        showView(
          navItem.dataset.view
        );

        return;
      }


      const viewButton =
        event.target.closest(
          "[data-view-target]"
        );

      if (viewButton) {
        navigateFromButton(viewButton);
      }


      const appearance =
        event.target.closest(
          "[data-theme-choice]"
        );

      if (appearance) {
        applyTheme(
          appearance.dataset.themeChoice
        );
      }


      const answerButton =
        event.target.closest(
          "[data-answer]"
        );

      if (answerButton) {
        selectQuizAnswer(
          answerButton.dataset.answer
        );
      }


      const removeQuestion =
        event.target.closest(
          "[data-remove-question]"
        );

      if (removeQuestion) {

        const card =
          removeQuestion.closest(
            ".question-builder-card"
          );

        if (card) {
          card.remove();
        }

        return;
      }

    }
  );
}


/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

  document.addEventListener(
    "keydown",
    event => {

      const tag =
        document.activeElement?.tagName;

      const editing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        document.activeElement?.isContentEditable;


      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        openCommandPalette();

        return;
      }


      if (
        event.key === "Escape"
      ) {

        if (
          !$("commandPalette")
            .classList.contains("hidden")
        ) {
          closeCommandPalette();
          return;
        }

        if (
          !$("imageLightbox")
            .classList.contains("hidden")
        ) {
          closeImageLightbox();
          return;
        }

        if (
          !$("noteReader")
            .classList.contains("hidden")
        ) {
          closeReader();
          return;
        }

        if (
          !$("noteModal")
            .classList.contains("hidden")
        ) {
          closeNoteModal();
          return;
        }

        if (
          !$("quizCreatorModal")
            .classList.contains("hidden")
        ) {
          closeQuizCreator();
          return;
        }
      }


      if (editing) return;


    if (
  event.key &&
  event.key.toLowerCase() === "n"
) {
        if (state.isAdmin) {
          event.preventDefault();
          openNewNote();
        }
      }

    }
  );
}


/* =========================================================
   IMAGE LIGHTBOX
   ========================================================= */

function openImageLightbox(src, alt = "Note image") {
  if (!src) return;

  $("lightboxImage").src = src;
  $("lightboxImage").alt = alt;

  $("imageLightbox").classList.remove("hidden");
  $("imageLightbox").setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeImageLightbox() {
  $("imageLightbox").classList.add("hidden");
  $("imageLightbox").setAttribute(
    "aria-hidden",
    "true"
  );

  $("lightboxImage").src = "";
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupListeners() {

  $("googleBtn")
    .addEventListener(
      "click",
      signInWithGoogle
    );

  $("authForm")
    .addEventListener(
      "submit",
      handleAuthSubmit
    );

  $("switchBtn")
    .addEventListener(
      "click",
      () => {

        state.authMode =
          state.authMode === "login"
            ? "signup"
            : "login";

        updateAuthUI();
      }
    );


  $("togglePassword")
    .addEventListener(
      "click",
      () => {

        const input =
          $("authPassword");

        const visible =
          input.type === "text";

        input.type =
          visible
            ? "password"
            : "text";

        $("togglePassword")
          .textContent =
          visible ? "◉" : "◌";
      }
    );


  $("themeToggle")
    .addEventListener(
      "click",
      () => {

        const dark =
          document.body.classList.contains("dark");

        applyTheme(
          dark ? "light" : "dark"
        );
      }
    );


  $("newNoteBtn")
    .addEventListener(
      "click",
      openNewNote
    );


  $("heroNewNoteBtn")
    .addEventListener(
      "click",
      openNewNote
    );


  $("heroQuizBtn")
    .addEventListener(
      "click",
      () => showView("quizView")
    );


  $("closeNoteModal")
    .addEventListener(
      "click",
      closeNoteModal
    );


  $("cancelNoteBtn")
    .addEventListener(
      "click",
      closeNoteModal
    );


  $("noteForm")
    .addEventListener(
      "submit",
      saveNote
    );


  $("deleteNoteBtn")
    .addEventListener(
      "click",
      deleteNote
    );


  $("editorToolbar")
    .addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-command]"
          );

        if (!button) return;

        execEditorCommand(
          button.dataset.command,
          button.dataset.value || null
        );
      }
    );


  $("noteImageInput")
    .addEventListener(
      "change",
      event => {

        const file =
          event.target.files?.[0];

        if (file) {
          insertImageFile(file);
        }

        event.target.value = "";
      }
    );


  $("notesSearch")
    .addEventListener(
      "input",
      renderAllNotes
    );


  $("subjectFilter")
    .addEventListener(
      "change",
      renderAllNotes
    );


  $("globalSearch")
    .addEventListener(
      "input",
      performGlobalSearch
    );


  $("signOutBtn")
    .addEventListener(
      "click",
      signOut
    );


  $("settingsSignOutBtn")
    .addEventListener(
      "click",
      signOut
    );


  $("profileForm")
    .addEventListener(
      "submit",
      saveProfile
    );


  $("closeReaderBtn")
    .addEventListener(
      "click",
      closeReader
    );


  $("readerScroll")
    .addEventListener(
      "scroll",
      updateReaderProgress,
      { passive: true }
    );


  $("readerEditBtn")
    .addEventListener(
      "click",
      () => {

        if (!state.activeNoteId) return;

        closeReader();

        openEditNote(
          state.activeNoteId
        );
      }
    );


  $("readerPrintBtn")
    .addEventListener(
      "click",
      () => window.print()
    );


  $("readerFocusBtn")
    .addEventListener(
      "click",
      () => {

        $("readerShell")?.classList.toggle(
          "focus-mode"
        );

        $("readerToolbar")
          ?.classList.toggle(
            "focus-mode"
          );
      }
    );


  $("readerContent")
    .addEventListener(
      "click",
      event => {

        const image =
          event.target.closest("img");

        if (!image) return;

        openImageLightbox(
          image.src,
          image.alt
        );
      }
    );


  $("closeLightboxBtn")
    .addEventListener(
      "click",
      closeImageLightbox
    );


  $("imageLightbox")
    .addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("imageLightbox")
        ) {
          closeImageLightbox();
        }
      }
    );


  $("commandPaletteBtn")
    .addEventListener(
      "click",
      openCommandPalette
    );


  $("commandInput")
    .addEventListener(
      "input",
      event =>
        renderCommandResults(
          event.target.value
        )
    );


  $("mobileSidebarOpen")
    .addEventListener(
      "click",
      () => {

        $("sidebar").classList.add("open");

        $("sidebarOverlay")
          .classList.remove("hidden");
      }
    );


  $("mobileSidebarClose")
    .addEventListener(
      "click",
      () => {

        $("sidebar").classList.remove("open");

        $("sidebarOverlay")
          .classList.add("hidden");
      }
    );


  $("sidebarOverlay")
    .addEventListener(
      "click",
      () => {

        $("sidebar").classList.remove("open");

        $("sidebarOverlay")
          .classList.add("hidden");
      }
    );


  $("quizNextBtn")
    .addEventListener(
      "click",
      nextQuizQuestion
    );


  $("exitQuizBtn")
    .addEventListener(
      "click",
      exitQuiz
    );


  $("retakeQuizBtn")
    .addEventListener(
      "click",
      retakeQuiz
    );


  $("reviewQuizBtn")
    .addEventListener(
      "click",
      reviewQuiz
    );


  $("adminNewNoteBtn")
    .addEventListener(
      "click",
      openNewNote
    );


  $("adminNewQuizBtn")
    .addEventListener(
      "click",
      openQuizCreator
    );


  $("adminManageNotesBtn")
    .addEventListener(
      "click",
      () => showView("notesView")
    );


  $("adminManageQuizzesBtn")
    .addEventListener(
      "click",
      () => showView("quizView")
    );


  $("closeQuizCreator")
    .addEventListener(
      "click",
      closeQuizCreator
    );


  $("cancelQuizCreator")
    .addEventListener(
      "click",
      closeQuizCreator
    );


  $("addQuestionBtn")
    .addEventListener(
      "click",
      addQuestionBuilder
    );


  $("quizCreatorForm")
    .addEventListener(
      "submit",
      createQuiz
    );
}


/* =========================================================
   PWA SERVICE WORKER
   ========================================================= */

async function registerServiceWorker() {
  if (
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {
    await navigator.serviceWorker.register(
      "./sw.js"
    );
  } catch (error) {
    console.warn(
      "Service worker registration failed:",
      error
    );
  }
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initialize() {

  if (state.initialized) return;

  state.initialized = true;

  updateAuthUI();

  loadTheme();

  setupListeners();

  setupDelegatedEvents();

  setupKeyboard();

  setupInstallPrompt();

  await registerServiceWorker();

  try {

    const {
      data: {
        session
      }
    } =
      await supabase.auth.getSession();

    await handleSession(session);

  } catch (error) {

    console.error(error);

    toast(
      "Could not initialize GyaanBikas.",
      "error"
    );
  }

  supabase.auth.onAuthStateChange(
    async (_event, session) => {

      if (session?.user) {

        if (
          !state.currentUser ||
          state.currentUser.id !==
            session.user.id
        ) {
          await handleSession(session);
        }

      } else {

        await handleSession(null);

      }
    }
  );

  hideSplash();
}


/* =========================================================
   BOOT
   ========================================================= */

initialize();