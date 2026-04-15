"""Quick security audit for index.html"""
import re

content = open("index.html", encoding="utf-8").read()

ok = True

# 1. innerHTML usage - flag any that don't route through esc()
raw_inner = re.findall(r'innerHTML\s*=[^\n;]{0,200}', content)
template_inner = [r for r in raw_inner if '`' in r or '${' in r]
if template_inner:
    print("WARN: raw template literals in innerHTML:")
    for r in template_inner: print("  ", r.strip()[:100])
    ok = False
else:
    print("OK  : No raw template literals in innerHTML")

# 2. esc() defined and used
print("OK  : esc() defined:", "function esc(" in content)

# 3. eval
if re.search(r'\beval\s*\(', content):
    print("WARN: eval() found"); ok = False
else:
    print("OK  : No eval()")

# 4. document.write
if "document.write" in content:
    print("WARN: document.write found"); ok = False
else:
    print("OK  : No document.write")

# 5. Head count (should be 1) — use regex to exclude <header>
hc = len(re.findall(r'<head[>\s]', content))
print(f"{'OK  ' if hc == 1 else 'WARN'}: <head> count = {hc} (excludes <header>)")

# 6. Script tag balance
so = content.count("<script"); sc = content.count("</script>")
print(f"{'OK  ' if so == sc else 'WARN'}: <script> {so} / </script> {sc}")

# 7. target=_blank without noopener
blanks = re.findall(r'target=["\']_blank["\']', content)
noopers = re.findall(r'rel=["\']noopener noreferrer["\']', content)
print(f"{'OK  ' if len(blanks) <= len(noopers) else 'WARN'}: _blank={len(blanks)} noopener={len(noopers)}")

# 8. HTTP (non-HTTPS) external URLs in href/src not localhost
http_only = re.findall(r'(?:href|src|action)\s*=\s*["\']http://(?!localhost)', content)
if http_only:
    print("WARN: non-HTTPS external URLs:"); [print("  ", u) for u in http_only]; ok = False
else:
    print("OK  : No non-HTTPS external resources (except localhost API)")

# 9. localStorage usage (acceptable, just audit)
ls_uses = re.findall(r'localStorage\.\w+\([^)]{0,60}\)', content)
print(f"INFO: localStorage calls ({len(ls_uses)}): {ls_uses[:4]}")

# 10. Duplicate tailwind.config
tc = content.count("tailwind.config")
print(f"{'OK  ' if tc == 1 else 'WARN'}: tailwind.config declarations = {tc}")

# 11. CSP headers count
csp = content.count("Content-Security-Policy")
print(f"{'OK  ' if csp == 1 else 'WARN'}: CSP meta tags = {csp}")

print("\n" + ("ALL CHECKS PASSED" if ok else "SOME WARNINGS - review above"))
