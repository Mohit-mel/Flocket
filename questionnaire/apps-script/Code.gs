/**
 * Flocket brand discovery: Google Sheets receiver.
 *
 * Paste this into Extensions → Apps Script of the Google Sheet that should
 * collect responses, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Copy the /exec URL into
 * questionnaire/config.js → sheetEndpoint. Full steps: questionnaire/README.md.
 *
 * Each submission becomes one row on the "Responses" tab. Columns are created
 * automatically from the question ids, so adding a question to questions.js
 * adds a column here without touching this script. The "Questions" tab maps
 * every column id to the question it came from.
 */

const RESPONSES_SHEET = 'Responses';
const KEY_SHEET = 'Questions';
// Optional: an address that gets an email for every new response. Leave '' to turn off.
const NOTIFY_EMAIL = '';

const META_COLUMNS = ['submittedAt', 'responseId', 'startedAt', 'minutesSpent', 'questionnaireVersion'];

/**
 * Run this once from the editor (select "setup" in the toolbar, then Run).
 * It asks for permissions and creates both tabs, so the first real
 * response doesn't have to.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responses = ss.getSheetByName(RESPONSES_SHEET) || ss.insertSheet(RESPONSES_SHEET, 0);
  ensureHeaders_(responses, META_COLUMNS);
  if (!ss.getSheetByName(KEY_SHEET)) writeKey_(ss, []);
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(blank);
  Logger.log('Ready. Now use Deploy → New deployment → Web app.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!data.responseId || !data.answers) return json_({ ok: false, error: 'Missing responseId or answers.' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(RESPONSES_SHEET) || ss.insertSheet(RESPONSES_SHEET);
    const order = Array.isArray(data.order) && data.order.length ? data.order : Object.keys(data.answers);
    const headers = ensureHeaders_(sheet, META_COLUMNS.concat(order));

    // The browser may send twice when it cannot read our reply; keep the first copy.
    const idCol = headers.indexOf('responseId') + 1;
    if (sheet.getLastRow() > 1) {
      const ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
      if (ids.some(function (r) { return r[0] === data.responseId; })) return json_({ ok: true, duplicate: true });
    }

    const record = {};
    META_COLUMNS.forEach(function (k) { record[k] = data[k] == null ? '' : data[k]; });
    record.submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();
    record.startedAt = data.startedAt ? new Date(data.startedAt) : '';
    Object.keys(data.answers).forEach(function (k) { record[k] = data.answers[k]; });

    sheet.appendRow(headers.map(function (h) { return record[h] == null ? '' : record[h]; }));
    sheet.getRange(sheet.getLastRow(), 1, 1, headers.length).setWrap(true).setVerticalAlignment('top');
    if (Array.isArray(data.schema)) writeKey_(ss, data.schema);
    if (NOTIFY_EMAIL) notify_(data);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the /exec URL in a browser shows this, which confirms the deployment works.
function doGet() {
  return json_({ ok: true, service: 'Flocket brand discovery receiver' });
}

function ensureHeaders_(sheet, wanted) {
  const lastCol = sheet.getLastColumn();
  const headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  const missing = wanted.filter(function (k) { return headers.indexOf(k) === -1; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    const all = headers.concat(missing);
    sheet.getRange(1, 1, 1, all.length).setFontWeight('bold').setBackground('#e2f5d0');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    return all;
  }
  return headers;
}

function writeKey_(ss, schema) {
  const sheet = ss.getSheetByName(KEY_SHEET) || ss.insertSheet(KEY_SHEET);
  const rows = [['Column', 'Chapter', 'Question']].concat(schema.map(function (s) { return [s.key, s.chapter, s.label]; }));
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#e2f5d0');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(3, 520);
}

function notify_(data) {
  const name = data.answers.name || 'Someone';
  const lines = Object.keys(data.answers)
    .filter(function (k) { return data.answers[k] !== ''; })
    .map(function (k) { return k + ': ' + data.answers[k]; });
  MailApp.sendEmail(NOTIFY_EMAIL, 'New Flocket brand questionnaire from ' + name, lines.join('\n\n'));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
