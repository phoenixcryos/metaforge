# Deployment

The artifact is one self-contained HTML file. Any static host works, and so does
no host at all.

```bash
npm run build     # writes dist/index.html, dist/404.html, dist/.nojekyll
```

---

## GitHub Pages (recommended)

The workflow at `.github/workflows/deploy.yml` builds and deploys on every push
to `main`.

**One-time setup:**
1. Push the repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. The workflow runs tests, builds, and deploys.

Live at `https://<user>.github.io/<repo>/`.

`.nojekyll` is emitted by the build so Pages serves the files as-is.

### Custom domain
Settings → Pages → Custom domain. Then add a `CNAME` file to `dist/` by appending
to `build.js`:

```js
writeFileSync(join(ROOT,"dist/CNAME"), "metaforge.example.com\n");
```

---

## Other hosts

| Host | Setup |
|---|---|
| **Netlify** | Build command `npm run build`, publish directory `dist` |
| **Vercel** | Framework preset "Other", build `npm run build`, output `dist` |
| **Cloudflare Pages** | Build `npm run build`, output `dist` |
| **S3 + CloudFront** | `aws s3 sync dist/ s3://bucket/ --delete`, index document `index.html` |
| **nginx / Apache** | Copy `dist/` into the web root. No config needed. |
| **Any file share** | Send someone `index.html`. It works. |

---

## Local and offline

```bash
npm run dev                       # build + serve on :8080
python3 -m http.server -d dist    # serve an existing build
open dist/index.html              # no server at all — works from file://
```

Everything is inlined, so `file://` has no CORS or module-loading problems. This
is deliberate ([ADR-0001](adr/0001-single-file-artifact.md)) — the tool works on a
plane, on an air-gapped machine, or attached to an email.

---

## Embedding

The compiled page has no frame-busting and no external requests, so it embeds
cleanly:

```html
<iframe src="https://…/index.html" style="width:100%;height:900px;border:0"
        sandbox="allow-scripts"></iframe>
```

`sandbox="allow-scripts"` alone is sufficient — no network, storage, or same-origin
access is needed.

To embed just the engine, skip the page and import the module:

```js
import { compile } from "metaforge/src/engine/compile.js";
```

See [`API.md`](API.md).

---

## Verifying a deployment

```bash
curl -sI https://your-host/ | head -1              # 200
curl -s  https://your-host/ | grep -c "MetaForge"  # non-zero
```

Then in a browser: load the page, click a preset, confirm a prompt renders and the
console is clean. The bundle test (`npm run test:bundle`) validates the artifact
before it ships, but it cannot check your CDN cache.

---

## Security notes

- **No backend, no data collection.** Everything runs client-side; nothing you type
  leaves the browser.
- **No third-party requests.** Nothing to leak to, no supply-chain surface at runtime.
- **Safe for sensitive specs**, since evidence and untrusted-input fields never
  transit a network. Note that downloads write to local disk as normal.
- If you fork and add analytics or an API call, update this section — the privacy
  claim above is only true while the artifact stays self-contained.
