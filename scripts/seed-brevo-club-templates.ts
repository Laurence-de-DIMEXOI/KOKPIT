/**
 * seed-brevo-club-templates.ts
 *
 * Creates 5 Brevo email templates for Club Tectona (Niveaux I-V).
 * Idempotent: checks by name before creating. Templates are created INACTIVE.
 *
 * Usage:
 *   npx tsx scripts/seed-brevo-club-templates.ts
 *
 * Prerequisites:
 *   - BREVO_API_KEY set in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

if (!BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not set in .env.local');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Shared HTML helpers
// ---------------------------------------------------------------------------

/**
 * Common @font-face declaration and base styles injected into every template.
 * Perandory is used for headings with Georgia as fallback.
 * Inter is the body font with sans-serif fallback.
 */
const fontFaceBlock = `
  @font-face {
    font-family: 'Perandory';
    src: url('https://dimexoi.fr/fonts/perandory/Perandory-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }
`;

/** Reusable inline style constants */
const COLORS = {
  green: '#515712',
  white: '#ffffff',
};

const FONT = {
  body: "'Inter', Arial, Helvetica, sans-serif",
  heading: "'Perandory', Georgia, serif",
};

// ---------------------------------------------------------------------------
// HTML builder functions
// ---------------------------------------------------------------------------

function buildHeader(topLine: string, badge: string): string {
  return `
    <!-- HEADER -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.green};">
      <tr>
        <td align="center" class="header-padding" style="padding:16px 20px 8px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="font-family:${FONT.body};font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.6);text-transform:uppercase;">
                ${topLine}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:8px;padding-bottom:2px;">
                <img src="https://kokpit-kappa.vercel.app/images/club-tectona-logo-blanc.png" alt="Club Tectona" width="220" class="logo-img" style="display:block;margin:0 auto;max-width:220px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="font-family:${FONT.body};font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1px;padding-bottom:6px;">
                Par Dimexoi et Bois d&rsquo;Orient
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="40">
                  <tr>
                    <td style="border-top:1px solid rgba(255,255,255,0.4);font-size:0;line-height:0;" height="1">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORS.white};border-radius:4px;">
                  <tr>
                    <td style="padding:8px 24px;font-family:${FONT.body};font-size:14px;letter-spacing:2px;color:${COLORS.white};text-transform:uppercase;">
                      ${badge}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildRemiseBlock(remise: string, description: string): string {
  return `
    <!-- REMISE BLOCK -->
    <tr>
      <td style="padding:24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ${COLORS.green};border-radius:4px;">
          <tr>
            <td align="center" style="padding:24px 20px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" class="remise-text" style="font-family:${FONT.heading};font-size:36px;color:${COLORS.green};font-weight:700;line-height:1.2;">
                    ${remise}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;font-family:${FONT.body};font-size:14px;color:${COLORS.green};line-height:1.5;">
                    ${description}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildAdvantagesList(items: string[]): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:4px 0;font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.6;" valign="top">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top" style="padding-right:10px;font-family:${FONT.body};font-size:14px;color:${COLORS.green};">&#10003;</td>
            <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.6;">${item}</td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <!-- ADVANTAGES LIST -->
    <tr>
      <td style="padding:16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT.body};font-size:14px;color:#333333;">
          <tr>
            <td style="padding-bottom:8px;font-family:${FONT.body};font-size:16px;font-weight:700;color:${COLORS.green};">
              Vos avantages :
            </td>
          </tr>
          ${rows}
        </table>
      </td>
    </tr>
  `;
}

function buildNextCircle(text: string): string {
  return `
    <!-- NEXT CIRCLE -->
    <tr>
      <td style="padding:16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7f2;border-radius:4px;">
          <tr>
            <td style="padding:16px 20px;font-family:${FONT.body};font-size:13px;color:#555555;line-height:1.6;">
              <strong style="color:${COLORS.green};">Prochain cercle :</strong> ${text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildCTA(label: string, href: string): string {
  return `
    <!-- CTA BUTTON -->
    <tr>
      <td align="center" style="padding:24px 0;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="background-color:${COLORS.green};border-radius:4px;">
              <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${FONT.body};font-size:14px;font-weight:600;color:${COLORS.white};text-decoration:none;letter-spacing:1px;">
                ${label}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildSignOff(team: string, showrooms: boolean = true): string {
  const showroomLine = showrooms
    ? `
    <tr>
      <td style="padding-top:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" valign="top" style="padding-right:8px;font-family:${FONT.body};font-size:11px;color:#888888;line-height:1.6;">
              <strong style="color:#555555;">Showroom SUD</strong><br/>
              8 rue Benjamin Hoareau<br/>
              ZI n&deg;3, 97410 Saint-Pierre<br/>
              <a href="tel:0262350679" style="color:#515712;text-decoration:none;">0262 35 06 79</a><br/>
              Mar - Sam : 9h - 17h
            </td>
            <td width="50%" valign="top" style="padding-left:8px;font-family:${FONT.body};font-size:11px;color:#888888;line-height:1.6;">
              <strong style="color:#555555;">Showroom NORD</strong><br/>
              43 rue Tourette<br/>
              97400 Saint-Denis<br/>
              <a href="tel:0262203030" style="color:#515712;text-decoration:none;">0262 20 30 30</a><br/>
              Mar - Sam : 10h-13h &amp; 14h-18h
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : '';

  return `
    <!-- SIGN-OFF -->
    <tr>
      <td style="padding:24px 0 8px 0;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.6;">
              ${team}
            </td>
          </tr>
          ${showroomLine}
        </table>
      </td>
    </tr>
  `;
}

function buildMentionClub(): string {
  return `
    <tr>
      <td style="padding:12px 0;font-family:${FONT.body};font-size:13px;color:#555555;line-height:1.6;font-style:italic;">
        Il vous suffit de mentionner votre statut Club Tectona lors de votre visite en showroom ou pour tout devis en ligne. Remise applicable sur le mobilier en teck massif (catalogue + sur-mesure). Bon nominatif, usage unique, non cumulable avec les promotions en cours.
      </td>
    </tr>
  `;
}

function buildFooter(): string {
  return `
    <!-- FOOTER -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.green};">
      <tr>
        <td align="center" class="footer-padding" style="padding:20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="font-family:${FONT.body};font-size:12px;color:${COLORS.white};line-height:1.5;">
                <a href="{{ unsubscribe }}" style="color:${COLORS.white};text-decoration:underline;">Se d&eacute;sinscrire</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Wraps body content rows inside the full HTML document shell.
 */
function wrapTemplate(header: string, bodyRows: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Club Tectona</title>
  <style type="text/css">
    ${fontFaceBlock}
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    body { margin:0; padding:0; width:100%!important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-padding { padding: 24px 20px !important; }
      .header-padding { padding: 12px 16px 6px !important; }
      .footer-padding { padding: 16px 20px !important; }
      .remise-text { font-size: 36px !important; }
      .logo-img { width: 180px !important; }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f0;font-family:${FONT.body};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f0;">
    <tr>
      <td align="center">
        <!-- CONTAINER -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px;margin:0 auto;">
          <tr><td>${header}</td></tr>
          <tr>
            <td class="email-padding" style="background-color:${COLORS.white};padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${bodyRows}
              </table>
            </td>
          </tr>
          <tr><td>${footer}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface TemplateDefinition {
  name: string;
  subject: string;
  htmlContent: string;
}

function buildTemplateLevel1(): TemplateDefinition {
  const header = buildHeader('BIENVENUE DANS', 'I &middot; L&#8217;&Eacute;corce');

  const bodyRows = `
    <!-- GREETING -->
    <tr>
      <td style="font-family:${FONT.body};font-size:16px;color:#333333;line-height:1.6;padding-bottom:16px;">
        Bonjour {{ params.prenom }},
      </td>
    </tr>
    <tr>
      <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.7;padding-bottom:8px;">
        Votre premi&egrave;re commande vient d&rsquo;ouvrir les portes du <strong>Club Tectona</strong>. Vous int&eacute;grez le cercle I &ndash; <em>L&rsquo;&Eacute;corce</em>, la premi&egrave;re couche protectrice de l&rsquo;arbre, celle qui enveloppe et pr&eacute;serve.
      </td>
    </tr>

    ${buildRemiseBlock('-5&thinsp;%', "sur le mobilier en teck massif &middot; valable 3 mois &agrave; compter de la r&eacute;ception de ce mail")}

    ${buildAdvantagesList([
      "5&thinsp;% de remise sur votre prochaine commande de mobilier teck",
      "Bon de remise nominatif et personnel",
      "Espace Club personnel avec suivi de commandes",
      "Newsletter exclusive Club Tectona",
    ])}

    ${buildNextCircle("2&thinsp;000&thinsp;&euro; de cumul d&rsquo;achats &rarr; cercle II <em>L&rsquo;Aubier</em> (&ndash;10&thinsp;% + ventes priv&eacute;es + livraison offerte)")}

    ${buildMentionClub()}

    ${buildCTA("D&eacute;couvrir le programme Club Tectona &rarr;", "https://www.dimexoi.fr/club-grandis")}

    ${buildSignOff("L&rsquo;&eacute;quipe Dimexoi")}
  `;

  return {
    name: 'Club Tectona - Niveau I - L\'Ecorce',
    subject: "Bienvenue au Club Tectona - Votre cercle I vient de s'ouvrir",
    htmlContent: wrapTemplate(header, bodyRows, buildFooter()),
  };
}

function buildTemplateLevel2(): TemplateDefinition {
  const header = buildHeader('VOUS PROGRESSEZ AU CERCLE', 'II &middot; L&#8217;Aubier');

  const bodyRows = `
    <tr>
      <td style="font-family:${FONT.body};font-size:16px;color:#333333;line-height:1.6;padding-bottom:16px;">
        Bonjour {{ params.prenom }},
      </td>
    </tr>
    <tr>
      <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.7;padding-bottom:8px;">
        F&eacute;licitations&thinsp;! Vous avez franchi le seuil des <strong>2&thinsp;000&thinsp;&euro;</strong> de cumul d&rsquo;achats et acc&eacute;dez au cercle II &ndash; <em>L&rsquo;Aubier</em>, la couche vivante qui nourrit l&rsquo;arbre en profondeur.
      </td>
    </tr>

    ${buildRemiseBlock('-10&thinsp;%', "sur le mobilier en teck massif &middot; valable 6 mois &agrave; compter de la r&eacute;ception de ce mail")}

    ${buildAdvantagesList([
      "10&thinsp;% de remise sur votre prochaine commande de mobilier teck",
      "Acc&egrave;s aux ventes priv&eacute;es",
      "Livraison offerte d&egrave;s 1&thinsp;500&thinsp;&euro; d&rsquo;achat",
      "Bon de remise nominatif et personnel",
      "Espace Club personnel avec suivi de commandes",
      "Newsletter exclusive Club Tectona",
    ])}

    ${buildNextCircle("5&thinsp;000&thinsp;&euro; de cumul &rarr; cercle III <em>Le C&oelig;ur</em> (&ndash;15&thinsp;% + avant-premi&egrave;res nouvelles collections)")}

    ${buildMentionClub()}

    ${buildCTA("D&eacute;couvrir le programme Club Tectona &rarr;", "https://www.dimexoi.fr/club-grandis")}

    ${buildSignOff("L&rsquo;&eacute;quipe Dimexoi")}
  `;

  return {
    name: 'Club Tectona - Niveau II - L\'Aubier',
    subject: "Club Tectona - Vous progressez au cercle II, L'Aubier",
    htmlContent: wrapTemplate(header, bodyRows, buildFooter()),
  };
}

function buildTemplateLevel3(): TemplateDefinition {
  const header = buildHeader('VOUS &Ecirc;TES AU C&OElig;UR', 'III &middot; Le C&oelig;ur');

  const bodyRows = `
    <tr>
      <td style="font-family:${FONT.body};font-size:16px;color:#333333;line-height:1.6;padding-bottom:16px;">
        Bonjour {{ params.prenom }},
      </td>
    </tr>
    <tr>
      <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.7;padding-bottom:8px;">
        Vous avez atteint <strong>5&thinsp;000&thinsp;&euro;</strong> de cumul d&rsquo;achats. Vous acc&eacute;dez au cercle III &ndash; <em>Le C&oelig;ur</em>, la partie la plus dense, la plus noble de l&rsquo;arbre, celle qui lui donne sa solidit&eacute;.
      </td>
    </tr>

    ${buildRemiseBlock('-15&thinsp;%', "sur le mobilier en teck massif &middot; valable 9 mois &agrave; compter de la r&eacute;ception de ce mail")}

    ${buildAdvantagesList([
      "15&thinsp;% de remise sur votre prochaine commande de mobilier teck",
      "Acc&egrave;s aux avant-premi&egrave;res des nouvelles collections",
      "Acc&egrave;s aux ventes priv&eacute;es",
      "Livraison offerte d&egrave;s 1&thinsp;500&thinsp;&euro; d&rsquo;achat",
      "Bon de remise nominatif et personnel",
      "Espace Club personnel avec suivi de commandes",
      "Newsletter exclusive Club Tectona",
    ])}

    ${buildNextCircle("10&thinsp;000&thinsp;&euro; de cumul &rarr; cercle IV <em>Le Grain</em> (&ndash;20&thinsp;% + remise partenaire h&ocirc;telier)")}

    ${buildMentionClub()}

    ${buildCTA("D&eacute;couvrir le programme Club Tectona &rarr;", "https://www.dimexoi.fr/club-grandis")}

    ${buildSignOff("L&rsquo;&eacute;quipe Dimexoi")}
  `;

  return {
    name: 'Club Tectona - Niveau III - Le Coeur',
    subject: "Club Tectona - Vous \u00eates au c\u0153ur, cercle III",
    htmlContent: wrapTemplate(header, bodyRows, buildFooter()),
  };
}

function buildTemplateLevel4(): TemplateDefinition {
  const header = buildHeader('BIENVENUE AU CERCLE', 'IV &middot; Le Grain');

  const bodyRows = `
    <tr>
      <td style="font-family:${FONT.body};font-size:16px;color:#333333;line-height:1.6;padding-bottom:16px;">
        Bonjour {{ params.prenom }},
      </td>
    </tr>
    <tr>
      <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.7;padding-bottom:8px;">
        Vous avez franchi le cap des <strong>10&thinsp;000&thinsp;&euro;</strong> de cumul d&rsquo;achats. Bienvenue dans le cercle IV &ndash; <em>Le Grain</em>, un cercle rare r&eacute;serv&eacute; &agrave; nos clients les plus fid&egrave;les. Le grain du bois r&eacute;v&egrave;le sa texture unique&thinsp;; votre fid&eacute;lit&eacute; r&eacute;v&egrave;le la v&ocirc;tre.
      </td>
    </tr>

    ${buildRemiseBlock('-20&thinsp;%', "sur le mobilier en teck massif &middot; valable 12 mois &agrave; compter de la r&eacute;ception de ce mail")}

    ${buildAdvantagesList([
      "20&thinsp;% de remise sur votre prochaine commande de mobilier teck",
      "Remise chez l&rsquo;un de nos partenaires h&ocirc;teliers*",
      "Acc&egrave;s aux avant-premi&egrave;res des nouvelles collections",
      "Acc&egrave;s aux ventes priv&eacute;es",
      "Livraison offerte d&egrave;s 1&thinsp;500&thinsp;&euro; d&rsquo;achat",
      "Bon de remise nominatif et personnel",
      "Espace Club personnel avec suivi de commandes",
      "Newsletter exclusive Club Tectona",
    ])}

    ${buildNextCircle("20&thinsp;000&thinsp;&euro; de cumul &rarr; cercle V <em>Le Tectona Grandis</em> (&ndash;25&thinsp;% &agrave; vie)")}

    ${buildMentionClub()}

    ${buildCTA("D&eacute;couvrir le programme Club Tectona &rarr;", "https://www.dimexoi.fr/club-grandis")}

    ${buildSignOff("L&rsquo;&eacute;quipe Dimexoi")}
  `;

  return {
    name: 'Club Tectona - Niveau IV - Le Grain',
    subject: "Club Tectona - Bienvenue au cercle IV, Le Grain",
    htmlContent: wrapTemplate(header, bodyRows, buildFooter()),
  };
}

function buildTemplateLevel5(): TemplateDefinition {
  const header = buildHeader('VOUS REJOIGNEZ LE CERCLE', 'V &middot; Le Tectona Grandis');

  const bodyRows = `
    <tr>
      <td style="font-family:${FONT.body};font-size:16px;color:#333333;line-height:1.6;padding-bottom:16px;">
        Bonjour {{ params.prenom }},
      </td>
    </tr>
    <tr>
      <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.7;padding-bottom:8px;">
        Vous acc&eacute;dez au cercle le plus &eacute;lev&eacute; du Club Tectona &ndash; <em>Le Tectona Grandis</em>. Le nom m&ecirc;me de l&rsquo;arbre. Il n&rsquo;y a pas de cercle au-del&agrave;&thinsp;; vous &ecirc;tes l&rsquo;arbre tout entier.
      </td>
    </tr>
    <tr>
      <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.7;padding-bottom:8px;">
        Ce statut traduit une confiance durable et nous en mesurons toute la valeur.
      </td>
    </tr>

    ${buildRemiseBlock('-25&thinsp;%', "&agrave; vie sur le mobilier en teck massif")}

    ${buildAdvantagesList([
      "25&thinsp;% de remise &agrave; vie sur le mobilier en teck massif",
      "Cadeau de bienvenue pour avoir atteint ce palier",
      "Remise chez l&rsquo;un de nos partenaires h&ocirc;teliers*",
      "Acc&egrave;s aux avant-premi&egrave;res des nouvelles collections",
      "Acc&egrave;s aux ventes priv&eacute;es",
      "Livraison offerte d&egrave;s 1&thinsp;500&thinsp;&euro; d&rsquo;achat",
      "Espace Club personnel avec suivi de commandes",
      "Newsletter exclusive Club Tectona",
    ])}

    ${buildCTA("D&eacute;couvrir le programme Club Tectona &rarr;", "https://www.dimexoi.fr/club-grandis")}

    <!-- SIGN-OFF (more personal tone) -->
    <tr>
      <td style="padding:24px 0 8px 0;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.6;">
              Avec toute notre gratitude,
            </td>
          </tr>
          <tr>
            <td style="padding-top:4px;font-family:${FONT.body};font-size:14px;color:#333333;line-height:1.6;font-weight:600;">
              La direction Dimexoi
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right:8px;font-family:${FONT.body};font-size:11px;color:#888888;line-height:1.6;">
                    <strong style="color:#555555;">Showroom SUD</strong><br/>
                    8 rue Benjamin Hoareau<br/>
                    ZI n&deg;3, 97410 Saint-Pierre<br/>
                    <a href="tel:0262350679" style="color:#515712;text-decoration:none;">0262 35 06 79</a><br/>
                    Mar - Sam : 9h - 17h
                  </td>
                  <td width="50%" valign="top" style="padding-left:8px;font-family:${FONT.body};font-size:11px;color:#888888;line-height:1.6;">
                    <strong style="color:#555555;">Showroom NORD</strong><br/>
                    43 rue Tourette<br/>
                    97400 Saint-Denis<br/>
                    <a href="tel:0262203030" style="color:#515712;text-decoration:none;">0262 20 30 30</a><br/>
                    Mar - Sam : 10h-13h &amp; 14h-18h
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  return {
    name: 'Club Tectona - Niveau V - Le Tectona Grandis',
    subject: "Club Tectona - Vous rejoignez le cercle V, Le Tectona Grandis",
    htmlContent: wrapTemplate(header, bodyRows, buildFooter()),
  };
}

// All 5 template builders in order
const TEMPLATE_BUILDERS: (() => TemplateDefinition)[] = [
  buildTemplateLevel1,
  buildTemplateLevel2,
  buildTemplateLevel3,
  buildTemplateLevel4,
  buildTemplateLevel5,
];

// ---------------------------------------------------------------------------
// Brevo API helpers
// ---------------------------------------------------------------------------

interface BrevoTemplate {
  id: number;
  name: string;
  isActive: boolean;
}

/**
 * Fetches all SMTP templates from Brevo (paginated).
 * Returns a flat array of { id, name, isActive }.
 */
async function listAllTemplates(): Promise<BrevoTemplate[]> {
  const templates: BrevoTemplate[] = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const url = `${BREVO_API_URL}/smtp/templates?limit=${limit}&offset=${offset}&sort=desc`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY!,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to list templates (HTTP ${res.status}): ${body}`);
    }

    const data = await res.json();
    const batch: BrevoTemplate[] = (data.templates || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      isActive: t.isActive,
    }));

    templates.push(...batch);

    if (batch.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return templates;
}

/**
 * Creates a single Brevo SMTP template (INACTIVE).
 * Returns the created template ID.
 */
async function createTemplate(def: TemplateDefinition): Promise<number> {
  const payload = {
    sender: { name: 'DIMEXOI', email: 'laurence.payet@dimexoi.fr' },
    templateName: def.name,
    subject: def.subject,
    htmlContent: def.htmlContent,
    isActive: false,
  };

  const res = await fetch(`${BREVO_API_URL}/smtp/templates`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY!,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create template "${def.name}" (HTTP ${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Updates an existing Brevo SMTP template (htmlContent + subject only).
 */
async function updateTemplate(id: number, htmlContent: string, subject: string): Promise<void> {
  const res = await fetch(`${BREVO_API_URL}/smtp/templates/${id}`, {
    method: 'PUT',
    headers: {
      'api-key': BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ htmlContent, subject }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update template ${id} (HTTP ${res.status}): ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Club Tectona - Brevo Template Seeder ===\n');

  // 1. Fetch existing templates to check for duplicates
  console.log('Fetching existing Brevo templates...');
  const existingTemplates = await listAllTemplates();
  console.log(`Found ${existingTemplates.length} existing template(s).\n`);

  const existingByName = new Map<string, BrevoTemplate>();
  for (const t of existingTemplates) {
    existingByName.set(t.name, t);
  }

  // 2. Create each template if it does not already exist
  const results: { level: number; name: string; id: number; action: string }[] = [];

  for (let i = 0; i < TEMPLATE_BUILDERS.length; i++) {
    const def = TEMPLATE_BUILDERS[i]();
    const level = i + 1;

    const existing = existingByName.get(def.name);
    if (existing) {
      console.log(`[Niveau ${level}] "${def.name}" already exists (ID: ${existing.id}) - updating...`);
      await updateTemplate(existing.id, def.htmlContent, def.subject);
      console.log(`[Niveau ${level}] Updated (ID: ${existing.id})`);
      results.push({ level, name: def.name, id: existing.id, action: 'UPDATED' });
    } else {
      console.log(`[Niveau ${level}] Creating "${def.name}"...`);
      const id = await createTemplate(def);
      console.log(`[Niveau ${level}] Created with ID: ${id}`);
      results.push({ level, name: def.name, id, action: 'CREATED' });
    }
  }

  // 3. Summary
  console.log('\n=== Summary ===\n');
  console.log('Add these template IDs to your environment variables:\n');

  for (const r of results) {
    const tag = r.action === 'CREATED' ? '(new)' : '(updated)';
    console.log(`  BREVO_CLUB_TEMPLATE_NIVEAU_${r.level}=${r.id}  ${tag}`);
  }

  console.log('\nAll templates are INACTIVE. Activate them manually in Brevo when ready.');
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
