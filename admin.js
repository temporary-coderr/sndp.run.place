const publishButton = document.getElementById("publish");
const statusBox = document.getElementById("status");

if (publishButton) {
  publishButton.addEventListener("click", publishArticle);
}

async function publishArticle() {
  const owner = document.getElementById("githubOwner").value.trim();
  const repo = document.getElementById("githubRepo").value.trim();
  const branch = document.getElementById("githubBranch").value.trim();
  const token = document.getElementById("githubToken").value.trim();
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const content = document.getElementById("content").value.trim();
  const imageInput = document.getElementById("image");

  if (!owner || !repo || !branch || !token || !title || !content) {
    showStatus("Please fill in all required fields.", true);
    return;
  }

  publishButton.disabled = true;

  try {
    const slug = createSlug(title);
    if (!slug) throw new Error("The title must contain at least one letter or number.");

    let imageUrl = "";
    if (imageInput && imageInput.files.length > 0) {
      showStatus("Uploading image...");
      const file = imageInput.files[0];
      const extension = getExtension(file.name);
      const imagePath = `images/${slug}.${extension}`;
      await githubUpload(
        owner,
        repo,
        branch,
        token,
        imagePath,
        await fileToBase64(file),
        `Add image for ${title}`
      );
      imageUrl = `https://sndp.run.place/${imagePath}`;
    }

    const article = {
      title,
      slug,
      category,
      description,
      date: new Date().toISOString().split("T")[0],
      image: imageUrl,
      content
    };

    showStatus("Creating article...");
    await githubUpload(
      owner,
      repo,
      branch,
      token,
      `posts/${slug}.json`,
      stringToBase64(JSON.stringify(article, null, 2)),
      `Publish article: ${title}`
    );

    showStatus("Updating article list...");
    await updateIndex(owner, repo, branch, token, article);

    showStatus(
      `Article published successfully!<br><br><a href="article.html?slug=${encodeURIComponent(slug)}" target="_blank" rel="noopener">Open article</a>`
    );
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    document.getElementById("content").value = "";
    if (imageInput) imageInput.value = "";
  } catch (error) {
    console.error(error);
    showStatus(`Error: ${escapeHtml(error.message)}`, true);
  } finally {
    publishButton.disabled = false;
  }
}

async function githubUpload(owner, repo, branch, token, path, contentBase64, message) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  let sha;

  const existing = await githubRequest(`${url}?ref=${encodeURIComponent(branch)}`, token);
  if (existing.ok) sha = (await existing.json()).sha;
  else if (existing.status !== 404) await throwGithubError(existing, "Could not check the existing file.");

  const body = { message, content: contentBase64, branch };
  if (sha) body.sha = sha;

  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify(body)
  });
  if (!response.ok) await throwGithubError(response, "GitHub upload failed.");
  return response.json();
}

async function updateIndex(owner, repo, branch, token, article) {
  const path = "posts/index.json";
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`;
  const response = await githubRequest(`${url}?ref=${encodeURIComponent(branch)}`, token);
  if (!response.ok) await throwGithubError(response, "Could not read article index.");

  const data = await response.json();
  let posts;
  try {
    posts = JSON.parse(decodeBase64(data.content));
  } catch {
    throw new Error("The article index is not valid JSON.");
  }
  if (!Array.isArray(posts)) throw new Error("The article index must contain an array.");

  posts = posts.filter(post => post.slug !== article.slug);
  posts.push(article);
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const update = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify({
      message: "Update article index",
      content: stringToBase64(JSON.stringify(posts, null, 2)),
      sha: data.sha,
      branch
    })
  });
  if (!update.ok) await throwGithubError(update, "Could not update article index.");
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function githubRequest(url, token) {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
}

async function throwGithubError(response, fallback) {
  let message = fallback;
  try {
    const error = await response.json();
    if (error.message) message = error.message;
  } catch {
    // Keep the fallback when GitHub does not return JSON.
  }
  throw new Error(message);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function stringToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach(byte => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function decodeBase64(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getExtension(filename) {
  const extension = filename.split(".").pop().toLowerCase();
  return /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function showStatus(message, error = false) {
  statusBox.classList.remove("hidden");
  statusBox.innerHTML = message;
  statusBox.style.color = error ? "#b00020" : "#222";
}
