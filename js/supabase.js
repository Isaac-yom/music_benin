// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://adfypqwwprukhvosuvam.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__uQHdWOWkne1kcACWqYL3g_2HvEf6wQ'; 


const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTH HELPERS
// ============================================

async function getCurrentUser() {
  try {
    const { data: { user }, error } = await _supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

async function getCurrentProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data, error } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // ← maybeSingle évite l'erreur 406 si profil absent
    if (error) {
      console.warn('Profil non trouvé:', error.message);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function signOut() {
  await _supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ============================================
// REDIRECT HELPERS
// ============================================

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

async function redirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) {
    window.location.href = 'feed.html';
  }
}

// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ============================================
// FIELD ERROR HELPERS (utilisés dans auth.js)
// ============================================

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('input-error');
  const existing = field.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
  const err = document.createElement('p');
  err.className = 'field-error';
  err.textContent = message;
  field.parentElement.appendChild(err);
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('input-error');
  const err = field.parentElement?.querySelector('.field-error');
  if (err) err.remove();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

// ============================================
// COOKIES CONSENT
// ============================================

function initCookies() {
  if (localStorage.getItem('cookieConsent')) return;
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  setTimeout(() => banner.classList.add('show'), 1200);

  document.getElementById('accept-cookies')?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.classList.remove('show');
    showToast('Cookies acceptés ✓');
  });

  document.getElementById('reject-cookies')?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'rejected');
    banner.classList.remove('show');
    showToast('Cookies refusés', 'info');
  });
}