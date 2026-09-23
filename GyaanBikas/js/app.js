import { supabase } from "./supabase.js?v=20260923-2";

const $ = id => document.getElementById(id);
const splash = $("splash"), authView = $("authView"), appView = $("appView");
let authMode = "login", currentUser = null, notes = [], profile = null;

const subjects = [
  {name:"Machine Learning", icon:"◈", available:true, desc:"Algorithms, models & intuition"},
  {name:"Python", icon:"⌘", available:false, desc:"Coming soon"},
  {name:"Java", icon:"☕", available:false, desc:"Coming soon"},
  {name:"Data Science", icon:"◒", available:false, desc:"Coming soon"},
  {name:"Web Development", icon:"⌁", available:false, desc:"Coming soon"}
];

function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function plain(html=""){const d=document.createElement("div");d.innerHTML=html;return d.textContent||d.innerText||""}
function initials(name="A"){return name.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()||"A"}
function fmtDate(d){if(!d)return "";return new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}

function renderSubjects(){
  $("subjectGrid").innerHTML=subjects.map(s=>`<button class="subject-card ${s.available?"":"soon"}" data-subject="${esc(s.name)}">
    ${s.available?"":'<span class="badge">COMING SOON</span>'}
    <div class="subject-icon">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
  </button>`).join("");
  document.querySelectorAll(".subject-card").forEach(b=>b.onclick=()=>{
    const s=b.dataset.subject;if(s!=="Machine Learning"){toast(`${s} is coming soon.`);return}
    showView("notes");$("subjectFilter").value=s;renderNotes();
  });
}

function noteCard(n){
  const tags=(n.tags||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join("");
  const preview=esc(plain(n.details)).slice(0,220);
  return `<article class="note-card" data-id="${n.id}">
    <div class="note-top"><div><p class="eyebrow">${esc(n.subject)} · ${fmtDate(n.learning_date)}</p><h3>${esc(n.topic)}</h3></div>${n.is_pinned?'<span class="pin">★</span>':''}</div>
    <div class="preview">${preview||"No preview text yet."}</div><div class="note-meta">${tags||'<span class="tag">No tags</span>'}</div>
  </article>`;
}
function empty(title="No notes yet",sub="Start your first learning note."){
 return `<div class="empty"><strong>${title}</strong><span>${sub}</span></div>`;
}
function bindCards(container){container.querySelectorAll(".note-card").forEach(c=>c.onclick=()=>openNote(c.dataset.id))}

function renderRecent(){
  const list=notes.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,6);
  $("recentNotes").innerHTML=list.length?list.map(noteCard).join(""):empty();
  bindCards($("recentNotes"));
}
function filteredNotes(){
  const q=($("notesSearch")?.value||"").toLowerCase().trim(), subject=$("subjectFilter")?.value||"";
  return notes.filter(n=>{
    const hay=[n.subject,n.topic,n.details,(n.tags||[]).join(" "),n.reference_url].join(" ").toLowerCase();
    return (!q||hay.includes(q))&&(!subject||n.subject===subject);
  }).sort((a,b)=>new Date(b.learning_date)-new Date(a.learning_date));
}
function renderNotes(){
  const list=filteredNotes();$("allNotes").innerHTML=list.length?list.map(noteCard).join(""):empty("No matching notes","Try another search or create a new note.");
  bindCards($("allNotes"));
}
function renderSearch(q=""){
  const list=q?notes.filter(n=>[n.subject,n.topic,n.details,(n.tags||[]).join(" ")].join(" ").toLowerCase().includes(q.toLowerCase())).sort((a,b)=>new Date(b.learning_date)-new Date(a.learning_date)):[];
  $("searchResults").innerHTML=list.length?list.map(noteCard).join(""):(q?empty("Nothing found","Try a different topic, tag or phrase."):`<div class="empty"><strong>Search your knowledge</strong><span>Type above to find your notes.</span></div>`);
  bindCards($("searchResults"));
}

async function loadProfile(){
  if(!currentUser)return;
  const {data,error}=await supabase.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
  if(error)console.warn(error);
  profile=data||{full_name:currentUser.user_metadata?.full_name||currentUser.user_metadata?.name||currentUser.email?.split("@")[0]||"Learner"};
  const name=profile.full_name||"Learner";
  $("helloName").textContent=name.split(" ")[0];$("sideName").textContent=name;$("sideEmail").textContent=currentUser.email||"";
  $("sideAvatar").textContent=initials(name);$("topAvatar").textContent=initials(name);
  if(profile.avatar_url){$("sideAvatar").innerHTML=`<img src="${esc(profile.avatar_url)}">`;$("topAvatar").innerHTML=`<img src="${esc(profile.avatar_url)}">`}
  $("settingsName").value=profile.full_name||"";$("settingsUsername").value=profile.username||"";
}
async function loadNotes(){
  const {data,error}=await supabase.from("learning_notes").select("*").eq("user_id",currentUser.id).order("learning_date",{ascending:false});
  if(error){console.error(error);toast("Could not load notes.");notes=[];return}
  notes=data||[];renderRecent();renderNotes();renderSearch("");
}

async function enterApp(){
  authView.classList.add("hidden");appView.classList.remove("hidden");renderSubjects();await loadProfile();await loadNotes();showView("home");
}
async function handleSession(session){
  currentUser=session?.user||null;
  if(currentUser) await enterApp(); else {appView.classList.add("hidden");authView.classList.remove("hidden")}
}
supabase.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>handleSession(session),0)});

function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  $(name+"View").classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===name));
  $("crumb").textContent={home:"Home",notes:"All Notes",search:"Search",settings:"Settings"}[name]||"Home";
  if(name==="notes")renderNotes();
}

document.querySelectorAll(".nav-item").forEach(n=>n.onclick=()=>{showView(n.dataset.view);document.querySelector(".sidebar").classList.remove("open")});
document.querySelectorAll("[data-view]").forEach(n=>{if(!n.classList.contains("nav-item"))n.onclick=()=>showView(n.dataset.view)});
$("mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
$("quickSearchBtn").onclick=()=>showView("search");
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();showView("search");$("globalSearch").focus()}});

function setTheme(t){
  document.body.classList.toggle("dark",t==="dark");localStorage.setItem("gyaanbikas-theme",t);
  document.querySelectorAll(".theme-option").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));
}
setTheme(localStorage.getItem("gyaanbikas-theme")||"light");
$("themeBtn").onclick=()=>setTheme(document.body.classList.contains("dark")?"light":"dark");
document.querySelectorAll(".theme-option").forEach(b=>b.onclick=()=>setTheme(b.dataset.theme));

function setAuthMode(mode){
  authMode=mode;const signup=mode==="signup";
  $("authTitle").textContent=signup?"Create account":"Sign in";$("authSubtitle").textContent=signup?"Create your private learning space.":"Continue your learning journey.";
  $("nameWrap").classList.toggle("hidden",!signup);$("name").required=signup;
  $("submitText").textContent=signup?"Create account":"Sign in";$("switchText").textContent=signup?"Already have an account? Sign in":"Create an account";$("authMessage").textContent="";
}
$("switchBtn").onclick=()=>setAuthMode(authMode==="login"?"signup":"login");
$("togglePassword").onclick=()=>{$("password").type=$("password").type==="password"?"text":"password";$("togglePassword").textContent=$("password").type==="password"?"Show":"Hide"};
function authErrorMessage(error){
  const msg = error?.message || "Authentication failed.";
  if(/invalid api key/i.test(msg)){
    return "Supabase rejected the browser API key. The app is using the Publishable key configured for GyaanBikas. Please hard-refresh this updated build (Ctrl + Shift + R). If it still appears, open F12 → Console and check the first red Supabase error.";
  }
  if(/redirect|redirect_uri/i.test(msg)){
    return "Google redirect is not allowed yet. In Supabase → Authentication → URL Configuration, add http://localhost:3000 and http://localhost:3000/**.";
  }
  return msg;
}

$("googleBtn").onclick=async()=>{
  $("authMessage").textContent="";
  $("googleBtn").disabled=true;
  const redirectTo = new URL("./", window.location.href).href;
  const {error}=await supabase.auth.signInWithOAuth({
    provider:"google",
    options:{
      redirectTo,
      queryParams:{access_type:"offline",prompt:"select_account"}
    }
  });
  $("googleBtn").disabled=false;
  if(error) $("authMessage").textContent=authErrorMessage(error);
};

$("authForm").onsubmit=async e=>{
  e.preventDefault();
  $("authMessage").textContent="";
  $("submitBtn").disabled=true;
  const email=$("email").value.trim(),password=$("password").value,name=$("name").value.trim();
  let result;
  try{
    if(authMode==="signup"){
      result=await supabase.auth.signUp({
        email,password,
        options:{data:{full_name:name},emailRedirectTo:new URL("./",window.location.href).href}
      });
    }else{
      result=await supabase.auth.signInWithPassword({email,password});
    }
  }catch(err){
    result={error:err};
  }
  $("submitBtn").disabled=false;
  if(result.error){
    $("authMessage").textContent=authErrorMessage(result.error);
    return;
  }
  if(authMode==="signup"){
    if(result.data?.session){
      toast("Account created. Welcome to GyaanBikas.");
    }else{
      $("authMessage").textContent="Account created. Check your email to confirm your account, then sign in.";
    }
  }
};

async function openNote(id){
 const n=notes.find(x=>x.id===id);if(!n)return;
 $("modalTitle").textContent="Edit note";$("noteId").value=n.id;$("noteSubject").value=n.subject;$("noteDate").value=n.learning_date;$("noteTopic").value=n.topic;$("noteEditor").innerHTML=n.details||"";$("noteTags").value=(n.tags||[]).join(", ");$("noteReference").value=n.reference_url||"";$("notePinned").checked=!!n.is_pinned;$("deleteNoteBtn").classList.remove("hidden");$("noteModal").classList.remove("hidden");
}
function newNote(){
 $("modalTitle").textContent="New note";$("noteForm").reset();$("noteId").value="";$("noteDate").value=new Date().toISOString().slice(0,10);$("noteSubject").value="Machine Learning";$("noteEditor").innerHTML="";$("deleteNoteBtn").classList.add("hidden");$("noteModal").classList.remove("hidden");
}
$("addNoteBtn").onclick=newNote;$("closeModal").onclick=()=>$("noteModal").classList.add("hidden");$("cancelNote").onclick=()=>$("noteModal").classList.add("hidden");$("modalBackdrop")?.addEventListener("click",()=>$("noteModal").classList.add("hidden"));
$("noteModal").querySelector(".modal-backdrop").onclick=()=>$("noteModal").classList.add("hidden");

document.querySelectorAll(".editor-toolbar button[data-cmd]").forEach(b=>b.onclick=()=>document.execCommand(b.dataset.cmd,false,b.dataset.value||null));
$("codeBtn").onclick=()=>{const s=window.getSelection();if(!s.rangeCount)return;const text=s.toString();if(text){document.execCommand("insertHTML",false,`<pre><code>${esc(text)}</code></pre>`)}else document.execCommand("insertHTML",false,"<pre><code>code here</code></pre>")};
$("linkBtn").onclick=()=>{const url=prompt("Enter URL");if(url)document.execCommand("createLink",false,url)};
$("imageBtn").onclick=()=>$("imageInput").click();
$("imageInput").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>document.execCommand("insertImage",false,r.result);r.readAsDataURL(f);e.target.value=""};
$("noteEditor").addEventListener("paste",e=>{const items=[...(e.clipboardData?.items||[])];const image=items.find(i=>i.type.startsWith("image/"));if(!image)return; e.preventDefault();const f=image.getAsFile();const r=new FileReader();r.onload=()=>document.execCommand("insertImage",false,r.result);r.readAsDataURL(f)});

$("noteForm").onsubmit=async e=>{
 e.preventDefault();if(!currentUser)return;
 const id=$("noteId").value, payload={user_id:currentUser.id,subject:$("noteSubject").value,topic:$("noteTopic").value.trim(),learning_date:$("noteDate").value,details:$("noteEditor").innerHTML||"",tags:$("noteTags").value.split(",").map(x=>x.trim()).filter(Boolean),reference_url:$("noteReference").value.trim()||null,is_pinned:$("notePinned").checked};
 let res=id?await supabase.from("learning_notes").update(payload).eq("id",id).eq("user_id",currentUser.id):await supabase.from("learning_notes").insert(payload);
 if(res.error){toast(res.error.message);return}
 $("noteModal").classList.add("hidden");toast(id?"Note updated":"Note saved");await loadNotes();
};
$("deleteNoteBtn").onclick=async()=>{const id=$("noteId").value;if(!id)return;if(!confirm("Delete this note permanently?"))return;const {error}=await supabase.from("learning_notes").delete().eq("id",id).eq("user_id",currentUser.id);if(error){toast(error.message);return}$("noteModal").classList.add("hidden");toast("Note deleted");await loadNotes()};

$("notesSearch").oninput=renderNotes;$("subjectFilter").onchange=renderNotes;$("globalSearch").oninput=e=>renderSearch(e.target.value);
$("saveProfile").onclick=async()=>{const full_name=$("settingsName").value.trim(),username=$("settingsUsername").value.trim()||null;const {error}=await supabase.from("profiles").upsert({id:currentUser.id,full_name,username,updated_at:new Date().toISOString()});if(error){toast(error.message);return}await loadProfile();toast("Profile saved")};
$("signOutBtn").onclick=async()=>{await supabase.auth.signOut();location.reload()};$("settingsSignOut").onclick=async()=>{await supabase.auth.signOut();location.reload()};

async function bootApp(){
  const started=performance.now();
  let session=null;
  try{
    const {data,error}=await supabase.auth.getSession();
    if(error) console.warn("GyaanBikas session check:",error);
    session=data?.session||null;
  }catch(error){
    console.warn("GyaanBikas auth bootstrap:",error);
  }
  const elapsed=performance.now()-started;
  const minimumSplash=2800;
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,minimumSplash-elapsed)));
  splash.classList.add("hide");
  await new Promise(resolve=>setTimeout(resolve,520));
  await handleSession(session);
}
bootApp();
