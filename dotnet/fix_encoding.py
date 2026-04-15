"""Fix double-encoded UTF-8 (mojibake) in HTML files. Run with: python fix_encoding.py"""
import os, sys

FILES = [
    r'C:\xampp\htdocs\APEX\04_WebUI\index.html',
    r'C:\xampp\htdocs\APEX\04_WebUI\register.html',
]

# Each entry: (broken_bytes_as_latin1_str, correct_utf8_str)
# These are raw UTF-8 bytes that were re-interpreted as latin-1, producing "Ã©" etc.
REPLACEMENTS = [
    # lowercase accented vowels
    ('Ã©', 'é'), ('Ã¨', 'è'), ('Ãª', 'ê'), ('Ã«', 'ë'),
    ('Ã ', 'à'), ('Ã¢', 'â'), ('Ã¤', 'ä'),
    ('Ã®', 'î'), ('Ã¯', 'ï'),
    ('Ã´', 'ô'), ('Ã¶', 'ö'),
    ('Ã¹', 'ù'), ('Ã»', 'û'), ('Ã¼', 'ü'),
    # consonants
    ('Ã§', 'ç'),
    # uppercase accented
    ('Ã‰', 'É'), ('Ãˆ', 'È'), ('ÃŠ', 'Ê'),
    ('Ã€', 'À'), ('Ã‚', 'Â'),
    # ligatures
    ('Å\x93', 'œ'), ('Å\x92', 'Œ'),
    # typographic quotes & punctuation
    ('\xe2\x80\x99', '\u2019'),   # right single quote '
    ('\xe2\x80\x98', '\u2018'),   # left single quote '
    ('\xe2\x80\x9c', '\u201c'),   # left double quote "
    ('\xe2\x80\x9d', '\u201d'),   # right double quote "
    ('\xe2\x80\x93', '\u2013'),   # en dash –
    ('\xe2\x80\x94', '\u2014'),   # em dash —
    ('\xe2\x80\xa6', '\u2026'),   # ellipsis …
    # guillemets
    ('\xc2\xab', '«'), ('\xc2\xbb', '»'),
    # misc
    ('\xc2\xb0', '°'), ('\xc2\xb7', '·'), ('\xc2\xa0', '\u00a0'),
    ('\xc3\x97', '×'),
    # arrows / symbols
    ('\xe2\x86\x92', '→'), ('\xe2\x86\x93', '↓'),
    ('\xe2\x9c\x93', '✓'), ('\xe2\x9c\x97', '✗'),
]

def fix_file(path):
    if not os.path.exists(path):
        print(f'[SKIP] not found: {path}'); return
    # Read as latin-1: every byte becomes the same code-point, so broken sequences are preserved as-is
    with open(path, 'r', encoding='latin-1') as f:
        text = f.read()
    original = text
    for broken, correct in REPLACEMENTS:
        text = text.replace(broken, correct)
    if text == original:
        print(f'[NO CHANGE] {path}')
    else:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'[FIXED]     {path}')

if __name__ == '__main__':
    for fp in FILES:
        fix_file(fp)
    print('Done.')
