# Deploying Ameya's Library to ameyakohli.com

## Before you touch anything: the existing site

There is already a site on ameyakohli.com. Check these first.

1. **Where is it hosted?** Log in to wherever you bought the domain (the registrar) and look at the DNS records for ameyakohli.com. The `A` or `CNAME` record on the root (`@`) and on `www` tells you where the current site lives (Squarespace, Wix, GitHub Pages, Netlify, a shared host, and so on).
2. **Back it up.** Download the current site's files or export from its builder. Save a screenshot of the DNS records page too: that's your rollback.
3. **Links you must keep.** If the old site has URLs people link to (a resume PDF, a project page), note them. The new site can only honour the root URL and hashes like `/#fine-art`. For anything else, add a redirect (Netlify can do this; GitHub Pages cannot without a placeholder HTML page at the old path).
4. **Email.** If you have email at @ameyakohli.com, do **not** delete `MX` records or any `TXT` records (SPF, DKIM). Only change `A`, `AAAA`, and `CNAME` records for `@` and `www`.
5. **Decide: replace or live alongside.** Replacing means pointing the root domain at the new site. Living alongside (for example `library.ameyakohli.com`) means adding one `CNAME` for the subdomain and leaving everything else alone. The steps below cover both; the subdomain route is the lower-risk one.

## Option A: Netlify

### Deploy by dragging the folder

1. Go to https://app.netlify.com and sign in (GitHub login is fine).
2. On the Sites page, find the box that says "Drag and drop your site output folder here". Drag the whole `ameyas-library` folder onto it. Everything in it is static, so no build settings are needed.
3. Netlify gives you a random URL like `https://amber-fox-123456.netlify.app`. Open it. Check a section opens, a `#fine-art` link works, and the console has no 404s.
4. Site configuration → Site details → Change site name, to something like `ameyas-library` so the URL is readable.

### Point ameyakohli.com at it

1. In the Netlify site: Domain management → Add a domain → type `ameyakohli.com` → Verify → Add domain. Netlify will also suggest `www.ameyakohli.com`; add it.
2. Netlify shows "Awaiting External DNS" with the records it wants. At your registrar's DNS page set exactly these:

   | Type | Host / Name | Value |
   |---|---|---|
   | `A` | `@` (root) | `75.2.60.5` |
   | `CNAME` | `www` | `<your-site-name>.netlify.app` |

   Delete any other `A` or `CNAME` records on `@` and `www` that pointed at the old host. Leave `MX` and `TXT` alone.

   For a subdomain instead: add only `CNAME` `library` → `<your-site-name>.netlify.app`, and in Netlify add `library.ameyakohli.com` as the domain.

3. Back in Netlify, under HTTPS, click "Verify DNS configuration" once the records have propagated, then "Provision certificate". HTTPS is automatic after that.
4. Set the primary domain to the non-www version so `www` redirects to it.

## Option B: GitHub Pages

### Push the repo

1. Create a new repository on GitHub named `ameyas-library` (public; Pages on private repos needs a paid plan).
2. In the project folder:
   ```
   git remote add origin https://github.com/<your-username>/ameyas-library.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub: Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` → Save.
4. Wait a minute, then open `https://<your-username>.github.io/ameyas-library/`. Check the console for 404s: all paths in this project are relative, so it works in a subfolder.

### The CNAME file and the custom domain

1. In the project folder create a file named exactly `CNAME` (no extension) containing one line: `ameyakohli.com`. Commit and push it. (GitHub writes this file for you if you type the domain in Settings → Pages → Custom domain, but the commit is the durable version.)
2. At your registrar set these DNS records:

   | Type | Host / Name | Value |
   |---|---|---|
   | `A` | `@` | `185.199.108.153` |
   | `A` | `@` | `185.199.109.153` |
   | `A` | `@` | `185.199.110.153` |
   | `A` | `@` | `185.199.111.153` |
   | `CNAME` | `www` | `<your-username>.github.io` |

   For a subdomain only: `CNAME` `library` → `<your-username>.github.io`, and put `library.ameyakohli.com` in the `CNAME` file instead.

3. Settings → Pages → Custom domain: type `ameyakohli.com` → Save. Once the DNS check passes, tick "Enforce HTTPS".

## DNS propagation

- Changes usually show within 10 to 30 minutes. Worst case is the old record's TTL, often 1 hour, sometimes 24.
- To check: https://dnschecker.org, type `ameyakohli.com`, choose `A` (or `CNAME` for `www`). When most of the world's resolvers show the new value, it has propagated.
- From your own machine: `nslookup ameyakohli.com`. If it still shows the old IP after everyone else has moved, flush your cache: `ipconfig /flushdns`.
- Netlify's and GitHub's dashboards both show a green state when they can see the records.

## Rolling back

**The site itself broke (a bad config.js, a missing image):**
- Netlify: Deploys tab → click the previous good deploy → "Publish deploy". Instant.
- GitHub Pages: `git revert <bad-commit>` then `git push`. Live in about a minute. Or `git log --oneline`, find the good commit, and `git revert` each bad one above it.

**The domain switch broke (site unreachable, certificate errors):**
- Put the DNS records back to what they were (that's why you screenshotted them). The old site returns as propagation runs in reverse.
- If only HTTPS is failing, wait: certificate provisioning follows DNS and can take an hour.

**You want the old site back entirely:** restore DNS, and the old host still has it, provided you didn't delete it there. Don't cancel the old hosting until the new site has been up for a week.

## Updating the site later (adding a project)

1. Put the image in `assets/`.
2. Edit `config.js`: add the item to the section's `items` array.
3. Double-click `index.html` locally. Open the console. No warnings, image shows, lightbox opens it.
4. Commit:
   ```
   git add -A
   git commit -m "Add Night market to fine art"
   ```
5. Publish:
   - **Netlify by drag**: drag the folder onto the site's Deploys page again. Live in seconds.
   - **Netlify linked to GitHub** (set up once via "Import from Git"): `git push`. Live in about a minute.
   - **GitHub Pages**: `git push`. Live in about a minute.
6. Open the live site, hard-refresh (Ctrl+Shift+R) so you aren't looking at a cached copy, and check the new item.

If a hotspot needs moving, do it in `index.html?dev` first, Copy config, paste into `config.js`, then follow the same commit and publish steps.
