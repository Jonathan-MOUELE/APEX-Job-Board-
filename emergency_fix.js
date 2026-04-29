const fs = require('fs');
let text = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');

// 1. Remove my catastrophic space replacement mistake
text = text.split('à ').join(' ');
// Also check for 'à' without space if any were joined
// But the replace was / /g -> 'à '

// 2. Surgical encoding fix (only the truly broken sequences)
const map = {
  'Ã©': 'é', 'Ã¨': 'è', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã§': 'ç', 'Ã ': 'à', 'Ã¹': 'ù',
  'â€”': '—', 'â€“': '–', 'â€œ': '"', 'â€?': '"', 'â€™': "'", 'â€¦': '...', 'Ã‰': 'É', 'Ã€': 'À', 'Ã?': 'ï',
  'Å“': 'œ', 'Ã¯': 'ï'
};
for (const [bad, good] of Object.entries(map)) {
  text = text.split(bad).join(good);
}

// 3. Fix words that might be broken (without breaking keywords like class)
text = text.replace(/Mtier/g, 'Métier')
           .replace(/comptence/g, 'compétence')
           .replace(/recommandes/g, 'recommandées')
           .replace(/frquentes/g, 'fréquentes')
           .replace(/intrim/g, 'intérim')
           .replace(/Intrim/g, 'Intérim')
           .replace(/rmunrs/g, 'rémunérés')
           .replace(/rmunres/g, 'rémunérées')
           .replace(/Dconnexion/g, 'Déconnexion')
           .replace(/carrire/g, 'carrière')
           .replace(/lan/g, 'élan')
           .replace(/slectionne/g, 'sélectionnée')
           .replace(/opportunits/g, 'opportunités')
           .replace(/dcouvrez/g, 'découvrez')
           .replace(/Dcouvrez/g, 'Découvrez')
           .replace(/rcupration/g, 'récupération')
           .replace(/rinitialiser/g, 'réinitialiser')
           .replace(/dj/g, 'déjà')
           .replace(/Dj/g, 'Déjà')
           .replace(/russir/g, 'réussir')
           .replace(/relle/g, 'réelle')
           .replace(/ngocier/g, 'négocier')
           .replace(/dcrocher/g, 'décrocher')
           .replace(/activit/g, 'activité');

fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, 'utf8');
