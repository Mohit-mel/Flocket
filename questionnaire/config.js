/*
 * Questionnaire settings.
 *
 * sheetEndpoint: paste the Web App URL from Google Apps Script here
 * (Deploy → New deployment → Web app → copy the URL ending in /exec).
 * While it is empty the questionnaire runs in preview mode: everything works,
 * but Submit only saves on this device instead of sending to the Sheet.
 */
window.FLOCKET_CONFIG = {
  sheetEndpoint: '',
  // Shown on the closing screen so the client knows who receives their answers.
  studioName: 'the design team',
  // Bump this when the questions change, so old drafts in a browser are not reused.
  version: '2026-10-v1',
};
