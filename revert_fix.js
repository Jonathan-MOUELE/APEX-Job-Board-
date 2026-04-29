const fs = require('fs');
let text = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');
text = text.split('clé').join('cl');
const map = {
  'Ã©': 'é', 'Ã¨': 'è', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã§': 'ç', 'Ã ': 'à', 'Ã¹': 'ù',
  'â€”': '—', 'â€“': '–', 'â€œ': '"', 'â€?': '"', 'â€™': "'", 'â€¦': '...', 'Ã‰': 'É', 'Ã€': 'À', 'Ã?': 'ï',
  'Å“': 'œ', 'Ã¯': 'ï'
};
for (const [bad, good] of Object.entries(map)) { text = text.split(bad).join(good); }
text = text.replace(/Mtier/g, 'Métier').replace(/comptence/g, 'compétence').replace(/analyses/g, 'analysées').replace(/carrire/g, 'carrière');
text = text.replace(/\0/g, "");
fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, 'utf8');
