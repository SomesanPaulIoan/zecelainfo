#!/usr/bin/env python3
"""Genereaza app/dark-theme.css din paleta Tailwind (node_modules/tailwindcss/theme.css).

Ideea: in Tailwind v4 fiecare clasa de culoare foloseste var(--color-<nume>-<nuanta>).
In modul intunecat (html.dark) redefinim aceste variabile:
  - griurile (slate/gray/zinc/...) se inverseaza pe o scara de luminozitate aleasa manual;
  - culorile (sky/amber/...) se inverseaza 50<->950, 100<->900 etc. (nuantele deschise devin fundaluri inchise);
  - elementele care au deja fundal inchis/saturat (bg-sky-700, bg-zinc-950, gradiente, text-white...)
    primesc inapoi paleta originala, ca butoanele si zonele de cod sa ramana cum au fost proiectate.
Ruleaza: python3 scripts/gen-dark-theme.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
theme = (ROOT / "node_modules/tailwindcss/theme.css").read_text()

SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"]
CHROMATIC = ["red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan",
             "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"]

colors = {}
for name, shade, l, c, h in re.findall(r"--color-([a-z]+)-(\d+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)", theme):
    colors[(name, int(shade))] = (float(l), float(c), float(h))

def oklch(l, c, h):
    return f"oklch({l:.1f}% {c:.3f} {h:.1f})"

# Luminozitatea pe care o primeste fiecare nuanta de gri in modul intunecat.
NEUTRAL_L = {50: 14, 100: 25, 200: 31, 300: 40, 400: 56, 500: 64, 600: 74, 700: 84, 800: 91, 900: 95, 950: 98}
WHITE_DARK = oklch(19.5, 0.03, 262)  # suprafata principala (bg-white)

dark, light = [], []
for name in NEUTRALS + CHROMATIC:
    for s in SHADES:
        l, c, h = colors[(name, s)]
        light.append(f"  --color-{name}-{s}: {oklch(l, c, h)};")
        if name in NEUTRALS:
            dark.append(f"  --color-{name}-{s}: {oklch(NEUTRAL_L[s], min(c, 0.045), h)};")
        else:
            il, ic, ih = colors[(name, SHADES[len(SHADES) - 1 - SHADES.index(s)])]
            if s <= 200:  # fundaluri nuantate: mai putin saturate, sa nu "tipe" pe fundal inchis
                ic *= 0.6
                il = min(il, 30)
            dark.append(f"  --color-{name}-{s}: {oklch(il, ic, h)};")
light.append("  --color-white: #fff;")
dark.append(f"  --color-white: {WHITE_DARK};")

# Fundaluri care raman "ca in modul luminos" (deja inchise sau saturate).
keep = []
for name in CHROMATIC:
    for s in [300, 400, 500, 600, 700, 800, 900, 950]:
        for p in ["bg", "from", "via"]:
            keep.append(f"{p}-{name}-{s}")
for name in NEUTRALS:
    for s in [600, 700, 800, 900, 950]:
        for p in ["bg", "from", "via"]:
            keep.append(f"{p}-{name}-{s}")
keep += ["text-white"]
# Potrivim clasa ca token separat (nu si hover:bg-...), cu sau fara modificator de opacitate.
sel = ",".join(f'[class^="{k}"],[class*=" {k}"]' for k in keep)
# bg-black da, dar NU bg-black/45 etc.: acelea sunt fundaluri transparente in spatele
# pop-up-urilor si ar readuce paleta luminoasa in tot modalul (text gri deschis pe alb).
sel += ',[class^="bg-black"]:not([class*="bg-black/"]),[class*=" bg-black"]:not([class*="bg-black/"])'

out = f"""/* GENERAT de scripts/gen-dark-theme.py — nu edita manual. */
html.dark {{
  color-scheme: dark;
{chr(10).join(dark)}
}}

html.dark :is({sel}) {{
{chr(10).join(light)}
}}
"""
(ROOT / "app/dark-theme.css").write_text(out)
print(f"scris app/dark-theme.css ({len(out)//1024} KB, {len(keep)} clase pastrate)")
