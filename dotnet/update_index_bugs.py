import os
import re

INDEX_PATH = r"C:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\wwwroot\index.html"
PROGRAM_PATH = r"C:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\Program.cs"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Mobile CSS (Bug 5)
css_to_add = """
        @media (max-width: 768px) {
          .chat-panel {
            right: 10px;
            left: 10px;
            width: auto;
            bottom: 80px;
            height: 70vh;
            max-height: 500px;
          }
          .chat-btn {
            bottom: 16px;
            right: 16px;
          }
        }
    </style>"""
if "@media (max-width: 768px)" not in html:
    html = html.replace("    </style>", css_to_add)

# 2. Remove live badge (Bug 4)
badge_pattern = r'<div class="live-badge">.*?</div>'
html = re.sub(badge_pattern, '', html, flags=re.DOTALL)

# 3. Super Recruiters cleanup (Bug 4)
recruiters_mapping = [
    ('<div class="recruiter-card">', '<div class="recruiter-card" onclick="triggerSearch(\'Microsoft\')">', 'Microsoft'),
    ('<div class="recruiter-card">', '<div class="recruiter-card" onclick="triggerSearch(\'Thales\')">', 'Thales'),
    ('<div class="recruiter-card">', '<div class="recruiter-card" onclick="triggerSearch(\'Doctolib\')">', 'Doctolib'),
    ('<div class="recruiter-card">', '<div class="recruiter-card" onclick="triggerSearch(\'OVH\')">', 'OVH Cloud'),
    ('<div class="recruiter-card">', '<div class="recruiter-card" onclick="triggerSearch(\'Capgemini\')">', 'Capgemini')
]

# Quick replace for recruiters by finding the exact blocks or replacing globally.
# Let's just do a simple replacement for the onclick:
html = html.replace('<div class="recruiter-card">\n                        <div class="recruiter-logo" style="color: #0078D4;">M</div>', '<div class="recruiter-card" style="cursor:pointer;" onclick="triggerSearch(\'Microsoft\')">\n                        <div class="recruiter-logo" style="color: #0078D4;">M</div>')
html = html.replace('<div class="recruiter-card">\n                        <div class="recruiter-logo" style="color: #FF0000;">T</div>', '<div class="recruiter-card" style="cursor:pointer;" onclick="triggerSearch(\'Thales\')">\n                        <div class="recruiter-logo" style="color: #FF0000;">T</div>')
html = html.replace('<div class="recruiter-card">\n                        <div class="recruiter-logo" style="color: #000000; background: white;">D</div>', '<div class="recruiter-card" style="cursor:pointer;" onclick="triggerSearch(\'Doctolib\')">\n                        <div class="recruiter-logo" style="color: #000000; background: white;">D</div>')
html = html.replace('<div class="recruiter-card">\n                        <div class="recruiter-logo" style="color: #E23D28;">O</div>', '<div class="recruiter-card" style="cursor:pointer;" onclick="triggerSearch(\'OVH\')">\n                        <div class="recruiter-logo" style="color: #E23D28;">O</div>')
html = html.replace('<div class="recruiter-card">\n                        <div class="recruiter-logo" style="color: #06B6D4;">C</div>', '<div class="recruiter-card" style="cursor:pointer;" onclick="triggerSearch(\'Capgemini\')">\n                        <div class="recruiter-logo" style="color: #06B6D4;">C</div>')

# 4. Job detail panel missing (Bug 3)
# The JS should be replaced inside `renderRealResults`:
old_js = """
  // Click handlers pour le panel
  searchResultsContainer.querySelectorAll('.job-card').forEach((card, i) => {
    card.addEventListener('click', () => openJobPanelReal(jobs[i]));
  });
"""

new_js = """
  // Click handlers pour le panel
  window._currentJobs = jobs; // Store globally
  searchResultsContainer.querySelectorAll('.job-card').forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      openJobPanelReal(window._currentJobs[i]);
    });
  });
"""
if "window._currentJobs = jobs;" not in html:
    html = html.replace(old_js, new_js)

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(html)

# AddHttpClient in Program.cs (Bug 2)
with open(PROGRAM_PATH, 'r', encoding='utf-8') as f:
    prog = f.read()

if "builder.Services.AddHttpClient();" not in prog:
    prog = prog.replace("builder.Services.AddEndpointsApiExplorer();", "builder.Services.AddHttpClient();\nbuilder.Services.AddEndpointsApiExplorer();")
    with open(PROGRAM_PATH, 'w', encoding='utf-8') as f:
        f.write(prog)

print("Updated perfectly.")
