document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // GALAXY PRELOADER
  // ============================================
  const canvas = document.getElementById('stars');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fill();
        s.alpha += (Math.random() - 0.5) * 0.05;
        if (s.alpha > 1) s.alpha = 1;
        if (s.alpha < 0) s.alpha = 0;
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ============================================
  // PRELOADER
  // ============================================
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => preloader.classList.add('hidden'), 2800);
  }

  // ============================================
  // SCROLL TO TOP BUTTON
  // ============================================
  const scrollBtn = document.getElementById('scrollToTop');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('show', window.scrollY > 200);
    });
    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // MOBILE MENU
  // ============================================
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });
  }

  // ============================================
  // COOKIES CONSENT
  // ============================================
  if (typeof initCookies === 'function') {
    initCookies();
  } else {
    // Fallback si supabase.js non chargé
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      const banner = document.getElementById('cookie-banner');
      if (banner) {
        setTimeout(() => banner.classList.add('show'), 1200);
        document.getElementById('accept-cookies')?.addEventListener('click', () => {
          localStorage.setItem('cookieConsent', 'accepted');
          banner.classList.remove('show');
        });
        document.getElementById('reject-cookies')?.addEventListener('click', () => {
          localStorage.setItem('cookieConsent', 'rejected');
          banner.classList.remove('show');
        });
      }
    }
  }

  // ============================================
  // ACTIVE NAV LINK
  // ============================================
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });

  // ============================================
  // DROPDOWN MENUS
  // ============================================
  document.querySelectorAll('[data-dropdown]').forEach(trigger => {
    const menuId = trigger.dataset.dropdown;
    const menu = document.getElementById(menuId);
    if (menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-menu.open').forEach(m => {
          if (m !== menu) m.classList.remove('open');
        });
        menu.classList.toggle('open');
      });
    }
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
  });

  // ============================================
  // MODALS
  // ============================================
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.dataset.modal;
      document.getElementById(modalId)?.classList.add('open');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    overlay.querySelector('.modal-close')?.addEventListener('click', () => {
      overlay.classList.remove('open');
    });
  });

  // ============================================
  // HEADER SEARCH
  // ============================================
  const headerSearch = document.getElementById('header-search');
  if (headerSearch) {
    headerSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && headerSearch.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(headerSearch.value.trim())}`;
      }
    });
  }

  // ============================================
  // FILTER BUTTONS
  // ============================================
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group || 'default';
      document.querySelectorAll(`.filter-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ============================================
  // PROFILE TABS
  // ============================================
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.profile-tabs');
      group?.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.dataset.target;
      if (targetId) {
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(targetId)?.classList.remove('hidden');
      }
    });
  });

  // ============================================
  // DASHBOARD NAV (simple show/hide panels)
  // ============================================
  document.querySelectorAll('.dash-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.dash-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const target = item.dataset.target;
      if (target) {
        document.querySelectorAll('.dash-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(target)?.classList.remove('hidden');
      }
    });
  });

  // ============================================
  // LAZY LOADING IMAGES
  // ============================================
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imgObserver.unobserve(img);
          }
        }
      });
    });
    document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
  }

  // ============================================
  // FORM VALIDATION HELPERS
  // ============================================
  window.validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  window.validatePassword = (pw) => pw.length >= 8;

  window.showFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    if (field) field.classList.add('error');
    if (error) { error.textContent = message; error.classList.add('show'); }
  };

  window.clearFieldError = (fieldId) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    if (field) field.classList.remove('error');
    if (error) error.classList.remove('show');
  };

  // ============================================
  // ALPINEJS DATE (fallback)
  // ============================================
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});

// ============================================
// AVATAR FALLBACK
// ============================================
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    const initial = e.target.dataset.initial || '?';
    e.target.style.display = 'none';
    const parent = e.target.parentElement;
    if (!parent.querySelector('.avatar-fallback')) {
      const div = document.createElement('div');
      div.className = 'avatar-fallback';
      div.style.cssText = `
        width:${e.target.width || 44}px;height:${e.target.height || 44}px;
        border-radius:50%;background:linear-gradient(135deg,#007847,#FCD116);
        display:flex;align-items:center;justify-content:center;
        color:#111;font-weight:800;font-size:1.1rem;font-family:'Syne',sans-serif;
      `;
      div.textContent = initial.toUpperCase();
      parent.appendChild(div);
    }
  }
}, true);