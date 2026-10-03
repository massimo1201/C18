"""Rewrite the off-canvas menu on every page.

The menu is a two-level drill-down (Products and About us open a second
panel). Each page carries its own copy so it works without JavaScript; run
this script after changing the menu: python3 tools/build_nav.py
"""
import re
import subprocess

CATEGORIES = [
    ("desks", "cat.desks", "Desks"),
    ("tables-and-sharings", "cat.tables", "Meetings"),
    ("seatings", "cat.seatings", "Seatings"),
    ("coffee-tables", "cat.coffeeTables", "Coffee Tables"),
    ("storage-units", "cat.storage", "Storage Units"),
    ("receptions", "cat.receptions", "Receptions"),
    ("acoustic-solutions", "cat.acoustic", "Acoustic Solutions"),
]

CHEVRON = '<svg class="nav-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
BACK = '<svg class="nav-chevron nav-chevron--back" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'

SOCIAL = [
    ("LinkedIn", '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7.5 10v6.5M7.5 7.5v.01M12 16.5V13a2.5 2.5 0 0 1 5 0v3.5M12 16.5v-4"/>'),
    ("Instagram", '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/>'),
    ("Facebook", '<path d="M14.5 21v-7.5H17l.5-3.2h-3V8.2c0-.9.3-1.6 1.7-1.6H17.6V3.9c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.9H8v3.2h2.6V21"/>'),
    ("YouTube", '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" stroke="none"/>'),
]


def nav_html(p):
    cats = "\n".join(
        f'        <li><a href="{p}products/{slug}.html" data-i18n="{key}">{label}</a></li>'
        for slug, key, label in CATEGORIES
    )
    social = "\n".join(
        f'      <a href="#" target="_blank" rel="noopener" aria-label="{name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">{svg}</svg></a>'
        for name, svg in SOCIAL
    )
    return f'''<nav class="nav-overlay" id="navOverlay" aria-label="Menu">
  <div class="nav-panels">
    <div class="nav-panel nav-panel--main is-active" data-panel="main">
      <a class="nav-home" href="{p}index.html"><span class="nav-home__dash" aria-hidden="true"></span><span data-i18n="nav.home">Home</span></a>
      <ul class="nav-main">
        <li><button type="button" class="nav-main__open" data-open="products" aria-expanded="false"><span data-i18n="nav.products">Our Products</span>{CHEVRON}</button></li>
        <li><a href="{p}contract.html" data-i18n="nav.contract">Contract</a></li>
        <li><a href="{p}bespoke.html" data-i18n="nav.bespoke">Bespoke</a></li>
        <li><a href="{p}spaces.html" data-i18n="nav.spaces">Spaces</a></li>
        <li><a href="{p}materials.html" data-i18n="nav.finishes">Finishes</a></li>
        <li><button type="button" class="nav-main__open" data-open="about" aria-expanded="false"><span data-i18n="nav.about">About Us</span>{CHEVRON}</button></li>
        <li><a href="{p}news.html" data-i18n="nav.news">News and Events</a></li>
        <li><a href="{p}contact.html" data-i18n="nav.contact">Contact Us</a></li>
      </ul>
      <ul class="nav-secondary">
        <li><a href="{p}resources.html" data-i18n="nav.download">Download</a></li>
        <li><a href="{p}index.html#newsletter" data-i18n="nav.newsletter">Newsletter</a></li>
      </ul>
      <div class="nav-social">
{social}
      </div>
    </div>
    <div class="nav-panel" data-panel="products">
      <button type="button" class="nav-back" data-back>{BACK}<span data-i18n="nav.products">Our Products</span></button>
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


def main():
    files = subprocess.check_output(["git", "ls-files", "*.html"]).decode().split()
    pat = re.compile(r'<nav class="nav-overlay".*?</nav>', re.S)
    for f in files:
        s = open(f, encoding="utf-8").read()
        if not pat.search(s):
            continue
        prefix = "../" * f.count("/")
        s = pat.sub(lambda m: nav_html(prefix), s, count=1)
        open(f, "w", encoding="utf-8").write(s)
        print("menu:", f)


if __name__ == "__main__":
    main()
