"""Rakit demo Saget Kasir (contoh toko: Lingkar Kopi) menjadi satu file HTML tanpa internet: promo/kasir/kasir-lingkar-demo.html
- Huruf: Inter (SIL Open Font License 1.1), tools/fonts/Inter-latin-var.woff2, ditanam base64.
- Ikon: Lucide (ISC), diambil dari node_modules/lucide-vue-next lalu dijadikan sprite <symbol id="i-nama">.
Jalankan: python tools/kasir_build.py"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ["shopping-cart", "chef-hat", "receipt", "chart-column", "rotate-ccw", "coffee", "cup-soda", "sandwich", "cookie", "croissant", "popcorn",
         "utensils", "shopping-bag", "user", "bookmark", "trash-2", "tag", "banknote", "qr-code", "credit-card", "printer", "message-circle", "ban",
         "check", "circle-check", "x", "plus", "minus", "search", "delete", "clock", "wallet", "arrow-down-left", "arrow-up-right", "store", "bike",
         "circle-alert", "pencil", "hand-coins", "list-ordered", "timer", "leaf", "glass-water", "download",
         "circle-question-mark", "book-open", "lightbulb", "bluetooth", "wrench", "info"]


def symbol(name):
    src = (ROOT / f"node_modules/lucide-vue-next/dist/esm/icons/{name}.js").read_text(encoding="utf8")
    body = src[src.index("createLucideIcon("):]
    parts = []
    for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{([^}]*)\}\s*\]', body):
        kv = [(k, v) for k, v in re.findall(r'(\w+):\s*"([^"]*)"', attrs) if k != "key"]
        parts.append("<%s %s/>" % (tag, " ".join('%s="%s"' % kv_ for kv_ in kv)))
    assert parts, name
    return f'<symbol id="i-{name}" viewBox="0 0 24 24">{"".join(parts)}</symbol>'


def main():
    tpl = (ROOT / "tools/kasir-demo.html").read_text(encoding="utf8")
    font = base64.b64encode((ROOT / "tools/fonts/Inter-latin-var.woff2").read_bytes()).decode()
    sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + "".join(symbol(n) for n in ICONS) + "</svg>"
    out = ROOT / "promo/kasir/kasir-lingkar-demo.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(tpl.replace("__FONT__", font).replace("__ICONS__", sprite), encoding="utf8")
    print(out, out.stat().st_size)


if __name__ == "__main__":
    main()
