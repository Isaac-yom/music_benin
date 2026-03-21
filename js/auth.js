// ============================================
// AUTH.JS — Login, Register, Session
// ============================================

document.addEventListener('DOMContentLoaded', async () => {

  // Init cookies banner sur toutes les pages
  if (typeof initCookies === 'function') initCookies();

  // ============================================
  // LOGIN PAGE
  // ============================================
  
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    await redirectIfLoggedIn();

    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePw      = document.getElementById('toggle-password');
    const submitBtn     = document.getElementById('login-submit');
    const globalError   = document.getElementById('global-error');

    togglePw?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePw.innerHTML = isPassword
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const email    = emailInput.value.trim();
      const password = passwordInput.value;

      ['email', 'password'].forEach(clearFieldError);
      if (globalError) globalError.classList.add('hidden');

      if (!email || !validateEmail(email)) {
        showFieldError('email', 'Adresse e-mail invalide');
        valid = false;
      }
      if (!password) {
        showFieldError('password', 'Mot de passe requis');
        valid = false;
      }
      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion en cours…';

      const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

      if (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
        if (globalError) {
          globalError.textContent = error.message.includes('Invalid')
            ? 'Email ou mot de passe incorrect'
            : 'Erreur de connexion. Réessaie.';
          globalError.classList.remove('hidden');
        }
        return;
      }

      showToast('Connexion réussie ! ✓');
      setTimeout(() => window.location.href = 'feed.html', 800);
    });
  }

  // ============================================
  // REGISTER PAGE
  // ============================================
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    await redirectIfLoggedIn();

    const submitBtn     = document.getElementById('register-submit');
    const togglePw      = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const globalError   = document.getElementById('global-error');

    togglePw?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePw.innerHTML = isPassword
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const displayName = document.getElementById('display-name').value.trim();
      const username    = document.getElementById('username').value.trim().toLowerCase();
      const email       = document.getElementById('email').value.trim();
      const password    = document.getElementById('password').value;
      const confirm     = document.getElementById('confirm-password').value;
      const terms       = document.getElementById('terms')?.checked;

      ['display-name', 'username', 'email', 'password', 'confirm-password'].forEach(clearFieldError);
      if (globalError) globalError.classList.add('hidden');

      if (!displayName || displayName.length < 2) {
        showFieldError('display-name', 'Minimum 2 caractères'); valid = false;
      }
      if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
        showFieldError('username', 'Lettres minuscules, chiffres et _ uniquement (min 3 caractères)'); valid = false;
      }
      if (!email || !validateEmail(email)) {
        showFieldError('email', 'Adresse e-mail invalide'); valid = false;
      }
      if (!validatePassword(password)) {
        showFieldError('password', 'Minimum 8 caractères'); valid = false;
      }
      if (password !== confirm) {
        showFieldError('confirm-password', 'Les mots de passe ne correspondent pas'); valid = false;
      }
      if (terms === false) {
        showToast('Accepte les conditions d\'utilisation', 'error');
        valid = false;
      }
      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Création du compte…';

      // ── Vérifie si le username est déjà pris ──
      // On utilise maybeSingle() pour éviter l'erreur 406
      const { data: existingUser, error: checkError } = await _supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle(); // ← CORRECTION : était .single(), cause du 406

      if (checkError) {
        // Erreur réseau ou RLS → on laisse passer, le trigger gérera
        console.warn('Check username warning:', checkError.message);
      }

      if (existingUser) {
        showFieldError('username', 'Nom d\'utilisateur déjà pris');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer mon compte';
        return;
      }

      // ── Crée le compte Supabase Auth ──
      const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName
          }
        }
      });

      if (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer mon compte';
        if (globalError) {
          let msg = 'Une erreur est survenue. Réessaie.';
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            msg = 'Cet email est déjà utilisé.';
          } else if (error.message.includes('Database error')) {
            msg = 'Erreur de base de données. Vérifie que le schéma SQL est bien exécuté dans Supabase.';
          } else if (error.message.includes('password')) {
            msg = 'Mot de passe trop faible (minimum 8 caractères).';
          }
          globalError.textContent = msg;
          globalError.classList.remove('hidden');
        }
        console.error('Signup error:', error);
        return;
      }

      // ── Succès ──
      // Si email confirmation est activée dans Supabase, data.user sera présent
      // mais data.session sera null → on redirige vers une page de confirmation
      if (data.user && !data.session) {
        showToast('Vérifie ta boîte mail pour confirmer ton compte ✉️', 'info');
        setTimeout(() => window.location.href = 'login.html', 2500);
      } else {
        showToast('Compte créé avec succès ! ✓');
        setTimeout(() => window.location.href = 'feed.html', 800);
      }
    });
  }

  // ============================================
  // NAV — Mise à jour du header selon session
  // ============================================
  const userAvatarEl  = document.getElementById('user-avatar-nav');
  const loginBtnEl    = document.getElementById('login-btn-nav');
  const logoutBtnEl   = document.getElementById('logout-btn');
  const mobileLoginBtn  = document.getElementById('mobile-login-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

  const user = await getCurrentUser();

  if (user) {
    const profile = await getCurrentProfile();

    if (userAvatarEl) {
      const name = profile?.display_name || profile?.username || 'U';
      userAvatarEl.src = profile?.avatar_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=007847&color=fff&bold=true&size=64`;
      userAvatarEl.classList.remove('hidden');
    }
    loginBtnEl?.classList.add('hidden');
    mobileLoginBtn?.classList.add('hidden');
    mobileLogoutBtn?.classList.remove('hidden');

    // Badge notifications
    try {
      const { count } = await _supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (count > 0) {
        const badge = document.getElementById('notif-count');
        if (badge) {
          badge.textContent = count > 9 ? '9+' : count;
          badge.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.warn('Notif count error:', e.message);
    }

  } else {
    userAvatarEl?.classList.add('hidden');
    loginBtnEl?.classList.remove('hidden');
    mobileLoginBtn?.classList.remove('hidden');
    mobileLogoutBtn?.classList.add('hidden');
  }

  logoutBtnEl?.addEventListener('click', signOut);
  mobileLogoutBtn?.addEventListener('click', signOut);
});