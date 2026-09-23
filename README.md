# INFINITIVE Desk

Paper dashboard for Ghost Desk.

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

The page is `app/page.js` (Next.js App Router). Same paper book as the static HTML: $100k start, SPY/QQQ/BTC/ETH, 15% name cap, 40% crypto cap, −15% desk stop.

Static fallback: `index.html` + `style.css` + scripts.

Book is stored in the browser only. Agents never submit live orders.
