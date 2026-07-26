const { normalizeUrl, parseAuditData } = require('./server');

describe('normalizeUrl', () => {
  test('adds https:// if missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  test('leaves https:// URLs unchanged', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });
});

describe('parseAuditData', () => {
  test('happy path: extracts title, h1 count, images, word count', () => {
    const html = `
      <html>
        <head><title>Test Page</title><meta name="description" content="A test page"></head>
        <body>
          <h1>Hello</h1>
          <img src="a.png" alt="a photo">
          <img src="b.png">
          <p>Some sample words here for counting purposes</p>
        </body>
      </html>
    `;
    const result = parseAuditData(html);

    expect(result.title).toBe('Test Page');
    expect(result.metaDescription).toBe('A test page');
    expect(result.h1Count).toBe(1);
    expect(result.totalImages).toBe(2);
    expect(result.imagesMissingAlt).toBe(1);
    expect(result.wordCount).toBeGreaterThan(0);
  });

  test('failure case: missing title and meta description return null', () => {
    const html = `<html><head></head><body><p>No title here</p></body></html>`;
    const result = parseAuditData(html);

    expect(result.title).toBeNull();
    expect(result.metaDescription).toBeNull();
  });

  test('failure case: empty body returns zero word count', () => {
    const html = `<html><head><title>Empty</title></head><body></body></html>`;
    const result = parseAuditData(html);

    expect(result.wordCount).toBe(0);
    expect(result.totalImages).toBe(0);
  });
});