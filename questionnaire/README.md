# Flocket brand discovery questionnaire

A one-question-at-a-time questionnaire for the Flocket founders, which kicks off the branding work. It is a static site (plain HTML, CSS and JavaScript, no build step) that sends every response to a Google Sheet through Apps Script.

- 8 chapters plus a short intro, 47 questions, about 20 minutes
- Painted backgrounds move from morning to blue hour as the client progresses
- Answers autosave in the browser, so the client can close the tab and resume later
- Review screen before sending, with an Edit link on every answer
- SF Pro Display on Apple devices; everywhere else Poppins with tightened letter spacing

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell and loading screen |
| `styles.css` | All styling, including the phone and tablet breakpoints |
| `app.js` | Navigation, question types, autosave, submission, animations |
| `questions.js` | **The question set.** Edit copy and options here |
| `config.js` | **The Google Sheet URL.** Paste the Apps Script URL here |
| `apps-script/Code.gs` | Receiver to paste into the Google Sheet's Apps Script |
| `assets/` | Backgrounds and the redrawn Flocket logo (SVG) |
| `tools/clean_deck_art.py` | Removes text from pitch-deck slides to make backgrounds |

## Connect Google Sheets

1. Create a Google Sheet (for example "Flocket brand questionnaire").
2. Open **Extensions → Apps Script**, delete the sample code, and paste in all of `apps-script/Code.gs`. Save.
3. Optional: set `NOTIFY_EMAIL` at the top of the script to get an email for every response.
4. Click **Deploy → New deployment**, choose the type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, approve the permissions, and copy the **Web app URL** (it ends in `/exec`).
6. Paste it into `config.js`:
   ```js
   sheetEndpoint: 'https://script.google.com/macros/s/AKfy.../exec',
   ```
7. Open the `/exec` URL in a browser. You should see `{"ok":true,...}`.

Each submission adds one row to a **Responses** tab. Columns are created automatically from the question ids, and a **Questions** tab maps every column to its question. If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

How the answers arrive:

- Multi-select answers are joined with `; `.
- Ranked answers look like `1. Creators; 2. Solopreneurs`.
- Personality sliders get one column each, from 1 (left word) to 5 (right word). Empty means the client skipped that slider.

The browser sometimes sends a response twice when it can't read Google's reply. The script ignores any repeat of a `responseId` it has already stored.

## Host it

It is a folder of static files, so any static host works. Upload the `questionnaire` folder to Netlify Drop, Vercel or GitHub Pages and send the client the link. Preview it locally with:

```sh
cd questionnaire
python3 -m http.server 8000
# open http://localhost:8000
```

Until `sheetEndpoint` is set, the questionnaire runs in preview mode: everything works, but Send only saves on the device.

## Edit the questions

Everything lives in `questions.js`. Labels, help text and options can change freely. A question's `id` is its column in the Sheet, so keep ids stable once responses come in; a new id simply adds a new column. Bump `version` in `config.js` whenever the questions change, so old browser drafts are not reused.

Question types: `text`, `email`, `longtext`, `choice` (optionally `multi`, `max`, `ordered`, `other`), `scale`, `moods`, `palettes`, `type` and `ab`.

## Keyboard

- Enter continues; in long answers use Cmd/Ctrl + Enter.
- Letter keys pick options.
- The arrow buttons at the bottom move back and forward.

## Artwork

Backgrounds come from the client: the painted scenes they supplied, plus three slides from the Flocket pitch deck with the text removed by `tools/clean_deck_art.py`. The logo SVGs in `assets/logo/` are redrawn from the client's mark. Swap in the original vector files there when they are available.
