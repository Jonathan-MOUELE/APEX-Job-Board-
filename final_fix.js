const fs = require('fs');
let text = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');

// 1. Encoding Fixes (Agresive)
// First, remove any potential BOM or null chars
text = text.replace(/^\uFEFF/, "").replace(/\0/g, "");

const map = {
  'Ã©': 'é', 'Ã¨': 'è', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã§': 'ç', 'Ã ': 'à', 'Ã¹': 'ù',
  'â€”': '—', 'â€“': '–', 'â€œ': '"', 'â€?': '"', 'â€™': "'", 'â€¦': '...', 'Ã‰': 'É', 'Ã€': 'À', 'Ã?': 'ï',
  'Å“': 'œ', 'Ã¯': 'ï', 'Ǹ': 'é'
};

// Common garbled patterns from terminal output
text = text.replace(/Mtier/g, 'Métier')
           .replace(/comptence/g, 'compétence')
           .replace(/analyses/g, 'analysées')
           .replace(/lan/g, 'élan')
           .replace(/carrire/g, 'carrière')
           .replace(/rmunrs/g, 'rémunérés')
           .replace(/rmunres/g, 'rémunérées')
           .replace(/slectionne/g, 'sélectionnée')
           .replace(/opportunits/g, 'opportunités')
           .replace(/dcouvrez/g, 'découvrez')
           .replace(/Dcouvrez/g, 'Découvrez')
           .replace(/cl/g, 'clé')
           .replace(/rcupration/g, 'récupération')
           .replace(/rinitialiser/g, 'réinitialiser')
           .replace(/dj/g, 'déjà')
           .replace(/Dj/g, 'Déjà')
           .replace(/russir/g, 'réussir')
           .replace(/mtier/g, 'métier')
           .replace(/Mtier/g, 'Métier')
           .replace(/relle/g, 'réelle')
           .replace(/ngocier/g, 'négocier')
           .replace(/dcrocher/g, 'décrocher')
           .replace(/activit/g, 'activité')
           .replace(/recommandes/g, 'recommandées')
           .replace(/frquentes/g, 'fréquentes')
           .replace(/intresse/g, 'intéresse')
           .replace(/intrt/g, 'intérêt')
           .replace(/intrim/g, 'intérim')
           .replace(/Intrim/g, 'Intérim')
           .replace(/Penthivre/g, 'Penthievre');

for (const [bad, good] of Object.entries(map)) {
  text = text.split(bad).join(good);
}

// 2. Remove "Explorer" button in Offres recommandées
text = text.replace(/<button class="btn-exploration".*?<\/button>/gs, '');

// 3. City Section Reconstruction (Ensuring order Paris, Lyon, Bordeaux, Marseille)
const cities = [
  { name: 'Paris', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&q=80' },
  { name: 'Lyon', img: 'https://plus.unsplash.com/premium_photo-1742418148669-85fde84c4431?w=1000&q=80' },
  { name: 'Bordeaux', img: 'https://images.unsplash.com/photo-1493564738392-d148cfbd6eda?w=1000&q=80' },
  { name: 'Marseille', img: 'https://images.unsplash.com/photo-1576244348464-c7d393b6dfc0?w=1000&q=80' }
];

const moreCities = [
  { name: 'Nice', img: 'https://images.unsplash.com/photo-1643914729809-4aa59fdc4c17?w=1000&q=80' },
  { name: 'Reims', img: 'https://images.unsplash.com/photo-1581211653431-310ba15ff9bf?w=1000&q=80' },
  { name: 'Toulouse', img: 'https://plus.unsplash.com/premium_photo-1677048147575-0c2d7c5be8c3?w=1000&q=80' },
  { name: 'Lille', img: 'https://images.unsplash.com/photo-1608651422537-da1f24fdc6fe?w=1000&q=80' },
  { name: 'Strasbourg', img: 'https://images.unsplash.com/photo-1598710859838-d6b630235c56?w=1000&q=80' },
  { name: 'Rennes', img: 'https://plus.unsplash.com/premium_photo-1715954843156-f7c45b73ec92?w=1000&q=80' },
  { name: 'Nantes', img: 'https://plus.unsplash.com/premium_photo-1718893372651-fc0369e6d3f8?w=1000&q=80' }
];

const cityCardsHtml = cities.map(c => `
          <div class="city-card-gallery" onclick="searchChip('','${c.name}'); window.scrollToResults(); return false;">
            <div class="city-gallery-img" style="background-image:url('${c.img}')"></div>
            <div class="city-gallery-overlay"></div>
            <div class="city-gallery-content">
              <div class="city-gallery-name">${c.name}</div>
              <div class="city-gallery-view">Voir les offres →</div>
            </div>
          </div>`).join('');

const moreCityCardsHtml = moreCities.map(c => `
            <div class="city-card-gallery" onclick="searchChip('','${c.name}'); window.scrollToResults(); closeAll(); return false;">
              <div class="city-gallery-img" style="background-image:url('${c.img}')"></div>
              <div class="city-gallery-overlay"></div>
              <div class="city-gallery-content">
                <div class="city-gallery-name">${c.name}</div>
                <div class="city-gallery-view">Voir les offres →</div>
              </div>
            </div>`).join('');

const citySectionHtml = `
    <section class="sec" aria-labelledby="cities-title">
      <div class="sec-inner">
        <div class="sec-hd">
          <div class="sec-eye">Découvrez votre futur cadre de vie</div>
          <h2 class="sec-title" id="cities-title">Découvrir par ville</h2>
          <p style="color:var(--muted);max-width:600px;margin-top:8px;">Quelle ville pour votre prochain job ? Explorez les opportunités dans les plus grandes métropoles françaises.</p>
        </div>

        <div class="city-grid-gallery">
${cityCardsHtml}
        </div>

        <div style="text-align:center; margin-top:32px;">
          <button class="btn-ghost" onclick="document.getElementById('more-cities-panel').style.display='block'; document.getElementById('backdrop').style.display='block';" style="font-weight:700">
            Voir plus de villes <i data-lucide="chevron-down"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- PANEL MORE CITIES -->
    <div id="more-cities-panel" class="panel drawer" style="display:none; max-width:800px; padding:24px;">
      <div class="panel-hd" style="margin-bottom:24px;">
        <h3 style="font-weight:800; font-size:1.4rem;">Toutes les destinations</h3>
        <button class="btn-ghost" onclick="this.closest('.panel').style.display='none'; document.getElementById('backdrop').style.display='none';" style="width:36px; height:36px; padding:0;"><i data-lucide="x"></i></button>
      </div>
      <div class="city-grid-gallery" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
${moreCityCardsHtml}
      </div>
    </div>
`;

const patternCities = /<section class="sec" aria-labelledby="cities-title">.*?<\/section>(\s*<!-- PANEL MORE CITIES -->.*?<\/div>)?/gs;
text = text.replace(patternCities, citySectionHtml);

fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, 'utf8');
