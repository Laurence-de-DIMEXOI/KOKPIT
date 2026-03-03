// ==================================================
// KOKPIT - Google Ads Export Script
// ==================================================
// Ce script exporte les données Google Ads vers un Google Sheet
// qui sera lu par KOKPIT pour afficher les campagnes.
//
// INSTRUCTIONS :
// 1. Créer un Google Sheet vide
// 2. Copier l'URL du Sheet dans SPREADSHEET_URL ci-dessous
// 3. Coller ce script dans Google Ads > Outils > Scripts
// 4. Autoriser l'accès et exécuter
// 5. Planifier une exécution quotidienne si souhaité
// ==================================================

var SPREADSHEET_URL = 'COLLER_URL_GOOGLE_SHEET_ICI';

function main() {
  var spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

  // ===== ONGLET 1 : CAMPAGNES =====
  exportCampaigns(spreadsheet);

  // ===== ONGLET 2 : GROUPES D'ANNONCES =====
  exportAdGroups(spreadsheet);

  // ===== ONGLET 3 : ANNONCES =====
  exportAds(spreadsheet);

  Logger.log('Export terminé !');
}

function exportCampaigns(spreadsheet) {
  var sheet = getOrCreateSheet(spreadsheet, 'Campagnes');
  sheet.clear();

  // En-têtes
  sheet.appendRow([
    'campaign_id', 'campaign_name', 'status', 'type',
    'start_date', 'end_date', 'budget_daily',
    'impressions', 'clicks', 'cost', 'conversions',
    'conversion_value', 'ctr', 'cpc', 'cost_per_conversion',
    'export_date'
  ]);

  // Données — ALL_TIME pour tout récupérer
  var report = AdsApp.report(
    'SELECT ' +
    'campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, ' +
    'campaign.start_date, campaign.end_date, campaign_budget.amount_micros, ' +
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, ' +
    'metrics.conversions_value, metrics.ctr, metrics.average_cpc, metrics.cost_per_conversion ' +
    'FROM campaign ' +
    'ORDER BY metrics.cost_micros DESC'
  );

  var rows = report.rows();
  var exportDate = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd HH:mm:ss');

  while (rows.hasNext()) {
    var row = rows.next();
    sheet.appendRow([
      row['campaign.id'],
      row['campaign.name'],
      row['campaign.status'],
      row['campaign.advertising_channel_type'],
      row['campaign.start_date'] || '',
      row['campaign.end_date'] || '',
      (parseInt(row['campaign_budget.amount_micros'] || 0) / 1000000).toFixed(2),
      row['metrics.impressions'],
      row['metrics.clicks'],
      (parseInt(row['metrics.cost_micros'] || 0) / 1000000).toFixed(2),
      parseFloat(row['metrics.conversions'] || 0).toFixed(1),
      parseFloat(row['metrics.conversions_value'] || 0).toFixed(2),
      parseFloat(row['metrics.ctr'] || 0).toFixed(4),
      (parseInt(row['metrics.average_cpc'] || 0) / 1000000).toFixed(2),
      (parseInt(row['metrics.cost_per_conversion'] || 0) / 1000000).toFixed(2),
      exportDate
    ]);
  }

  Logger.log('Campagnes exportées');
}

function exportAdGroups(spreadsheet) {
  var sheet = getOrCreateSheet(spreadsheet, 'Groupes');
  sheet.clear();

  sheet.appendRow([
    'ad_group_id', 'ad_group_name', 'campaign_id', 'campaign_name',
    'status', 'impressions', 'clicks', 'cost', 'conversions',
    'ctr', 'cpc', 'export_date'
  ]);

  var report = AdsApp.report(
    'SELECT ' +
    'ad_group.id, ad_group.name, campaign.id, campaign.name, ' +
    'ad_group.status, ' +
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, ' +
    'metrics.ctr, metrics.average_cpc ' +
    'FROM ad_group ' +
    'ORDER BY metrics.cost_micros DESC'
  );

  var rows = report.rows();
  var exportDate = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd HH:mm:ss');

  while (rows.hasNext()) {
    var row = rows.next();
    sheet.appendRow([
      row['ad_group.id'],
      row['ad_group.name'],
      row['campaign.id'],
      row['campaign.name'],
      row['ad_group.status'],
      row['metrics.impressions'],
      row['metrics.clicks'],
      (parseInt(row['metrics.cost_micros'] || 0) / 1000000).toFixed(2),
      parseFloat(row['metrics.conversions'] || 0).toFixed(1),
      parseFloat(row['metrics.ctr'] || 0).toFixed(4),
      (parseInt(row['metrics.average_cpc'] || 0) / 1000000).toFixed(2),
      exportDate
    ]);
  }

  Logger.log('Groupes exportés');
}

function exportAds(spreadsheet) {
  var sheet = getOrCreateSheet(spreadsheet, 'Annonces');
  sheet.clear();

  sheet.appendRow([
    'ad_id', 'ad_name', 'ad_group_id', 'campaign_id', 'campaign_name',
    'type', 'status', 'headline1', 'headline2', 'description',
    'final_url', 'impressions', 'clicks', 'cost', 'conversions',
    'ctr', 'cpc', 'export_date'
  ]);

  var report = AdsApp.report(
    'SELECT ' +
    'ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group.id, campaign.id, campaign.name, ' +
    'ad_group_ad.ad.type, ad_group_ad.status, ' +
    'ad_group_ad.ad.responsive_search_ad.headlines, ' +
    'ad_group_ad.ad.responsive_search_ad.descriptions, ' +
    'ad_group_ad.ad.final_urls, ' +
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, ' +
    'metrics.ctr, metrics.average_cpc ' +
    'FROM ad_group_ad ' +
    'ORDER BY metrics.cost_micros DESC'
  );

  var rows = report.rows();
  var exportDate = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd HH:mm:ss');

  while (rows.hasNext()) {
    var row = rows.next();

    // Parse headlines et descriptions (format JSON array)
    var headlines = '';
    var descriptions = '';
    try {
      var h = JSON.parse(row['ad_group_ad.ad.responsive_search_ad.headlines'] || '[]');
      headlines = h.map(function(x) { return x.text || ''; }).slice(0, 2).join(' | ');
    } catch(e) { headlines = ''; }
    try {
      var d = JSON.parse(row['ad_group_ad.ad.responsive_search_ad.descriptions'] || '[]');
      descriptions = d.map(function(x) { return x.text || ''; }).slice(0, 1).join(' | ');
    } catch(e) { descriptions = ''; }

    var finalUrls = '';
    try {
      var urls = JSON.parse(row['ad_group_ad.ad.final_urls'] || '[]');
      finalUrls = urls[0] || '';
    } catch(e) { finalUrls = ''; }

    sheet.appendRow([
      row['ad_group_ad.ad.id'],
      row['ad_group_ad.ad.name'] || '',
      row['ad_group.id'],
      row['campaign.id'],
      row['campaign.name'],
      row['ad_group_ad.ad.type'],
      row['ad_group_ad.status'],
      headlines,
      '', // headline2 (déjà dans headlines)
      descriptions,
      finalUrls,
      row['metrics.impressions'],
      row['metrics.clicks'],
      (parseInt(row['metrics.cost_micros'] || 0) / 1000000).toFixed(2),
      parseFloat(row['metrics.conversions'] || 0).toFixed(1),
      parseFloat(row['metrics.ctr'] || 0).toFixed(4),
      (parseInt(row['metrics.average_cpc'] || 0) / 1000000).toFixed(2),
      exportDate
    ]);
  }

  Logger.log('Annonces exportées');
}

function getOrCreateSheet(spreadsheet, name) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  return sheet;
}
