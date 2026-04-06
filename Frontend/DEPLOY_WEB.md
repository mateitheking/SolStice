# Public Web Deploy (Global Access)

## 1) Build web version

```bash
cd /Users/kuanyshtemirbaev/Documents/Playground
npm install
npm run build:web
```

## 2) Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Then run production deploy:

```bash
vercel --prod
```

Vercel will return a public URL like:

`https://your-app.vercel.app`

Your friend can open it from any city.

## 3) Deploy to Netlify (alternative)

```bash
npm i -g netlify-cli
netlify deploy
```

Choose:
- Publish directory: `dist`

Then for production:

```bash
netlify deploy --prod --dir=dist
```

Netlify returns a public global URL.

## Notes

- Current app uses mock/local storage. Each user has their own local data in browser.
- For shared accounts/news in real-time, add real backend + database.
