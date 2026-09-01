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
