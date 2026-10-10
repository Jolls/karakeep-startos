# Karakeep

## Documentation

- [Karakeep documentation](https://docs.karakeep.app) — the full upstream user guide, including browser extensions, mobile apps, and the API.
- [Configuration reference](https://docs.karakeep.app/configuration) — every environment variable Karakeep supports (most are not applicable on StartOS since this package manages them for you).

## What you get on StartOS

This package runs the Karakeep web app together with the headless-Chrome
crawler it uses for page archival/screenshots and the Meilisearch index it
uses for full-text search — all three as part of a single service, with a
single **Web Interface** exposed. Your bookmarks, notes, images, and search
index all live on your server's storage.

## Getting set up

1. Open the **Web Interface**. You'll land on Karakeep's sign-up page —
   there's no separate account-creation step on StartOS.
2. Create an account. **The first account created becomes the administrator**
   — there is no separate admin password to retrieve.
3. Once you've signed in, run the **Toggle Signups** action to disable
   further registrations. Until you do, anyone who has your service's URL
   can create their own account on your server.

## Using Karakeep

### Web interface

After signing in you'll land on your bookmark dashboard, where you can save
links, notes, and images, browse your tags, and search across everything
you've saved.

### Actions

- **Toggle Signups** — enable or disable new account creation. Its label
  reflects the current state ("Enable Signups" or "Disable Signups").
- **Set Primary URL** — choose which of your service's addresses Karakeep
  uses for login and OAuth callback links, if you have more than one
  address configured.
- **Configure AI** — connect Karakeep to an AI model so it can tag your
  bookmarks (and optionally summarize them) automatically. Choose **Ollama**
  and enter the address of an Ollama server, or **OpenAI-compatible** for
  OpenAI or any service with the same API. Then enter the text and image
  model names. The API key is required even for a local server such as
  Ollama, which ignores it — enter any placeholder like `ollama`. Karakeep
  restarts when you save.

## Using AI tagging

Karakeep doesn't run a model itself — it needs an Ollama server (or an
OpenAI-compatible API) it can reach, such as another computer on your home
network. Make sure that server is listening on the network (for Ollama, set
`OLLAMA_HOST=0.0.0.0`) and that you've pulled the models you want to use.

1. Run **Configure AI** and enter the server address, for example
   `http://192.168.1.50:11434`, and your model names.
2. Add a bookmark. Tags appear shortly after Karakeep finishes fetching the
   page.

AI only runs on new bookmarks. To process ones you already have, open
**Admin Settings** in Karakeep and use **Regenerate AI Tags** (or summaries).
This queues every bookmark, so on a large library it can take many hours and
keeps your AI server busy the whole time. If the AI server is offline, those
jobs fail; run **Regenerate AI Tags → Failed Bookmarks Only** once it is back.
