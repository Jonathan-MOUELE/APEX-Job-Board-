const fs = require('fs');
let text = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', 'utf8');

// Surgical fixes
text = text.replace(/élang=/g, 'lang=')
           .replace(/classList/g, 'classList')
           .replace(/clip:/g, 'clip:')
           .replace(/clamp\(/g, 'clamp(')
           .replace(/—Â/g, '—')
           .replace(/â€”/g, '—')
           .replace(/Ã©/g, 'é')
           .replace(/Ã¨/g, 'è')
           .replace(/Ã¢/g, 'â')
           .replace(/Ãª/g, 'ê')
           .replace(/Ã®/g, 'î')
           .replace(/Ã´/g, 'ô')
           .replace(/Ã»/g, 'û')
           .replace(/Ã§/g, 'ç')
           .replace(/Ã /g, 'à')
           .replace(/Ã¹/g, 'ù')
           .replace(/â€“/g, '–')
           .replace(/â€œ/g, '"')
           .replace(/â€?/g, '"')
           .replace(/â€™/g, "'")
           .replace(/â€¦/g, '...')
           .replace(/Ã‰/g, 'É')
           .replace(/Ã€/g, 'À');

// Re-verify words that might be broken
text = text.replace(/Dconnexion/g, 'Déconnexion')
           .replace(/recommandes/g, 'recommandées')
           .replace(/rmunrs/g, 'rémunérés')
           .replace(/frquentes/g, 'fréquentes')
           .replace(/intrim/g, 'intérim')
           .replace(/Intrim/g, 'Intérim')
           .replace(/Mtier/g, 'Métier')
           .replace(/comptence/g, 'compétence')
           .replace(/rmunres/g, 'rémunérées')
           .replace(/Penthvre/g, 'Penthievre');

// Check for the "à " at the start of tags or weird places
text = text.replace(/<à /g, '<')
           .replace(/ à /g, ' ')
           .replace(/à </g, '<')
           .replace(/>à /g, '>');

fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, 'utf8');
