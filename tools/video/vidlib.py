"""Perekam video tutorial: panggung 1920x1080 (panel langkah + aplikasi di iframe), kursor sentuh tiruan,
narasi edge-tts (id-ID-ArdiNeural, suara pria), digabung ffmpeg dari imageio-ffmpeg."""
import asyncio, functools, http.server, json, pathlib, re, shutil, subprocess, threading, time
import edge_tts, imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = pathlib.Path(__file__).parent
VOICE = "id-ID-ArdiNeural"


def tts(scenes, outdir, rate="+0%"):
    """Satu mp3 per adegan; dilewati bila teksnya sama dengan sebelumnya. Mengisi sc['dur'] (detik)."""
    outdir.mkdir(parents=True, exist_ok=True)
    async def one(i, sc):
        mp3, txt = outdir / f"{i:02d}.mp3", outdir / f"{i:02d}.txt"
        if not (mp3.exists() and txt.exists() and txt.read_text(encoding="utf8") == sc["say"] + rate):
            await edge_tts.Communicate(sc["say"], VOICE, rate=rate).save(str(mp3))
            txt.write_text(sc["say"] + rate, encoding="utf8")
        sc["mp3"] = mp3
    async def all_():
        for i, sc in enumerate(scenes): await one(i, sc)
    asyncio.run(all_())
    for sc in scenes: sc["dur"] = duration(sc["mp3"])


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
        self.pg, self.t0, self.marks = page, time.time(), []
        self.fsel = frame_sel

    @property
    def f(self): return self.pg.frame_locator(self.fsel)

    def now(self): return time.time() - self.t0

    # ---- kursor sentuh tiruan (di halaman panggung, koordinat layar)
    def point(self, loc, dx=0.5, dy=0.5):
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

    def hide_cursor(self): self.pg.evaluate("window.cur(-100,-100)")

    def scroll(self, sel, dy, ms=900):
        loc = self.f.locator(sel).first
        loc.evaluate("(e,[dy,ms]) => e.scrollBy({top:dy,behavior:'smooth'})", [dy, ms]); self.pg.wait_for_timeout(ms)

    # ---- adegan
    def run(self, scenes, total):
        for i, sc in enumerate(scenes):
            start = self.now()
            self.pg.evaluate("(a) => window.step(a)", {"i": i, "n": total, "title": sc["title"], "say": sc["say"], "card": sc.get("card")})
            self.marks.append((start, sc))
            self.pg.wait_for_timeout(int(sc.get("settle", 0 if sc.get("card") else 1.1) * 1000))   # tunggu ayunan 3D perangkat selesai sebelum mengetuk
            try:
                if sc.get("act"): sc["act"](self)
            except Exception as e:
                print("ADEGAN GAGAL", i, sc["title"], repr(e)[:300]); raise
            left = start + sc["dur"] + sc.get("pad", 0.7) - self.now()
            if left > 0: self.pg.wait_for_timeout(int(left * 1000))
            print(f"{i:02d} {sc['title'][:40]:40s} narasi {sc['dur']:5.1f}s  adegan {self.now() - start:5.1f}s", flush=True)
        self.end = self.now()


def mux(webm, marks, end, out):
    """Potong video mulai adegan pertama, taruh tiap narasi pada waktunya, encode mp4 H.264 + AAC."""
    t_cut = marks[0][0]
    args = [FF, "-y", "-ss", f"{t_cut:.3f}", "-i", str(webm)]
    for _, sc in marks: args += ["-i", str(sc["mp3"])]
    parts = []
    for k, (t, sc) in enumerate(marks):
        ms = max(0, int((t - t_cut) * 1000) + 250)
        parts.append(f"[{k + 1}:a]adelay={ms}|{ms},aresample=48000[a{k}]")
    filt = ";".join(parts) + ";" + "".join(f"[a{k}]" for k in range(len(marks))) + f"amix=inputs={len(marks)}:normalize=0,apad[aout]"
    args += ["-filter_complex", filt, "-map", "0:v", "-map", "[aout]", "-t", f"{end - t_cut:.3f}",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", "30", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); raise SystemExit("ffmpeg gagal")
    print(out, round(out.stat().st_size / 1e6, 1), "MB", round(end - t_cut), "detik")


def srt(marks, out):
    """Teks terjemahan (subtitle) terpisah, untuk YouTube/Facebook."""
    t_cut = marks[0][0]
    def ts(s): ms = int(s * 1000); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    rows = []
    for k, (t, sc) in enumerate(marks):
        a = t - t_cut + 0.25
        rows.append(f"{k + 1}\n{ts(a)} --> {ts(a + sc['dur'])}\n{sc['say']}\n")
    out.write_text("\n".join(rows), encoding="utf8")


def split_parts(mp4, marks, end, out_stem, limit=59.0):
    """Potong video penuh jadi bagian <= limit detik, selalu di awal adegan (untuk Instagram Story)."""
    t_cut = marks[0][0]; starts = [t - t_cut for t, _ in marks] + [end - t_cut]
    cuts, a = [0.0], 0.0
    for i in range(1, len(starts)):
        if starts[i] - a > limit:
            assert starts[i - 1] > a, "satu adegan lebih panjang dari batas story"
            a = starts[i - 1]; cuts.append(a)
    cuts.append(starts[-1]); n = len(cuts) - 1; outs = []
    for k in range(n):
        o = out_stem.parent / f"{out_stem.name}-{k + 1}-dari-{n}.mp4"
        r = subprocess.run([FF, "-y", "-ss", f"{cuts[k]:.3f}", "-to", f"{cuts[k + 1]:.3f}", "-i", str(mp4), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(o)], capture_output=True, text=True)
        if r.returncode: print(r.stderr[-2000:]); raise SystemExit("ffmpeg gagal")
        outs.append((o, round(cuts[k + 1] - cuts[k], 1)))
    for o, d in outs: print(o.name, d, "detik")
    return outs
