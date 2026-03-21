// ============================================================
// BÉNINMUSIC — analytics.js
// Tracker de visites léger — à inclure dans toutes les pages
// Usage : <script src="js/analytics.js"></script>
// ============================================================

(function() {
  // Attend que Supabase soit prêt
  document.addEventListener('DOMContentLoaded', async function() {
    try {
      // Identifie la page depuis l'URL
      var path = window.location.pathname;
      var page = path.split('/').pop().replace('.html', '') || 'index';
      if (!page || page === '') page = 'index';

      var referrer = document.referrer
        ? new URL(document.referrer).pathname.split('/').pop().replace('.html','') || 'direct'
        : 'direct';

      // Enregistre via la fonction Supabase (bypasse RLS)
      await _supabase.rpc('track_page_view', {
        p_page:     page,
        p_referrer: referrer
      });
    } catch(e) {
      // Silencieux — ne jamais bloquer le chargement de la page
    }
  });
})();