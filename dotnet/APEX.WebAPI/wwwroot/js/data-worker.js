/**
 * APEX — data-worker.js
 * ─────────────────────────────────────────────
 * Web Worker dédié au parsing/formatage des offres France Travail.
 * Tourne dans un thread séparé → UI reste à 60 FPS pendant le parsing.
 *
 * Communication : postMessage({id, jobs: rawArray})
 * Réponse       : postMessage({id, result: processedArray})
 */

/** Décode les strings UTF-8 corrompues (é → é etc.) */
function decodeUtf8Safe(str) {
  if (!str) return str;
  return str
    .replace(/\u00C3\u00A9/g, '\u00E9') // é
    .replace(/\u00C3\u00A8/g, '\u00E8') // è
    .replace(/\u00C3\u00AA/g, '\u00EA') // ê
    .replace(/\u00C3\u00AB/g, '\u00EB') // ë
    .replace(/\u00C3\u00A7/g, '\u00E7') // ç
    .replace(/\u00C3\u00AE/g, '\u00EE') // î
    .replace(/\u00C3\u00AF/g, '\u00EF') // ï
    .replace(/\u00C3\u00B4/g, '\u00F4') // ô
    .replace(/\u00C3\u00B6/g, '\u00F6') // ö
    .replace(/\u00C3\u00B9/g, '\u00F9') // ù
    .replace(/\u00C3\u00BB/g, '\u00FB') // û
    .replace(/\u00C3\u00BC/g, '\u00FC') // ü
    .replace(/\u00C3\u00A0/g, '\u00E0') // à
    .replace(/\u00C3\u0020/g, '\u00E0 ') // Ã followed by space
    .replace(/\u00C3/g, '\u00E0')       // Ã alone
    .replace(/\u00E2\u20AC\u2122/g, "'") // â€™
    .replace(/\u00E2\u20AC\u00A6/g, "...") // â€¦
    .replace(/\u00E2\u20AC\u0153/g, '"') // â€œ
    .replace(/\u00E2\u20AC\u009D/g, '"') // â€ 
    .replace(/\u00E2\u20AC/g, '-')      // â€
    .replace(/\u00C5\u201C/g, '\u0153')  // œ
    .replace(/\u00C3\u0080/g, '\u00C0') // À
    .replace(/\u00C3\u0089/g, '\u00C9') // É
    .replace(/\u00C2/g, '');            // Â
}

/** Formate le salaire en chaîne lisible */
function formatSalary(label) {
  if (!label) return '';
  const s = decodeUtf8Safe(label);
  const m = s.match(/(\d[\d\s]*)[\s\S]*?[Ee]uros?\s*[àa]\s*(\d[\d\s]*)/i);
  if (m) {
    const min = parseInt(m[1].replace(/\s/g,'')), max = parseInt(m[2].replace(/\s/g,''));
    if (!isNaN(min) && !isNaN(max)) return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} €/${/mois/i.test(s)?'mois':'an'}`;
  }
  return s.replace(/Euros?/gi,'€').replace(/â‚¬/g,'€').trim();
}

/** Nettoie le HTML d'une description */
function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

/** Traitement complet d'un tableau d'offres brutes */
function processJobs(raw) {
  if (!Array.isArray(raw)) {
    raw = raw?.resultats ?? raw?.results ?? raw?.items ?? raw?.offres ?? [];
  }
  return raw.map(j => ({
    ...j,
    id:          j.id || j.identifiant || j.jobId || (Math.random().toString(36).slice(2)),
    intitule:    decodeUtf8Safe(j.intitule    || j.title    || ''),
    description: decodeUtf8Safe(stripHtml(j.description || j.desc || '')),
    entreprise:  {
      ...(j.entreprise||{}),
      nom: decodeUtf8Safe(j.entreprise?.nom || j.company || ''),
    },
    salaire: {
      ...(j.salaire||{}),
      libelle:    decodeUtf8Safe(j.salaire?.libelle || j.salary || ''),
      _formatted: formatSalary(j.salaire?.libelle || j.salary || ''),
    },
    lieuTravail: {
      ...(j.lieuTravail||{}),
      libelle: decodeUtf8Safe(j.lieuTravail?.libelle || j.location || ''),
    },
    typeContrat: (function(tc) {
      if (!tc) return '';
      // Normalisation des codes bruts → libellés FR
      const MAP = {
        'CDI': 'CDI', 'CDD': 'CDD',
        'MIS': 'Intérim', 'SAI': 'Saisonnier',
        'LIB': 'Libéral', 'REP': 'Reprise',
        'FRA': 'Franchise', 'CCE': 'Commerce',
        'DIN': 'Indépendant',
        'full_time':  'Temps plein',
        'part_time':  'Temps partiel',
        'FULL_TIME':  'Temps plein',
        'PART_TIME':  'Temps partiel',
        'INTERNSHIP': 'Stage',
        'APPRENTICESHIP': 'Alternance',
        'CONTRACT': 'CDD',
        'PERMANENT': 'CDI',
        'FREELANCE': 'Freelance',
        'TEMPORARY': 'Intérim',
      };
      return MAP[tc] || (MAP[tc.toUpperCase()] || tc);
    })(j.typeContrat || j.contractType || j.natureContrat || ''),
    url:         j.url || j.originUrl || j.origineOffre?.urlOrigine || j.contact?.urlPostulation || j.applyUrl || (j.id&&!j.id.toString().includes('_')?`https://candidat.francetravail.fr/offres/recherche/detail/${j.id}`:''),
    dateCreation:j.dateCreation || j.datePublished || '',
    _processed:  true,
  }));
}

// Écoute les messages du thread principal
self.addEventListener('message', ({data}) => {
  const {id, jobs} = data;
  try {
    const result = processJobs(jobs);
    self.postMessage({id, result});
  } catch(e) {
    self.postMessage({id, result: [], error: e.message});
  }
});
