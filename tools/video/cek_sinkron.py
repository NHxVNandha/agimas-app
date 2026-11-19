"""Cek sinkron: waktu penanda tiap kalimat (dari video mentah) vs awal suara di video jadi (silencedetect).
Pakai: python cek_sinkron.py <raw.webm|folder-raw> <video-jadi.mp4> [jumlah-kalimat]"""
import re, subprocess, sys, pathlib, statistics
from vidlib import FF, sync_times

p = pathlib.Path(sys.argv[1]); raw = p if p.suffix == ".webm" else max(p.glob("*.webm"), key=lambda f: f.stat().st_mtime)
mp4 = sys.argv[2]
# jumlah penanda tidak diketahui di sini: baca semua pergantian
data = subprocess.run([FF, "-v", "error", "-i", str(raw), "-vf", "crop=8:8:0:0,scale=1:1:flags=area,format=gray", "-r", "60", "-f", "rawvideo", "-"], capture_output=True).stdout
t, st = [], None
for k, v in enumerate(data):
    s = v > 127
    if st is not None and s != st: t.append(k / 60)
    st = s
n = int(sys.argv[3]) if len(sys.argv) > 3 else len(re.findall(r"(?m)^\d+$", pathlib.Path(mp4).with_suffix(".srt").read_text(encoding="utf8")))
t = t[-(n + 1):]                                          # buang pergantian ekstra di awal (layar kosong sebelum panggung dimuat)
beats = [x - t[0] for x in t[:-1]]                       # penanda terakhir = akhir video
err = subprocess.run([FF, "-i", mp4, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [0.0] + [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]   # suara mulai saat sunyi berakhir
dev = []
for b in beats:
    near = [s - b for s in starts if -0.3 <= s - b <= 1.0]
    if near: dev.append(min(near, key=abs))
print(f"{pathlib.Path(mp4).name}: {len(beats)} kalimat, cocok {len(dev)}; selisih suara-gambar median {statistics.median(dev)*1000:.0f} ms, "
      f"terbesar {max(dev, key=abs)*1000:.0f} ms" if dev else "tidak ada yang cocok")
