import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Démarrage du seed KÒKPIT...");

  // ============================================================================
  // NETTOYAGE (ordre inversé pour respecter les FK)
  // ============================================================================
  console.log("Nettoyage des données existantes...");
  await prisma.workflowLog.deleteMany();
  await prisma.workflowAction.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.smsLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.clickEvent.deleteMany();
  await prisma.evenement.deleteMany();
  await prisma.coutOffline.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.devis.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campagne.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.showroom.deleteMany();

  // ============================================================================
  // SHOWROOMS
  // ============================================================================
  console.log("Création des showrooms...");

  const showroomNord = await prisma.showroom.create({
    data: {
      nom: "Showroom Nord",
      adresse: "123 Rue de la Paix, 97400 Saint-Denis",
      emailNotif: "notification.nord@dimexoi.re",
    },
  });

  const showroomSud = await prisma.showroom.create({
    data: {
      nom: "Showroom Sud",
      adresse: "456 Rue de l'Océan, 97410 Saint-Pierre",
      emailNotif: "notification.sud@dimexoi.re",
    },
  });

  console.log(`  ✓ Showroom Nord: ${showroomNord.id}`);
  console.log(`  ✓ Showroom Sud: ${showroomSud.id}`);

  // ============================================================================
  // UTILISATEURS
  // ============================================================================
  console.log("Création des utilisateurs...");

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@kokpit.re",
        nom: "Admin",
        prenom: "Système",
        passwordHash: await hash("Admin123!", 10),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        email: "marketing@kokpit.re",
        nom: "Payet",
        prenom: "Laurence",
        passwordHash: await hash("Marketing123!", 10),
        role: "MARKETING",
      },
    }),
    prisma.user.create({
      data: {
        email: "commercial.nord@kokpit.re",
        nom: "Commercial",
        prenom: "Nord",
        passwordHash: await hash("Commercial123!", 10),
        role: "COMMERCIAL",
        showroomId: showroomNord.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "commercial.sud@kokpit.re",
        nom: "Commercial",
        prenom: "Sud",
        passwordHash: await hash("Commercial123!", 10),
        role: "COMMERCIAL",
        showroomId: showroomSud.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "direction@kokpit.re",
        nom: "Direction",
        prenom: "Générale",
        passwordHash: await hash("Direction123!", 10),
        role: "DIRECTION",
      },
    }),
  ]);

  const [admin, marketing, commercialNord, commercialSud, direction] = users;
  console.log(`  ✓ ${users.length} utilisateurs créés`);

  // ============================================================================
  // WORKFLOWS
  // ============================================================================
  console.log("Création des workflows...");

  // 1. Nurturing nouveau lead
  await prisma.workflow.create({
    data: {
      nom: "Séquence nurturing nouveau lead",
      triggerType: "NOUVEAU_LEAD",
      actif: true,
      conditions: {},
      actions: {
        create: [
          {
            ordre: 1,
            typeAction: "NOTIFICATION",
            config: { titre: "Nouveau lead", message: "Un nouveau lead vient d'arriver" },
            delaiHeures: 0,
          },
          {
            ordre: 2,
            typeAction: "EMAIL",
            config: { template: "bienvenue", objet: "Bienvenue chez Dimexoi" },
            delaiHeures: 1,
          },
          {
            ordre: 3,
            typeAction: "EMAIL",
            config: { template: "presentation", objet: "Découvrez nos collections en teck" },
            delaiHeures: 48,
          },
          {
            ordre: 4,
            typeAction: "EMAIL",
            config: { template: "offre", objet: "Une offre spéciale pour vous" },
            delaiHeures: 120,
          },
        ],
      },
    },
  });

  // 2. Relance inactif J+7
  await prisma.workflow.create({
    data: {
      nom: "Relance lead inactif J+7",
      triggerType: "LEAD_INACTIF",
      actif: true,
      conditions: { inactiviteJours: 7 },
      actions: {
        create: [
          {
            ordre: 1,
            typeAction: "EMAIL",
            config: { template: "relance_inactif", objet: "Toujours intéressé ?" },
            delaiHeures: 0,
          },
          {
            ordre: 2,
            typeAction: "SMS",
            config: { message: "Bonjour, avez-vous des questions sur nos meubles en teck ? Contactez votre showroom." },
            delaiHeures: 48,
          },
          {
            ordre: 3,
            typeAction: "TACHE",
            config: { titre: "Appeler le lead inactif", priorite: "HAUTE" },
            delaiHeures: 72,
          },
        ],
      },
    },
  });

  // 3. Alerte SLA 72h
  await prisma.workflow.create({
    data: {
      nom: "Alerte SLA 72h dépassé",
      triggerType: "SLA_DEPASSE",
      actif: true,
      conditions: { slaHeures: 72 },
      actions: {
        create: [
          {
            ordre: 1,
            typeAction: "NOTIFICATION",
            config: { titre: "⚠️ SLA dépassé", message: "Un lead n'a pas été traité dans les 72h" },
            delaiHeures: 0,
          },
          {
            ordre: 2,
            typeAction: "EMAIL",
            config: { template: "alerte_sla", objet: "URGENT : SLA dépassé", destinataire: "responsable" },
            delaiHeures: 0,
          },
        ],
      },
    },
  });

  // 4. Relance devis non facturé
  await prisma.workflow.create({
    data: {
      nom: "Relance devis non facturé",
      triggerType: "DEVIS_NON_FACTURE",
      actif: true,
      conditions: { statutDevis: "EN_ATTENTE", delaiJours: 14 },
      actions: {
        create: [
          {
            ordre: 1,
            typeAction: "EMAIL",
            config: { template: "relance_devis", objet: "Votre devis est toujours disponible" },
            delaiHeures: 0,
          },
          {
            ordre: 2,
            typeAction: "TACHE",
            config: { titre: "Appeler pour relance devis", priorite: "HAUTE" },
            delaiHeures: 48,
          },
          {
            ordre: 3,
            typeAction: "EMAIL",
            config: { template: "relance_devis_final", objet: "Dernière relance : votre devis expire bientôt" },
            delaiHeures: 168,
          },
        ],
      },
    },
  });

  // 5. Cross-sell post-achat
  await prisma.workflow.create({
    data: {
      nom: "Cross-sell post-achat",
      triggerType: "POST_ACHAT",
      actif: true,
      conditions: {},
      actions: {
        create: [
          {
            ordre: 1,
            typeAction: "EMAIL",
            config: { template: "merci_achat", objet: "Merci pour votre achat chez Dimexoi !" },
            delaiHeures: 2,
          },
          {
            ordre: 2,
            typeAction: "EMAIL",
            config: { template: "cross_sell", objet: "Complétez votre espace avec nos suggestions" },
            delaiHeures: 48,
          },
          {
            ordre: 3,
            typeAction: "TACHE",
            config: { titre: "Suivi satisfaction post-achat", priorite: "NORMALE" },
            delaiHeures: 168,
          },
        ],
      },
    },
  });

  console.log("  ✓ 5 workflows créés avec leurs actions");

  // ============================================================================
  // CAMPAGNES DE TEST
  // ============================================================================
  console.log("Création des campagnes de test...");

  const campagneMeta = await prisma.campagne.create({
    data: {
      nom: "Meta Ads - Salon 2026",
      plateforme: "META",
      coutTotal: 5000,
      dateDebut: new Date("2026-01-15"),
      dateFin: new Date("2026-04-20"),
      metaCampaignId: "meta_camp_001",
      actif: true,
    },
  });

  const campagneGoogle = await prisma.campagne.create({
    data: {
      nom: "Google Ads - Meubles Teck",
      plateforme: "GOOGLE",
      coutTotal: 3000,
      dateDebut: new Date("2026-01-01"),
      actif: true,
      googleCampaignId: "gads_camp_001",
    },
  });

  const campagneSalon = await prisma.campagne.create({
    data: {
      nom: "Salon de la Maison 2026",
      plateforme: "SALON",
      coutTotal: 8000,
      dateDebut: new Date("2026-04-01"),
      dateFin: new Date("2026-04-20"),
      actif: true,
    },
  });

  console.log("  ✓ 3 campagnes créées");

  // ============================================================================
  // CONTACTS ET LEADS DE TEST
  // ============================================================================
  console.log("Création des contacts et leads de test...");

  const now = new Date();
  const sla72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const slaDepasse = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Contact 1 - Lead actif
  const contact1 = await prisma.contact.create({
    data: {
      email: "jean.dupont@example.com",
      nom: "Dupont",
      prenom: "Jean",
      telephone: "+262 692 12 34 56",
      ville: "Saint-Denis",
      codePostal: "97400",
      showroomId: showroomNord.id,
      sourcePremiere: "META_ADS",
      lifecycleStage: "LEAD",
      rgpdEmailConsent: true,
      rgpdSmsConsent: true,
      rgpdConsentDate: now,
      rgpdConsentSource: "formulaire_site",
    },
  });

  await prisma.lead.create({
    data: {
      contactId: contact1.id,
      showroomId: showroomNord.id,
      commercialId: commercialNord.id,
      source: "META_ADS",
      statut: "EN_COURS",
      priorite: "HAUTE",
      slaDeadline: sla72h,
      campagneId: campagneMeta.id,
      produitsDemandes: ["Meuble salle de bain teck", "Miroir teck"],
      utmSource: "facebook",
      utmMedium: "cpc",
      utmCampaign: "salon_2026",
    },
  });

  // Contact 2 - Lead nouveau
  const contact2 = await prisma.contact.create({
    data: {
      email: "marie.martin@example.com",
      nom: "Martin",
      prenom: "Marie",
      telephone: "+262 693 45 67 89",
      ville: "Saint-Pierre",
      codePostal: "97410",
      showroomId: showroomSud.id,
      sourcePremiere: "GOOGLE_ADS",
      lifecycleStage: "PROSPECT",
      rgpdEmailConsent: true,
      rgpdSmsConsent: false,
      rgpdConsentDate: now,
      rgpdConsentSource: "formulaire_site",
    },
  });

  await prisma.lead.create({
    data: {
      contactId: contact2.id,
      showroomId: showroomSud.id,
      commercialId: commercialSud.id,
      source: "GOOGLE_ADS",
      statut: "NOUVEAU",
      priorite: "NORMALE",
      slaDeadline: sla72h,
      campagneId: campagneGoogle.id,
      produitsDemandes: ["Cuisine teck"],
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "meubles_teck_reunion",
      gclid: "CjwKCAiA_example123",
    },
  });

  // Contact 3 - Lead SLA dépassé (pour tester les alertes)
  const contact3 = await prisma.contact.create({
    data: {
      email: "pierre.hoarau@example.com",
      nom: "Hoarau",
      prenom: "Pierre",
      telephone: "+262 692 98 76 54",
      ville: "Le Tampon",
      codePostal: "97430",
      showroomId: showroomSud.id,
      sourcePremiere: "SALON",
      lifecycleStage: "LEAD",
      rgpdEmailConsent: true,
      rgpdSmsConsent: true,
      rgpdConsentDate: now,
      rgpdConsentSource: "salon_maison",
    },
  });

  await prisma.lead.create({
    data: {
      contactId: contact3.id,
      showroomId: showroomSud.id,
      commercialId: commercialSud.id,
      source: "SALON",
      statut: "NOUVEAU",
      priorite: "HAUTE",
      slaDeadline: slaDepasse, // SLA déjà dépassé !
      campagneId: campagneSalon.id,
      produitsDemandes: ["Table séjour teck", "Chaises teck"],
    },
  });

  // Contact 4 - Client avec devis et vente
  const contact4 = await prisma.contact.create({
    data: {
      email: "sophie.payet@example.com",
      nom: "Payet",
      prenom: "Sophie",
      telephone: "+262 693 11 22 33",
      ville: "Saint-Denis",
      codePostal: "97400",
      showroomId: showroomNord.id,
      sourcePremiere: "SITE_WEB",
      lifecycleStage: "CLIENT",
      rgpdEmailConsent: true,
      rgpdSmsConsent: true,
      rgpdConsentDate: new Date("2025-11-15"),
      rgpdConsentSource: "formulaire_site",
      scoreRfm: 8,
      recence: 30,
      frequence: 2,
      montant: 4500,
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      contactId: contact4.id,
      showroomId: showroomNord.id,
      commercialId: commercialNord.id,
      source: "SITE_WEB",
      statut: "VENTE",
      priorite: "NORMALE",
      slaDeadline: new Date("2025-11-16"),
      premiereActionAt: new Date("2025-11-15T10:00:00"),
      produitsDemandes: ["Meuble salle de bain teck"],
      utmSource: "google",
      utmMedium: "organic",
    },
  });

  const devis4 = await prisma.devis.create({
    data: {
      leadId: lead4.id,
      contactId: contact4.id,
      montant: 2800,
      statut: "ACCEPTE",
      dateEnvoi: new Date("2025-11-16"),
    },
  });

  await prisma.vente.create({
    data: {
      devisId: devis4.id,
      contactId: contact4.id,
      montant: 2800,
      dateVente: new Date("2025-12-01"),
      produits: ["Meuble salle de bain teck 120cm"],
    },
  });

  console.log("  ✓ 4 contacts, 4 leads, 1 devis, 1 vente créés");

  // ============================================================================
  // ÉVÉNEMENTS DE TEST
  // ============================================================================
  console.log("Création des événements de test...");

  await prisma.evenement.createMany({
    data: [
      {
        contactId: contact1.id,
        type: "CREATION_LEAD",
        description: "Nouveau lead créé via Meta Ads",
        metadata: { source: "META_ADS", campagne: "salon_2026" },
      },
      {
        contactId: contact1.id,
        type: "EMAIL_ENVOYE",
        description: "Email de bienvenue envoyé",
        metadata: { template: "bienvenue" },
      },
      {
        contactId: contact4.id,
        type: "CREATION_LEAD",
        description: "Nouveau lead créé via le site web",
      },
      {
        contactId: contact4.id,
        type: "DEVIS_CREE",
        description: "Devis créé pour meuble salle de bain - 2 800 €",
        auteurId: commercialNord.id,
      },
      {
        contactId: contact4.id,
        type: "VENTE",
        description: "Vente conclue - 2 800 €",
        auteurId: commercialNord.id,
      },
    ],
  });

  console.log("  ✓ 5 événements créés");

  console.log("\n✅ Seed terminé avec succès !");
  console.log("   Connexion : admin@kokpit.re / Admin123!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
