"""Collection launch pages (collections/<slug>.html).

Built on the "premium furniture site" approach: dark cinematic hero, a sticky
scene that reveals the product while scrolling, key figures with counters,
"why" tiles, material details on black, a full-screen configurator, the
collection line-up, a technical sheet and a closing call to action.

Run after tools/build_site.py (it imports its page chrome):
    python3 tools/build_collections.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import build_site as bs  # noqa: E402

esc = bs.esc

# slug: (name, line, claim, three reveal lines, designer, catalogue)
COLLECTIONS = {
    "one": ("One", "Executive", "Nature at the desk.",
            ["Wood, glass, steel, leather and stone.", "A semi-rough stone that feels natural to the touch.", "Every material natural and recyclable."],
            None, "Codutti-One-Catalogue.pdf"),
    "isixty": ("iSixty", "Executive", "Sixty years, one line.",
               ["A flowing profile from top to base.", "Leather, glass and wood in balance.", "Built for the corner office."],
               None, "Codutti-iSixty-Catalogue.pdf"),
    "genesis": ("Genesis", "Executive", "Light by design.",
                ["A die-cast joint holds the top.", "Glass, wood or lacquer above, slender legs below.", "From the single desk to the boardroom."],
                None, "Codutti-Genesis-Catalogue.pdf"),
    "alfaomega": ("Alfaomega", "Executive", "Statement in leather.",
                  ["Curved sides wrapped in hand-stitched leather.", "Glass and lacquer tops.", "Desks, boardrooms and storage in one language."],
                  None, "Codutti-Alfaomega-Catalogue.pdf"),
    "mithos": ("Mithos", "Executive", "Sculpted for leadership.",
               ["A single curve from top to floor.", "Embossed leather and dark veneers.", "Executive office, home office and meeting room."],
               "Paolo Galeotti", "Codutti-Mithos-Catalogue.pdf"),
    "cloud": ("Cloud", "Executive", "A top that floats.",
              ["Light structures, generous tops.", "HPL, ash veneers and glass.", "Desks, tables and coffee tables."],
              "Robby Cantarutti", None),
    "ginza": ("Ginza", "Executive", "Calm, in solid form.",
              ["Monolithic bases in oak and stone.", "Travertine, Piasentina and lacquer.", "Tables, benches and chests."],
              "Robby Cantarutti", None),
    "attiva": ("Attiva", "Operative", "Work, well arranged.",
               ["Frame legs in steel or wood.", "Desks, returns and meeting tables.", "Storage that matches every top."],
               None, "Codutti-Attiva-Catalogue.pdf"),
    "team": ("Team", "Operative", "Built for teams.",
             ["Single desks, benches and sharing tables.", "Cable management built in.", "Storage walls that close the space."],
             None, "Codutti-Team-Catalogue.pdf"),
    "2be": ("2BE", "Operative", "The office as a place to be.",
            ["Desks, workstations and round tables.", "Planters, lockers and shelving.", "Sharing and break areas in one system."],
            "Daniele Canuti", "Codutti-2BE-Catalogue.pdf"),
    "adjustable-desks": ("Height Adjustable", "Operative", "Sit. Stand. Switch.",
                         ["Electric lift in seconds.", "Up to 126 cm, Bluetooth keypad with OLED display.", "Single desk, bench, meeting and wall tables."],
                         None, "Codutti-Height-Adjustable-Catalogue.pdf"),
}

FAMILY_LABEL = dict(bs.FAMILIES)


def hero_png(prod):
    """Transparent PNG of the product's first still life, for dark scenes."""
    src = os.path.join(ROOT, prod["variants"][0]["image"])
    dst_rel = os.path.join(os.path.dirname(prod["variants"][0]["image"]), "hero.png")
    dst = os.path.join(ROOT, dst_rel)
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
        whiteness = im.min(axis=2)
        alpha = np.clip((250 - whiteness) / 22, 0, 1)
        rgba = np.dstack([im, alpha * 255]).astype(np.uint8)
        out = Image.fromarray(rgba, "RGBA")
        out.thumbnail((1400, 1400), Image.LANCZOS)
        out.save(dst, optimize=True)
    return dst_rel


def collection_page(slug, meta, products, fins):
    p = "../"
    name, line, claim, reveal, designer, catalogue = meta
    items = [x for x in products if x.get("collection") == slug]
    if not items:
        return None
    hero = items[0]
    hero_img = hero_png(hero)
    codes = []
    for x in items:
        for c in x.get("finishes") or []:
            if c in fins and c not in codes:
                codes.append(c)
    families = []
    for c in codes:
        fam = fins[c]["family"]
        if fam not in families:
            families.append(fam)
    versions = sum(len(x["variants"]) for x in items)
    gallery = [g for x in items for g in x["gallery"]]

    anchors = [("overview", "col.overview", "Overview"), ("design", "col.design", "Design"),
               ("configure", "col.configure", "Configure"), ("lineup", "col.lineup", "Line-up"),
               ("specs", "col.specs", "Specifications")]
    subnav = "".join(f'<a href="#{a}" data-i18n="{k}">{l}</a>' for a, k, l in anchors)

    # Key figures
    figures = [(len(items), "col.fig.products", "products"), (versions, "col.fig.versions", "versions"),
               (len(codes), "col.fig.finishes", "catalogue finishes"), (1954, "col.fig.since", "made in Friuli since")]
    figures_html = "".join(
        f'<div class="cl-fig"><span class="cl-fig__num" data-count="{n}">{n}</span>'
        f'<span class="cl-fig__label" data-i18n="{k}">{l}</span></div>' for n, k, l in figures if n)

    # Why tiles
    fam_names = ", ".join(FAMILY_LABEL.get(f, f) for f in families[:4]) or "Wood, metal and leather"
    tiles = [
        ("col.why.materials", "Materials", fam_names + "."),
        ("col.why.made", "Made in Friuli", "Designed, machined and finished in our own factory since 1954."),
        ("col.why.modular", "Modular", f"{len(items)} product families, {versions} versions that work together."),
        ("col.why.bespoke", "Bespoke", "Sizes and finishes beyond the catalogue, on request."),
    ]
    tiles_html = "".join(f'<div class="cl-tile reveal"><h3 data-i18n="{k}">{t}</h3><p>{esc(d)}</p></div>' for k, t, d in tiles)

    # Material details on black
    details = gallery[:3]
    detail_caps = [FAMILY_LABEL.get(f, f) for f in families[:3]] + ["", "", ""]
    details_html = "".join(
        f'<figure class="cl-macro__item"><img src="{p}{g}" alt="" loading="lazy">'
        f'<figcaption>{esc(detail_caps[i])}</figcaption></figure>' for i, g in enumerate(details))

    # Configurator
    cfg_products = "".join(
        f'<button type="button" class="cfg-opt{" is-on" if i == 0 else ""}" data-product="{esc(x["name"])}" '
        f'data-variants=\'{esc(json.dumps([[v["key"], p + v["image"]] for v in x["variants"]]))}\' aria-pressed="{"true" if i == 0 else "false"}">'
        f'<img src="{p}{x["variants"][0]["image"]}" alt="" loading="lazy"><span>{esc(bs.sub_meta(x)[1])}</span></button>'
        for i, x in enumerate(items))
    cfg_fams = []
    for fam in families:
        sw = [fins[c] for c in codes if fins[c]["family"] == fam]
        btns = "".join(
            f'<button type="button" class="cfg-sw{" is-on" if j == 0 else ""}" data-code="{f["code"]}" data-name="{esc(f["en"] or f["it"])}" '
            f'title="{f["code"]} {esc(f["en"] or f["it"])}" aria-pressed="{"true" if j == 0 else "false"}">'
            f'<img src="{p}assets/img/finishes/{f["code"].lower()}.jpg" alt="{f["code"]} {esc(f["en"] or f["it"])}"></button>'
            for j, f in enumerate(sw))
        cfg_fams.append(f'<div class="cfg-group" data-family="{esc(FAMILY_LABEL.get(fam, fam))}">'
                        f'<p class="cfg-label" data-i18n="fam.{fam}">{esc(FAMILY_LABEL.get(fam, fam))}</p>'
                        f'<div class="cfg-swatches">{btns}</div></div>')

    # Line-up
    lineup = "".join(
        f'''<a class="cl-model" href="{p}products/item/{x["slug"]}.html">
          <span class="cl-model__media"><img src="{p}{x["variants"][0]["image"]}" alt="{esc(x["name"])}" loading="lazy"></span>
          <span class="cl-model__type" data-i18n="{bs.sub_meta(x)[0]}">{esc(bs.sub_meta(x)[1])}</span>
          <dl class="cl-model__data">
            <div><dt data-i18n="col.fig.versions">versions</dt><dd>{len(x["variants"])}</dd></div>
            <div><dt data-i18n="col.fig.fin">finishes</dt><dd>{len([c for c in (x.get("finishes") or []) if c in fins])}</dd></div>
            <div><dt data-i18n="col.line">line</dt><dd>{line}</dd></div>
          </dl>
          <span class="cl-model__more" data-i18n="col.discover">Discover</span>
        </a>''' for x in items)

    # Technical sheet
    rows = [("col.spec.line", "Line", line),
            ("col.spec.products", "Products", ", ".join(bs.sub_meta(x)[1] for x in items)),
            ("col.spec.materials", "Materials", ", ".join(FAMILY_LABEL.get(f, f) for f in families) or "—"),
            ("col.spec.finishes", "Catalogue finishes", str(len(codes))),
            ("col.spec.production", "Production", "In-house, Friuli Venezia Giulia, Italy"),
            ("col.spec.certs", "Certifications", "ISO 9001 · FSC® Chain of Custody"),
            ("col.spec.dimensions", "Dimensions", "See catalogue; bespoke sizes on request")]
    if designer:
        rows.insert(1, ("col.spec.designer", "Design", designer))
    rows_html = "".join(f'<tr><th scope="row" data-i18n="{k}">{l}</th><td>{esc(v)}</td></tr>' for k, l, v in rows)
    pdf = ""
    if catalogue and os.path.exists(os.path.join(ROOT, "assets/docs", catalogue)):
        pdf = f'<a class="feature__btn" href="{p}assets/docs/{catalogue}" download data-i18n="prod.catalogue">Download the catalogue</a>'

    gal_html = "".join(f'<figure class="pd-gallery__item"><img src="{p}{g}" alt="" loading="lazy"></figure>' for g in gallery)
    reveal_html = "".join(f'<p class="cl-scene__line" data-step="{i}">{esc(t)}</p>' for i, t in enumerate(reveal))

    main = f'''  <nav class="pd-subnav cl-subnav" aria-label="{esc(name)}">
    <div class="pd-subnav__inner wrap">
      <span class="pd-subnav__name">{esc(name)}</span>
      <span class="pd-subnav__links">{subnav}</span>
      <a class="pd-subnav__cta" href="#configure" data-i18n="tour.outro.cta">Request a quote</a>
    </div>
  </nav>

  <section class="cl-hero" id="overview">
    <div class="cl-hero__inner">
      <p class="cl-eyebrow">{esc(line)} · <span data-i18n="col.collection">Collection</span></p>
      <h1 class="cl-hero__title">{esc(name)}</h1>
      <p class="cl-hero__claim">{esc(claim)}</p>
      <img class="cl-hero__img" src="{p}{hero_img}" alt="{esc(name)} — {esc(hero['name'])}" fetchpriority="high">
      <div class="cl-hero__ctas">
        <a class="feature__btn" href="#configure" data-i18n="col.configure">Configure</a>
        <a class="feature__link" href="#design" data-i18n="col.discover">Discover</a>
      </div>
    </div>
  </section>

  <section class="cl-scene" id="design" aria-label="{esc(name)}">
    <div class="cl-scene__sticky">
      <img class="cl-scene__img" src="{p}{hero_img}" alt="" loading="lazy">
      <div class="cl-scene__text">{reveal_html}</div>
    </div>
  </section>

  <section class="cl-figs">
    <div class="cl-figs__grid wrap">{figures_html}</div>
  </section>

  <section class="cl-why wrap">
    <h2 class="cl-h2 reveal"><span data-i18n="col.why">Why</span> {esc(name)}</h2>
    <div class="cl-tiles">{tiles_html}</div>
  </section>

  <section class="cl-macro" aria-label="Details">
    <div class="cl-macro__grid wrap">{details_html}</div>
  </section>

  <section class="cfg" id="configure" data-collection="{esc(name)}" data-contact="{p}contact.html">
    <div class="cfg__inner wrap">
      <div class="cfg__stage"><img class="cfg__img" src="{p}{items[0]["variants"][0]["image"]}" alt="{esc(items[0]["name"])}"></div>
      <div class="cfg__panel">
        <h2 class="cl-h2"><span data-i18n="col.configure">Configure</span> {esc(name)}</h2>
        <p class="cfg-label" data-i18n="col.cfg.product">Product</p>
        <div class="cfg-products">{cfg_products}</div>
        <p class="cfg-label" data-i18n="col.cfg.version">Version</p>
        <div class="cfg-variants"></div>
        {"".join(cfg_fams)}
        <div class="cfg-summary">
          <p class="cfg-label" data-i18n="col.cfg.summary">Your configuration</p>
          <ul class="cfg-summary__list"></ul>
          <a class="feature__btn cfg-cta" href="{p}contact.html" data-i18n="col.cfg.cta">Request a quote for this configuration</a>
        </div>
      </div>
    </div>
  </section>

  <section class="cl-lineup wrap" id="lineup">
    <h2 class="cl-h2 reveal" data-i18n="col.lineup">Line-up</h2>
    <div class="cl-lineup__grid">{lineup}</div>
  </section>

  <section class="cl-specs wrap" id="specs">
    <h2 class="cl-h2 reveal" data-i18n="col.specs">Specifications</h2>
    <table class="cl-spec">{rows_html}</table>
    <div class="feature__ctas cl-specs__ctas">{pdf}<a class="feature__link" href="{p}materials.html" data-i18n="prod.finishes">Finishes</a></div>
  </section>

  {"<section class='pd-section pd-gallery'><h2 class='pd-section__title wrap' data-i18n='prod.ambients'>In the space</h2><div class='pd-gallery__track' tabindex='0'>" + gal_html + "</div></section>" if gallery else ""}

  <section class="cl-heritage">
    <p class="cl-heritage__year">1954</p>
    <p class="cl-heritage__line" data-i18n="col.heritage">Designed and made in our own factory in Friuli.</p>
  </section>
{bs.closing(p)}'''
    return bs.page(p, name, f"{name} — {line} collection by Codutti: {claim}", main, "page-collection", ("products", "collection"))


def home_lineup(products, fins):
    """Range line-up on the landing page: tabs per line, 3 key figures per model."""
    tabs = [("exec", "col.tab.executive", "Executive", [k for k, m in COLLECTIONS.items() if m[1] == "Executive"]),
            ("oper", "col.tab.operative", "Operative", [k for k, m in COLLECTIONS.items() if m[1] == "Operative"]),
            ("meet", "col.tab.meeting", "Meeting", None)]
    btns, panels = [], []
    for i, (tid, key, label, slugs) in enumerate(tabs):
        btns.append(f'<button type="button" role="tab" class="lu-tab{" is-on" if i == 0 else ""}" id="lu-t-{tid}" aria-controls="lu-p-{tid}" aria-selected="{"true" if i == 0 else "false"}" data-i18n="{key}">{label}</button>')
        cards = []
        if slugs:
            for slug in slugs:
                items = [x for x in products if x.get("collection") == slug]
                if not items:
                    continue
                name = COLLECTIONS[slug][0]
                versions = sum(len(x["variants"]) for x in items)
                nfin = len({c for x in items for c in (x.get("finishes") or []) if c in fins})
                cards.append((name, COLLECTIONS[slug][2], items[0]["variants"][0]["image"], f"collections/{slug}.html",
                              [(len(items), "col.fig.products", "products"), (versions, "col.fig.versions", "versions"), (nfin, "col.fig.fin", "finishes")]))
        else:
            for x in [x for x in products if "meeting-tables" in x["subcategories"]][:8]:
                cards.append((x["name"], bs.sub_meta(x)[1], x["variants"][0]["image"], f"products/item/{x['slug']}.html",
                              [(len(x["variants"]), "col.fig.versions", "versions"), (len([c for c in (x.get("finishes") or []) if c in fins]), "col.fig.fin", "finishes"), (1954, "col.fig.year", "since")]))
        html = "".join(f'''<a class="lu-card" href="{u}">
          <span class="lu-card__media"><img src="{img}" alt="{esc(n)}" loading="lazy"></span>
          <span class="lu-card__name">{esc(n)}</span>
          <span class="lu-card__claim">{esc(c)}</span>
          <dl class="cl-model__data">{"".join(f'<div><dt data-i18n="{k}">{l}</dt><dd>{v}</dd></div>' for v, k, l in data)}</dl>
          <span class="cl-model__more" data-i18n="col.discover">Discover</span>
        </a>''' for n, c, img, u, data in cards)
        panels.append(f'<div class="lu-panel" role="tabpanel" id="lu-p-{tid}" aria-labelledby="lu-t-{tid}"{"" if i == 0 else " hidden"}><div class="lu-track">{html}</div></div>')
    block = f'''  <!-- lineup:start -->
  <section class="lu" id="range" aria-labelledby="lu-title">
    <div class="wrap">
      <h2 class="cl-h2 reveal" id="lu-title" data-i18n="col.range">The range</h2>
      <div class="lu-tabs" role="tablist">{"".join(btns)}</div>
      {"".join(panels)}
    </div>
  </section>
  <!-- lineup:end -->'''
    path = os.path.join(ROOT, "index.html")
    s = open(path, encoding="utf-8").read()
    a, b = s.index("  <!-- lineup:start -->"), s.index("<!-- lineup:end -->") + len("<!-- lineup:end -->")
    open(path, "w", encoding="utf-8").write(s[:a] + block + s[b:])


def main():
    products = bs.load_products()
    fins = bs.load_finishes()
    # home_lineup(products, fins)  # range line-up removed from the landing on request
    for slug, meta in COLLECTIONS.items():
        html = collection_page(slug, meta, products, fins)
        if html:
            bs.write(f"collections/{slug}.html", html)
            print("collection", slug)


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
