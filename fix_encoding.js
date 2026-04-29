const fs = require('fs');
let text = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');
text = text.replace(/Ã©/g, 'é')
  .replace(/Ã¨/g, 'è')
  .replace(/Ã¢/g, 'â')
  .replace(/Ãª/g, 'ê')
  .replace(/Ã®/g, 'î')
  .replace(/Ã´/g, 'ô')
  .replace(/Ã»/g, 'û')
  .replace(/Ã§/g, 'ç')
  .replace(/Ã /g, 'à')
  .replace(/Ã¹/g, 'ù')
  .replace(/â€”/g, '—')
  .replace(/â€“/g, '–')
  .replace(/â€œ/g, '"')
  .replace(/â€\?/g, '"')
  .replace(/â€™/g, "'")
  .replace(/â€¦/g, '...')
  .replace(/Ã‰/g, 'É')
  .replace(/Ã€/g, 'À')
  .replace(/Ã\?/g, 'ï')
  .replace(/Å“/g, 'œ')
  .replace(/Ã¯/g, 'ï');
fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, 'utf8');
