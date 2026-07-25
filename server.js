const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public')); // serves our frontend later

app.get('/', (req, res) => {
  res.send('Page Pulse server is running!');
});

const cheerio = require('cheerio');
function normalizeUrl(rawUrl) {
  // If someone types "example.com" without http/https, assume https
  if (!/^https?:\/\//i.test(rawUrl)) {
    return 'https://' + rawUrl;
  }
  return rawUrl;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function parseAuditData(html) {
  const $ = cheerio.load(html);

  const title = $('head').children('title').first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content') || null;
  const h1Count = $('h1').length;

  const totalImages = $('img').length;
  const imagesMissingAlt = $('img').filter((i, el) => !$(el).attr('alt')).length;

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.length > 0 ? bodyText.split(' ').length : 0;

  return { title, metaDescription, h1Count, totalImages, imagesMissingAlt, wordCount };
}
app.get('/audit', async (req, res) => {
  const rawUrl = req.query.url;

  if (!rawUrl) {
    return res.status(400).json({ error: 'Please provide a url query parameter, e.g. /audit?url=https://example.com' });
  }

  const targetUrl = normalizeUrl(rawUrl);

  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(targetUrl, 8000);
    const responseTime = Date.now() - startTime;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return res.status(422).json({ error: 'This URL did not return an HTML page', contentType });
    }

    const html = await response.text();
    const auditData = parseAuditData(html);

    res.json({
      url: targetUrl,
      httpStatus: response.status,
      responseTimeMs: responseTime,
      ...auditData
    });

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'The site took too long to respond (timeout)' });
    }
    res.status(500).json({ error: 'Failed to fetch or parse the URL', details: err.message });
  }
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});