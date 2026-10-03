"""Site generator.

Rewrites the shared chrome (header, language panel, menu) on every page and
generates: projects.html, downloads.html, the product pages (from
assets/data/products.json) and the site-search index.

    python3 tools/build_site.py
"""
import html
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
esc = html.escape

# --------------------------------------------------------------------------
# Taxonomy
# --------------------------------------------------------------------------
TAXONOMY = [
    ("desks", "cat.desks", "Desks", "prod.intro.desks",
     "Executive and operative desks, from the corner office to the shared bench.",
     [("executive-desks", "sub.executiveDesks", "Executive Desks"),
      ("operative-desks", "sub.operativeDesks", "Operative Desks"),
      ("adjustable-desks", "sub.adjustableDesks", "Adjustable Desks"),
      ("system-benches", "sub.systemBenches", "System Benches")]),
    ("tables-and-sharings", "cat.tables", "Meetings", "prod.intro.tables",
     "Meeting and sharing tables sized to the way your team works together.",
     [("meeting-tables", "sub.meetingTables", "Meeting Tables"),
      ("sharing-tables", "sub.sharingTables", "Sharing Tables")]),
    ("seatings", "cat.seatings", "Seatings", "prod.intro.seatings",
     "Chairs, armchairs, sofas and stools for every room of the office.",
     [("executive-chairs", "sub.executiveChairs", "Executive Chairs"),
      ("task-chairs", "sub.taskChairs", "Task Chairs"),
      ("meeting-guest-chairs", "sub.meetingChairs", "Meeting & Guest Chairs"),
      ("lounge-seatings", "sub.loungeSeatings", "Lounge Seatings"),
      ("privacy-seatings", "sub.privacySeatings", "Privacy Seatings"),
      ("sofas", "sub.sofas", "Sofas"),
      ("stools", "sub.stools", "Stools")]),
    ("coffee-tables", "cat.coffeeTables", "Coffee Tables", "prod.intro.coffee",
     "Small tables for lounges, waiting areas and informal meetings.", []),
    ("storage-units", "cat.storage", "Storage Units", "prod.intro.storage",
     "Sideboards, drawer units and wardrobes that keep the office in order.",
     [("cabinets", "sub.cabinets", "Cabinets"),
      ("drawers", "sub.drawers", "Drawers"),
      ("wardrobes", "sub.wardrobes", "Wardrobes")]),
    ("receptions", "cat.receptions", "Receptions", "prod.intro.receptions",
     "Reception desks that set the tone from the first step inside.", []),
    ("acoustic-solutions", "cat.acoustic", "Acoustic Solutions", "prod.intro.acoustic",
     "Panels and pods that bring quiet to open spaces.",
     [("acoustic-pods", "sub.acousticPods", "Acoustic Pods"),
      ("ceiling-panels", "sub.ceilingPanels", "Ceiling Panels"),
      ("desk-panels", "sub.deskPanels", "Desk Panels"),
      ("freestanding-panels", "sub.freestandingPanels", "Freestanding Panels"),
      ("wall-panels", "sub.wallPanels", "Wall Panels")]),
]
CAT = {c[0]: c for c in TAXONOMY}
SUB = {s[0]: (c[0], s) for c in TAXONOMY for s in c[5]}

COLLECTION_PAGES = {
    "one", "isixty", "genesis", "alfaomega", "attiva", "team", "cloud",
    "ginza", "mithos", "2be", "adjustable-desks",
}

from projects_data import PROJECTS

DOWNLOADS = [
    ("Codutti-Company-Profile-2026.pdf", "Company Profile 2026", "dl.profile"),
    ("Codutti-Material-Book-2026.pdf", "Material Book 2026", "dl.materials"),
    ("Codutti-Upholstery-Material-Book-2026.pdf", "Upholstery Material Book 2026", "dl.materials"),
    ("Codutti-Seating-Collection.pdf", "Seating Collection", "dl.catalogue"),
    ("Codutti-Height-Adjustable-Catalogue.pdf", "Height Adjustable Desks", "dl.catalogue"),
    ("Codutti-One-Catalogue.pdf", "One", "dl.catalogue"),
    ("Codutti-iSixty-Catalogue.pdf", "iSixty", "dl.catalogue"),
    ("Codutti-Genesis-Catalogue.pdf", "Genesis", "dl.catalogue"),
    ("Codutti-Alfaomega-Catalogue.pdf", "Alfaomega", "dl.catalogue"),
    ("Codutti-Mithos-Catalogue.pdf", "Mithos", "dl.catalogue"),
    ("Codutti-Attiva-Catalogue.pdf", "Attiva", "dl.catalogue"),
    ("Codutti-Team-Catalogue.pdf", "Team", "dl.catalogue"),
    ("Codutti-2BE-Catalogue.pdf", "2BE", "dl.catalogue"),
    ("Codutti-Ciao-Reception-Catalogue.pdf", "Ciao Reception", "dl.catalogue"),
]

LANGS = [("EN", "EN", "English"), ("IT", "IT", "Italiano"), ("FR", "FR", "Français"),
         ("SP", "ES", "Español"), ("RU", "RU", "Русский"), ("AR", "AR", "العربية")]

# --------------------------------------------------------------------------
# Shared chrome
# --------------------------------------------------------------------------
CHEVRON = '<svg class="nav-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
BACK = '<svg class="nav-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
ICON_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>'
ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>'


def header_html(p):
    return f'''<header class="site-header">
  <div class="header-side header-side--left">
    <button class="lang-btn" id="langBtn" aria-expanded="false" aria-label="Choose language">EN</button>
    <a class="header-icon" href="{p}downloads.html" aria-label="Download" data-i18n-aria="nav.download">{ICON_DL}</a>
    <button type="button" class="header-icon" id="searchBtn" aria-label="Search" data-i18n-aria="search.open">{ICON_SEARCH}</button>
  </div>
  <a href="{p}index.html" class="brand"><img src="{p}assets/img/logo-mark.png" alt="Codutti"></a>
  <div class="header-side header-side--right">
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>'''


def lang_html():
    items = "\n".join(
        f'    <button class="lang-overlay__item{" is-active" if code == "EN" else ""}" data-lang="{code}" data-short="{short}" lang="{LANG_HTML[code]}">{label}</button>'
        for code, short, label in LANGS)
    return f'''<div class="lang-overlay" id="langOverlay">
  <div class="lang-overlay__list">
{items}
  </div>
</div>'''


LANG_HTML = {"EN": "en", "IT": "it", "FR": "fr", "SP": "es", "RU": "ru", "AR": "ar"}


def nav_html(p):
    cats = "\n".join(
        f'        <li><a href="{p}products/{slug}.html" data-i18n="{key}">{label}</a></li>'
        for slug, key, label, *_ in TAXONOMY)
    main = [
        ('button', 'products', 'nav.products', 'Products'),
        ('a', f'{p}contract.html', 'nav.contract', 'Contract'),
        ('a', f'{p}bespoke.html', 'nav.bespoke', 'Bespoke'),
        ('a', f'{p}projects.html', 'nav.projects', 'Projects'),
        ('a', f'{p}materials.html', 'nav.finishes', 'Finishes'),
        ('button', 'about', 'nav.about', 'About Us'),
        ('a', f'{p}news.html', 'nav.news', 'News and Events'),
        ('a', f'{p}contact.html', 'nav.contact', 'Contact Us'),
    ]
    rows = []
    for i, (kind, target, key, label) in enumerate(main, 1):
        num = f'<span class="num">{i:02d}</span>'
        if kind == 'button':
            rows.append(f'        <li><button type="button" class="nav-main__open" data-open="{target}" aria-expanded="false">{num} <span data-i18n="{key}">{label}</span>{CHEVRON}</button></li>')
        else:
            rows.append(f'        <li><a href="{target}">{num} <span data-i18n="{key}">{label}</span></a></li>')
    rows = "\n".join(rows)
    return f'''<nav class="nav-overlay" id="navOverlay" aria-label="Menu">
  <div class="nav-panels">
    <div class="nav-panel nav-panel--main is-active" data-panel="main">
      <ul class="nav-main">
{rows}
      </ul>
    </div>
    <div class="nav-panel" data-panel="products">
      <button type="button" class="nav-back" data-back>{BACK}<span data-i18n="nav.products">Products</span></button>
      <ul class="nav-main nav-main--sub">
        <li><a href="{p}products/all.html" data-i18n="nav.allProducts">All Products</a></li>
{cats}
      </ul>
    </div>
    <div class="nav-panel" data-panel="about">
      <button type="button" class="nav-back" data-back>{BACK}<span data-i18n="nav.about">About Us</span></button>
      <ul class="nav-main nav-main--sub">
        <li><a href="{p}company.html" data-i18n="nav.company">Company</a></li>
        <li><a href="{p}codutti-method.html" data-i18n="nav.method">The Codutti Method</a></li>
        <li><a href="{p}company.html#certifications" data-i18n="legal.certifications">Certifications</a></li>
      </ul>
    </div>
  </div>
</nav>'''


def scripts_html(p, extra=()):
    s = [f'<script src="{p}assets/js/ai-config.js"></script>',
         f'<script src="{p}assets/js/i18n.js"></script>',
         f'<script src="{p}assets/js/finish-names.js"></script>',
         f'<script src="{p}assets/js/main.js"></script>',
         f'<script src="{p}assets/js/search-index.js" defer></script>',
         f'<script src="{p}assets/js/search.js" defer></script>']
    s += [f'<script src="{p}assets/js/{x}.js"></script>' for x in extra]
    return "\n".join(s)


def apply_chrome(path):
    s = open(path, encoding="utf-8").read()
    if '<header class="site-header">' not in s:
        return False
    p = "../" * os.path.relpath(path, ROOT).count(os.sep)
    s = re.sub(r'<header class="site-header">.*?</header>', lambda m: header_html(p), s, count=1, flags=re.S)
    s = re.sub(r'<div class="lang-overlay" id="langOverlay">.*?(?=\n*<nav class="nav-overlay")', lambda m: lang_html() + "\n\n", s, count=1, flags=re.S)
    s = re.sub(r'<nav class="nav-overlay".*?</nav>', lambda m: nav_html(p), s, count=1, flags=re.S)
    if not path.endswith(os.sep + "index.html") or os.path.dirname(path) != ROOT:
        s = re.sub(r'<footer class="site-footer">.*?</footer>', lambda m: prefix_urls(footer_html(), p), s, count=1, flags=re.S)
    if "ai-config.js" not in s:
        s = s.replace(f'<script src="{p}assets/js/i18n.js"></script>', f'<script src="{p}assets/js/ai-config.js"></script>\n<script src="{p}assets/js/i18n.js"></script>', 1)
    if "search.js" not in s:
        s = s.replace(f'<script src="{p}assets/js/main.js"></script>',
                      f'<script src="{p}assets/js/finish-names.js"></script>\n<script src="{p}assets/js/main.js"></script>\n<script src="{p}assets/js/search-index.js" defer></script>\n<script src="{p}assets/js/search.js" defer></script>', 1)
    open(path, "w", encoding="utf-8").write(s)
    return True


def footer_html():
    s = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    return s[s.index('<footer class="site-footer">'):s.index("</footer>") + len("</footer>")]


def prefix_urls(fragment, p):
    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r"^(https?:|mailto:|tel:|#|data:|/)", url):
            return m.group(0)
        return f'{attr}="{p}{url}"'
    return re.sub(r'(href|src)="([^"]*)"', fix, fragment)


def page(p, title, desc, main, body_class="", extra_js=()):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)} — Codutti</title>
<meta name="description" content="{esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{p}assets/css/style.css">
</head>
<body id="top" class="{body_class}">

{header_html(p)}

{lang_html()}

{nav_html(p)}

<main class="pl">
{main}
</main>

{prefix_urls(footer_html(), p)}

{scripts_html(p, extra_js)}
</body>
</html>
'''


def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(content)


# --------------------------------------------------------------------------
# Products
# --------------------------------------------------------------------------
def load_products():
    return json.load(open(os.path.join(ROOT, "assets/data/products.json"), encoding="utf-8"))


def product_url(prod, p):
    return f"{p}products/item/{prod['slug']}.html"


def sub_meta(prod):
    if prod["subcategories"]:
        cat, sub = SUB[prod["subcategories"][0]]
        return sub[1], sub[2]
    c = CAT[prod["category"]]
    return c[1], c[2]


def media_img(src, fit, p, alt="", eager=False):
    load = "" if eager else ' loading="lazy"'
    return f'<img class="fit-{fit}" src="{p}{src}" alt="{esc(alt)}"{load}>'


def card(prod, p):
    key, label = sub_meta(prod)
    v0 = prod["variants"][0]
    n = len(prod["variants"])
    badge = '<span class="pl-card__badge" data-i18n="prod.new">New</span>' if prod.get("new") else ""
    versions = f' · {n} <span data-i18n="prod.versions">versions</span>' if n > 1 else ""
    subs = " ".join(prod["subcategories"])
    return f'''      <li class="pl-card" data-subs="{subs}">
        <a class="pl-card__link" href="{product_url(prod, p)}">
          <span class="pl-card__media">{media_img(v0["image"], v0["fit"], p, prod["name"])}{badge}</span>
          <span class="pl-card__name">{esc(prod["name"])}</span>
          <span class="pl-card__meta"><span data-i18n="{key}">{esc(label)}</span>{versions}</span>
        </a>
      </li>'''


def closing(p):
    return f'''  <section class="pl-closing">
    <h2 class="feature__title" data-i18n="prod.closing.title">Can't find what you need?</h2>
    <p class="feature__body" data-i18n="prod.closing.body">Every piece can be made to measure in our factory.</p>
    <div class="feature__ctas">
      <a class="feature__btn" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a>
      <a class="feature__link" href="{p}bespoke.html" data-i18n="home.bespoke.cta">Discover Bespoke</a>
    </div>
  </section>'''


COVER = {"desks": "genesis-desk", "tables-and-sharings": "genesis-meeting", "seatings": "seat-velar",
         "coffee-tables": "tondo", "storage-units": "one-storage", "receptions": "ciao",
         "acoustic-solutions": "desk-panels"}


def category_tile(slug, key, label, p, products, small=False):
    by = {x["slug"]: x for x in products}
    cover = by.get(COVER.get(slug))
    n = sum(1 for x in products if x["category"] == slug)
    img = (media_img(cover["variants"][0]["image"], cover["variants"][0]["fit"], p)
           if cover else '<span class="pl-tile__placeholder" aria-hidden="true"></span>')
    count = f'<span class="pl-tile__count">{n}</span>' if n else ""
    return f'''      <li class="pl-tile">
        <a href="{p}products/{slug}.html">
          <span class="pl-tile__name"><span data-i18n="{key}">{label}</span>{count}</span>
          <span class="pl-tile__media">{img}</span>
        </a>
      </li>'''


def chips(cat, active, p):
    slug, key, label, *_r, subs = cat
    if not subs:
        return ""
    items = [f'<a class="pl-chip{" is-active" if active is None else ""}" href="{p}products/{slug}.html" data-i18n="prod.all">All</a>']
    for s, k, l in subs:
        items.append(f'<a class="pl-chip{" is-active" if active == s else ""}" href="{p}products/{slug}/{s}.html" data-i18n="{k}">{l}</a>')
    return '  <nav class="pl-chips wrap" aria-label="Filter">\n    ' + "\n    ".join(items) + "\n  </nav>"


def listing(cat, sub, p, products):
    slug, key, label, ikey, intro, subs = cat
    items = [x for x in products if x["category"] == slug and (sub is None or sub[0] in x["subcategories"])]
    crumbs = [f'<a href="{p}products/all.html" data-i18n="nav.products">Products</a>']
    if sub:
        crumbs.append(f'<a href="{p}products/{slug}.html" data-i18n="{key}">{label}</a>')
        crumbs.append(f'<span data-i18n="{sub[1]}">{sub[2]}</span>')
        title_key, title = sub[1], sub[2]
    else:
        crumbs.append(f'<span data-i18n="{key}">{label}</span>')
        title_key, title = key, label

    if items and sub is None and subs:
        # Category page: every product, grouped by division.
        groups = []
        for s, k, l in subs:
            g = [x for x in items if x["subcategories"] and x["subcategories"][0] == s]
            if not g:
                continue
            groups.append(f'''    <div class="pl-group">
      <h2 class="pl-group__title"><a href="{p}products/{slug}/{s}.html"><span data-i18n="{k}">{l}</span><span class="pl-group__n">{len(g)}</span></a></h2>
      <ul class="pl-grid">
{chr(10).join(card(x, p) for x in g)}
      </ul>
    </div>''')
        body = "\n".join(groups)
    elif items:
        body = f'''    <ul class="pl-grid">
{chr(10).join(card(x, p) for x in items)}
    </ul>'''
    else:
        body = f'''    <div class="pl-empty">
      <p class="feature__body" data-i18n="prod.empty">Designed project by project: tell us about your space and we'll propose the right solution.</p>
      <div class="feature__ctas"><a class="feature__btn" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a></div>
    </div>'''
    count = f'<p class="pl-count"><span class="pl-count__n">{len(items)}</span> <span data-i18n="prod.items">products</span></p>' if items else ""
    main = f'''  <section class="pl-hero wrap">
    <nav class="pl-crumbs" aria-label="Breadcrumb">{' <span aria-hidden="true">/</span> '.join(crumbs)}</nav>
    <h1 class="pl-title" data-i18n="{title_key}">{title}</h1>
    <p class="pl-intro" data-i18n="{ikey}">{intro}</p>
  </section>
{chips(cat, sub[0] if sub else None, p)}
  <section class="pl-list wrap">
    {count}
{body}
  </section>
{closing(p)}'''
    return page(p, title, intro, main, "page-products")


def all_page(products):
    p = "../"
    tiles = "\n".join(category_tile(s, k, l, p, products) for s, k, l, *_ in TAXONOMY)
    main = f'''  <section class="pl-hero wrap">
    <h1 class="pl-title" data-i18n="nav.products">Products</h1>
    <p class="pl-intro" data-i18n="prod.intro.all">Seven families of office furniture, designed and built in our own factory.</p>
  </section>
  <section class="wrap">
    <ul class="pl-tiles">
{tiles}
    </ul>
  </section>
{closing(p)}'''
    return page(p, "Products", "Office furniture designed and built in Italy by Codutti.", main, "page-products")


FAMILIES = [
    ("melamine", "Melamine"), ("hpl", "HPL"), ("wood", "Wood veneer"), ("lacquered", "Lacquered"),
    ("glass", "Glass"), ("metal", "Metal"), ("stone", "Stone"), ("thick-leather", "Thick leather"),
    ("leather", "Leather"), ("faux-leather", "Faux leather"), ("felt", "Felt and fabric for screens"),
    ("fabric-moon", "Fabric · Moon"), ("fabric-sirai", "Fabric · Sirai"),
    ("fabric-nocera", "Fabric · Nocera FR"), ("fabric-montreal", "Fabric · Montreal FR"),
]


def load_finishes():
    return {f["code"]: f for f in json.load(open(os.path.join(ROOT, "assets/data/finishes.json"), encoding="utf-8"))}


def swatch(f, p):
    name = f["en"] or f["it"]
    return (f'<li class="fin" title="{esc(f["code"])} {esc(name)}"><img src="{p}assets/img/finishes/{f["code"].lower()}.jpg" alt="" loading="lazy">'
            f'<span class="fin__code">{esc(f["code"])}</span><span class="fin__name" data-i18n="fin.{f["code"]}">{esc(name)}</span></li>')


def finishes_block(codes, p, fins):
    out = []
    for fam, label in FAMILIES:
        items = [fins[c] for c in codes if c in fins and fins[c]["family"] == fam]
        if items:
            out.append('      <div class="fin-group">\n'
                       f'        <h3 class="fin-group__title" data-i18n="fam.{fam}">{label}</h3>\n'
                       f'        <ul class="fin-grid">{"".join(swatch(f, p) for f in items)}</ul>\n'
                       '      </div>')
    return "\n".join(out)


def product_page(prod, products, fins):
    p = "../../"
    cat = CAT[prod["category"]]
    crumbs = [f'<a href="{p}products/all.html" data-i18n="nav.products">Products</a>',
              f'<a href="{p}products/{cat[0]}.html" data-i18n="{cat[1]}">{cat[2]}</a>']
    if prod["subcategories"]:
        _, s = SUB[prod["subcategories"][0]]
        crumbs.append(f'<a href="{p}products/{cat[0]}/{s[0]}.html" data-i18n="{s[1]}">{s[2]}</a>')
    v = prod["variants"]
    first = v[0]

    def vlabel(x, i):
        if x["key"] == "version":
            return f'<span data-i18n="var.version">Version</span> {i + 1:02d}'
        return f'<span data-i18n="var.{x["key"]}">{esc(VAR_EN.get(x["key"], x["key"]))}</span>'

    thumbs = "\n".join(
        f'        <button type="button" class="pd-thumb{" is-active" if i == 0 else ""}" data-src="{p}{x["image"]}" aria-pressed="{"true" if i == 0 else "false"}">'
        f'<span class="pd-thumb__media"><img src="{p}{x["image"]}" alt="" loading="lazy"></span>'
        f'<span class="pd-thumb__label">{vlabel(x, i)}</span></button>' for i, x in enumerate(v))
    tabs, sections = [], []
    n = len(v)
    if n > 1:
        tabs.append(("versions", "prod.versionsTitle", "Versions"))
        sections.append(f'  <section class="pd-section wrap" id="versions">\n'
                        f'    <h2 class="pd-section__title"><span data-i18n="prod.versionsTitle">Versions</span> <span class="pl-group__n">{n}</span></h2>\n'
                        f'    <div class="pd-thumbs">\n{thumbs}\n    </div>\n  </section>')
    codes = [c for c in (prod.get("finishes") or []) if c in fins]
    if codes:
        tabs.append(("finishes", "prod.finishes", "Finishes"))
        sections.append(f'  <section class="pd-section wrap" id="finishes">\n'
                        f'    <h2 class="pd-section__title"><span data-i18n="prod.finishes">Finishes</span> <span class="pl-group__n">{len(codes)}</span></h2>\n'
                        f'    <p class="pd-section__note" data-i18n="prod.finishesNote">Finishes as listed in the catalogue. Further customisation on request.</p>\n'
                        f'{finishes_block(codes, p, fins)}\n  </section>')
    if prod["gallery"]:
        tabs.append(("gallery", "prod.ambients", "In the space"))
        items = "\n".join(f'      <figure class="pd-gallery__item"><img src="{p}{g}" alt="" loading="lazy"></figure>' for g in prod["gallery"])
        sections.append('  <section class="pd-section pd-gallery" id="gallery">\n'
                        '    <h2 class="pd-section__title wrap" data-i18n="prod.ambients">In the space</h2>\n'
                        f'    <div class="pd-gallery__track" tabindex="0">\n{items}\n    </div>\n  </section>')
    if prod.get("model"):
        tabs.append(("view3d", "prod.view3d", "3D and AR"))
        m = prod["model"]
        dims = f'<p class="pd-3d__dims"><span data-i18n="prod.dims">Overall size</span> {esc(m["dims"])}</p>' if m.get("dims") else ""
        sections.append('  <section class="pd-section wrap pd-3d" id="view3d">\n'
                        '    <h2 class="pd-section__title" data-i18n="prod.view3d">3D and AR</h2>\n'
                        '    <p class="pd-section__note" data-i18n="prod.view3dNote">Drag to turn the model. On a phone, tap the button to place it in your room.</p>\n'
                        f'    <model-viewer class="pd-3d__viewer" src="{p}{m["glb"]}" ios-src="{p}{m["usdz"]}" alt="{esc(prod["name"])} 3D model" '
                        f'poster="{p}{first["image"]}" camera-controls touch-action="pan-y" ar ar-modes="webxr scene-viewer quick-look" '
                        'camera-orbit="20deg 82deg auto" shadow-intensity="0" exposure="1.05" environment-image="neutral" loading="lazy">\n'
                        '      <button slot="ar-button" class="pd-3d__ar" data-i18n="prod.ar">View in your space</button>\n'
                        f'    </model-viewer>\n    {dims}\n'
                        f'    <script type="module" src="{p}assets/vendor/model-viewer.min.js"></script>\n  </section>')
    dls = []
    if prod.get("catalogue") and os.path.exists(os.path.join(ROOT, prod["catalogue"])):
        dls.append((f'{p}{prod["catalogue"]}', "prod.catalogue", "Catalogue", os.path.getsize(os.path.join(ROOT, prod["catalogue"]))))
    if codes:
        book = "Codutti-Upholstery-Material-Book-2026.pdf" if prod["slug"].startswith("seat-") else "Codutti-Material-Book-2026.pdf"
        path = os.path.join(ROOT, "assets/docs", book)
        if os.path.exists(path):
            dls.append((f'{p}assets/docs/{book}', "prod.materialBook", "Material Book", os.path.getsize(path)))
    if dls:
        tabs.append(("downloads", "nav.download", "Download"))
        rows = "\n".join(f'      <li class="dl-row"><a href="{u}" download><span class="dl-row__name" data-i18n="{k}">{l}</span>'
                         f'<span class="dl-row__meta">PDF · {sz / 1e6:.0f} MB</span><span class="dl-row__icon">{ICON_DL}</span></a></li>'
                         for u, k, l, sz in dls)
        sections.append('  <section class="pd-section wrap" id="downloads">\n'
                        '    <h2 class="pd-section__title" data-i18n="nav.download">Download</h2>\n'
                        f'    <ul class="dl-list">\n{rows}\n    </ul>\n  </section>')
    coll = prod.get("collection")
    links = []
    if coll in COLLECTION_PAGES:
        links.append(f'<a class="feature__link" href="{p}collections/{coll}.html" data-i18n="prod.collection">Discover the collection</a>')
    eyebrow_key, eyebrow = sub_meta(prod)
    related = [x for x in products if x["category"] == prod["category"] and x["slug"] != prod["slug"]]
    same = [x for x in related if set(x["subcategories"]) & set(prod["subcategories"])]
    related = (same + [x for x in related if x not in same])[:4]
    rel = ""
    if related:
        rel = ('  <section class="pd-section wrap">\n'
               '    <h2 class="pd-section__title" data-i18n="prod.related">You may also like</h2>\n'
               f'    <ul class="pl-grid">\n{chr(10).join(card(x, p) for x in related)}\n    </ul>\n  </section>')
    subnav = "".join(f'<a href="#{a}" data-i18n="{k}">{l}</a>' for a, k, l in tabs)
    crumb = ' <span aria-hidden="true">/</span> '.join(crumbs)
    main = f'''  <nav class="pd-subnav" aria-label="{esc(prod["name"])}">
    <div class="pd-subnav__inner wrap">
      <span class="pd-subnav__name">{esc(prod["name"])}</span>
      <span class="pd-subnav__links">{subnav}</span>
      <a class="pd-subnav__cta" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a>
    </div>
  </nav>
  <section class="pd wrap">
    <nav class="pl-crumbs" aria-label="Breadcrumb">{crumb}</nav>
    <div class="pd__grid">
      <div class="pd__stage">
        <div class="pd__main"><img src="{p}{first["image"]}" alt="{esc(prod["name"])}"></div>
      </div>
      <div class="pd__info">
        <p class="pd__eyebrow"><span data-i18n="{eyebrow_key}">{esc(eyebrow)}</span></p>
        <h1 class="pd__name">{esc(prod["name"])}</h1>
        <p class="pd__variant" aria-live="polite">{vlabel(first, 0)}</p>
        <div class="pd__ctas">
          <a class="feature__btn" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a>
          {"".join(links)}
        </div>
      </div>
    </div>
  </section>
{chr(10).join(sections)}
{rel}
{closing(p)}'''
    return page(p, prod["name"], f'{prod["name"]} — {eyebrow} by Codutti.', main, "page-products page-product", ("products",))


def materials_page(fins):
    p = ""
    by_book = {"mat": [], "uph": []}
    for f in fins.values():
        by_book[f["book"]].append(f["code"])
    blocks = []
    for book, title_key, title, pdf in [("mat", "mat.book", "Material Book", "Codutti-Material-Book-2026.pdf"),
                                        ("uph", "mat.uphBook", "Upholstery Material Book", "Codutti-Upholstery-Material-Book-2026.pdf")]:
        dl = (f'<a class="feature__link" href="assets/docs/{pdf}" download data-i18n="mat.download">Download the PDF</a>'
              if os.path.exists(os.path.join(ROOT, "assets/docs", pdf)) else "")
        blocks.append(f'  <section class="pd-section wrap">\n    <div class="mat-head"><h2 class="pd-section__title" data-i18n="{title_key}">{title}</h2>{dl}</div>\n'
                      f'{finishes_block(by_book[book], p, fins)}\n  </section>')
    main = f'''  <section class="pl-hero wrap">
    <h1 class="pl-title" data-i18n="nav.finishes">Finishes</h1>
    <p class="pl-intro" data-i18n="mat.intro">Every surface, leather and fabric we work with, with its catalogue code.</p>
  </section>
{chr(10).join(blocks)}
{closing(p)}'''
    return page(p, "Finishes", "Codutti materials and finishes: melamine, HPL, wood, lacquer, glass, metal, leather and fabrics.", main)


def finish_names_js(fins):
    en = {f"fin.{c}": f["en"] or f["it"] for c, f in fins.items()}
    it = {f"fin.{c}": f["it"] or f["en"] for c, f in fins.items()}
    write("assets/js/finish-names.js", "/* Generated by tools/build_site.py */\nObject.assign(I18N.EN, " + json.dumps(en, ensure_ascii=False)
          + ");\nObject.assign(I18N.IT, " + json.dumps(it, ensure_ascii=False) + ");\n")


VAR_EN = {
    "single-pod": "Single pod", "single-desk": "Single desk", "desk-extension": "Desk with extension", "corner-desk": "Corner desk",
    "wood-legs": "Desk with wooden legs", "desk": "Desk", "meeting-table": "Meeting table",
    "glass-meeting": "Glass meeting table", "glass-meeting-square": "Square glass meeting table",
    "modular-meeting": "Modular meeting table", "round-table": "Round table", "boardroom": "Boardroom table",
    "table-bench": "Table with bench", "high-table": "High table", "sideboard": "Sideboard",
    "low-sideboard": "Low sideboard", "bar-cabinet": "Bar cabinet", "credenza": "Credenza",
    "drawer-unit": "Drawer unit", "bookcase": "Bookcase", "console": "Console", "cabinet": "Cabinet",
    "wardrobe": "Wardrobe", "storage-wall": "Storage wall", "lockers": "Lockers",
    "smart-wall": "Smart Meeting Wall", "chest": "Chest of drawers", "coffee-table": "Coffee table",
    "bench": "Bench", "double-ws": "Double workstation", "workstation": "Workstation", "sharing": "Sharing",
    "break": "Break", "linear": "Linear", "corner": "Corner", "wave": "Wave", "circular": "Circular",
    "double-wave": "Double wave", "reception-desk": "Reception desk", "heights": "Height range",
    "with-storage": "With storage unit", "bench-screens": "Bench with screens", "single-panel": "Single panel",
    "double-panel": "Double panel", "rail-mounted": "On wall rail", "joining-kit": "Joining kit",
    "freestanding": "Freestanding panel", "ceiling-single": "Ceiling panel", "ceiling-light": "Ceiling panel with light",
    "ceiling-double": "Double ceiling panel", "ceiling-v": "V-shaped ceiling panel", "ceiling-folded": "Folded ceiling panel", "with-chairs": "With chairs", "screen": "Acoustic screen",
}


# --------------------------------------------------------------------------
# Projects & downloads
# --------------------------------------------------------------------------
def project_images():
    data = json.load(open(os.path.join(ROOT, "assets/data/project-images.json"), encoding="utf-8"))
    return {d["slug"]: d["images"] for d in data}


def project_meta(pr):
    bits = [pr["location"], pr["year"]]
    return " · ".join(b for b in bits if b)


def projects_page():
    p = ""
    imgs = project_images()
    sectors = []
    for pr in PROJECTS:
        if pr["sector"] not in sectors:
            sectors.append(pr["sector"])
    chips = '<button type="button" class="pl-chip is-active" aria-pressed="true" data-filter="all" data-i18n="prod.all">All</button>' + "".join(
        f'<button type="button" class="pl-chip" aria-pressed="false" data-filter="{esc(sec)}">{esc(sec)}</button>' for sec in sectors)
    cards = []
    for pr in PROJECTS:
        im = imgs[pr["slug"]][0]
        n = len(imgs[pr["slug"]])
        cards.append(f'''      <a class="pj-card" href="projects/{pr["slug"]}.html" data-sector="{esc(pr["sector"])}">
        <span class="pj-card__media"><img src="{im["src"]}" alt="{esc(pr["title"])}" loading="lazy" width="{im["w"]}" height="{im["h"]}"></span>
        <span class="pj-card__meta">{esc(pr["sector"])}{(" · " + esc(project_meta(pr))) if project_meta(pr) else ""}</span>
        <span class="pj-card__title">{esc(pr["title"])}</span>
        <span class="pj-card__preview">{esc(pr["preview"])}</span>
        <span class="pj-card__more"><span data-i18n="pj.discover">Discover the project</span> · {n} <span data-i18n="pj.photos">photos</span></span>
      </a>''')
    main = f'''  <section class="pl-hero wrap">
    <h1 class="pl-title" data-i18n="nav.projects">Projects</h1>
    <p class="pl-intro" data-i18n="projects.intro">Ministries, banks, headquarters and trade fairs: a selection of the spaces we have furnished around the world.</p>
    <div class="pl-chips pj-filter" role="group" aria-label="Filter projects">{chips}</div>
  </section>
  <section class="wrap pj-list">
    <div class="pj-grid">
{chr(10).join(cards)}
    </div>
  </section>
{closing(p)}'''
    return page(p, "Projects", "Codutti reference projects worldwide.", main, extra_js=("projects",))


FEATURED = {"contract.html": ["ministry-of-investment", "al-rajhi-bank", "torre-mohamed", "ferrbatt"],
            "bespoke.html": ["security-national-pr", "rtcc-dubai", "interlux", "sberbank"],
            "company.html": ["orgatec", "light-building", "loreal-paris", "saudi-investment-bank"]}


def featured_projects():
    """Swap the project tiles on Contract, Bespoke and Company for real references."""
    imgs = project_images()
    by = {pr["slug"]: pr for pr in PROJECTS}
    for f, slugs in FEATURED.items():
        path = os.path.join(ROOT, f)
        s = open(path, encoding="utf-8").read()
        cards = "\n".join(
            f'      <a class="pj-card" href="projects/{x}.html"><span class="pj-card__media"><img src="{imgs[x][0]["src"]}" alt="{esc(by[x]["title"])}" loading="lazy"></span>'
            f'<span class="pj-card__meta">{esc(project_meta(by[x]))}</span><span class="pj-card__title">{esc(by[x]["title"])}</span>'
            f'<span class="pj-card__preview">{esc(by[x]["preview"])}</span></a>' for x in slugs)
        s = re.sub(r'<div class="(project-grid|pj-grid pj-grid--4)">.*?\n    </div>', lambda m: f'<div class="pj-grid pj-grid--4">\n{cards}\n    </div>', s, count=1, flags=re.S)
        open(path, "w", encoding="utf-8").write(s)


def project_page(i, pr):
    p = "../"
    imgs = project_images()[pr["slug"]]
    hero = imgs[0]
    facts = [("pj.project", "Project", pr["title"]), ("pj.location", "Location", pr["location"]),
             ("pj.year", "Year", pr["year"]), ("pj.sector", "Sector", pr["sector"])]
    facts_html = "".join(f'<div><dt data-i18n="{k}">{lab}</dt><dd>{esc(v)}</dd></div>' for k, lab, v in facts if v)
    scope = "".join(f"<li>{esc(x)}</li>" for x in pr["scope"])
    frames = []
    for n, im in enumerate(imgs, 1):
        wide = " pj-frame--wide" if im["w"] / im["h"] > 1.55 or n == 1 else ""
        frames.append(f'      <figure class="pj-frame{wide} reveal"><img src="{p}{im["src"]}" alt="{esc(pr["title"])} — {n}" loading="lazy" width="{im["w"]}" height="{im["h"]}"><figcaption>{n:02d}</figcaption></figure>')
    prev_pr = PROJECTS[i - 1]
    next_pr = PROJECTS[(i + 1) % len(PROJECTS)]
    main = f'''  <section class="pj-hero">
    <img class="pj-hero__img" src="{p}{hero["src"]}" alt="{esc(pr["title"])}">
    <div class="pj-hero__shade"></div>
    <div class="pj-hero__text wrap">
      <a class="pj-back" href="{p}projects.html" data-i18n="pj.all">All projects</a>
      <p class="pj-hero__eyebrow">{esc(pr["sector"])}</p>
      <h1 class="pj-hero__title">{esc(pr["title"])}</h1>
      <p class="pj-hero__meta">{esc(project_meta(pr))}</p>
    </div>
  </section>
  <section class="wrap pj-story">
    <dl class="pj-facts">{facts_html}</dl>
    <div class="pj-cols">
      <div>
        <h2 class="pj-h2" data-i18n="pj.about">The project</h2>
        <p class="pj-text">{esc(pr["about"])}</p>
      </div>
      <div>
        <h2 class="pj-h2" data-i18n="pj.scope">What Codutti did</h2>
        <ul class="pj-scope">{scope}</ul>
      </div>
    </div>
  </section>
  <section class="wrap pj-board" aria-label="Photos">
    <h2 class="pj-h2" data-i18n="pj.storyboard">Storyboard</h2>
    <div class="pj-frames">
{chr(10).join(frames)}
    </div>
  </section>
  <nav class="wrap pj-nav" aria-label="More projects">
    <a href="{prev_pr["slug"]}.html"><span data-i18n="pj.prev">Previous project</span><strong>{esc(prev_pr["title"])}</strong></a>
    <a href="{next_pr["slug"]}.html" class="pj-nav__next"><span data-i18n="pj.next">Next project</span><strong>{esc(next_pr["title"])}</strong></a>
  </nav>
{closing(p)}'''
    return page(p, f'{pr["title"]}{", " + pr["location"] if pr["location"] else ""}', pr["preview"], main, body_class="page-project")


DL_GROUPS = [("dl.profile", "Company profile", "company"), ("dl.catalogue", "Catalogue", "catalogue"), ("dl.materials", "Materials", "materials")]


def downloads_page():
    p = ""
    kind = {"dl.profile": "company", "dl.catalogue": "catalogue", "dl.materials": "materials"}
    cards = []
    for fn, name, key in DOWNLOADS:
        path = os.path.join(ROOT, "assets/docs", fn)
        if not os.path.exists(path):
            continue
        mb = os.path.getsize(path) / 1e6
        cover = f"assets/img/covers/{fn[:-4]}.jpg"
        cards.append(f'''      <li class="dl-card" data-kind="{kind[key]}">
        <a href="assets/docs/{fn}" download>
          <span class="dl-card__cover"><img src="{cover}" alt="" loading="lazy"></span>
          <span class="dl-card__type" data-i18n="{key}">Catalogue</span>
          <span class="dl-card__name">{esc(name)}</span>
          <span class="dl-card__meta">PDF · {mb:.0f} MB</span>
          <span class="dl-card__btn">{ICON_DL}<span data-i18n="nav.download">Download</span></span>
        </a>
      </li>''')
    chips = ['<button type="button" class="pl-chip is-active" data-filter="" data-i18n="prod.all">All</button>']
    chips += [f'<button type="button" class="pl-chip" data-filter="{k}" data-i18n="{i}">{l}</button>' for i, l, k in DL_GROUPS]
    main = f'''  <section class="pl-hero wrap">
    <h1 class="pl-title" data-i18n="nav.download">Download</h1>
    <p class="pl-intro" data-i18n="dl.intro">Catalogues and company profile, ready to download.</p>
  </section>
  <nav class="pl-chips wrap" aria-label="Filter">
    {"".join(chips)}
  </nav>
  <section class="wrap pl-list">
    <ul class="dl-grid">
{chr(10).join(cards)}
    </ul>
  </section>
{closing(p)}'''
    return page(p, "Download", "Codutti catalogues, material books and company profile.", main, "page-downloads", ("products",))


# --------------------------------------------------------------------------
# Search index
# --------------------------------------------------------------------------
def search_index(products, files):
    entries = []
    for prod in products:
        _, label = sub_meta(prod)
        entries.append({"t": prod["name"], "s": label, "u": f"products/item/{prod['slug']}.html",
                        "i": prod["variants"][0]["image"], "f": prod["variants"][0]["fit"], "k": "p",
                        "x": " ".join([prod.get("collection") or "", prod["category"]] + prod["subcategories"])})
    for c in TAXONOMY:
        entries.append({"t": c[2], "s": "", "u": f"products/{c[0]}.html", "k": "c", "x": c[4]})
        for s in c[5]:
            entries.append({"t": s[2], "s": c[2], "u": f"products/{c[0]}/{s[0]}.html", "k": "c", "x": ""})
    for f in files:
        if f.startswith(("products/", "festa18")):
            continue
        s = open(os.path.join(ROOT, f), encoding="utf-8").read()
        m = re.search(r"<title>(.*?)</title>", s)
        if not m:
            continue
        title = html.unescape(m.group(1)).split(" — ")[0].strip()
        d = re.search(r'<meta name="description" content="([^"]*)"', s)
        entries.append({"t": title, "s": "", "u": f, "k": "g", "x": html.unescape(d.group(1)) if d else ""})
    js = "/* Generated by tools/build_site.py */\nwindow.SEARCH_INDEX = " + json.dumps(entries, ensure_ascii=False) + ";\n"
    write("assets/js/search-index.js", js)


# --------------------------------------------------------------------------
def main():
    products = load_products()
    fins = load_finishes()
    for f in os.listdir(os.path.join(ROOT, "products")):
        full = os.path.join(ROOT, "products", f)
        if os.path.isdir(full):
            for g in os.listdir(full):
                if g.endswith(".html"):
                    os.remove(os.path.join(full, g))
    write("products/all.html", all_page(products))
    for cat in TAXONOMY:
        write(f"products/{cat[0]}.html", listing(cat, None, "../", products))
        for sub in cat[5]:
            write(f"products/{cat[0]}/{sub[0]}.html", listing(cat, sub, "../../", products))
    for prod in products:
        write(f"products/item/{prod['slug']}.html", product_page(prod, products, fins))
    write("materials.html", materials_page(fins))
    finish_names_js(fins)
    import build_collections
    build_collections.main()
    write("projects.html", projects_page())
    for f in os.listdir(os.path.join(ROOT, "projects")):
        if f.endswith(".html"):
            os.remove(os.path.join(ROOT, "projects", f))
    for i, pr in enumerate(PROJECTS):
        write(f"projects/{pr['slug']}.html", project_page(i, pr))
    featured_projects()
    write("downloads.html", downloads_page())

    files = subprocess.check_output(["git", "ls-files", "*.html"], cwd=ROOT).decode().split()
    files = sorted((set(files) | {"projects.html", "downloads.html"} | {f"projects/{pr['slug']}.html" for pr in PROJECTS})
                   - {f for f in files if f.startswith("projects/") and not os.path.exists(os.path.join(ROOT, f))})
    for f in files:
        full = os.path.join(ROOT, f)
        if os.path.exists(full):
            apply_chrome(full)
    search_index(products, files)
    print(f"{len(products)} products, {len(files)} pages")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
