"""Generate the product pages from assets/data/products.json.

Writes products/all.html, one page per category (products/<cat>.html) and
one per subcategory (products/<cat>/<sub>.html). The page chrome (header,
language panel, footer) is copied from index.html; the menu is rebuilt by
tools/build_nav.py at the end.

    python3 tools/build_products.py
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import build_nav  # noqa: E402

# slug, i18n key, label, intro key, intro, [(sub slug, i18n key, label)]
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

# Representative still life for each category tile on products/all.html.
COVER = {
    "desks": "genesis-desk", "tables-and-sharings": "alfaomega-meeting",
    "seatings": "velar", "coffee-tables": "sophie", "storage-units": "one-sideboard",
    "receptions": "ciao-circular", "acoustic-solutions": None,
}

COLLECTION_PAGES = {
    "one", "isixty", "genesis", "alfaomega", "attiva", "team", "cloud",
    "ginza", "mithos", "2be", "adjustable-desks",
}

esc = html.escape


def chrome():
    """Header + language panel + menu, and the footer, from index.html."""
    s = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    top = s[s.index('<header class="site-header">'):s.index("<main>")]
    foot = s[s.index("</main>") + len("</main>"):s.index('<script src="assets/js/i18n.js">')]
    return top, foot


def prefix_urls(fragment, p):
    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r"^(https?:|mailto:|tel:|#|data:|/)", url):
            return m.group(0)
        return f'{attr}="{p}{url}"'
    return re.sub(r'(href|src)="([^"]*)"', fix, fragment)


def page(p, title, desc, main, extra_scripts=""):
    top, foot = chrome()
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)} — Codutti</title>
<meta name="description" content="{esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{p}assets/css/style.css">
</head>
<body id="top" class="page-products">

{prefix_urls(top, p)}<main class="pl">
{main}
</main>
{prefix_urls(foot, p)}<script src="{p}assets/js/i18n.js"></script>
<script src="{p}assets/js/main.js"></script>
<script src="{p}assets/js/products.js"></script>
</body>
</html>
'''


def sub_label(cat, sub):
    for c in TAXONOMY:
        if c[0] == cat:
            for s in c[5]:
                if s[0] == sub:
                    return s
    return None


def variant_key(variant):
    return "var." + re.sub(r"[^a-z0-9]+", "-", variant.lower()).strip("-")


def name_html(name):
    """'One · L-shaped desk' → collection kept as is, variant translatable."""
    if " · " not in name:
        return esc(name)
    coll, variant = name.split(" · ", 1)
    return f'{esc(coll)} · <span data-i18n="{variant_key(variant)}">{esc(variant)}</span>'


def card(prod, p):
    cat = next(c for c in TAXONOMY if c[0] == prod["category"])
    meta = sub_label(prod["category"], prod["subcategory"]) if prod["subcategory"] else None
    meta_key, meta_text = (meta[1], meta[2]) if meta else (cat[1], cat[2])
    coll = prod.get("collection")
    href = f"{p}collections/{coll}.html" if coll in COLLECTION_PAGES else f"{p}contact.html"
    coll_attr = f' data-collection="{p}collections/{coll}.html"' if coll in COLLECTION_PAGES else ""
    return f'''      <li class="pl-card" data-cat="{prod["category"]}" data-sub="{prod["subcategory"] or ""}">
        <a class="pl-card__link" href="{href}" data-quick data-name="{esc(prod["name"])}" data-img="{p}{prod["image"]}" data-meta-key="{meta_key}"{coll_attr}>
          <span class="pl-card__media"><img src="{p}{prod["image"]}" alt="{esc(prod["name"])}" loading="lazy" width="640" height="640"></span>
          <span class="pl-card__name">{name_html(prod["name"])}</span>
          <span class="pl-card__meta" data-i18n="{meta_key}">{esc(meta_text)}</span>
        </a>
      </li>'''


def count_line(n):
    return f'<p class="pl-count"><span class="pl-count__n">{n}</span> <span data-i18n="prod.items">products</span></p>'


def quick_view(p):
    return f'''<dialog class="pl-quick" id="plQuick" aria-labelledby="plQuickName">
  <div class="pl-quick__inner">
    <button type="button" class="pl-quick__close" data-close data-i18n-aria="prod.close" aria-label="Close">&times;</button>
    <div class="pl-quick__media"><img alt=""></div>
    <div class="pl-quick__info">
      <p class="pl-quick__meta"></p>
      <h2 class="pl-quick__name" id="plQuickName"></h2>
      <div class="pl-quick__ctas">
        <a class="feature__btn" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a>
        <a class="feature__link pl-quick__collection" href="#" data-i18n="prod.collection">Discover the collection</a>
        <a class="feature__link" href="{p}resources.html" data-i18n="prod.catalogues">Catalogues and finishes</a>
      </div>
    </div>
  </div>
</dialog>'''


def closing(p):
    return f'''  <section class="pl-closing">
    <h2 class="feature__title" data-i18n="prod.closing.title">Can't find what you need?</h2>
    <p class="feature__body" data-i18n="prod.closing.body">Every piece can be made to measure in our factory.</p>
    <div class="feature__ctas">
      <a class="feature__btn" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a>
      <a class="feature__link" href="{p}bespoke.html" data-i18n="home.bespoke.cta">Discover Bespoke</a>
    </div>
  </section>'''


def other_categories(current, p, products):
    tiles = []
    for slug, key, label, *_ in TAXONOMY:
        if slug == current:
            continue
        tiles.append(category_tile(slug, key, label, p, products, small=True))
    return f'''  <section class="pl-others wrap">
    <h2 class="pl-others__title" data-i18n="prod.others">Other categories</h2>
    <ul class="pl-tiles pl-tiles--small">
{chr(10).join(tiles)}
    </ul>
  </section>'''


def category_tile(slug, key, label, p, products, small=False):
    cover = COVER.get(slug)
    n = sum(1 for x in products if x["category"] == slug)
    img = (f'<img src="{p}assets/img/products/{cover}.jpg" alt="" loading="lazy" width="640" height="640">'
           if cover else '<span class="pl-tile__placeholder" aria-hidden="true"></span>')
    count = f'<span class="pl-tile__count">{n}</span>' if n else ""
    return f'''      <li class="pl-tile">
        <a href="{p}products/{slug}.html">
          <span class="pl-tile__media">{img}</span>
          <span class="pl-tile__name"><span data-i18n="{key}">{label}</span>{count}</span>
        </a>
      </li>'''


def chips(cat, active, p_cat):
    """Subcategory chips; p_cat is the path from the current page to products/."""
    slug, key, label, *_rest, subs = cat
    if not subs:
        return ""
    items = [f'<a class="pl-chip{" is-active" if active is None else ""}" href="{p_cat}{slug}.html" data-i18n="prod.all">All</a>']
    for s, k, l in subs:
        items.append(f'<a class="pl-chip{" is-active" if active == s else ""}" href="{p_cat}{slug}/{s}.html" data-i18n="{k}">{l}</a>')
    return f'''  <nav class="pl-chips wrap" data-i18n-aria="prod.filter" aria-label="Filter">
    {chr(10).join("    " + i for i in items).strip()}
  </nav>'''


def listing(cat, sub, p, products):
    slug, key, label, ikey, intro, subs = cat
    items = [x for x in products if x["category"] == slug and (sub is None or x["subcategory"] == sub[0])]
    p_cat = "" if sub is None else "../"
    crumbs = [f'<a href="{p}products/all.html" data-i18n="nav.products">Our Products</a>']
    if sub:
        crumbs.append(f'<a href="{p}products/{slug}.html" data-i18n="{key}">{label}</a>')
        crumbs.append(f'<span data-i18n="{sub[1]}">{sub[2]}</span>')
        title_key, title = sub[1], sub[2]
    else:
        crumbs.append(f'<span data-i18n="{key}">{label}</span>')
        title_key, title = key, label
    if items:
        grid = f'''    {count_line(len(items))}
    <ul class="pl-grid">
{chr(10).join(card(x, p) for x in items)}
    </ul>'''
    else:
        grid = f'''    <div class="pl-empty">
      <p class="feature__body" data-i18n="prod.empty">Designed project by project: tell us about your space and we'll propose the right solution.</p>
      <div class="feature__ctas"><a class="feature__btn" href="{p}contact.html" data-i18n="tour.outro.cta">Request a quote</a></div>
    </div>'''
    main = f'''  <section class="pl-hero wrap">
    <nav class="pl-crumbs" aria-label="Breadcrumb">{' <span aria-hidden="true">/</span> '.join(crumbs)}</nav>
    <h1 class="pl-title" data-i18n="{title_key}">{title}</h1>
    <p class="pl-intro" data-i18n="{ikey}">{intro}</p>
  </section>
{chips(cat, sub[0] if sub else None, p_cat)}
  <section class="pl-list wrap">
{grid}
  </section>
{closing(p)}
{other_categories(slug, p, products)}
{quick_view(p)}'''
    return page(p, title, intro, main)


def all_page(products):
    p = "../"
    tiles = "\n".join(category_tile(s, k, l, p, products) for s, k, l, *_ in TAXONOMY)
    filters = ['<button type="button" class="pl-chip is-active" data-filter="" data-i18n="prod.all">All</button>']
    for s, k, l, *_ in TAXONOMY:
        if any(x["category"] == s for x in products):
            filters.append(f'<button type="button" class="pl-chip" data-filter="{s}" data-i18n="{k}">{l}</button>')
    main = f'''  <section class="pl-hero wrap">
    <h1 class="pl-title" data-i18n="nav.products">Our Products</h1>
    <p class="pl-intro" data-i18n="prod.intro.all">Seven families of office furniture, designed and built in our own factory.</p>
  </section>
  <section class="wrap">
    <ul class="pl-tiles">
{tiles}
    </ul>
  </section>
  <section class="pl-list wrap" id="all">
    <h2 class="pl-others__title" data-i18n="prod.browseAll">Browse every product</h2>
    <nav class="pl-chips pl-chips--inline" data-i18n-aria="prod.filter" aria-label="Filter">
      {chr(10).join("      " + f for f in filters).strip()}
    </nav>
    {count_line(len(products))}
    <ul class="pl-grid">
{chr(10).join(card(x, p) for x in products)}
    </ul>
  </section>
{closing(p)}
{quick_view(p)}'''
    return page(p, "Our Products", "Office furniture designed and built in Italy by Codutti.", main)


def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(content)
    print("wrote", rel)


def main():
    products = json.load(open(os.path.join(ROOT, "assets/data/products.json"), encoding="utf-8"))
    write("products/all.html", all_page(products))
    for cat in TAXONOMY:
        write(f"products/{cat[0]}.html", listing(cat, None, "../", products))
        for sub in cat[5]:
            write(f"products/{cat[0]}/{sub[0]}.html", listing(cat, sub, "../../", products))
    os.chdir(ROOT)
    build_nav.main()


if __name__ == "__main__":
    main()
