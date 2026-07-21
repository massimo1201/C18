/**
 * Setup (una volta sola):
 * 1. Crea un nuovo Google Sheet (es. "RSVP 18 anni Massimo").
 * 2. Estensioni > Apps Script, incolla questo file, salva.
 * 3. Deploy > Nuova implementazione > Tipo: Web app.
 *    Esegui come: Io | Chi ha accesso: Chiunque.
 * 4. Copia l'URL generato in SHEET_ENDPOINT dentro 18-anni.html.
 * 5. Per ottenere il file Excel: nel foglio, File > Scarica > Microsoft Excel (.xlsx).
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Risposte')
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Risposte');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Data e ora', 'Nome', 'Cognome', 'Messaggio']);
  }

  sheet.appendRow([
    new Date(),
    e.parameter.nome || '',
    e.parameter.cognome || '',
    e.parameter.messaggio || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
