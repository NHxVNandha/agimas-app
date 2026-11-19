"""Perekam video tutorial: panggung (latar PNG + aplikasi di iframe), kursor sentuh tiruan, narasi edge-tts (id-ID-ArdiNeural).

Sinkron suara & gambar:
- Tiap adegan dipecah jadi "ketukan" (beat) = satu kalimat + aksinya. Kalimat diputar tepat saat aksinya mulai,
  dan ketukan berikutnya baru mulai setelah kalimat selesai DAN aksinya selesai.
- Penanda sinkron: kotak 8x8 px di pojok kiri atas berganti hitam/putih di awal tiap ketukan. Setelah merekam,
  waktu pergantian dibaca dari video itu sendiri, jadi suara ditaruh pada waktu VIDEO (bukan jam dinding) -
  bingkai yang terlewat saat perekaman tidak menggeser suara. Kotak ditutup potongan latar di sebelahnya pada hasil akhir."""
import asyncio, hashlib, http.server, pathlib, re, subprocess, threading, time
import edge_tts, imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = pathlib.Path(__file__).parent
VOICE = "id-ID-ArdiNeural"


def B(say, act=None):
    """Satu ketukan: kalimat narasi + aksi (fungsi r -> None) yang terjadi bersamaan."""
    return {"say": say, "act": act}


def tts(scenes, outdir, rate="+0%"):
    """Satu mp3 per ketukan (nama dari hash teks, jadi aman saat naskah diubah). Mengisi beat['mp3'], beat['dur']."""
    outdir.mkdir(parents=True, exist_ok=True)
    beats = [b for sc in scenes for b in sc["beats"]]
    async def run():
        for b in beats:
            mp3 = outdir / (hashlib.md5((b["say"] + rate).encode()).hexdigest()[:12] + ".mp3")
            if not mp3.exists() or mp3.stat().st_size < 1000:
                await edge_tts.Communicate(b["say"], VOICE, rate=rate).save(str(mp3))
            b["mp3"] = mp3
    asyncio.run(run())
    for b in beats: b["dur"] = duration(b["mp3"])
    return sum(b["dur"] for b in beats)


def duration(f):
    err = subprocess.run([FF, "-i", str(f)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def serve(routes, port):
    """routes: {prefix: dir}; prefix terpanjang menang."""
    class H(http.server.SimpleHTTPRequestHandler):
        def translate_path(self, path):
            p = path.split("?")[0].split("#")[0]
            for pre in sorted(routes, key=len, reverse=True):
                if p.startswith(pre):
                    rel = p[len(pre):].lstrip("/") or "index.html"
                    return str(pathlib.Path(routes[pre]) / rel)
            return str(HERE / "nothing")
        def log_message(self, *a): pass
        def end_headers(self): self.send_header("Cache-Control", "no-store"); super().end_headers()
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port}/"


class Rec:
    def __init__(self, page, frame_sel="#app"):
        self.pg, self.t0, self.beats = page, time.time(), []
        self.fsel = frame_sel

    @property
    def f(self): return self.pg.frame_locator(self.fsel)

    def now(self): return time.time() - self.t0

    # ---- kursor sentuh tiruan (di halaman panggung, koordinat layar)
    def point(self, loc, dx=0.5, dy=0.5):
        if isinstance(loc, str): loc = self.f.locator(loc).first
        for k in range(5):   # elemen bisa digambar ulang saat data dimuat
            try:
                loc.wait_for(state="visible", timeout=15000)
                loc.scroll_into_view_if_needed(timeout=15000); b = loc.bounding_box(timeout=15000)
                if b: break
                raise RuntimeError("not attached (tanpa kotak)")
            except Exception as e:
                if k == 4 or "not attached" not in str(e): raise
                self.pg.wait_for_timeout(600)
        x, y = b["x"] + b["width"] * dx, b["y"] + b["height"] * dy
        self.pg.evaluate("([x,y]) => window.cur(x,y)", [x, y]); self.pg.wait_for_timeout(650)
        return x, y

    def tap(self, loc, after=500, **kw):
        if isinstance(loc, str): loc = self.f.locator(loc).first
        self.point(loc)
        self.pg.evaluate("window.ripple()"); loc.click(timeout=15000, **kw); self.pg.wait_for_timeout(after)

    def type(self, sel, text, delay=70):
        loc = self.f.locator(sel).first if isinstance(sel, str) else sel
        self.tap(loc, after=200); loc.press_sequentially(text, delay=delay); self.pg.wait_for_timeout(300)

    def drag(self, sel, dy, steps=14):
        """Geser (misal bilah keranjang) dengan kursor tiruan ikut bergerak."""
        x, y = self.point(sel)
        self.pg.mouse.move(x, y); self.pg.mouse.down()
        for k in range(1, steps + 1):
            yy = y + dy * k / steps; self.pg.mouse.move(x, yy); self.pg.evaluate("([x,y]) => window.cur(x,y)", [x, yy]); self.pg.wait_for_timeout(25)
        self.pg.mouse.up(); self.pg.wait_for_timeout(600)

    def hide_cursor(self): self.pg.evaluate("window.cur(-100,-100)")

    def scroll(self, sel, dy, ms=900):
        loc = self.f.locator(sel).first
        loc.evaluate("(e,[dy,ms]) => e.scrollBy({top:dy,behavior:'smooth'})", [dy, ms]); self.pg.wait_for_timeout(ms)

    # ---- adegan & ketukan
    def run(self, scenes):
        n = len(scenes)
        for i, sc in enumerate(scenes):
            self.pg.evaluate("(a) => window.step(a)", {"i": i, "n": n, "title": sc["title"], "says": [b["say"] for b in sc["beats"]], "card": sc.get("card")})
            self.pg.wait_for_timeout(int(sc.get("settle", 0.5) * 1000))   # judul & teks langkah muncul dulu
            t_sc = self.now()
            for j, b in enumerate(sc["beats"]):
                start = self.now()
                b["first"] = j == 0; b["scene"] = i
                self.pg.evaluate("(k) => window.sync(k, " + str(j) + ")", len(self.beats))   # penanda + sorot kalimat
                self.beats.append(b)
                try:
                    if b["act"]: b["act"](self)
                except Exception as e:
                    print("ADEGAN GAGAL", i, sc["title"], "| kalimat", j + 1, repr(e)[:300]); raise
                left = start + b["dur"] + b.get("gap", 0.3) - self.now()
                if left > 0: self.pg.wait_for_timeout(int(left * 1000))
            self.pg.wait_for_timeout(int(sc.get("pad", 0.5) * 1000))
            print(f"{i:02d} {sc['title'][:40]:40s} narasi {sum(b['dur'] for b in sc['beats']):5.1f}s  adegan {self.now() - t_sc:5.1f}s", flush=True)
        self.pg.evaluate("(k) => window.sync(k, -1)", len(self.beats))   # penanda akhir
        self.pg.wait_for_timeout(800)


def ffmpeg(args, label, total):
    """Jalankan ffmpeg tanpa banjir log (hanya error, ke file) dan catat progres (%) ke progres.txt."""
    prog, log = HERE / "ff-progress.txt", HERE / "ff-error.txt"
    with open(log, "w", encoding="utf8") as err:
        proc = subprocess.Popen([args[0], "-nostats", "-loglevel", "error", "-progress", str(prog)] + args[1:], stdout=subprocess.DEVNULL, stderr=err)
        while proc.poll() is None:
            time.sleep(3)
            try:
                us = re.findall(r"out_time_us=(\d+)", prog.read_text(encoding="utf8", errors="ignore"))
                pct = min(99.9, int(us[-1]) / 1e6 / total * 100) if us else 0
                (HERE / "progres.txt").write_text(f"{label}: {pct:.0f}% ({time.strftime('%H:%M:%S')})", encoding="utf8")
            except (OSError, ValueError): pass
    (HERE / "progres.txt").write_text(f"{label}: selesai ({time.strftime('%H:%M:%S')})", encoding="utf8")
    if proc.returncode: print(log.read_text(encoding="utf8")[-3000:]); raise SystemExit("ffmpeg gagal: " + label)


def sync_times(webm, n):
    """Waktu (detik, waktu video) setiap pergantian warna penanda 8x8 di pojok kiri atas."""
    raw = subprocess.run([FF, "-v", "error", "-i", str(webm), "-vf", "crop=8:8:0:0,scale=1:1:flags=area,format=gray", "-r", "60", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    times, state = [], None
    for k, v in enumerate(raw):
        s = v > 127
        if state is not None and s != state: times.append(k / 60)
        state = s
    if len(times) > n: times = times[-n:]   # pergantian ekstra di awal: layar kosong (putih) sebelum halaman panggung dimuat
    if len(times) != n:
        raise SystemExit(f"penanda sinkron: terbaca {len(times)}, seharusnya {n}")
    return times


def mux(webm, beats, out):
    """Suara tiap ketukan ditaruh pada waktu penandanya di video; video dipotong dari ketukan pertama sampai penanda akhir."""
    t = sync_times(webm, len(beats) + 1)
    t_cut, t_end = t[0], t[-1] + 0.6
    args = [FF, "-y", "-ss", f"{t_cut:.3f}", "-i", str(webm)]
    for b in beats: args += ["-i", str(b["mp3"])]
    parts = []
    for k, b in enumerate(beats):
        ms = max(0, int((t[k] - t_cut) * 1000) + 60)
        parts.append(f"[{k + 1}:a]adelay={ms}|{ms},aresample=48000[a{k}]")
    filt = ";".join(parts) + ";" + "".join(f"[a{k}]" for k in range(len(beats))) + f"amix=inputs={len(beats)}:normalize=0,apad[aout]"
    # tutup kotak penanda (8x8 kiri atas) dengan potongan latar tepat di sebelah kanannya
    filt += ";[0:v]split[v1][v2];[v2]crop=12:12:12:0[pt];[v1][pt]overlay=0:0[vout]"
    args += ["-filter_complex", filt, "-map", "[vout]", "-map", "[aout]", "-t", f"{t_end - t_cut:.3f}",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", "30", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)]
    ffmpeg(args, "gabung suara " + out.name, t_end - t_cut)
    print(out, round(out.stat().st_size / 1e6, 1), "MB", round(t_end - t_cut), "detik")
    return [x - t_cut for x in t], t_end - t_cut


def srt(rel, beats, out):
    """Subtitle per kalimat, sesuai waktu video."""
    def ts(s): ms = int(s * 1000); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    rows = [f"{k + 1}\n{ts(rel[k] + .06)} --> {ts(rel[k] + .06 + b['dur'])}\n{b['say']}\n" for k, b in enumerate(beats)]
    out.write_text("\n".join(rows), encoding="utf8")


def split_parts(mp4, rel, beats, total, out_stem, limit=59.0):
    """Potong jadi bagian <= limit detik, selalu di awal adegan (untuk Instagram Story)."""
    starts = [rel[k] for k, b in enumerate(beats) if b["first"]] + [total]
    cuts, a = [0.0], 0.0
    for i in range(1, len(starts)):
        if starts[i] - a > limit:
            assert starts[i - 1] > a, "satu adegan lebih panjang dari batas story"
            a = starts[i - 1]; cuts.append(a)
    cuts.append(total); n = len(cuts) - 1; outs = []
    for k in range(n):
        o = out_stem.parent / f"{out_stem.name}-{k + 1}-dari-{n}.mp4"
        ffmpeg([FF, "-y", "-ss", f"{cuts[k]:.3f}", "-to", f"{cuts[k + 1]:.3f}", "-i", str(mp4), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(o)], f"potong bagian {k + 1}/{n}", cuts[k + 1] - cuts[k])
        outs.append((o, round(cuts[k + 1] - cuts[k], 1)))
    for o, d in outs: print(o.name, d, "detik")
    return outs
