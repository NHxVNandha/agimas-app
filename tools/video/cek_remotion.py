"""Cek sinkron video Remotion: awal tiap kalimat menurut data (frame) vs awal suara di video (silencedetect)."""
import json, re, statistics, subprocess, sys
from vidlib import FF
R = "D:/HU/AgiMasApp"
for app, folder in (("agimas", "agimas"), ("kasir", "saget-kasir")):
    d = json.load(open(f"{R}/remotion/src/gen/{app}.json", encoding="utf8"))
    for kind, key, sub, suf in [(k, key, sub, suf) for k, key in (("promosi", "promo"), ("deskripsi", "desc"), ("tutorial", None)) for sub, suf in (("", ""), ("vertikal/", "-vertikal"))]:
        mp4 = f"{R}/promo/video-remotion/{folder}/{sub}{folder}-{kind}{suf}.mp4"
        frames = [b["frames"] for s in d["tutorial"] for b in s["beats"]] if key is None else [l["frames"] for l in d[key]]
        starts, t = [], 0
        for f in frames: starts.append(t / d["fps"]); t += f
        try:
            err = subprocess.run([FF, "-i", mp4, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"], capture_output=True, text=True).stderr
        except Exception as e: print(mp4, "belum ada"); continue
        if "No such file" in err: print(f"{folder}-{kind}{suf}: belum ada"); continue
        voice = [0.0] + [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
        dev = [min((v - s for v in voice if -0.3 <= v - s <= 1.0), key=abs) for s in starts if any(-0.3 <= v - s <= 1.0 for v in voice)]
        print(f"{folder}-{kind}{suf}: {len(starts)} kalimat, terukur {len(dev)}; suara mulai setelah gambar: median {statistics.median(dev)*1000:.0f} ms, terbesar {max(dev, key=abs)*1000:.0f} ms")
