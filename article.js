const OWNER="temporary-coderr";
const REPO="sndp.run.place";
const BRANCH="main";
const params=new URLSearchParams(window.location.search);
const slug=params.get("slug");
const articleContainer=document.getElementById("article");

async function loadArticle(){
if(!slug){articleContainer.innerHTML="<h1>Article not found</h1>";return;}
try{
const url=`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/posts/${encodeURIComponent(slug)}.json`;
const response=await fetch(url+"?t="+Date.now());
if(!response.ok) throw new Error("Article not found.");
const post=await response.json();
document.title=post.title+" | SND P";
document.getElementById("description").setAttribute("content",post.description||post.title);
articleContainer.innerHTML=`
<article>
<h1>${escapeHtml(post.title)}</h1>
<div class="article-meta">${escapeHtml(post.category||"Article")} · ${escapeHtml(post.date)}</div>
${post.image?`<img class="article-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}">`:""}
<div class="article-content">${markdownToHtml(post.content)}</div>
</article>`;
}catch(error){
console.error(error);
articleContainer.innerHTML="<h1>Article not found</h1><p>This article may have been deleted or has not been published yet.</p>";
}}
function markdownToHtml(text){
let html=escapeHtml(text||"");
html=html.replace(/^### (.*)$/gm,"<h3>$1</h3>");
html=html.replace(/^## (.*)$/gm,"<h2>$1</h2>");
html=html.replace(/^# (.*)$/gm,"<h1>$1</h1>");
html=html.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");
html=html.replace(/\*(.*?)\*/g,"<em>$1</em>");
html=html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
html=html.replace(/\n\n/g,"</p><p>");
html="<p>"+html+"</p>";
html=html.replace(/<p>(<h[1-3]>)/g,"$1");
html=html.replace(/(<\/h[1-3]>)<\/p>/g,"$1");
return html;
}
function escapeHtml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
loadArticle();
