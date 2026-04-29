const fs = require('fs');
let content = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');

// 1. Repair Common UTF-8 Corruption
const map = {
  'Ã©': 'é', 'Ã¨': 'è', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã§': 'ç', 'Ã ': 'à', 'Ã¹': 'ù',
  'â€”': '—', 'â€“': '–', 'â€œ': '"', 'â€?': '"', 'â€™': "'", 'â€¦': '...', 'Ã‰': 'É', 'Ã€': 'À', 'Ã?': 'ï',
  'Å“': 'œ', 'Ã¯': 'ï', 'Ǹ': 'é'
};
for (const [bad, good] of Object.entries(map)) {
  content = content.split(bad).join(good);
}

// 2. Repair My Previous Turn Mistakes (Surgical Reverts)
content = content.replace(/élang=/g, 'lang=')
                 .replace(/classList/g, 'classList')
                 .replace(/clip:/g, 'clip:')
                 .replace(/clamp\(/g, 'clamp(')
                 .replace(/class=/g, 'class=')
                 .replace(/click/g, 'click')
                 .replace(/close/g, 'close')
                 .replace(/clear/g, 'clear')
                 .replace(/ /g, 'à ')
                 .replace(/Dconnexion/g, 'Déconnexion')
                 .replace(/recommandes/g, 'recommandées')
                 .replace(/rmunrs/g, 'rémunérés')
                 .replace(/frquentes/g, 'fréquentes')
                 .replace(/intrim/g, 'intérim')
                 .replace(/Intrim/g, 'Intérim')
                 .replace(/Mtier/g, 'Métier')
                 .replace(/comptence/g, 'compétence')
                 .replace(/rmunres/g, 'rémunérées')
                 .replace(/Penthvre/g, 'Penthievre')
                 .replace(/Ã©/g, 'é'); // One last check

// 3. Ensure the Search Bar is Correct (no manual oninput conflict if search.js handles it)
// If search.js uses autoComplete library on #sq-job, we don't need manual oninput.
// However, the user liked my manual autocompletion. I'll keep it but fix the syntax in search.js (already done).

// 4. Cities Order & Images (Paris, Lyon, Bordeaux, Marseille)
const citiesTop = [
  { name: 'Paris', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&q=80' },
  { name: 'Lyon', img: 'https://plus.unsplash.com/premium_photo-1742418148669-85fde84c4431?w=1000&q=80' },
  { name: 'Bordeaux', img: 'https://images.unsplash.com/photo-1493564738392-d148cfbd6eda?w=1000&q=80' },
  { name: 'Marseille', img: 'https://images.unsplash.com/photo-1576244348464-c7d393b6dfc0?w=1000&q=80' }
];
const cityCardsHtml = citiesTop.map(c => `
          <div class="city-card-gallery" onclick="searchChip('','${c.name}'); window.scrollToResults(); return false;">
            <div class="city-gallery-img" style="background-image:url('${c.img}')"></div>
            <div class="city-gallery-overlay"></div>
            <div class="city-gallery-content">
              <div class="city-gallery-name">${c.name}</div>
              <div class="city-gallery-view">Voir les offres →</div>
            </div>
          </div>`).join('');

const patternGrid = /<div class="city-grid-gallery">.*?<\/div>/s;
content = content.replace(patternGrid, `<div class="city-grid-gallery">${cityCardsHtml}\n        </div>`);

// 5. Final Formatting & Cleanup
content = content.replace(/ —Trouvez/g, ' — Trouvez');
content = content.replace(/\0/g, "");

fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', content, 'utf8');
