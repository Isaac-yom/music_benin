// ============================================================
// BÉNINMUSIC — storage.js
// Gestion des uploads vers les buckets Supabase Storage
// Buckets : avatars (2MB), posts (5MB), artists (5MB), events (5MB)
// ============================================================

// ── Limites par bucket ──────────────────────────────────────
const BUCKET_LIMITS = {
  avatars: 2  * 1024 * 1024,   // 2 MB
  posts:   5  * 1024 * 1024,   // 5 MB
  artists: 5  * 1024 * 1024,   // 5 MB
  events:  5  * 1024 * 1024,   // 5 MB
  videos:  50 * 1024 * 1024,   // 50 MB
};

const ALLOWED_VIDEO_TYPES = ['video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo'];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ============================================================
// uploadImage(file, bucket, folder?)
// → Renvoie l'URL publique ou null en cas d'erreur
// ============================================================
async function uploadImage(file, bucket, folder = '') {
  // 1. Vérifie le type
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Format non supporté. Utilise JPG, PNG, WebP ou GIF.', 'error');
    return null;
  }

  // 2. Vérifie la taille
  const limit = BUCKET_LIMITS[bucket];
  if (file.size > limit) {
    const mb = (limit / 1024 / 1024).toFixed(0);
    showToast(`Image trop lourde. Maximum ${mb} MB pour ce bucket.`, 'error');
    return null;
  }

  // 3. Génère un nom de fichier unique
  const ext      = file.name.split('.').pop().toLowerCase();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  const path     = folder ? `${folder}/${filename}` : filename;

  // 4. Upload
  const { data, error } = await _supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error(`[storage] Upload error (${bucket}):`, error);
    showToast('Erreur upload : ' + error.message, 'error');
    return null;
  }

  // 5. Retourne l'URL publique
  const { data: urlData } = _supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ============================================================
// deleteImage(url, bucket)
// Supprime un fichier depuis son URL publique
// ============================================================
async function deleteImage(publicUrl, bucket) {
  try {
    // Extrait le path depuis l'URL publique
    // ex: https://xxx.supabase.co/storage/v1/object/public/avatars/user123/photo.jpg
    //  → user123/photo.jpg
    const marker = `/object/public/${bucket}/`;
    const idx    = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);

    const { error } = await _supabase.storage.from(bucket).remove([path]);
    if (error) console.warn('[storage] Delete error:', error.message);
  } catch (e) {
    console.warn('[storage] deleteImage exception:', e);
  }
}

// ============================================================
// AVATAR — uploadAvatar(file, userId)
// Upload l'avatar et le sauvegarde en base de façon PERMANENTE.
// - Nom de fichier FIXE (avatar.ext) + upsert:true
//   → même URL à chaque changement, la photo persiste après refresh.
// - URL propre stockée en DB, cache-buster retourné pour le DOM.
// ============================================================
async function uploadAvatar(file, userId) {
  // Vérifie le type
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Format non supporté. Utilise JPG, PNG ou WebP.', 'error');
    return null;
  }
  // Vérifie la taille (2 MB)
  if (file.size > BUCKET_LIMITS.avatars) {
    showToast('Photo trop lourde. Maximum 2 MB.', 'error');
    return null;
  }

  // Nom FIXE → {userId}/avatar.{ext}
  // Même path à chaque fois → même URL → photo persiste après refresh
  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, 'jpg');
  const path = userId + '/avatar.' + ext;

  console.log('[uploadAvatar] Uploading to path:', path);

  // Étape 1 : Upload storage avec upsert:true
  const { data, error: upErr } = await _supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '0',
      upsert: true,
      contentType: file.type,
    });

  if (upErr) {
    console.error('[uploadAvatar] STORAGE ERROR:', upErr.message, upErr);
    showToast('Erreur upload photo : ' + upErr.message, 'error');
    return null;
  }

  console.log('[uploadAvatar] Storage OK, path:', data.path);

  // Étape 2 : URL publique (sans cache-buster pour le stockage en DB)
  const { data: urlData } = _supabase.storage.from('avatars').getPublicUrl(data.path);
  const cleanUrl = urlData.publicUrl;

  console.log('[uploadAvatar] Public URL:', cleanUrl);

  // Étape 3 : Sauvegarde dans la table profiles
  const { data: updateData, error: dbErr } = await _supabase
    .from('profiles')
    .update({ avatar_url: cleanUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, avatar_url');  // select pour confirmer que la ligne a été modifiée

  if (dbErr) {
    console.error('[uploadAvatar] DB UPDATE ERROR:', dbErr.message, dbErr);
    showToast('Photo uploadée mais non sauvegardée : ' + dbErr.message, 'error');
    return null;
  }

  if (!updateData || updateData.length === 0) {
    // L'UPDATE n'a modifié aucune ligne — RLS bloque silencieusement
    console.error('[uploadAvatar] DB UPDATE silently failed — RLS issue? userId:', userId);
    showToast('Erreur RLS : photo non sauvegardée. Vérifiez la console.', 'error');
    return null;
  }

  console.log('[uploadAvatar] DB OK, avatar_url saved:', updateData[0].avatar_url);

  // Retourne l'URL avec cache-buster pour forcer le rechargement dans le DOM
  return cleanUrl + '?t=' + Date.now();
}

// ============================================================
// POST IMAGE — uploadPostImage(file, userId)
// Upload une image pour une publication
// ============================================================
async function uploadPostImage(file, userId) {
  return await uploadImage(file, 'posts', userId);
}

// ============================================================
// POST VIDEO — uploadPostVideo(file, userId)
// Upload une vidéo pour une publication → bucket "videos"
// ============================================================
async function uploadPostVideo(file, userId) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    showToast('Format non supporté. Utilise MP4, WebM ou MOV.', 'error');
    return null;
  }
  if (file.size > BUCKET_LIMITS.videos) {
    showToast('Vidéo trop lourde. Maximum 50 MB.', 'error');
    return null;
  }

  const ext      = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const filename = Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
  const path     = userId + '/' + filename;

  const { data, error } = await _supabase.storage
    .from('videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('[uploadPostVideo] storage:', error);
    showToast('Erreur upload vidéo : ' + error.message, 'error');
    return null;
  }

  const { data: urlData } = _supabase.storage.from('videos').getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ============================================================
// ARTIST IMAGE — uploadArtistImage(file, artistSlug)
// Upload la photo d'un artiste (usage dashboard admin)
// ============================================================
async function uploadArtistImage(file, artistSlug) {
  return await uploadImage(file, 'artists', artistSlug);
}

// ============================================================
// EVENT IMAGE — uploadEventImage(file, eventId)
// Upload l'affiche d'un événement (usage dashboard admin)
// ============================================================
async function uploadEventImage(file, eventId) {
  return await uploadImage(file, 'events', eventId || 'misc');
}

// ============================================================
// initAvatarUpload(inputId, previewId, userId)
// Branche un <input type="file"> sur l'upload avatar
// avec prévisualisation instantanée
// ============================================================
function initAvatarUpload(inputId, previewId, userId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prévisualisation locale immédiate
    if (preview) {
      const reader = new FileReader();
      reader.onload = ev => { preview.src = ev.target.result; };
      reader.readAsDataURL(file);
    }

    // Upload réel
    showToast('Upload en cours…', 'info');
    const url = await uploadAvatar(file, userId);
    if (url) {
      showToast('Photo de profil mise à jour ✓');
      // Met aussi à jour tous les avatars affichés sur la page
      document.querySelectorAll('.user-avatar, .nav-avatar').forEach(img => {
        img.src = url;
      });
    }
    // Reset input pour permettre de re-sélectionner le même fichier
    input.value = '';
  });
}

// ============================================================
// initImageUpload(inputId, previewId, onSuccess)
// Branche un <input type="file"> générique avec preview
// onSuccess(url) est appelé avec l'URL publique
// ============================================================
function initImageUpload(inputId, previewId, bucket, folder, onSuccess) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prévisualisation locale
    if (preview) {
      const reader = new FileReader();
      reader.onload = ev => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    showToast('Upload en cours…', 'info');
    const url = await uploadImage(file, bucket, folder);
    if (url && typeof onSuccess === 'function') {
      onSuccess(url);
      showToast('Image uploadée ✓');
    }
    input.value = '';
  });
}

// ============================================================
// getAvatarUrl(profile)
// Retourne l'URL d'avatar ou un avatar généré depuis le nom
// ============================================================
function getAvatarUrl(profile) {
  if (profile?.avatar_url && profile.avatar_url.trim() !== '') {
    return profile.avatar_url;
  }
  const name = encodeURIComponent(profile?.display_name || profile?.username || '?');
  return `https://ui-avatars.com/api/?name=${name}&background=007847&color=fff&size=128&bold=true`;
}