/* Netlify paket gratis menyisipkan badge "Powered by Netlify" (iframe #nl-badge-frame, 200x64) di pojok kanan bawah.
   Badge tidak boleh dihilangkan di paket gratis, jadi bilah bawah aplikasi digeser ke atas agar tombolnya tidak tertutup.
   Di APK (tanpa Netlify) badge tidak ada, tampilan tidak berubah. */
(function () {
  function check() {
    if (!document.getElementById("nl-badge-frame")) return false;
    document.documentElement.classList.add("has-badge");
    return true;
  }
  if (check()) return;
  var mo = new MutationObserver(function () { if (check()) mo.disconnect(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { mo.disconnect(); }, 20000);
})();
