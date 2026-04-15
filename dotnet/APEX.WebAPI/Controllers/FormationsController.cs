// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — FormationsController                          ║
// ║  Certifications & formations par secteur (guest OK)          ║
// ╚══════════════════════════════════════════════════════════════╝

using Microsoft.AspNetCore.Mvc;

namespace APEX.WebAPI.Controllers;

[ApiController]
[Route("api/formations")]
public class FormationsController : ControllerBase
{
    // ══════════════════════════════════════════════════════════
    //  GET /api/formations?sector=numerique
    // ══════════════════════════════════════════════════════════

    [HttpGet]
    public IActionResult GetFormations([FromQuery] string sector = "")
    {
        var s = sector.Trim().ToLowerInvariant();

        var all = new Dictionary<string, FormationDto[]>
        {
            ["numerique"] =
            [
                new("💻", "OpenClassrooms — Développeur Web Full Stack",
                    "https://openclassrooms.com/fr/paths/185",
                    "Formation diplômante Bac+2", "12 mois", "Gratuit CPF", "#a78bfa"),
                new("🎓", "Google IT Support Certificate",
                    "https://grow.google/certificates/it-support/",
                    "Certification Google", "6 mois", "Gratuit Coursera", "#60a5fa"),
                new("☁️", "Microsoft Azure AZ-900",
                    "https://learn.microsoft.com/fr-fr/certifications/azure-fundamentals/",
                    "Certification Microsoft", "40h", "165€ examen", "#38bdf8"),
                new("⚡", "AWS Cloud Practitioner",
                    "https://aws.amazon.com/fr/certification/certified-cloud-practitioner/",
                    "Certification AWS", "40h", "100$", "#fb923c"),
                new("🐍", "Python Institute — PCEP",
                    "https://pythoninstitute.org/pcep",
                    "Certification Python", "60h", "59$", "#facc15"),
                new("🔐", "CompTIA Security+",
                    "https://www.comptia.org/certifications/security",
                    "Certification cybersécurité", "3 mois", "399$", "#f87171"),
            ],

            ["sante"] =
            [
                new("🏥", "Aide-Soignant — DEAS Croix-Rouge",
                    "https://www.croix-rouge.fr/Nos-formations/Institut-de-formation",
                    "Diplôme d'État", "12 mois", "Financement OPCO", "#34d399"),
                new("💊", "Infirmier — IFSI",
                    "https://www.infirmiers.com/etudiants/concours-ifsi.html",
                    "Diplôme d'État Infirmier", "3 ans", "Gratuit (frais inscription)", "#4ade80"),
                new("🧬", "BTS Analyses de biologie médicale",
                    "https://www.onisep.fr/Choisir-mes-etudes/Apres-le-bac/Principaux-domaines-d-etudes/Les-BTS/BTS-Analyses-de-biologie-medicale",
                    "BTS National", "2 ans", "Gratuit (lycée)", "#a3e635"),
                new("🧠", "PSC1 — Prévention Secours Civiques",
                    "https://www.croix-rouge.fr/Nos-formations/Formation-premiers-secours/Prevention-et-Secours-Civiques-PSC1",
                    "Attestation nationale", "7h", "50€", "#86efac"),
            ],

            ["restauration"] =
            [
                new("👨‍🍳", "CAP Cuisine — IFAPME",
                    "https://www.ifapme.be/formations/alimentation-et-horeca/cap-cuisine",
                    "CAP Cuisine", "1 an", "Financement OPCO", "#fbbf24"),
                new("🍷", "WSET Level 2 — Vins & Spiritueux",
                    "https://www.wsetglobal.com/qualifications/wset-level-2-award-in-wines/",
                    "Certification internationale", "2 jours", "~400€", "#f59e0b"),
                new("🍰", "BP Arts de la cuisine",
                    "https://www.ferrandi-paris.fr/",
                    "Brevet Professionnel", "2 ans", "CPF éligible", "#a78bfa"),
                new("📋", "HACCP — Hygiène alimentaire",
                    "https://www.qualiformation.com/formation-hygiene-alimentaire-haccp.html",
                    "Certification obligatoire", "14h", "50-150€", "#34d399"),
            ],

            ["logistique"] =
            [
                new("🚚", "CACES R489 — Chariot élévateur",
                    "https://www.inrs.fr/risques/chariots-elevateurs/caces.html",
                    "Certification obligatoire", "3-5 jours", "300-500€", "#60a5fa"),
                new("📦", "BTS Gestion des transports et logistique associée",
                    "https://www.onisep.fr/Choisir-mes-etudes/Apres-le-bac/Principaux-domaines-d-etudes/Les-BTS/BTS-Gestion-des-transports-et-logistique-associee",
                    "BTS National", "2 ans", "Gratuit", "#38bdf8"),
                new("📊", "Supply Chain Management — APICS CSCP",
                    "https://www.ascm.org/certifications/cscp/",
                    "Certification internationale", "6 mois", "~1300$", "#fb923c"),
                new("🏭", "Lean Six Sigma Yellow Belt",
                    "https://www.lean6sigmabelt.fr/",
                    "Certification qualité", "2 jours", "~400€", "#a78bfa"),
            ],

            ["btp"] =
            [
                new("⚠️", "CACES R482 — Engins de chantier",
                    "https://www.inrs.fr/risques/engins-de-chantier/caces.html",
                    "Certification obligatoire", "3-5 jours", "400-600€", "#fb923c"),
                new("📐", "Conducteur de travaux — Titre RNCP",
                    "https://www.afpa.fr/formation-professionnelle/conducteur-h-f-de-travaux-batiment",
                    "Titre professionnel Bac+2", "12 mois", "CPF éligible", "#fbbf24"),
                new("🔧", "Habilitation électrique B1V — AFPA",
                    "https://www.afpa.fr",
                    "Habilitation réglementaire", "3-5 jours", "300-500€", "#60a5fa"),
                new("🏗️", "BIM Manager — Autodesk Certified",
                    "https://www.autodesk.com/certification/learn/catalog",
                    "Certification Autodesk", "3 mois", "~600€", "#4ade80"),
            ],

            ["finance"] =
            [
                new("📈", "CFA Institute — Chartered Financial Analyst",
                    "https://www.cfainstitute.org",
                    "Certification internationale", "18+ mois", "~1000$ par niveau", "#fbbf24"),
                new("📊", "Comptalia — DCG en ligne",
                    "https://www.comptalia.com",
                    "Diplôme national", "3 ans", "CPF éligible", "#60a5fa"),
                new("🏦", "ACCA — Association of Chartered Accountants",
                    "https://www.accaglobal.com/fr/students.html",
                    "Qualification internationale", "2-3 ans", "Variable", "#a78bfa"),
                new("💹", "AMF — Certification pro marchés financiers",
                    "https://www.amf-france.org/fr/formation-et-certification",
                    "Certification AMF obligatoire", "2 jours", "240€", "#34d399"),
                new("📉", "Bloomberg Market Concepts",
                    "https://www.bloomberg.com/professional/product/bloomberg-market-concepts/",
                    "Certification Bloomberg", "8h e-learning", "Gratuit (étudiants)", "#38bdf8"),
            ],

            ["marketing"] =
            [
                new("📱", "Google Digital Marketing Certificate",
                    "https://grow.google/certificates/digital-marketing-ecommerce/",
                    "Certification Google", "6 mois", "Gratuit Coursera", "#4ade80"),
                new("📣", "Meta Social Media Marketing",
                    "https://www.coursera.org/professional-certificates/facebook-social-media-marketing",
                    "Certification Meta", "5 mois", "Gratuit audit", "#60a5fa"),
                new("🔍", "HubSpot Marketing Certification",
                    "https://academy.hubspot.com/",
                    "Certification HubSpot", "4h e-learning", "Gratuit", "#fb923c"),
                new("✍️", "Google Analytics 4 — GA4 Certification",
                    "https://skillshop.withgoogle.com/",
                    "Certification Google", "6h e-learning", "Gratuit", "#a78bfa"),
                new("🚀", "LinkedIn Marketing Labs",
                    "https://business.linkedin.com/marketing-solutions/learning",
                    "Certification LinkedIn", "Variable", "Gratuit", "#38bdf8"),
            ],

            ["rh"] =
            [
                new("👥", "Titre RRH — CNAM",
                    "https://www.cnam.fr",
                    "Titre niveau 6 Bac+3/4", "18 mois", "CPF éligible", "#a78bfa"),
                new("🎯", "SHRM-CP Certification",
                    "https://www.shrm.org/certification/",
                    "Certification internationale RH", "3 mois", "~300$", "#60a5fa"),
                new("📋", "Droit du travail — Formation AFPI",
                    "https://www.afpi.com/",
                    "Formation continue", "3 jours", "~800€", "#34d399"),
                new("🤝", "Talent Management — Coursera",
                    "https://www.coursera.org/specializations/human-resource-management",
                    "Spécialisation Coursera", "4 mois", "~49€/mois", "#fbbf24"),
            ],

            ["commerce"] =
            [
                new("💼", "BTS Négociation et digitalisation de la relation client",
                    "https://www.onisep.fr",
                    "BTS National", "2 ans", "Gratuit", "#fb923c"),
                new("🛒", "Certification Vente Consultative — Mercuri",
                    "https://www.mercuri.fr",
                    "Formation professionnelle", "3 jours", "1200-1800€", "#fbbf24"),
                new("📊", "Salesforce Administrator Certification",
                    "https://trailhead.salesforce.com/credentials/administrator",
                    "Certification Salesforce", "2 mois", "200$", "#60a5fa"),
                new("🌐", "E-commerce Manager — ISTEC",
                    "https://www.istec.fr",
                    "Titre Bac+5", "12 mois", "CPF éligible", "#a78bfa"),
            ],

            ["juridique"] =
            [
                new("⚖️", "Licence Droit — CNED",
                    "https://www.cned.fr/licence/droit",
                    "Licence nationale", "3 ans", "~400€/an", "#a78bfa"),
                new("📝", "Juriste d'entreprise — CNAM",
                    "https://www.cnam.fr",
                    "Titre niveau 7 Bac+5", "24 mois", "CPF éligible", "#60a5fa"),
                new("🔒", "DPO — Délégué à la Protection des Données",
                    "https://www.cnil.fr/fr/devenir-delegue-a-la-protection-des-donnees",
                    "Certification CNIL", "5 jours", "~2000€", "#34d399"),
                new("📜", "Huissier de justice — ENH",
                    "https://www.enh.fr",
                    "Examen national", "2 ans prépa", "Variable", "#fbbf24"),
            ],

            ["industrie"] =
            [
                new("⚙️", "CAP Maintenance Industrielle — AFPA",
                    "https://www.afpa.fr",
                    "CAP national", "12 mois", "Gratuit (demandeur emploi)", "#fb923c"),
                new("🔬", "Lean Manufacturing — École Polytechnique",
                    "https://www.polytechnique-executive.com",
                    "Executive Certificate", "3 jours", "~2500€", "#60a5fa"),
                new("🏭", "Habilitation électrique BR — Schneider",
                    "https://www.se.com/fr/fr",
                    "Habilitation réglementaire", "2 jours", "300-500€", "#fbbf24"),
                new("📐", "SolidWorks CSWA Certification",
                    "https://www.solidworks.com/sw/support/mcad_certification.htm",
                    "Certification CAO", "2 mois", "99$", "#a78bfa"),
            ],
        };

        FormationDto[] results;

        if (!string.IsNullOrEmpty(s) && all.TryGetValue(s, out var specific))
            results = specific;
        else
        {
            // Default → mix CPF + Pôle Emploi + cross-secteur
            results =
            [
                new("🏛️", "France Travail — Catalogue formations financées",
                    "https://www.francetravail.fr/candidat/formation.html",
                    "Catalogue officiel", "Variable", "Pris en charge", "#34d399"),
                new("💳", "Mon Compte Formation (CPF)",
                    "https://www.moncompteformation.gouv.fr",
                    "Catalogue CPF", "Variable", "Crédits CPF", "#60a5fa"),
                new("🎓", "OpenClassrooms — Toutes filières",
                    "https://openclassrooms.com/fr",
                    "Plateforme e-learning", "Variable", "Gratuit ou CPF", "#a78bfa"),
                new("📚", "Coursera — Universités mondiales",
                    "https://www.coursera.org",
                    "MOOC international", "Variable", "Gratuit audit", "#fbbf24"),
            ];
        }

        return Ok(results);
    }

    // ══════════════════════════════════════════════════════════
    //  DTO
    // ══════════════════════════════════════════════════════════

    private sealed record FormationDto(
        string Badge,
        string Title,
        string Url,
        string Type,
        string Duration,
        string Price,
        string Color);
}
