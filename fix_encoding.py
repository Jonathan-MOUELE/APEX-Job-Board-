"""
Fix broken French characters in 04_WebUI/index.html and 04_WebUI/register.html.
Run once from the repo root: python dotnet/fix_encoding.py
"""
import os

FILES = [
    r"C:\xampp\htdocs\APEX\04_WebUI\index.html",
    r"C:\xampp\htdocs\APEX\04_WebUI\register.html",
]

# Complete mapping of every mojibake sequence found in the files
REPLACEMENTS = [
    # 3-byte UTF-8 sequences mangled as Latin-1
    ("Ã©", "é"),  ("Ã¨", "è"),  ("Ãª", "ê"),  ("Ã«", "ë"),
    ("Ã ", "à"),  ("Ã¢", "â"),  ("Ã¤", "ä"),
    ("Ã®", "î"),  ("Ã¯", "ï"),
    ("Ã´", "ô"),  ("Ã¶", "ö"),  ("Ã²", "ò"),
    ("Ã¹", "ù"),  ("Ã»", "û"),  ("Ã¼", "ü"),
    ("Ã§", "ç"),
    ("Ã¦", "æ"),  ("Å"",  "œ"),
    ("Ã‰", "É"),  ("Ãˆ", "È"),  ("ÃŠ", "Ê"),
    ("Ã€", "À"),  ("Ã‚", "Â"),
    ("Ã®", "î"),
    ("Å'",  "Œ"),
    # Common broken words (catch any remaining)
    ("â€™", "'"),   # right single quotation mark
    ("â€œ", "\u201c"),  ("â€\u009d", "\u201d"),  # left/right double quotes
    ("â€"", "–"),   # en dash
    ("â€"", "—"),   # em dash
    ("â€¦", "…"),   # ellipsis
    ("Â«",  "«"),   ("Â»",  "»"),
    ("Â ",  "\u00a0"),  # non-breaking space
    ("â†'", "→"),
    ("â†"", "↓"),
    ("â–ª", "▪"),
    ("âœ"", "✓"),
    ("Â°",  "°"),
    ("Ã—",  "×"),
    ("Â·",  "·"),
]

def fix_file(path: str) -> None:
    if not os.path.exists(path):
        print(f"[SKIP] Not found: {path}")
        return

    # Read as Latin-1 to preserve raw bytes, then fix
    with open(path, "r", encoding="latin-1") as f:
        content = f.read()

    original = content
    for broken, fixed in REPLACEMENTS:
        content = content.replace(broken, fixed)

    # Ensure charset meta is utf-8 (already present, but guarantee it)
    if 'charset="utf-8"' not in content and "charset='utf-8'" not in content:
        content = content.replace("<head>", '<head>\n<meta charset="utf-8"/>', 1)

    if content == original:
        print(f"[OK] No changes needed: {path}")
    else:
        # Write back as UTF-8
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[FIXED] Saved as UTF-8: {path}")

if __name__ == "__main__":
    for file_path in FILES:
        fix_file(file_path)
    print("Done.")