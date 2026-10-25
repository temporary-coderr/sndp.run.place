
// SNDP Blog Admin - Publish Logic
const $ = id => document.getElementById(id);
const statusEl = $('status');
const publishBtn = $('publish');

function setStatus(msg, isError = false) {
  statusEl.classList.remove('hidden');
  statusEl.innerHTML = msg;
  statusEl.style.borderColor = isError ? '#fecaca' : '#e2e8f0';
  statusEl.style.background = isError ? '#fef2f2' : '#f8fafc';
  statusEl.style.color = isError ? '#b91c1c' : '#0f172a';
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function githubPut(owner, repo, path, contentBase64, message, token, branch) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `GitHub error ${res.status}`);
  }
  return data;
}

function getStored() {
  try {
    return JSON.parse(localStorage.getItem('sndp_admin') || '{}');
  } catch { return {}; }
}

function saveStored() {
  localStorage.setItem('sndp_admin', JSON.stringify({
    owner: $('githubOwner').value.trim(),
    repo: $('githubRepo').value.trim(),
    branch: $('githubBranch').value.trim()
  }));
}

// Load stored
const stored = getStored();
if (stored.owner) $('githubOwner').value = stored.owner;
if (stored.repo) $('githubRepo').value = stored.repo;
if (stored.branch) $('githubBranch').value = stored.branch;

publishBtn.addEventListener('click', async () => {
  const owner = $('githubOwner').value.trim();
  const repo = $('githubRepo').value.trim();
  const branch = $('githubBranch').value.trim() || 'main';
  const token = $('githubToken').value.trim();
  const title = $('title').value.trim();
  const category = $('category').value;
  const description = $('description').value.trim();
  const content = $('content').value.trim();
  const imageFile = $('image').files[0];

  if (!owner || !repo || !token || !title || !content) {
    setStatus('❌ Fill required: Owner, Repo, Token, Title, Content', true);
    return;
  }

  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing...';
  saveStored();

  try {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const slug = slugify(title);
    let imagePathInRepo = '';

    // 1. Upload image if selected
    if (imageFile) {
      setStatus(`⏳ Uploading image ${imageFile.name}...`);
      const ext = imageFile.name.split('.').pop() || 'webp';
      const imageName = `${dateStr}-${slug}.${ext}`;
      imagePathInRepo = `images/${imageName}`;
      const b64 = await fileToBase64(imageFile);
      await githubPut(owner, repo, imagePathInRepo, b64, `Add image ${imageName}`, token, branch);
    }

    // 2. Create article markdown
    setStatus('⏳ Creating article...');
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
category: "${category}"
date: "${date.toISOString()}"
${imagePathInRepo ? `image: "/${imagePathInRepo}"` : ''}
slug: "${slug}"
---

${content}
`;

    const articlePath = `posts/${dateStr}-${slug}.md`;
    const articleB64 = btoa(unescape(encodeURIComponent(frontmatter)));

    const result = await githubPut(owner, repo, articlePath, articleB64, `Publish: ${title}`, token, branch);

    setStatus(`✅ <b>Published!</b><br>
      File: <code>${articlePath}</code><br>
      <a href="${result.content.html_url}" target="_blank">View file on GitHub →</a><br>
      <a href="https://${owner}.github.io/${repo}/" target="_blank">View live site (after 1-2 min) →</a>
      ${imagePathInRepo ? `<br>Image: <code>${imagePathInRepo}</code>` : ''}
    `);

    // Clear content fields
    // $('title').value = ''; $('description').value=''; $('content').value='';

  } catch (e) {
    console.error(e);
    setStatus(`❌ Failed: ${e.message}<br><small>Check token has Contents: Read & write, and repo name is correct.</small>`, true);
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish Article';
  }
});
