const urlInput = document.getElementById('urlInput');
const checkBtn = document.getElementById('checkBtn');
const reportDiv = document.getElementById('report');
const errorDiv = document.getElementById('error');

checkBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();

  reportDiv.style.display = 'none';
  errorDiv.style.display = 'none';

  if (!url) {
    errorDiv.textContent = 'Please enter a URL first.';
    errorDiv.style.display = 'block';
    return;
  }

  checkBtn.disabled = true;
  checkBtn.textContent = 'Checking...';

  try {
    const response = await fetch(`/audit?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || 'Something went wrong.';
      errorDiv.style.display = 'block';
      return;
    }

    reportDiv.innerHTML = `
      <p><strong>URL:</strong> ${data.url}</p>
      <p><strong>Status:</strong> ${data.httpStatus}</p>
      <p><strong>Response time:</strong> ${data.responseTimeMs} ms</p>
      <p><strong>Title:</strong> ${data.title ?? 'None found'}</p>
      <p><strong>Meta description:</strong> ${data.metaDescription ?? 'None found'}</p>
      <p><strong>H1 count:</strong> ${data.h1Count}</p>
      <p><strong>Total images:</strong> ${data.totalImages}</p>
      <p><strong>Images missing alt text:</strong> ${data.imagesMissingAlt}</p>
      <p><strong>Word count:</strong> ${data.wordCount}</p>
    `;
    reportDiv.style.display = 'block';

  } catch (err) {
    errorDiv.textContent = 'Could not reach the server.';
    errorDiv.style.display = 'block';

  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = 'Check';
  }
});