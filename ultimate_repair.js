const fs = require('fs');
const buffer = fs.readFileSync('dotnet/APEX.WebAPI/wwwroot/index.html');
let text = buffer.toString('utf8');

// List of all known double-encoded UTF-8 patterns
const map = {
    '\u00C3\u00A9': 'é',
    '\u00C3\u00A8': 'è',
    '\u00C3\u00A0': 'à',
    '\u00C3\u00A2': 'â',
    '\u00C3\u00AA': 'ê',
    '\u00C3\u00AE': 'î',
    '\u00C3\u00AF': 'ï',
    '\u00C3\u00B4': 'ô',
    '\u00C3\u00BB': 'û',
    '\u00C3\u00B9': 'ù',
    '\u00C3\u00A7': 'ç',
    '\u00C3\u0089': 'É',
    '\u00C3\u0088': 'È',
    '\u00C3\u0080': 'À',
    '\u00C3\u0082': 'Â',
    '\u00C3\u008A': 'Ê',
    '\u00C3\u008E': 'Î',
    '\u00C3\u008F': 'Ï',
    '\u00C3\u0094': 'Ô',
    '\u00C3\u009B': 'Û',
    '\u00C3\u0099': 'Ù',
    '\u00C3\u0087': 'Ç',
    '\u00E2\u0080\u0099': "'",
    '\u00E2\u0080\u0093': '–',
    '\u00E2\u0080\u0094': '—',
    '\u00E2\u0080\u009C': '"',
    '\u00E2\u0080\u009D': '"',
    '\u00E2\u0080\u00A6': '...',
    '\u00C2\u00A0': ' ',
    '\u00C2\u00BB': '»',
    '\u00C2\u00AB': '«',
    '\u00C3\u008F\u00C2\u0092': 'é', // Some weird variants
    '\u00C3\u008F\u00C2\u0093': 'é',
    'Ǹ': 'é'
};

for (const [bad, good] of Object.entries(map)) {
    text = text.split(bad).join(good);
}

// Specific fix for the "class" bug and others
text = text.replace(/classList/g, 'classList')
           .replace(/clip:/g, 'clip:')
           .replace(/clamp\(/g, 'clamp(')
           .replace(/lang="fr"/g, 'lang="fr"')
           .replace(/Dconnexion/g, 'Déconnexion')
           .replace(/recommandes/g, 'recommandées')
           .replace(/rmunrs/g, 'rémunérés')
           .replace(/frquentes/g, 'fréquentes')
           .replace(/Intrim/g, 'Intérim')
           .replace(/intrim/g, 'intérim')
           .replace(/Mtier/g, 'Métier')
           .replace(/comptence/g, 'compétence')
           .replace(/rmunres/g, 'rémunérées')
           .replace(/Penthvre/g, 'Penthievre');

// Re-write with clean UTF-8
fs.writeFileSync('dotnet/APEX.WebAPI/wwwroot/index.html', text, { encoding: 'utf8' });
