import os

# Configuration
PROJECT_ROOT = r"c:\xampp\htdocs\APEX"
OUTPUT_FILE = r"c:\xampp\htdocs\APEX\APEX_AI_STUDIO_CONTEXT.md"
EXCLUDE_DIRS = ['bin', 'obj', 'node_modules', '.git', '.vs', 'artifacts', 'brain', 'scratch']
EXTENSIONS = ['.cs', '.html', '.js', '.css', '.json', '.md']

def should_include(filename):
    return any(filename.endswith(ext) for ext in EXTENSIONS)

def pack():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        out.write("# CONTEXTE COMPLET DU PROJET APEX POUR RÉPARATION\n\n")
        out.write("Ce fichier contient la structure et le code source complet pour analyse et réparation.\n\n")
        
        # 1. Structure
        out.write("## 1. STRUCTURE DES DOSSIERS\n```text\n")
        for root, dirs, files in os.walk(PROJECT_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            level = root.replace(PROJECT_ROOT, '').count(os.sep)
            indent = ' ' * 4 * (level)
            out.write(f"{indent}{os.path.basename(root)}/\n")
            subindent = ' ' * 4 * (level + 1)
            for f in files:
                if should_include(f):
                    out.write(f"{subindent}{f}\n")
        out.write("```\n\n")

        # 2. Code Source
        out.write("## 2. CODE SOURCE\n\n")
        for root, dirs, files in os.walk(PROJECT_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in files:
                if should_include(f) and f != "APEX_AI_STUDIO_CONTEXT.md":
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                    
                    # Ignorer certains fichiers de config lourds ou auto-générés
                    if "package-lock.json" in f: continue
                    
                    out.write(f"### FICHIER: {rel_path}\n")
                    lang = f.split('.')[-1]
                    if lang == 'cs': lang = 'csharp'
                    if lang == 'js': lang = 'javascript'
                    
                    out.write(f"```{lang}\n")
                    try:
                        with open(full_path, 'r', encoding='utf-8') as src:
                            out.write(src.read())
                    except Exception as e:
                        out.write(f"// Erreur de lecture : {e}\n")
                    out.write("\n```\n\n")

    print(f"Terminé ! Le fichier est prêt ici : {OUTPUT_FILE}")

if __name__ == "__main__":
    pack()
