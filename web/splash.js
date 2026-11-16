/* Animasi pembuka: logo Agimas tampil, motor melaju ke kiri menghapus tulisan, lalu masuk aplikasi.
   Garis progres + status di bawah. Splash menunggu data siap (event "agimas-ready" dari app.js, maks. 5 detik),
   jadi tidak ada "loading kedua" (skeleton) kecuali internet sangat lambat. */
(function () {
  var sp = document.getElementById("splash");
  if (!sp) return;
  var motor = document.getElementById("splashMotor"), text = document.getElementById("splashText");
  var bar = document.getElementById("splashBar"), status = document.getElementById("splashStatus");
  var HOLD = 550, DRIVE = 1400, MAX_WAIT = 5000; // ms
  var t0 = Date.now();
  document.getElementById("splashVer").textContent = "Versi " + (window.AGIMAS_VERSION || "-");

  function setBar(f, msg) { bar.style.width = Math.round(f * 100) + "%"; if (msg) status.textContent = msg; }
  function remove() { if (sp.parentNode) sp.parentNode.removeChild(sp); }
  function fade() { setBar(1, "Siap"); setTimeout(function () { sp.classList.add("done"); setTimeout(remove, 450); }, 150); }
  /* Animasi selesai: tunggu data (maks. MAX_WAIT sejak dibuka), lalu memudar. */
  function finish() {
    if (window.agimasReady) return fade();
    setBar(.92, "Memuat data driver & tarif…");
    var done = false, go = function () { if (!done) { done = true; fade(); } };
    window.addEventListener("agimas-ready", go);
    setTimeout(go, Math.max(0, MAX_WAIT - (Date.now() - t0)));
  }

  // Sudah tampil di sesi ini (mis. halaman dimuat ulang): langsung masuk.
  try { if (sessionStorage.getItem("agimas.splash")) { remove(); return; } sessionStorage.setItem("agimas.splash", "1"); } catch (e) {}

  setBar(.08);
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { setTimeout(finish, 700); return; }

  function easeIn(p) { return p * p * p * 0.6 + p * 0.4; } // mulai pelan, makin kencang

  function drive() {
    var tr = text.getBoundingClientRect(), mr = motor.getBoundingClientRect();
    var dist = mr.right + 40, start = null;
    setBar(.2, "Memuat peta & tarif…");
    function frame(ts) {
      if (start === null) start = ts;
      var e = ts - start, p = Math.max(0, Math.min(1, (e - HOLD) / DRIVE)), dx = -dist * easeIn(p);
      var bob = e > HOLD ? Math.sin(e / 45) * 1.6 : 0; // guncangan kecil saat jalan
      motor.style.transform = "translate(" + dx + "px," + bob + "px)";
      // Tulisan hanya terlihat di depan bagian belakang motor (kotak barang ±78% lebar gambar; sisanya garis kecepatan).
      var rear = mr.left + mr.width * 0.78 + dx;
      var vis = Math.max(0, Math.min(tr.width, rear - tr.left));
      text.style.clipPath = "inset(0 " + (tr.width - vis) + "px 0 0)";
      bar.style.width = Math.round((.2 + .7 * p) * 100) + "%";
      if (p < 1) requestAnimationFrame(frame); else finish();
    }
    requestAnimationFrame(frame);
  }

  // Mulai setelah kedua gambar siap (maks. 1,5 detik menunggu).
  var imgs = [motor, text.querySelector("img")], left = imgs.length, started = false;
  function ready() { if (!started && --left <= 0) { started = true; drive(); } }
  imgs.forEach(function (im) { if (im.complete && im.naturalWidth) ready(); else { im.onload = ready; im.onerror = ready; } });
  setTimeout(function () { if (!started) { started = true; drive(); } }, 1500);
})();
