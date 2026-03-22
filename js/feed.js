// ============================================
// FEED.JS — Posts, Likes, Comments
// Upload images → bucket "posts" via storage.js
// ============================================

let currentUser    = null;
let currentProfile = null;
let postsOffset    = 0;
const POSTS_PER_PAGE = 10;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  currentProfile = await getCurrentProfile();
  initUserUI();
  await loadFeed();
  initCreatePost();
  initSidebar();
  await loadEvents();
  await loadTrending();
});

function initUserUI() {
  if (!currentProfile) return;
  const avatarUrl = currentProfile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile.display_name || currentProfile.username)}&background=007847&color=fff&bold=true`;

  document.querySelectorAll('.my-avatar').forEach(el    => { el.src         = avatarUrl; });
  document.querySelectorAll('.my-name').forEach(el      => { el.textContent = currentProfile.display_name || currentProfile.username; });
  document.querySelectorAll('.my-username').forEach(el  => { el.textContent = '@' + currentProfile.username; });
  document.querySelectorAll('.my-posts').forEach(el     => { el.textContent = currentProfile.posts_count     || 0; });
  document.querySelectorAll('.my-followers').forEach(el => { el.textContent = currentProfile.followers_count || 0; });
  document.querySelectorAll('.my-following').forEach(el => { el.textContent = currentProfile.following_count || 0; });
}

async function loadFeed(append = false) {
  const container = document.getElementById('feed-posts');
  const loadBtn   = document.getElementById('load-more-btn');

  if (!append) { container.innerHTML = '<div class="loading-spinner"></div>'; postsOffset = 0; }

  const { data: posts, error } = await _supabase
    .from('posts')
    .select('*, profiles:user_id (id, username, display_name, avatar_url), likes!left (user_id)')
    .order('created_at', { ascending: false })
    .range(postsOffset, postsOffset + POSTS_PER_PAGE - 1);

  if (error) { container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>${error.message}</p></div>`; return; }
  if (!append) container.innerHTML = '';

  if (posts.length === 0 && !append) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎵</div><div class="empty-state-title">Aucune publication / No posts yet</div><div class="empty-state-text">Soyez le premier à publier ! / Be the first to post!</div></div>`;
    return;
  }

  posts.forEach(post => {
    const isLiked = post.likes?.some(l => l.user_id === currentUser?.id);
    container.insertAdjacentHTML('beforeend', renderPost(post, isLiked));
  });

  postsOffset += posts.length;
  if (loadBtn) loadBtn.classList.toggle('hidden', posts.length < POSTS_PER_PAGE);
  attachPostEvents();
}

function renderPost(post, isLiked) {
  const profile   = post.profiles;
  const avatarUrl = profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || profile?.username || '?')}&background=007847&color=fff&bold=true`;

  let mediaHtml = '';
  if (post.image_url) {
    mediaHtml = `<div class="post-media"><img src="${post.image_url}" alt="Post image" loading="lazy"></div>`;
  } else if (post.video_url) {
    const ytMatch = post.video_url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/);
    mediaHtml = ytMatch
      ? `<div class="post-media"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe></div>`
      : `<div class="post-media"><video src="${post.video_url}" controls></video></div>`;
  }

  let linkHtml = '';
  if (post.link_url && !post.image_url && !post.video_url) {
    linkHtml = `<a href="${post.link_url}" target="_blank" rel="noopener noreferrer" class="post-link-preview">${post.link_image ? `<img src="${post.link_image}" alt="">` : ''}<div class="post-link-info"><div class="post-link-title">${post.link_title || post.link_url}</div>${post.link_description ? `<div class="post-link-desc">${post.link_description}</div>` : ''}</div></a>`;
  }

  return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <img class="post-avatar" src="${avatarUrl}" alt="${profile?.display_name || 'User'}">
        <div class="post-meta">
          <a href="profile.html?id=${profile?.id || ''}" class="post-author">${profile?.display_name || profile?.username || 'Utilisateur'}</a>
          <div class="post-time">${formatDate(post.created_at)}</div>
        </div>
        ${currentUser && post.user_id === currentUser.id ? `
          <div class="dropdown">
            <div class="post-more" data-dropdown="post-menu-${post.id}"><i class="fas fa-ellipsis-h"></i></div>
            <div class="dropdown-menu" id="post-menu-${post.id}">
              <button class="dropdown-item danger" data-delete-post="${post.id}"><i class="fas fa-trash"></i> Supprimer / Delete</button>
            </div>
          </div>` : `<div class="post-more"><i class="fas fa-ellipsis-h"></i></div>`}
      </div>
      <div class="post-body">
        <p class="post-text">${linkifyText(post.content || '')}</p>
        ${mediaHtml}${linkHtml}
      </div>
      <div class="post-footer">
        <button class="post-action like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
          <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
          <span class="like-count">${post.likes_count || 0}</span>
        </button>
        <button class="post-action comment-toggle-btn" data-post-id="${post.id}">
          <i class="far fa-comment"></i><span>${post.comments_count || 0}</span>
        </button>
        <button class="post-action share-btn" data-post-id="${post.id}">
          <i class="fas fa-share"></i><span>Partager / Share</span>
        </button>
      </div>
      <div class="comments-section" id="comments-${post.id}">
        <div class="comments-list" id="comments-list-${post.id}"></div>
        <div class="comment-input-row">
          <img class="comment-avatar" src="${document.querySelector('.my-avatar')?.src || 'https://ui-avatars.com/api/?name=U&background=007847&color=fff'}" alt="You">
          <input class="comment-input" type="text" placeholder="Écrire un commentaire… / Write a comment…" data-post-id="${post.id}">
          <button class="comment-submit" data-post-id="${post.id}"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </article>`;
}

function linkifyText(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/#(\w+)/g, '<a href="search.html?q=%23$1">#$1</a>')
    .replace(/@(\w+)/g, '<a href="profile.html?user=$1">@$1</a>');
}

function attachPostEvents() {
  document.querySelectorAll('.like-btn:not([data-bound])').forEach(btn => {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => toggleLike(btn));
  });
  document.querySelectorAll('.comment-toggle-btn:not([data-bound])').forEach(btn => {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const section = document.getElementById(`comments-${btn.dataset.postId}`);
      if (section) { const open = section.classList.toggle('open'); if (open) loadComments(btn.dataset.postId); }
    });
  });
  document.querySelectorAll('.comment-input:not([data-bound])').forEach(input => {
    input.dataset.bound = '1';
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(input.dataset.postId, input); });
  });
  document.querySelectorAll('.comment-submit:not([data-bound])').forEach(btn => {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => { const input = document.querySelector(`.comment-input[data-post-id="${btn.dataset.postId}"]`); if (input) submitComment(btn.dataset.postId, input); });
  });
  document.querySelectorAll(share-btn:not([data-bound])').forEach(btn => {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const postId   = btn.dataset.postId;
      const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      const author   = postCard?.querySelector('.post-author')?.textContent?.trim() || 'BéninMusic';
      const textEl   = postCard?.querySelector('.post-text');
      const postText = textEl ? textEl.textContent.trim().substring(0, 120) : '';
      const url      = `${window.location.origin}${window.location.pathname.replace(/feed\.html.*/,'feed.html')}#post-${postId}`;
      const title    = `${author} sur BéninMusic`;
      openSharePanel(url, title, postText, postId);
    });
  });
  document.querySelectorAll('[data-delete-post]:not([data-bound])').forEach(btn => {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => deletePost(btn.dataset.deletePost));
  });
  document.querySelectorAll('.post-more:not([data-bound])').forEach(btn => {
    btn.dataset.bound = '1';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (btn.dataset.dropdown) {
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
        document.getElementById(btn.dataset.dropdown)?.classList.toggle('open');
      }
    });
  });
}

async function toggleLike(btn) {
  const postId  = btn.dataset.postId;
  const isLiked = btn.classList.contains('liked');
  const countEl = btn.querySelector('.like-count');
  btn.classList.toggle('liked');
  btn.querySelector('i').className = isLiked ? 'far fa-heart' : 'fas fa-heart';
  if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + (isLiked ? -1 : 1);
  if (isLiked) { await _supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id); }
  else         { await _supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id }); }
}

async function loadComments(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  if (!list || list.dataset.loaded) return;
  list.dataset.loaded = '1';
  list.innerHTML = '<div class="loading-spinner" style="width:24px;height:24px;margin:1rem auto;border-width:2px;"></div>';

  const { data: comments } = await _supabase
    .from('comments').select('*, profiles:user_id (username, display_name, avatar_url)')
    .eq('post_id', postId).order('created_at', { ascending: true });

  list.innerHTML = '';
  if (!comments?.length) { list.innerHTML = '<p style="font-size:0.82rem;color:var(--gray-3);margin-bottom:0.8rem;">Aucun commentaire / No comments yet</p>'; return; }

  comments.forEach(c => {
    const profile = c.profiles;
    const avatar  = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || '?')}&background=007847&color=fff&bold=true&size=34`;
    list.insertAdjacentHTML('beforeend', `
      <div class="comment-item">
        <img class="comment-avatar" src="${avatar}" alt="">
        <div class="comment-body">
          <div class="comment-author">${profile?.display_name || profile?.username || 'Utilisateur'}</div>
          <div class="comment-text">${String(c.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          <div class="comment-time">${formatDate(c.created_at)}</div>
        </div>
      </div>`);
  });
}

async function submitComment(postId, inputEl) {
  const content = inputEl.value.trim();
  if (!content) return;
  inputEl.value = ''; inputEl.disabled = true;
  const { error } = await _supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, content });
  inputEl.disabled = false;
  if (error) { showToast(error.message, 'error'); return; }
  const list = document.getElementById(`comments-list-${postId}`);
  if (list) delete list.dataset.loaded;
  await loadComments(postId);
  const counter = document.querySelector(`[data-post-id="${postId}"] .comment-toggle-btn span`);
  if (counter) counter.textContent = (parseInt(counter.textContent) || 0) + 1;
}

async function deletePost(postId) {
  if (!confirm('Supprimer cette publication ? / Delete this post?')) return;
  const { error } = await _supabase.from('posts').delete().eq('id', postId);
  if (error) { showToast(error.message, 'error'); return; }
  document.querySelector(`.post-card[data-post-id="${postId}"]`)?.remove();
  showToast('Publication supprimée / Post deleted');
}

// ============================================
// CREATE POST — Upload via storage.js (bucket "posts")
// ============================================
function initCreatePost() {
  const textarea        = document.getElementById('post-content');
  const submitBtn       = document.getElementById('post-submit');
  const imageBtn        = document.getElementById('attach-image');
  const videoBtn        = document.getElementById('attach-video');
  const linkBtn         = document.getElementById('attach-link');
  const imageInput      = document.getElementById('image-file-input');
  const mediaPreview    = document.getElementById('media-preview');
  const mediaPreviewImg = document.getElementById('media-preview-img');
  const mediaPreviewVid = document.getElementById('media-preview-vid');
  const mediaClose      = document.getElementById('media-preview-close');
  const linkPreview     = document.getElementById('link-preview');

  if (!textarea || !submitBtn) return;

  let uploadedMediaUrl = null, uploadedMediaType = null, linkUrl = null;

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  });

  // Photo → bucket "posts" via uploadPostImage() de storage.js
  imageBtn?.addEventListener('click', () => imageInput?.click());

  imageInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    imageBtn.classList.add('active');
    imageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload…';

    const publicUrl = await uploadPostImage(file, currentUser.id);

    imageBtn.classList.remove('active');
    imageBtn.innerHTML = '<i class="fas fa-image" style="color:#007847;"></i> <span>Photo</span>';

    if (!publicUrl) { imageInput.value = ''; return; }

    uploadedMediaUrl = publicUrl; uploadedMediaType = 'image';
    if (mediaPreview && mediaPreviewImg) {
      mediaPreviewImg.src = publicUrl;
      mediaPreviewImg.classList.remove('hidden');
      mediaPreviewVid?.classList.add('hidden');
      mediaPreview.classList.add('show');
    }
  });

  // ── Vidéo → vrai upload vers bucket "videos" ──
  const videoInput = document.getElementById('video-file-input');

  videoBtn?.addEventListener('click', () => videoInput?.click());

  videoInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    videoBtn.classList.add('active');
    videoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload…';

    // uploadPostVideo() de storage.js — max 50 MB
    const publicUrl = await uploadPostVideo(file, currentUser.id);

    videoBtn.classList.remove('active');
    videoBtn.innerHTML = '<i class="fab fa-youtube" style="color:#CE1126;"></i> <span>Vidéo</span>';

    if (!publicUrl) { videoInput.value = ''; return; }

    uploadedMediaUrl  = publicUrl;
    uploadedMediaType = 'video';

    if (mediaPreview && mediaPreviewVid) {
      mediaPreviewVid.src = publicUrl;
      mediaPreviewVid.classList.remove('hidden');
      mediaPreviewImg?.classList.add('hidden');
      mediaPreview.querySelector('iframe')?.remove();
      mediaPreview.classList.add('show');
    }
  });

  linkBtn?.addEventListener('click', () => {
    const url = prompt('URL du lien / Link URL:');
    if (!url) return;
    linkUrl = url; linkBtn.classList.add('active');
    if (linkPreview) { linkPreview.innerHTML = `<div class="link-preview-info"><div class="link-preview-title">${url}</div><div class="link-preview-desc">Lien ajouté / Link added</div></div>`; linkPreview.classList.add('show'); }
  });

  mediaClose?.addEventListener('click', () => {
    uploadedMediaUrl = null; uploadedMediaType = null;
    mediaPreview?.classList.remove('show');
    if (mediaPreviewImg) { mediaPreviewImg.src = ''; mediaPreviewImg.classList.add('hidden'); }
    if (mediaPreviewVid) { mediaPreviewVid.src = ''; mediaPreviewVid.classList.add('hidden'); }
    mediaPreview?.querySelector('iframe')?.remove();
    imageBtn?.classList.remove('active'); videoBtn?.classList.remove('active');
    if (imageInput) imageInput.value = '';
    if (videoInput) videoInput.value = '';
  });

  submitBtn.addEventListener('click', async () => {
    const content = textarea.value.trim();
    if (!content && !uploadedMediaUrl && !linkUrl) { showToast('Écris quelque chose ! / Write something!', 'info'); return; }

    submitBtn.disabled = true; submitBtn.textContent = 'Publication…';

    const postData = { user_id: currentUser.id, content: content || '' };
    if (uploadedMediaType === 'image') postData.image_url = uploadedMediaUrl;
    if (uploadedMediaType === 'video') postData.video_url = uploadedMediaUrl;
    if (linkUrl) postData.link_url = linkUrl;

    const { data, error } = await _supabase.from('posts')
      .insert(postData)
      .select('*, profiles:user_id (id, username, display_name, avatar_url), likes!left (user_id)')
      .single();

    submitBtn.disabled = false; submitBtn.textContent = 'Publier / Post';
    if (error) { showToast(error.message, 'error'); return; }

    textarea.value = ''; textarea.style.height = 'auto';
    uploadedMediaUrl = null; uploadedMediaType = null; linkUrl = null;
    mediaPreview?.classList.remove('show'); linkPreview?.classList.remove('show');
    [imageBtn, videoBtn, linkBtn].forEach(b => b?.classList.remove('active'));
    if (imageInput) imageInput.value = '';
    if (videoInput) videoInput.value = '';

    const container = document.getElementById('feed-posts');
    container.querySelector('.empty-state')?.remove();
    container.insertAdjacentHTML('afterbegin', renderPost(data, false));
    attachPostEvents();
    showToast('Publié ! / Posted! 🎵');
    document.querySelectorAll('.my-posts').forEach(el => { el.textContent = (parseInt(el.textContent) || 0) + 1; });
  });
}

document.getElementById('load-more-btn')?.addEventListener('click', () => loadFeed(true));

async function loadEvents() {
  const container = document.getElementById('widget-events');
  if (!container) return;
  const { data: events } = await _supabase.from('events').select('*')
    .gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(3);

  if (!events?.length) { container.innerHTML = '<p style="font-size:0.82rem;color:var(--gray-3);">Aucun événement à venir / No upcoming events</p>'; return; }
  container.innerHTML = events.map(ev => {
    const d = new Date(ev.event_date);
    return `<a href="events.html" class="event-widget-item"><div class="event-date-box"><span class="event-date-day">${d.getDate()}</span><span class="event-date-month">${d.toLocaleString('fr',{month:'short'})}</span></div><div class="event-widget-info"><div class="event-widget-title">${ev.title}</div><div class="event-widget-location"><i class="fas fa-map-marker-alt" style="font-size:0.7rem;color:var(--green)"></i> ${ev.city||ev.location||'Bénin'}</div></div></a>`;
  }).join('');
}

async function loadTrending() {
  const container = document.getElementById('widget-trending');
  if (!container) return;
  const { data: posts } = await _supabase.from('posts').select('content').order('created_at',{ascending:false}).limit(50);
  const tagMap = {};
  posts?.forEach(p => { (p.content?.match(/#(\w+)/g)||[]).forEach(t => { tagMap[t]=(tagMap[t]||0)+1; }); });
  const sorted = Object.entries(tagMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (!sorted.length) { container.innerHTML = '<p style="font-size:0.82rem;color:var(--gray-3);">#BéninMusic #Afrobeats #Cotonou</p>'; return; }
  container.innerHTML = sorted.map(([tag,count],i) => `<a href="search.html?q=${encodeURIComponent(tag)}" class="trending-item"><span class="trending-num">${i+1}</span><div class="trending-info"><div class="trending-tag">${tag}</div><div class="trending-count">${count} publication${count>1?'s':''}</div></div></a>`).join('');
}

// ============================================
// SHARE PANEL — Partage style réseaux sociaux
// ============================================
function openSharePanel(url, title, summary, postId) {
  // Supprime un panel existant
  document.getElementById('bm-share-panel')?.remove();
  document.getElementById('bm-share-overlay')?.remove();

  var overlay = document.createElement('div');
  overlay.id = 'bm-share-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;backdrop-filter:blur(4px);animation:fadeIn 0.2s;';

  var encoded = encodeURIComponent(url);
  var encodedTitle = encodeURIComponent(title + ' — ' + summary);

  var panel = document.createElement('div');
  panel.id = 'bm-share-panel';
  panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fff;border-radius:20px 20px 0 0;padding:1.5rem;z-index:9001;box-shadow:0 -8px 40px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;max-width:520px;margin:0 auto;';

  panel.innerHTML =
    '<div style="width:40px;height:4px;background:#e0e0e0;border-radius:999px;margin:0 auto 1.2rem;"></div>' +
    '<h3 style="font-family:Syne,sans-serif;font-weight:700;font-size:1rem;margin-bottom:0.3rem;">Partager cette publication</h3>' +
    '<p style="font-size:0.8rem;color:#999;margin-bottom:1.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + title + '</p>' +

    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;">' +

      // Facebook
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encoded + '" target="_blank" rel="noopener" style="text-decoration:none;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:16px;background:#1877F2;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;transition:opacity 0.2s;">' +
          '<i class="fab fa-facebook-f" style="color:#fff;font-size:1.3rem;"></i>' +
        '</div>' +
        '<span style="font-size:0.72rem;color:#555;font-family:Figtree,sans-serif;">Facebook</span>' +
      '</a>' +

      // WhatsApp
      '<a href="https://wa.me/?text=' + encodeURIComponent(title + '
' + url) + '" target="_blank" rel="noopener" style="text-decoration:none;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:16px;background:#25D366;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">' +
          '<i class="fab fa-whatsapp" style="color:#fff;font-size:1.3rem;"></i>' +
        '</div>' +
        '<span style="font-size:0.72rem;color:#555;font-family:Figtree,sans-serif;">WhatsApp</span>' +
      '</a>' +

      // Twitter/X
      '<a href="https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encoded + '" target="_blank" rel="noopener" style="text-decoration:none;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:16px;background:#000;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">' +
          '<i class="fab fa-x-twitter" style="color:#fff;font-size:1.2rem;"></i>' +
        '</div>' +
        '<span style="font-size:0.72rem;color:#555;font-family:Figtree,sans-serif;">Twitter/X</span>' +
      '</a>' +

      // Telegram
      '<a href="https://t.me/share/url?url=' + encoded + '&text=' + encodeURIComponent(title) + '" target="_blank" rel="noopener" style="text-decoration:none;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:16px;background:#0088cc;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">' +
          '<i class="fab fa-telegram-plane" style="color:#fff;font-size:1.2rem;"></i>' +
        '</div>' +
        '<span style="font-size:0.72rem;color:#555;font-family:Figtree,sans-serif;">Telegram</span>' +
      '</a>' +
    '</div>' +

    // Copier le lien
    '<button id="bm-copy-link" style="width:100%;padding:0.85rem;border:1.5px solid #e0e0e0;border-radius:12px;background:#f8f9fb;font-family:Figtree,sans-serif;font-size:0.88rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;color:#555;transition:all 0.2s;">' +
      '<i class="fas fa-link" style="color:var(--green);"></i>' +
      '<span id="bm-copy-text">Copier le lien</span>' +
    '</button>';

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // CSS animations
  if (!document.getElementById('bm-share-css')) {
    var style = document.createElement('style');
    style.id = 'bm-share-css';
    style.textContent = '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(style);
  }

  // Copier lien
  document.getElementById('bm-copy-link').addEventListener('click', function() {
    navigator.clipboard.writeText(url).then(function() {
      document.getElementById('bm-copy-text').textContent = 'Lien copié ! ✓';
      document.getElementById('bm-copy-link').style.borderColor = 'var(--green)';
      document.getElementById('bm-copy-link').style.color = 'var(--green)';
      setTimeout(function() { closeSharePanel(); }, 1200);
    });
  });

  // Ferme en cliquant l'overlay
  overlay.addEventListener('click', closeSharePanel);

  // Ferme en glissant vers le bas (swipe down)
  var startY = 0;
  panel.addEventListener('touchstart', function(e){ startY = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend', function(e){
    if (e.changedTouches[0].clientY - startY > 80) closeSharePanel();
  });
}

function closeSharePanel() {
  var panel   = document.getElementById('bm-share-panel');
  var overlay = document.getElementById('bm-share-overlay');
  if (panel)   { panel.style.transform = 'translateY(100%)'; panel.style.transition = '0.25s'; }
  if (overlay) { overlay.style.opacity = '0'; overlay.style.transition = '0.25s'; }
  setTimeout(function() { panel?.remove(); overlay?.remove(); }, 260);
}

function initSidebar() {
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => { document.querySelectorAll('.sidebar-nav-item').forEach(i=>i.classList.remove('active')); item.classList.add('active'); });
  });
}