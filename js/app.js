const state = {
  listings: [],
  activeCategory: "",
  selectedPlan: "free",
  pendingListing: null,
  photoFiles: [],
  photoPreviewUrls: [],
  session: null,
  myListings: [],
  manageStatus: ""
};

const $ = (id) => document.getElementById(id);

async function init(){
  fillRegions();
  fillCategories();
  fillCategorySelect();
  fillEditSelects();
  fillChips();
  bindEvents();
  await refreshSession();
  await loadListings();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    updateAuthUI();
  });
}

function bindEvents(){
  $("searchInput").addEventListener("input", renderListings);
  $("searchRegion").addEventListener("change", renderListings);
  $("searchBtn").addEventListener("click", renderListings);
  $("exploreBtn").addEventListener("click", goListings);
  $("publishBtn").addEventListener("click", requestPublish);
  $("publishBtn2").addEventListener("click", requestPublish);
  $("authBtn").addEventListener("click", () => openAuth("login"));
  $("userBtn").addEventListener("click", openMyListings);
  $("myListingsBtn").addEventListener("click", openMyListings);
  $("newListingFromManage").addEventListener("click", () => { closeModal("myListingsModal"); requestPublish(); });
  $("editRegion").addEventListener("change", loadEditCommunes);
  $("editListingForm").addEventListener("submit", saveListingEdits);
  $("manageFilters").addEventListener("click", e => { const b=e.target.closest("[data-status]"); if(!b)return; state.manageStatus=b.dataset.status; document.querySelectorAll("#manageFilters .chip").forEach(x=>x.classList.toggle("active",x===b)); renderMyListings(); });
  $("logoutBtn").addEventListener("click", logout);
  $("fRegion").addEventListener("change", loadCommunes);
  $("fPhotos").addEventListener("change", handlePhotos);
  $("publishForm").addEventListener("submit", goToPlanStep);
  $("backToForm").addEventListener("click", () => showPublishStep(1));
  $("finishPublish").addEventListener("click", finishPublishFlow);
  $("loginForm").addEventListener("submit", login);
  $("registerForm").addEventListener("submit", register);

  document.querySelectorAll("[data-auth-tab]").forEach(btn => {
    btn.addEventListener("click", () => switchAuthTab(btn.dataset.authTab));
  });

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  $("plans").addEventListener("click", e => {
    const card = e.target.closest(".plan-card");
    if (!card) return;
    state.selectedPlan = card.dataset.plan;
    document.querySelectorAll(".plan-card").forEach(x => x.classList.remove("selected"));
    card.classList.add("selected");
  });
}

async function refreshSession(){
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.warn("No se pudo leer la sesión", error);
  state.session = data?.session || null;
  updateAuthUI();
}

function updateAuthUI(){
  const user = state.session?.user;
  $("authBtn").hidden = !!user;
  $("userBtn").hidden = !user;
  $("logoutBtn").hidden = !user;
  $("myListingsBtn").hidden = !user;
  if (user) $("userBtn").textContent = user.email || "Mi cuenta";
}

function openAuth(tab="login"){
  clearAuthMessage();
  switchAuthTab(tab);
  openModal("authModal");
}

function switchAuthTab(tab){
  document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.authTab === tab));
  $("authLoginPanel").classList.toggle("active", tab === "login");
  $("authRegisterPanel").classList.toggle("active", tab === "register");
  clearAuthMessage();
}

function setAuthMessage(text, type="ok"){
  const box = $("authMessage");
  box.textContent = text;
  box.className = `auth-message show ${type}`;
}
function clearAuthMessage(){ $("authMessage").className = "auth-message"; $("authMessage").textContent = ""; }

async function register(e){
  e.preventDefault();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  setAuthMessage("Creando cuenta…");
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return setAuthMessage(error.message, "error");
  if (data.session){
    setAuthMessage("Cuenta creada. Ya iniciaste sesión.");
    setTimeout(() => closeModal("authModal"), 700);
  } else {
    setAuthMessage("Cuenta creada. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.");
  }
}

async function login(e){
  e.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  setAuthMessage("Ingresando…");
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return setAuthMessage(error.message, "error");
  setAuthMessage("Sesión iniciada correctamente.");
  setTimeout(() => closeModal("authModal"), 550);
}

async function logout(){
  await supabaseClient.auth.signOut();
}

function requestPublish(){
  if (!state.session?.user){
    openAuth("login");
    setAuthMessage("Para publicar un aviso primero debes ingresar o crear una cuenta.", "error");
    return;
  }
  openPublishModal();
}

async function loadListings(){
  $("listingGrid").innerHTML = `<div class="loading-listings">Cargando publicaciones…</div>`;
  const { data, error } = await supabaseClient
    .from("publicaciones")
    .select("id,created_at,titulo,precio,descripcion,categoria,region,comuna,whatsapp,fotos,plan,estado")
    .eq("estado", "activo")
    .order("created_at", { ascending:false });

  if (error){
    console.error(error);
    state.listings = [];
    $("resultCount").textContent = "No se pudo conectar con la base de datos";
    $("listingGrid").innerHTML = `<div class="empty" style="display:block">No pudimos cargar las publicaciones. Revisa la conexión con Supabase.</div>`;
    return;
  }
  state.listings = (data || []).map(row => ({
    id: row.id,
    createdAt: row.created_at,
    title: row.titulo,
    price: row.precio,
    description: row.descripcion,
    category: row.categoria,
    region: row.region,
    commune: row.comuna,
    phone: row.whatsapp,
    photos: row.fotos || [],
    plan: row.plan || "free",
    status: row.estado
  }));
  renderListings();
}

function fillRegions(){
  const options = Object.keys(GEO).map(r => `<option value="${escapeAttr(r)}">${escapeHtml(r)}</option>`).join("");
  $("searchRegion").innerHTML = `<option value="">Todas las regiones</option>${options}`;
  $("fRegion").innerHTML = `<option value="">Selecciona región</option>${options}`;
  $("fCommune").innerHTML = `<option value="">Selecciona comuna</option>`;
}
function loadCommunes(){
  const region = $("fRegion").value;
  const communes = GEO[region] || [];
  $("fCommune").innerHTML = `<option value="">Selecciona comuna</option>` + communes.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");
}
function fillCategories(){
  $("categories").innerHTML = Object.entries(CATEGORIES).map(([name, icon]) => `<button class="category-card" type="button" data-category="${escapeAttr(name)}"><span class="category-icon">${icon}</span><strong>${escapeHtml(name)}</strong></button>`).join("");
  $("categories").addEventListener("click", e => {
    const card = e.target.closest(".category-card"); if (!card) return;
    state.activeCategory = card.dataset.category; updateChips(); renderListings(); goListings();
  });
}
function fillCategorySelect(){
  $("fCategory").innerHTML = `<option value="">Selecciona categoría</option>` + Object.keys(CATEGORIES).map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");
}
function fillEditSelects(){
  $("editCategory").innerHTML = `<option value="">Selecciona categoría</option>` + Object.keys(CATEGORIES).map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");
  $("editRegion").innerHTML = `<option value="">Selecciona región</option>` + Object.keys(GEO).map(r => `<option value="${escapeAttr(r)}">${escapeHtml(r)}</option>`).join("");
}
function loadEditCommunes(selected=""){
  const region=$("editRegion").value; const communes=GEO[region]||[];
  $("editCommune").innerHTML=`<option value="">Selecciona comuna</option>`+communes.map(c=>`<option value="${escapeAttr(c)}" ${c===selected?"selected":""}>${escapeHtml(c)}</option>`).join("");
}
function fillChips(){
  const items = ["", "Vehículos", "Propiedades", "Tecnología", "Servicios"];
  $("chips").innerHTML = items.map((c,i) => `<button class="chip ${i===0?"active":""}" type="button" data-category="${escapeAttr(c)}">${c || "Todos"}</button>`).join("");
  $("chips").addEventListener("click", e => {
    const chip=e.target.closest(".chip"); if(!chip)return; state.activeCategory=chip.dataset.category; updateChips(); renderListings();
  });
}
function updateChips(){ document.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("active", chip.dataset.category === state.activeCategory)); }
function rank(plan){ return plan === "top" ? 0 : plan === "featured" ? 1 : 2; }
function filteredListings(){
  const q=$("searchInput").value.trim().toLowerCase(); const region=$("searchRegion").value;
  return [...state.listings].filter(x => {
    const haystack=`${x.title} ${x.description} ${x.category} ${x.region} ${x.commune}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!region || x.region===region) && (!state.activeCategory || x.category===state.activeCategory);
  }).sort((a,b)=>rank(a.plan)-rank(b.plan) || new Date(b.createdAt||0)-new Date(a.createdAt||0));
}
function renderListings(){
  const items=filteredListings();
  $("resultCount").textContent=`${items.length} publicaciones encontradas · TOP y destacadas aparecen primero`;
  $("emptyState").style.display=items.length?"none":"block";
  $("listingGrid").innerHTML=items.map(cardTemplate).join("");
  $("listingGrid").querySelectorAll(".listing-card").forEach(card=>card.addEventListener("click",()=>openDetail(Number(card.dataset.id))));
  $("listingGrid").querySelectorAll(".card-wa").forEach(link=>link.addEventListener("click",e=>e.stopPropagation()));
}
function cardTemplate(x){
  const photo=x.photos?.[0]?`<img src="${escapeAttr(x.photos[0])}" alt="${escapeAttr(x.title)}">`:`<span class="placeholder">${CATEGORIES[x.category]||"📦"}</span>`;
  const paidBadge=x.plan==="top"?`<span class="badge plan-badge top">🔥 TOP</span>`:x.plan==="featured"?`<span class="badge plan-badge featured">⭐ DESTACADO</span>`:"";
  const msg=encodeURIComponent(`Hola, vi tu publicación "${x.title}" en VentaLocal.cl. ¿Sigue disponible?`); const phone=String(x.phone||"").replace(/\D/g,"");
  return `<article class="listing-card ${escapeAttr(x.plan)}" data-id="${x.id}"><div class="listing-photo">${photo}<span class="badge">${escapeHtml(x.category)}</span>${paidBadge}</div><div class="listing-body"><div class="price">$${Number(x.price).toLocaleString("es-CL")}</div><div class="title">${escapeHtml(x.title)}</div><div class="meta">📍 ${escapeHtml(x.region)} · ${escapeHtml(x.commune)}</div><div class="desc">${escapeHtml(x.description)}</div><a class="card-wa" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${msg}">Contactar por WhatsApp</a></div></article>`;
}

function openPublishModal(){ resetPublishFlow(); openModal("publishModal"); }
function resetPublishFlow(){
  $("publishForm").reset(); $("fCommune").innerHTML=`<option value="">Selecciona comuna</option>`; $("photoPreview").innerHTML="";
  state.photoFiles=[]; state.photoPreviewUrls.forEach(URL.revokeObjectURL); state.photoPreviewUrls=[]; state.pendingListing=null; state.selectedPlan="free";
  document.querySelectorAll(".plan-card").forEach(x=>x.classList.remove("selected")); document.querySelector('.plan-card[data-plan="free"]').classList.add("selected"); showPublishStep(1);
}
function showPublishStep(n){ [1,2,3].forEach(i=>$("publishStep"+i).classList.toggle("active",i===n)); }
function handlePhotos(){
  state.photoPreviewUrls.forEach(URL.revokeObjectURL); state.photoPreviewUrls=[];
  const files=[...$("fPhotos").files].filter(f=>["image/jpeg","image/png","image/webp"].includes(f.type) && f.size<=5*1024*1024).slice(0,8);
  state.photoFiles=files; $("photoPreview").innerHTML="";
  files.forEach(file=>{ const url=URL.createObjectURL(file); state.photoPreviewUrls.push(url); const item=document.createElement("div"); item.className="preview-item"; item.innerHTML=`<img src="${url}" alt="Vista previa">`; $("photoPreview").appendChild(item); });
}
function goToPlanStep(e){
  e.preventDefault();
  state.pendingListing={category:$("fCategory").value,price:Number($("fPrice").value),region:$("fRegion").value,commune:$("fCommune").value,title:$("fTitle").value.trim(),description:$("fDescription").value.trim(),phone:$("fPhone").value.trim(),plan:"free"};
  showPublishStep(2);
}
function finishPublishFlow(){
  if(!state.pendingListing)return; state.pendingListing.plan=state.selectedPlan;
  if(state.selectedPlan==="free"){ savePendingListing(); return; }
  const label=state.selectedPlan==="top"?"TOP":"Destacada"; const amount=state.selectedPlan==="top"?"$5.990":"$2.990";
  showPublishStep(3); $("publishResult").innerHTML=`<div class="result-icon">💳</div><h3>Simulación de pago</h3><p>Elegiste publicación <strong>${label}</strong> por <strong>${amount}</strong>.</p><p class="muted">En la versión comercial aquí conectaremos el medio de pago real.</p><button class="btn btn-primary" id="simulatePaymentBtn" type="button">Simular pago exitoso</button>`;
  $("simulatePaymentBtn").addEventListener("click",savePendingListing);
}

async function uploadPhotos(userId){
  const urls=[];
  for(let i=0;i<state.photoFiles.length;i++){
    const file=state.photoFiles[i];
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path=`${userId}/${Date.now()}-${i}-${crypto.randomUUID()}.${ext}`;
    const { error }=await supabaseClient.storage.from("fotos-publicaciones").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
    if(error) throw error;
    const { data }=supabaseClient.storage.from("fotos-publicaciones").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function savePendingListing(){
  if(!state.session?.user){ openAuth("login"); return; }
  showPublishStep(3);
  $("publishResult").innerHTML=`<div class="result-icon">⏳</div><h3>Publicando aviso…</h3><p class="muted">Estamos subiendo tus fotos y guardando la publicación.</p>`;
  try{
    const photos=await uploadPhotos(state.session.user.id);
    const p=state.pendingListing;
    const { error }=await supabaseClient.from("publicaciones").insert({
      titulo:p.title, precio:p.price, descripcion:p.description, categoria:p.category, region:p.region, comuna:p.commune,
      whatsapp:p.phone, fotos:photos, plan:p.plan, estado:"activo", user_id:state.session.user.id
    });
    if(error) throw error;
    await loadListings();
    $("publishResult").innerHTML=`<div class="result-icon">✅</div><h3>¡Publicación creada!</h3><p>El aviso ya está guardado en Supabase y puede verse desde otros dispositivos.</p><button class="btn btn-primary" id="viewListingBtn" type="button">Ver publicaciones</button>`;
    $("viewListingBtn").addEventListener("click",()=>{ closeModal("publishModal"); goListings(); });
  }catch(err){
    console.error(err);
    $("publishResult").innerHTML=`<div class="result-icon">⚠️</div><h3>No pudimos publicar</h3><p class="muted">${escapeHtml(err.message||"Ocurrió un error al guardar el aviso.")}</p><button class="btn btn-light" id="retryPublishBtn" type="button">Volver</button>`;
    $("retryPublishBtn").addEventListener("click",()=>showPublishStep(2));
  }
}


async function openMyListings(){
  if(!state.session?.user){ openAuth("login"); return; }
  state.manageStatus="";
  document.querySelectorAll("#manageFilters .chip").forEach((x,i)=>x.classList.toggle("active",i===0));
  openModal("myListingsModal");
  await loadMyListings();
}

async function loadMyListings(){
  $("myListingsContent").innerHTML=`<div class="manage-loading">Cargando tus publicaciones…</div>`;
  const { data,error }=await supabaseClient.from("publicaciones")
    .select("id,created_at,titulo,precio,descripcion,categoria,region,comuna,whatsapp,fotos,plan,estado,user_id")
    .eq("user_id",state.session.user.id)
    .neq("estado","eliminado")
    .order("created_at",{ascending:false});
  if(error){ console.error(error); $("myListingsContent").innerHTML=`<div class="manage-empty">No pudimos cargar tus publicaciones.<br>${escapeHtml(error.message)}</div>`; return; }
  state.myListings=(data||[]).map(row=>({id:row.id,createdAt:row.created_at,title:row.titulo,price:row.precio,description:row.descripcion,category:row.categoria,region:row.region,commune:row.comuna,phone:row.whatsapp,photos:row.fotos||[],plan:row.plan||"free",status:row.estado,userId:row.user_id}));
  renderMyListings();
}

function renderMyListings(){
  const items=state.myListings.filter(x=>!state.manageStatus||x.status===state.manageStatus);
  if(!items.length){ $("myListingsContent").innerHTML=`<div class="manage-empty">No tienes publicaciones${state.manageStatus?` con estado “${escapeHtml(state.manageStatus)}”`:" todavía"}.</div>`; return; }
  $("myListingsContent").innerHTML=items.map(x=>{
    const photo=x.photos?.[0]?`<img src="${escapeAttr(x.photos[0])}" alt="${escapeAttr(x.title)}">`:`${CATEGORIES[x.category]||"📦"}`;
    const pauseLabel=x.status==="pausado"?"Reactivar":"Pausar";
    return `<article class="manage-item" data-manage-id="${x.id}">
      <div class="manage-photo">${photo}</div>
      <div class="manage-info"><span class="status-pill ${escapeAttr(x.status)}">${escapeHtml(x.status)}</span><h4>${escapeHtml(x.title)}</h4><div class="manage-price">$${Number(x.price).toLocaleString("es-CL")}</div><div class="manage-meta">📍 ${escapeHtml(x.region)} · ${escapeHtml(x.commune)}</div></div>
      <div class="manage-actions">
        <button class="btn btn-light" data-action="edit" type="button">Editar</button>
        <button class="btn btn-light" data-action="pause" type="button">${pauseLabel}</button>
        <button class="btn btn-light" data-action="sold" type="button">Vendido</button>
        <button class="btn btn-danger" data-action="delete" type="button">Eliminar</button>
      </div></article>`;
  }).join("");
  $("myListingsContent").querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>handleManageAction(Number(btn.closest("[data-manage-id]").dataset.manageId),btn.dataset.action)));
}

async function handleManageAction(id,action){
  const item=state.myListings.find(x=>x.id===id); if(!item)return;
  if(action==="edit"){ openEditListing(item); return; }
  let next;
  if(action==="pause") next=item.status==="pausado"?"activo":"pausado";
  if(action==="sold") next="vendido";
  if(action==="delete"){
    if(!confirm(`¿Eliminar “${item.title}”? Dejará de aparecer en VentaLocal.`)) return;
    next="eliminado";
  }
  const {error}=await supabaseClient.from("publicaciones").update({estado:next}).eq("id",id).eq("user_id",state.session.user.id);
  if(error){ alert("No pudimos actualizar la publicación: "+error.message); return; }
  await Promise.all([loadMyListings(),loadListings()]);
}

function openEditListing(item){
  $("editId").value=item.id; $("editTitle").value=item.title; $("editPrice").value=item.price; $("editDescription").value=item.description; $("editPhone").value=item.phone;
  $("editCategory").value=item.category; $("editRegion").value=item.region; loadEditCommunes(item.commune);
  $("editMessage").className="auth-message"; $("editMessage").textContent="";
  openModal("editListingModal");
}

async function saveListingEdits(e){
  e.preventDefault();
  const id=Number($("editId").value);
  const payload={titulo:$("editTitle").value.trim(),precio:Number($("editPrice").value),descripcion:$("editDescription").value.trim(),categoria:$("editCategory").value,region:$("editRegion").value,comuna:$("editCommune").value,whatsapp:$("editPhone").value.trim()};
  const box=$("editMessage"); box.className="auth-message show ok"; box.textContent="Guardando cambios…";
  const {error}=await supabaseClient.from("publicaciones").update(payload).eq("id",id).eq("user_id",state.session.user.id);
  if(error){ box.className="auth-message show error"; box.textContent=error.message; return; }
  box.className="auth-message show ok"; box.textContent="Cambios guardados correctamente.";
  await Promise.all([loadMyListings(),loadListings()]);
  setTimeout(()=>closeModal("editListingModal"),600);
}

function openDetail(id){
  const x=state.listings.find(item=>item.id===id); if(!x)return;
  $("detailTitle").textContent=x.title; $("detailPrice").textContent="$"+Number(x.price).toLocaleString("es-CL"); $("detailLocation").textContent=`📍 ${x.region} · ${x.commune}`; $("detailDescription").textContent=x.description;
  $("detailBadge").innerHTML=x.plan==="top"?`<span class="detail-pill top">🔥 PUBLICACIÓN TOP</span>`:x.plan==="featured"?`<span class="detail-pill featured">⭐ PUBLICACIÓN DESTACADA</span>`:`<span class="detail-pill">Publicación estándar</span>`;
  const photos=x.photos||[];
  if(photos.length){ setDetailMainPhoto(photos[0]); $("detailThumbs").innerHTML=photos.map((src,i)=>`<button class="thumb ${i===0?"active":""}" type="button" data-index="${i}"><img src="${escapeAttr(src)}" alt="Foto ${i+1}"></button>`).join(""); $("detailThumbs").querySelectorAll(".thumb").forEach(btn=>btn.addEventListener("click",()=>{ setDetailMainPhoto(photos[Number(btn.dataset.index)]); $("detailThumbs").querySelectorAll(".thumb").forEach(x=>x.classList.remove("active")); btn.classList.add("active"); })); }
  else { $("detailMain").innerHTML=`<span class="placeholder">${CATEGORIES[x.category]||"📦"}</span>`; $("detailThumbs").innerHTML=""; }
  const msg=encodeURIComponent(`Hola, vi tu publicación "${x.title}" en VentaLocal.cl. ¿Sigue disponible?`); const phone=String(x.phone||"").replace(/\D/g,""); $("detailWhatsApp").href=`https://wa.me/${phone}?text=${msg}`; openModal("detailModal");
}
function setDetailMainPhoto(src){ $("detailMain").innerHTML=`<img src="${escapeAttr(src)}" alt="Foto principal">`; }
function openModal(id){ $(id).classList.add("open"); $(id).setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; }
function closeModal(id){ $(id).classList.remove("open"); $(id).setAttribute("aria-hidden","true"); if(!document.querySelector(".modal.open"))document.body.style.overflow=""; }
function goListings(){ $("listingsSection").scrollIntoView({behavior:"smooth"}); }
function escapeHtml(value){ return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function escapeAttr(value){ return escapeHtml(value); }

document.addEventListener("DOMContentLoaded",init);


// ===== Password recovery =====
function openRecoveryRequest() {
  const modal = document.getElementById('recoveryModal');
  const req = document.getElementById('recoveryRequestView');
  const reset = document.getElementById('recoveryResetView');
  if (!modal) return;
  if (req) req.style.display = 'block';
  if (reset) reset.style.display = 'none';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.remove('open');
    authModal.setAttribute('aria-hidden', 'true');
  }
}

function openRecoveryReset() {
  const modal = document.getElementById('recoveryModal');
  const req = document.getElementById('recoveryRequestView');
  const reset = document.getElementById('recoveryResetView');
  if (!modal) return;
  if (req) req.style.display = 'none';
  if (reset) reset.style.display = 'block';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

async function sendPasswordRecovery() {
  const email = (document.getElementById('recoveryEmail')?.value || '').trim();
  const box = document.getElementById('recoveryMessage');
  if (!email) {
    if (box) {
      box.style.display = 'block';
      box.textContent = 'Ingresa tu correo.';
    }
    return;
  }

  const redirectTo = 'https://franciscoau.github.io/ventalocal/';
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });

  if (box) {
    box.style.display = 'block';
    if (error) {
      box.textContent = 'No se pudo enviar el enlace: ' + error.message;
    } else {
      box.textContent = 'Listo. Revisa tu correo y abre el enlace para crear una nueva contraseña.';
    }
  }
}

async function saveNewPassword() {
  const p1 = document.getElementById('newPassword')?.value || '';
  const p2 = document.getElementById('newPasswordConfirm')?.value || '';
  const box = document.getElementById('resetMessage');

  if (p1.length < 6) {
    if (box) {
      box.style.display = 'block';
      box.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return;
  }
  if (p1 !== p2) {
    if (box) {
      box.style.display = 'block';
      box.textContent = 'Las contraseñas no coinciden.';
    }
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password: p1 });
  if (box) {
    box.style.display = 'block';
    box.textContent = error ? ('No se pudo cambiar la contraseña: ' + error.message) : 'Contraseña actualizada correctamente. Ya puedes seguir usando VentaLocal.';
  }

  if (!error) {
    setTimeout(() => {
      document.getElementById('recoveryModal')?.classList.remove('open');
      document.getElementById('recoveryModal')?.setAttribute('aria-hidden', 'true');
    }, 1400);
  }
}

function wirePasswordRecovery() {
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', openRecoveryRequest);
  document.getElementById('sendRecoveryBtn')?.addEventListener('click', sendPasswordRecovery);
  document.getElementById('saveNewPasswordBtn')?.addEventListener('click', saveNewPassword);

  // Supabase emits PASSWORD_RECOVERY after opening the recovery link.
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      openRecoveryReset();
    }
  });

  // Fallback for hash-based recovery links.
  if (window.location.hash && window.location.hash.includes('type=recovery')) {
    openRecoveryReset();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wirePasswordRecovery);
} else {
  wirePasswordRecovery();
}
