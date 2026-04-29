const fs = require('fs');
let text = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');

const map = {
  'Ǹ': 'é',
  '\'': '→',
  '': 'è',
  'Â': '',
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ã¢': 'â',
  'Ãª': 'ê',
  'Ã®': 'î',
  'Ã´': 'ô',
  'Ã»': 'û',
  'Ã§': 'ç',
  'Ã ': 'à',
  'Ã¹': 'ù',
  'â€”': '—',
  'â€“': '–',
  'â€œ': '"',
  'â€?': '"',
  'â€™': "'",
  'â€¦': '...',
  'Ã‰': 'É',
  'Ã€': 'À',
  'Penthivre': 'Penthievre'
};

for (const [bad, good] of Object.entries(map)) {
  text = text.split(bad).join(good);
}

fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, 'utf8');
