const OWNER="temporary-coderr";
const REPO="sndp.run.place";
const BRANCH="main";
const articlesContainer=document.getElementById("articles");

async function loadArticles(){
try{
const url=`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/posts/index.json`;
const response=await fetch(url+"?t="+Date.now());
if(!response.ok) throw new Error("Could not load articles.");
const posts=await response.json();
if(!posts.length){articlesContainer.innerHTML="<p>No articles published yet.</p>";return;}
posts.sort((a,b)=>new Date(b.date)-new Date(a.date));
articlesContainer.innerHTML=posts.map(post=>`
<article class="card">
${post.image?`<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy">`:""}
<div class="card-content">
<small>${escapeHtml(post.category||"Article")} · ${escapeHtml(post.date)}</small>
<h3>${escapeHtml(post.title)}</h3>
<p>${escapeHtml(post.description||"")}</p>
<a class="read-more" href="article.html?slug=${encodeURIComponent(post.slug)}">Read Article →</a>
</div></article>`).join("");
}catch(error){
console.error(error);
articlesContainer.innerHTML="<p>Unable to load articles.</p>";
}}
function escapeHtml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
loadArticles();
