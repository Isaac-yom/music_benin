// ============================================================
// BÉNINMUSIC — components.js
// Header, Footer, Cookie Banner — Français uniquement
// ============================================================

// ============================================================
// HEADER
// ============================================================
function renderHeader(activePage) {
  activePage = activePage || '';
  return '' +
  '<style>' +
    /* Header sticky en haut, z-index élevé */
    '.site-header{position:sticky;top:0;z-index:900;}' +
    /* Drapeau dans le logo */
    '.header-logo img{border-radius:3px;flex-shrink:0;}' +
  '</style>' +
  '<header class="site-header">' +
    '<a href="index.html" class="header-logo">' +
      '<img src="https://upload.wikimedia.org/wikipedia/commons/0/0a/Flag_of_Benin.svg" alt="Bénin" style="width:26px;height:18px;object-fit:cover;border-radius:3px;flex-shrink:0;"> BéninMusic' +
    '</a>' +
    '<div class="header-search">' +
      '<i class="fas fa-search"></i>' +
      '<input type="text" id="header-search" placeholder="Rechercher artiste, chanson…">' +
    '</div>' +
    '<nav class="header-nav">' +
      '<a href="feed.html" class="nav-link ' + (activePage==='feed'?'active':'') + '">' +
        '<i class="fas fa-home"></i> <span>Fil</span>' +
      '</a>' +
      '<a href="events.html" class="nav-link ' + (activePage==='events'?'active':'') + '">' +
        '<i class="fas fa-calendar"></i> <span>Événements</span>' +
      '</a>' +
      '<a href="artists.html" class="nav-link ' + (activePage==='artists'?'active':'') + '">' +
        '<i class="fas fa-music"></i> <span>Artistes</span>' +
      '</a>' +
      '<a href="search.html" class="nav-link ' + (activePage==='search'?'active':'') + '">' +
        '<i class="fas fa-search"></i>' +
      '</a>' +
      '<div class="notif-badge nav-link" style="cursor:pointer;" onclick="window.location=\'feed.html\'">' +
        '<i class="fas fa-bell"></i>' +
        '<span class="badge hidden" id="notif-count">0</span>' +
      '</div>' +
      '<div class="dropdown">' +
        '<img class="nav-avatar hidden" id="user-avatar-nav" src="" alt="Profil" data-dropdown="user-menu">' +
        '<a href="login.html" class="nav-btn hidden" id="login-btn-nav">Se connecter</a>' +
        '<div class="dropdown-menu" id="user-menu">' +
          '<a class="dropdown-item" href="profile.html"><i class="fas fa-user"></i> Mon profil</a>' +
          '<a class="dropdown-item" href="feed.html"><i class="fas fa-home"></i> Fil d\'actualité</a>' +
          '<a class="dropdown-item" href="dashboard.html" id="admin-link" style="display:none">' +
            '<i class="fas fa-tachometer-alt"></i> Dashboard Admin' +
          '</a>' +
          '<button class="dropdown-item danger" id="logout-btn">' +
            '<i class="fas fa-sign-out-alt"></i> Déconnexion' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</nav>' +
    '<button class="hamburger" id="hamburger" aria-label="Menu">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
  '</header>' +
  '<div class="mobile-menu" id="mobile-menu">' +
    '<a href="feed.html" class="nav-link"><i class="fas fa-home" style="margin-right:8px;"></i>Fil d\'actualité</a>' +
    '<a href="events.html" class="nav-link"><i class="fas fa-calendar" style="margin-right:8px;"></i>Événements</a>' +
    '<a href="artists.html" class="nav-link"><i class="fas fa-music" style="margin-right:8px;"></i>Artistes</a>' +
    '<a href="search.html" class="nav-link"><i class="fas fa-search" style="margin-right:8px;"></i>Rechercher</a>' +
    '<a href="profile.html" class="nav-link"><i class="fas fa-user" style="margin-right:8px;"></i>Profil</a>' +
    '<a href="login.html" class="nav-btn" style="text-align:center;padding:12px;margin-top:8px;" id="mobile-login-btn">Se connecter</a>' +
    '<button class="nav-link danger hidden" id="mobile-logout-btn" style="background:none;border:none;cursor:pointer;color:var(--red);text-align:left;">' +
      '<i class="fas fa-sign-out-alt" style="margin-right:8px;"></i>Déconnexion' +
    '</button>' +
  '</div>';
}

// ============================================================
// FOOTER
// ============================================================
function renderFooter() {
  var year = new Date().getFullYear();
  return '' +
  '<footer class="site-footer">' +
    '<div class="footer-pro">' +
      '<div class="footer-brand">' +
        '<div class="footer-brand-logo">🇧🇯 BéninMusic</div>' +
        '<p class="footer-brand-desc">Le premier réseau social dédié à la musique béninoise et aux talents de la scène africaine moderne.</p>' +
        '<div class="footer-socials">' +
          '<a href="https://wa.me/2290158507828" target="_blank" rel="noopener" class="footer-social-btn" aria-label="WhatsApp" title="Discuter sur WhatsApp" style="background:rgba(37,211,102,0.15);color:#25D366;"><i class="fab fa-whatsapp"></i></a>' +
          '<a href="#" class="footer-social-btn" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>' +
          
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="footer-col-title">Explorer</div>' +
        '<div class="footer-links">' +
          '<a href="feed.html" class="footer-link">Fil d\'actualité</a>' +
          '<a href="artists.html" class="footer-link">Artistes</a>' +
          '<a href="events.html" class="footer-link">Événements</a>' +
          '<a href="search.html" class="footer-link">Recherche</a>' +
          '<a href="index.html" class="footer-link">Accueil</a>' +
          '<a href="contact.html" class="footer-link">Contact</a>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="footer-col-title">Compte</div>' +
        '<div class="footer-links">' +
          '<a href="login.html" class="footer-link">Connexion</a>' +
          '<a href="register.html" class="footer-link">Inscription</a>' +
          '<a href="profile.html" class="footer-link">Mon Profil</a>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="footer-col-title">Légal</div>' +
        '<div class="footer-links">' +
          '<a href="legal.html" class="footer-link">Mentions légales</a>' +
          '<a href="privacy.html" class="footer-link">Confidentialité</a>' +
          '<a href="legal.html#cgu" class="footer-link">CGU</a>' +
          '<a href="legal.html#cookies" class="footer-link">Cookies</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="height:1px;background:linear-gradient(90deg,transparent 0%,var(--green) 20%,var(--yellow) 50%,var(--red) 80%,transparent 100%);margin-bottom:2rem;opacity:0.6;"></div>' +
    '<div class="footer-bottom" style="border-top:none;">' +
      '<p class="footer-copyright">' +
        '&copy; ' + year + ' BéninMusic · Du Bénin au monde 🌍 · Conçu avec ❤️ par ' +
        '<a href="https://isaac-myportfolio.yomservice.com" target="_blank" rel="noopener noreferrer" style="color:var(--yellow);">Isaac Yom</a>' +
      '</p>' +
      '<div class="footer-legal-links">' +
        '<a href="legal.html" class="footer-legal-link">Mentions légales</a>' +
        '<a href="privacy.html" class="footer-legal-link">Confidentialité</a>' +
        '<a href="legal.html#cookies" class="footer-legal-link">Cookies</a>' +
      '</div>' +
    '</div>' +
  '</footer>';
}

// ============================================================
// COOKIE BANNER
// ============================================================
function renderCookieBanner() {
  return '' +
  '<style>' +
    '#cookie-banner{display:none!important;position:fixed!important;bottom:1.5rem!important;' +
      'left:50%!important;transform:translateX(-50%)!important;width:calc(100% - 2rem)!important;' +
      'max-width:700px!important;background:#111!important;color:#fff!important;' +
      'padding:1rem 1.5rem!important;border-radius:16px!important;' +
      'font-family:\'Figtree\',sans-serif!important;font-size:0.85rem!important;' +
      'align-items:center!important;gap:1rem!important;flex-wrap:wrap!important;' +
      'box-shadow:0 10px 40px rgba(0,0,0,0.5)!important;z-index:99999!important;' +
      'border:1px solid rgba(255,255,255,0.08)!important;margin:0!important;}' +
    '#cookie-banner.cb-visible{display:flex!important;}' +
  '</style>' +
  '<div id="cookie-banner">' +
    '<span style="flex:1;min-width:200px;line-height:1.5;">' +
      '<i class="fas fa-cookie-bite" style="margin-right:6px;color:var(--yellow);"></i>' +
      'Ce site utilise des cookies pour améliorer ton expérience. ' +
      '<a href="privacy.html" style="color:#FCD116;text-decoration:underline;">En savoir plus</a>' +
    '</span>' +
    '<div style="display:flex;gap:0.6rem;flex-shrink:0;">' +
      '<button id="accept-cookies" style="background:linear-gradient(90deg,#007847,#FCD116,#CE1126);border:none;padding:0.5rem 1.2rem;border-radius:999px;font-family:\'Syne\',sans-serif;font-size:0.78rem;font-weight:700;color:#111;cursor:pointer;white-space:nowrap;">Accepter</button>' +
      '<button id="reject-cookies" style="background:transparent;border:1px solid rgba(255,255,255,0.25);padding:0.5rem 1.2rem;border-radius:999px;font-family:\'Syne\',sans-serif;font-size:0.78rem;color:rgba(255,255,255,0.75);cursor:pointer;white-space:nowrap;">Refuser</button>' +
    '</div>' +
  '</div>';
}

function renderScrollBtn() {
  return '<div class="scroll" id="scrollToTop"><i class="fas fa-long-arrow-alt-up"></i></div>';
}

// ============================================================
// INJECTION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  var headerEl = document.getElementById('app-header');
  if (headerEl) {
    var activePage = headerEl.dataset.active || '';
    headerEl.outerHTML = renderHeader(activePage);
  }
  var footerEl = document.getElementById('app-footer');
  if (footerEl) footerEl.outerHTML = renderFooter();

  var cookieEl = document.getElementById('cookie-slot');
  if (cookieEl) cookieEl.outerHTML = renderCookieBanner() + renderScrollBtn();

  initCookieBanner();
});

// ============================================================
// COOKIE LOGIC
// ============================================================
function initCookieBanner() {
  if (localStorage.getItem('cookieConsent')) return;
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  setTimeout(function() { banner.classList.add('cb-visible'); }, 1200);

  document.getElementById('accept-cookies')?.addEventListener('click', function() {
    localStorage.setItem('cookieConsent', 'accepted');
    hideBanner(banner);
    if (typeof showToast === 'function') showToast('Cookies acceptés ✓');
  });
  document.getElementById('reject-cookies')?.addEventListener('click', function() {
    localStorage.setItem('cookieConsent', 'rejected');
    hideBanner(banner);
    if (typeof showToast === 'function') showToast('Cookies refusés', 'info');
  });
}

function hideBanner(banner) {
  banner.classList.remove('cb-visible');
  banner.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  banner.style.transform  = 'translateX(-50%) translateY(130%)';
  banner.style.opacity    = '0';
  setTimeout(function() { banner.style.cssText = 'display:none!important;'; }, 380);
}

function initCookies() { initCookieBanner(); }