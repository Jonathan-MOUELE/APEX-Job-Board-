/**
 * APEX — data-worker.js
 * ─────────────────────────────────────────────
 * Web Worker dédié au parsing/formatage des offres France Travail.
 * Tourne dans un thread séparé → UI reste à 60 FPS pendant le parsing.
 *
 * Communication : postMessage({id, jobs: rawArray})
 * Réponse       : postMessage({id, result: processedArray})
 */

/** Décode les strings UTF-8 corrompues (Ã© → é etc.) */
function decodeUtf8Safe(str) {
  if (!str || typeof str !== 'string') return str || '';
  try { return decodeURIComponent(escape(str)); } catch(_) {}
  return str
    .replace(/Ã©/g,'é').replace(/Ã¨/g,'è').replace(/Ã /g,'à').replace(/Ã¢/g,'â')
    .replace(/Ã®/g,'î').replace(/Ã´/g,'ô').replace(/Ã¹/g,'ù').replace(/Ã»/g,'û')
    .replace(/Ã§/g,'ç').replace(/Ã‰/g,'É').replace(/Ãª/g,'ê').replace(/Ã¼/g,'ü')
    .replace(/â€™/g,"'").replace(/â€"/g,'–').replace(/Ã¢â€šÂ¬/g,'€').replace(/â‚¬/g,'€')
    .replace(/Â°/g,'°').replace(/Â«/g,'«').replace(/Â»/g,'»');
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
    typeContrat: j.typeContrat || j.contractType || j.natureContrat || '',
    url:         j.url || j.origineOffre?.urlOrigine || j.applyUrl || '',
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
