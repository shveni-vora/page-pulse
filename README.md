# Page Pulse

A small tool that audits any URL — checks if it's up, how fast it loads, and pulls out basic SEO/accessibility info (title, meta description, H1 count, images missing alt text, word count).

## Setup

1. Clone this repo
2. Run `npm install`
3. Run `node server.js`
4. Open `http://localhost:3000` in your browser

## Running tests
npm test

## API Contract

### `GET /audit?url=<url>`

Success response (200):
```json
{
  "url": "https://example.com",
  "httpStatus": 200,
  "responseTimeMs": 220,
  "title": "Example Domain",
  "metaDescription": null,
  "h1Count": 1,
  "totalImages": 0,
  "imagesMissingAlt": 0,
  "wordCount": 17
}
```

Error responses:
- `400` — no `url` query parameter provided
- `422` — the URL returned non-HTML content (e.g. an image or PDF)
- `500` — the URL could not be fetched (invalid domain, DNS failure, etc.)
- `504` — the request timed out after 8 seconds

## Design decisions

1. Normalizing URLs without a protocol. If someone types `example.com` instead of `https://example.com`, the raw `fetch()` call fails outright. I added a small `normalizeUrl()` function that checks for a leading `http://` or `https://` and prepends `https://` if it's missing. This makes the tool more forgiving of how a real user would actually type a URL, instead of forcing them to know the exact format.

2. Restricting title extraction to direct children of `<head>`. My first version used `$('title').text()`, which grabs every `<title>` tag on the page. While testing on GitHub's homepage, I found this pulled in dozens of extra strings from inline SVG icon titles (used for accessibility, e.g. "American Airlines", "Duolingo"), corrupting the real page title. I fixed this by selecting only `<title>` tags that are direct children of `<head>` — `$('head').children('title')` — which excludes titles nested inside icons or templates. This is the kind of edge case that only shows up when testing real, complex sites rather than simple ones like example.com.

3. 8-second timeout using AbortController. Rather than letting a slow or unresponsive site hang the request indefinitely, I used an `AbortController` to cancel the fetch after 8 seconds and return a `504` error. I chose 8 seconds as a balance — long enough for most real sites (including slower international ones) to respond, but short enough that the tool still feels responsive and never appears to hang or crash.

## Known limitations

- Render's free tier spins down after inactivity, so the first request after idle time may take 30-50 seconds to respond.
- Word count is approximate — it's based on splitting visible body text by whitespace, not a true linguistic word count.

## AI usage

I used Claude to help scaffold the Express server, debug a GitHub title-parsing bug, and structure this README. I reviewed and tested every part myself, and made the timeout duration and URL-normalization decisions based on my own testing.