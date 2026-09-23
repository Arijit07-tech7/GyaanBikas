import { supabase } from "./supabase.js?v=20260923-2";

const $ = (id) => document.getElementById(id);

const splash = $("splash");
const authView = $("authView");
const appView = $("appView");

let authMode = "login";
let currentUser = null;
let notes = [];
let profile = null;

const subjects = [
  {
    name: "Machine Learning",
    icon: "◈",
    available: true,
    desc: "Algorithms, models & intuition"
  },
  {
    name: "Python",
    icon: "⌘",
    available: false,
    desc: "Coming soon"
  },
  {
    name: "Java",
    icon: "☕",
    available: false,
    desc: "Coming soon"
  },
  {
    name: "Data Science",
    icon: "◒",
    available: false,
    desc: "Coming soon"
  },
  {
    name: "Web Development",
    icon: "⌁",
    available: false,
    desc: "Coming soon"
  }
];

/* =========================================
   HELPERS
========================================= */

function toast(message) {
  const toastEl = $("toast");

  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return map[char];
  });
}

function plain(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;

  return div.textContent || div.innerText || "";
}

function initials(name = "A") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"
  );
}

function fmtDate(date) {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/* =========================================
   SUBJECTS
========================================= */

function renderSubjects() {
  const grid = $("subjectGrid");

  if (!grid) return;

  grid.innerHTML = subjects
    .map(
      (subject) => `
        <button
          class="subject-card ${subject.available ? "" : "soon"}"
          data-subject="${esc(subject.name)}"
          type="button">

          ${
            subject.available
              ? ""
              : '<span class="badge">COMING SOON</span>'
          }

          <div class="subject-icon">
            ${subject.icon}
          </div>

          <h3>${esc(subject.name)}</h3>

          <p>${esc(subject.desc)}</p>

        </button>
      `
    )
    .join("");

  document.querySelectorAll(".subject-card").forEach((button) => {
    button.onclick = () => {
      const subject = button.dataset.subject;

      if (subject !== "Machine Learning") {
        toast(`${subject} is coming soon.`);
        return;
      }

      showView("notes");

      const filter = $("subjectFilter");

      if (filter) {
        filter.value = subject;
      }

      renderNotes();
    };
  });
}

/* =========================================
   NOTE CARD
========================================= */

function noteCard(note) {
  const tags = (note.tags || [])
    .slice(0, 3)
    .map(
      (tag) =>
        `<span class="tag">${esc(tag)}</span>`
    )
    .join("");

  const preview = esc(plain(note.details)).slice(0, 220);

  return `
    <article
      class="note-card"
      data-id="${esc(note.id)}">

      <div class="note-top">

        <div>
          <p class="eyebrow">
            ${esc(note.subject)} · ${fmtDate(note.learning_date)}
          </p>

          <h3>
            ${esc(note.topic)}
          </h3>
        </div>

        ${
          note.is_pinned
            ? '<span class="pin">★</span>'
            : ""
        }

      </div>

      <div class="preview">
        ${preview || "No preview text yet."}
      </div>

      <div class="note-meta">
        ${
          tags ||
          '<span class="tag">No tags</span>'
        }
      </div>

    </article>
  `;
}

function empty(
  title = "No notes yet",
  subtitle = "Start your first learning note."
) {
  return `
    <div class="empty">
      <strong>${esc(title)}</strong>
      <span>${esc(subtitle)}</span>
    </div>
  `;
}

function bindCards(container) {
  if (!container) return;

  container
    .querySelectorAll(".note-card")
    .forEach((card) => {
      card.onclick = () => {
        openNote(card.dataset.id);
      };
    });
}

/* =========================================
   RECENT NOTES
========================================= */

function renderRecent() {
  const container = $("recentNotes");

  if (!container) return;

  const list = notes
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    )
    .slice(0, 6);

  container.innerHTML = list.length
    ? list.map(noteCard).join("")
    : empty();

  bindCards(container);
}

/* =========================================
   FILTER NOTES
========================================= */

function filteredNotes() {
  const searchInput = $("notesSearch");
  const subjectInput = $("subjectFilter");

  const query = (
    searchInput?.value || ""
  )
    .toLowerCase()
    .trim();

  const subject =
    subjectInput?.value || "";

  return notes
    .filter((note) => {
      const searchable = [
        note.subject,
        note.topic,
        note.details,
        (note.tags || []).join(" "),
        note.reference_url
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!subject || note.subject === subject)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.learning_date) -
        new Date(a.learning_date)
    );
}

function renderNotes() {
  const container = $("allNotes");

  if (!container) return;

  const list = filteredNotes();

  container.innerHTML = list.length
    ? list.map(noteCard).join("")
    : empty(
        "No matching notes",
        "Try another search or create a new note."
      );

  bindCards(container);
}

/* =========================================
   GLOBAL SEARCH
========================================= */

function renderSearch(query = "") {
  const container = $("searchResults");

  if (!container) return;

  const q = query.toLowerCase().trim();

  const list = q
    ? notes
        .filter((note) => {
          const searchable = [
            note.subject,
            note.topic,
            note.details,
            (note.tags || []).join(" "),
            note.reference_url
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(q);
        })
        .sort(
          (a, b) =>
            new Date(b.learning_date) -
            new Date(a.learning_date)
        )
    : [];

  container.innerHTML = list.length
    ? list.map(noteCard).join("")
    : q
      ? empty(
          "Nothing found",
          "Try a different topic, tag or phrase."
        )
      : `
          <div class="empty">
            <strong>Search your knowledge</strong>
            <span>
              Type above to find your notes.
            </span>
          </div>
        `;

  bindCards(container);
}

/* =========================================
   PROFILE
========================================= */

async function loadProfile() {
  if (!currentUser) return;

  const {
    data,
    error
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.warn(
      "GyaanBikas profile error:",
      error
    );
  }

  profile =
    data || {
      full_name:
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split("@")[0] ||
        "Learner"
    };

  const name =
    profile.full_name || "Learner";

  if ($("helloName")) {
    $("helloName").textContent =
      name.split(" ")[0];
  }

  if ($("sideName")) {
    $("sideName").textContent = name;
  }

  if ($("sideEmail")) {
    $("sideEmail").textContent =
      currentUser.email || "";
  }

  if ($("sideAvatar")) {
    $("sideAvatar").textContent =
      initials(name);
  }

  if ($("topAvatar")) {
    $("topAvatar").textContent =
      initials(name);
  }

  if (profile.avatar_url) {
    const safeAvatar =
      esc(profile.avatar_url);

    if ($("sideAvatar")) {
      $("sideAvatar").innerHTML =
        `<img src="${safeAvatar}" alt="">`;
    }

    if ($("topAvatar")) {
      $("topAvatar").innerHTML =
        `<img src="${safeAvatar}" alt="">`;
    }
  }

  if ($("settingsName")) {
    $("settingsName").value =
      profile.full_name || "";
  }

  if ($("settingsUsername")) {
    $("settingsUsername").value =
      profile.username || "";
  }
}

/* =========================================
   NOTES FROM SUPABASE
========================================= */

async function loadNotes() {
  if (!currentUser) return;

  const {
    data,
    error
  } = await supabase
    .from("learning_notes")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("learning_date", {
      ascending: false
    });

  if (error) {
    console.error(
      "GyaanBikas notes error:",
      error
    );

    toast("Could not load notes.");

    notes = [];

    renderRecent();
    renderNotes();

    return;
  }

  notes = data || [];

  renderRecent();
  renderNotes();
  renderSearch("");
}

/* =========================================
   ENTER APP
========================================= */

async function enterApp() {
  if (!authView || !appView) return;

  authView.classList.add("hidden");
  appView.classList.remove("hidden");

  renderSubjects();

  await loadProfile();
  await loadNotes();

  showView("home");
}

/* =========================================
   SESSION
========================================= */

async function handleSession(session) {
  currentUser = session?.user || null;

  if (currentUser) {
    await enterApp();
  } else {
    appView?.classList.add("hidden");
    authView?.classList.remove("hidden");
  }
}

supabase.auth.onAuthStateChange(
  (_event, session) => {
    setTimeout(() => {
      handleSession(session);
    }, 0);
  }
);

/* =========================================
   VIEW NAVIGATION
========================================= */

function showView(name) {
  document
    .querySelectorAll(".view")
    .forEach((view) => {
      view.classList.add("hidden");
    });

  const target = $(`${name}View`);

  if (target) {
    target.classList.remove("hidden");
  }

  document
    .querySelectorAll(".nav-item")
    .forEach((nav) => {
      nav.classList.toggle(
        "active",
        nav.dataset.view === name
      );
    });

  const labels = {
    home: "Home",
    notes: "All Notes",
    search: "Search",
    settings: "Settings"
  };

  if ($("crumb")) {
    $("crumb").textContent =
      labels[name] || "Home";
  }

  if (name === "notes") {
    renderNotes();
  }
}

document
  .querySelectorAll(".nav-item")
  .forEach((nav) => {
    nav.onclick = () => {
      showView(nav.dataset.view);

      document
        .querySelector(".sidebar")
        ?.classList.remove("open");
    };
  });

document
  .querySelectorAll("[data-view]")
  .forEach((element) => {
    if (!element.classList.contains("nav-item")) {
      element.onclick = () => {
        showView(element.dataset.view);
      };
    }
  });

$("mobileMenu")?.addEventListener(
  "click",
  () => {
    document
      .querySelector(".sidebar")
      ?.classList.toggle("open");
  }
);

$("quickSearchBtn")?.addEventListener(
  "click",
  () => {
    showView("search");
  }
);

/* =========================================
   SEARCH SHORTCUT
========================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();

      showView("search");

      $("globalSearch")?.focus();
    }
  }
);

/* =========================================
   THEME
========================================= */

function setTheme(theme) {
  document.body.classList.toggle(
    "dark",
    theme === "dark"
  );

  localStorage.setItem(
    "gyaanbikas-theme",
    theme
  );

  document
    .querySelectorAll(".theme-option")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.theme === theme
      );
    });
}

setTheme(
  localStorage.getItem(
    "gyaanbikas-theme"
  ) || "light"
);

$("themeBtn")?.addEventListener(
  "click",
  () => {
    setTheme(
      document.body.classList.contains("dark")
        ? "light"
        : "dark"
    );
  }
);

document
  .querySelectorAll(".theme-option")
  .forEach((button) => {
    button.onclick = () => {
      setTheme(button.dataset.theme);
    };
  });

/* =========================================
   AUTH MODE
========================================= */

function setAuthMode(mode) {
  authMode = mode;

  const signup = mode === "signup";

  if ($("authTitle")) {
    $("authTitle").textContent =
      signup
        ? "Create account"
        : "Sign in";
  }

  if ($("authSubtitle")) {
    $("authSubtitle").textContent =
      signup
        ? "Create your private learning space."
        : "Continue your learning journey.";
  }

  $("nameWrap")?.classList.toggle(
    "hidden",
    !signup
  );

  if ($("name")) {
    $("name").required = signup;
  }

  if ($("submitText")) {
    $("submitText").textContent =
      signup
        ? "Create account"
        : "Sign in";
  }

  if ($("switchText")) {
    $("switchText").textContent =
      signup
        ? "Already have an account? Sign in"
        : "Create an account";
  }

  if ($("authMessage")) {
    $("authMessage").textContent = "";
  }
}

$("switchBtn")?.addEventListener(
  "click",
  () => {
    setAuthMode(
      authMode === "login"
        ? "signup"
        : "login"
    );
  }
);

$("togglePassword")?.addEventListener(
  "click",
  () => {
    const password = $("password");
    const button = $("togglePassword");

    if (!password || !button) return;

    password.type =
      password.type === "password"
        ? "text"
        : "password";

    button.textContent =
      password.type === "password"
        ? "Show"
        : "Hide";
  }
);

/* =========================================
   AUTH ERRORS
========================================= */

function authErrorMessage(error) {
  const message =
    error?.message ||
    "Authentication failed.";

  if (/invalid api key/i.test(message)) {
    return (
      "Supabase rejected the browser API key. " +
      "Please hard-refresh this updated build " +
      "(Ctrl + Shift + R) and try again."
    );
  }

  if (
    /redirect|redirect_uri/i.test(
      message
    )
  ) {
    return (
      "Google redirect is not allowed yet. " +
      "Check Supabase Authentication → URL Configuration."
    );
  }

  if (
    /email not confirmed/i.test(
      message
    )
  ) {
    return (
      "Please confirm your email before signing in."
    );
  }

  if (
    /invalid login credentials/i.test(
      message
    )
  ) {
    return (
      "Email or password is incorrect."
    );
  }

  return message;
}

/* =========================================
   GOOGLE LOGIN
========================================= */

$("googleBtn")?.addEventListener(
  "click",
  async () => {
    if (!$("googleBtn")) return;

    $("authMessage").textContent = "";
    $("googleBtn").disabled = true;

    const redirectTo =
      new URL(
        "./",
        window.location.href
      ).href;

    try {
      const {
        error
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",

            options: {
              redirectTo,

              queryParams: {
                access_type: "offline",
                prompt: "select_account"
              }
            }
          }
        );

      if (error) {
        $("authMessage").textContent =
          authErrorMessage(error);
      }
    } catch (error) {
      $("authMessage").textContent =
        authErrorMessage(error);
    }

    $("googleBtn").disabled = false;
  }
);

/* =========================================
   EMAIL AUTH
========================================= */

$("authForm")?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!$("submitBtn")) return;

    $("authMessage").textContent = "";
    $("submitBtn").disabled = true;

    const email =
      $("email").value.trim();

    const password =
      $("password").value;

    const name =
      $("name")?.value.trim() || "";

    let result;

    try {
      if (authMode === "signup") {
        result =
          await supabase.auth.signUp({
            email,
            password,

            options: {
              data: {
                full_name: name
              },

              emailRedirectTo:
                new URL(
                  "./",
                  window.location.href
                ).href
            }
          });
      } else {
        result =
          await supabase.auth.signInWithPassword(
            {
              email,
              password
            }
          );
      }
    } catch (error) {
      result = {
        error
      };
    }

    $("submitBtn").disabled = false;

    if (result?.error) {
      $("authMessage").textContent =
        authErrorMessage(
          result.error
        );

      return;
    }

    if (authMode === "signup") {
      if (result.data?.session) {
        toast(
          "Account created. Welcome to GyaanBikas."
        );
      } else {
        $("authMessage").textContent =
          "Account created. Check your email to confirm your account, then sign in.";
      }
    }
  }
);

/* =========================================
   NOTE MODAL
========================================= */

async function openNote(id) {
  const note = notes.find(
    (item) => item.id === id
  );

  if (!note) return;

  $("modalTitle").textContent =
    "Edit note";

  $("noteId").value = note.id;
  $("noteSubject").value =
    note.subject || "";

  $("noteDate").value =
    note.learning_date || "";

  $("noteTopic").value =
    note.topic || "";

  $("noteEditor").innerHTML =
    note.details || "";

  $("noteTags").value =
    (note.tags || []).join(", ");

  $("noteReference").value =
    note.reference_url || "";

  $("notePinned").checked =
    !!note.is_pinned;

  $("deleteNoteBtn")?.classList.remove(
    "hidden"
  );

  $("noteModal")?.classList.remove(
    "hidden"
  );
}

function newNote() {
  $("modalTitle").textContent =
    "New note";

  $("noteForm").reset();

  $("noteId").value = "";

  $("noteDate").value =
    new Date()
      .toISOString()
      .slice(0, 10);

  $("noteSubject").value =
    "Machine Learning";

  $("noteEditor").innerHTML = "";

  $("deleteNoteBtn")?.classList.add(
    "hidden"
  );

  $("noteModal")?.classList.remove(
    "hidden"
  );
}

$("addNoteBtn")?.addEventListener(
  "click",
  newNote
);

$("closeModal")?.addEventListener(
  "click",
  () => {
    $("noteModal")?.classList.add(
      "hidden"
    );
  }
);

$("cancelNote")?.addEventListener(
  "click",
  () => {
    $("noteModal")?.classList.add(
      "hidden"
    );
  }
);

$("modalBackdrop")?.addEventListener(
  "click",
  () => {
    $("noteModal")?.classList.add(
      "hidden"
    );
  }
);

document
  .querySelector(
    "#noteModal .modal-backdrop"
  )
  ?.addEventListener(
    "click",
    () => {
      $("noteModal")?.classList.add(
        "hidden"
      );
    }
  );

/* =========================================
   RICH TEXT EDITOR
========================================= */

document
  .querySelectorAll(
    ".editor-toolbar button[data-cmd]"
  )
  .forEach((button) => {
    button.onclick = () => {
      document.execCommand(
        button.dataset.cmd,
        false,
        button.dataset.value || null
      );
    };
  });

$("codeBtn")?.addEventListener(
  "click",
  () => {
    const selection =
      window.getSelection();

    if (!selection?.rangeCount) {
      return;
    }

    const text =
      selection.toString();

    if (text) {
      document.execCommand(
        "insertHTML",
        false,
        `<pre><code>${esc(
          text
        )}</code></pre>`
      );
    } else {
      document.execCommand(
        "insertHTML",
        false,
        "<pre><code>code here</code></pre>"
      );
    }
  }
);

$("linkBtn")?.addEventListener(
  "click",
  () => {
    const url = window.prompt(
      "Enter URL"
    );

    if (url) {
      document.execCommand(
        "createLink",
        false,
        url
      );
    }
  }
);

$("imageBtn")?.addEventListener(
  "click",
  () => {
    $("imageInput")?.click();
  }
);

/* =========================================
   IMAGE INSERT
========================================= */

$("imageInput")?.addEventListener(
  "change",
  (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image.");
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      document.execCommand(
        "insertImage",
        false,
        reader.result
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }
);

/* =========================================
   PASTE IMAGE FROM CLIPBOARD
========================================= */

$("noteEditor")?.addEventListener(
  "paste",
  (event) => {
    const items = [
      ...(event.clipboardData?.items || [])
    ];

    const imageItem = items.find(
      (item) =>
        item.type.startsWith("image/")
    );

    if (!imageItem) return;

    event.preventDefault();

    const file =
      imageItem.getAsFile();

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      document.execCommand(
        "insertImage",
        false,
        reader.result
      );
    };

    reader.readAsDataURL(file);
  }
);

/* =========================================
   SAVE NOTE
========================================= */

$("noteForm")?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!currentUser) {
      toast("Please sign in first.");
      return;
    }

    const id =
      $("noteId").value;

    const payload = {
      user_id: currentUser.id,

      subject:
        $("noteSubject").value,

      topic:
        $("noteTopic").value.trim(),

      learning_date:
        $("noteDate").value,

      details:
        $("noteEditor").innerHTML || "",

      tags:
        $("noteTags")
          .value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),

      reference_url:
        $("noteReference").value.trim() ||
        null,

      is_pinned:
        $("notePinned").checked
    };

    let result;

    if (id) {
      result =
        await supabase
          .from("learning_notes")
          .update(payload)
          .eq("id", id)
          .eq(
            "user_id",
            currentUser.id
          );
    } else {
      result =
        await supabase
          .from("learning_notes")
          .insert(payload);
    }

    if (result.error) {
      toast(result.error.message);
      return;
    }

    $("noteModal")?.classList.add(
      "hidden"
    );

    toast(
      id
        ? "Note updated"
        : "Note saved"
    );

    await loadNotes();
  }
);

/* =========================================
   DELETE NOTE
========================================= */

$("deleteNoteBtn")?.addEventListener(
  "click",
  async () => {
    const id =
      $("noteId").value;

    if (!id || !currentUser) return;

    const confirmed =
      window.confirm(
        "Delete this note permanently?"
      );

    if (!confirmed) return;

    const {
      error
    } =
      await supabase
        .from("learning_notes")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {
      toast(error.message);
      return;
    }

    $("noteModal")?.classList.add(
      "hidden"
    );

    toast("Note deleted");

    await loadNotes();
  }
);

/* =========================================
   SEARCH EVENTS
========================================= */

$("notesSearch")?.addEventListener(
  "input",
  renderNotes
);

$("subjectFilter")?.addEventListener(
  "change",
  renderNotes
);

$("globalSearch")?.addEventListener(
  "input",
  (event) => {
    renderSearch(event.target.value);
  }
);

/* =========================================
   PROFILE SAVE
========================================= */

$("saveProfile")?.addEventListener(
  "click",
  async () => {
    if (!currentUser) return;

    const full_name =
      $("settingsName")
        .value
        .trim();

    const username =
      $("settingsUsername")
        .value
        .trim() || null;

    const {
      error
    } =
      await supabase
        .from("profiles")
        .upsert({
          id: currentUser.id,
          full_name,
          username,
          updated_at:
            new Date().toISOString()
        });

    if (error) {
      toast(error.message);
      return;
    }

    await loadProfile();

    toast("Profile saved");
  }
);

/* =========================================
   SIGN OUT
========================================= */

async function signOut() {
  const {
    error
  } = await supabase.auth.signOut();

  if (error) {
    toast(error.message);
    return;
  }

  window.location.reload();
}

$("signOutBtn")?.addEventListener(
  "click",
  signOut
);

$("settingsSignOut")?.addEventListener(
  "click",
  signOut
);

/* =========================================
   APP BOOT
========================================= */

async function bootApp() {
  const started =
    performance.now();

  let session = null;

  try {
    const {
      data,
      error
    } =
      await supabase.auth.getSession();

    if (error) {
      console.warn(
        "GyaanBikas session check:",
        error
      );
    }

    session =
      data?.session || null;
  } catch (error) {
    console.warn(
      "GyaanBikas auth bootstrap:",
      error
    );
  }

  const elapsed =
    performance.now() - started;

  const minimumSplash = 2800;

  await new Promise((resolve) => {
    setTimeout(
      resolve,
      Math.max(
        0,
        minimumSplash - elapsed
      )
    );
  });

  splash?.classList.add("hide");

  await new Promise((resolve) => {
    setTimeout(resolve, 520);
  });

  await handleSession(session);
}

bootApp();

/* =========================================
   GYAANBIKAS PWA INSTALL
========================================= */

let deferredInstallPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  (event) => {
    event.preventDefault();

    deferredInstallPrompt = event;

    const installButton =
      $("installAppBtn");

    if (installButton) {
      installButton.classList.remove(
        "hidden"
      );
    }
  }
);

document.addEventListener(
  "click",
  async (event) => {
    const installButton =
      event.target.closest(
        "#installAppBtn"
      );

    if (
      !installButton ||
      !deferredInstallPrompt
    ) {
      return;
    }

    deferredInstallPrompt.prompt();

    try {
      const result =
        await deferredInstallPrompt.userChoice;

      console.log(
        "GyaanBikas install result:",
        result.outcome
      );
    } catch (error) {
      console.warn(
        "GyaanBikas install prompt:",
        error
      );
    }

    deferredInstallPrompt = null;

    installButton.classList.add(
      "hidden"
    );
  }
);

window.addEventListener(
  "appinstalled",
  () => {
    console.log(
      "GyaanBikas installed successfully."
    );

    deferredInstallPrompt = null;

    const installButton =
      $("installAppBtn");

    if (installButton) {
      installButton.classList.add(
        "hidden"
      );
    }
  }
);