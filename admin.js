const publishButton=document.getElementById("publish");
const statusBox=document.getElementById("status");
publishButton.addEventListener("click",publishArticle);

async function publishArticle(){
const owner=document.getElementById("githubOwner").value.trim();
const repo=document.getElementById("githubRepo").value.trim();
const branch=document.getElementById("githubBranch").value.trim();
const token=document.getElementById("githubToken").value.trim();
const title=document.getElementById("title").value.trim();
const category=document.getElementById("category").value;
const description=document.getElementById("description").value.trim();
const content=document.getElementById("content").value.trim();
const imageInput=document.getElementById("image");

if(!owner||!repo||!branch||!token||!title||!content){
showStatus("Please fill in all required fields.",true);return;
}
publishButton.disabled=true;
showStatus("Publishing article...");
try{
const slug=createSlug(title);
let imageUrl="";
if(imageInput.files.length>0){
showStatus("Uploading image...");
const file=imageInput.files[0];
const extension=getExtension(file.name);
const imagePath=`images/${slug}.${extension}`;
const base64=await fileToBase64(file);
await githubUpload(owner,repo,branch,token,imagePath,base64,`Add image for ${title}`);
imageUrl=`https://sndp.run.place/${imagePath}`;
}
showStatus("Creating article...");
const article={
title,slug,category,description,
date:new Date().toISOString().split("T")[0],
image:imageUrl,content
};
const articleBase64=stringToBase64(JSON.stringify(article,null,2));
await githubUpload(owner,repo,branch,token,`posts/${slug}.json`,articleBase64,`Publish article: ${title}`);
showStatus("Updating article list...");
await updateIndex(owner,repo,branch,token,article);
showStatus(`Article published successfully!<br><br><a href="article.html?slug=${encodeURIComponent(slug)}" target="_blank">Open article</a>`);
document.getElementById("title").value="";
document.getElementById("description").value="";
document.getElementById("content").value="";
document.getElementById("image").value="";
}catch(error){
console.error(error);
showStatus("Error: "+error.message,true);
}finally{publishButton.disabled=false;}
}

async function githubUpload(owner,repo,branch,token,path,contentBase64,message){
const url=`https://api.github.com/repos/${temprory-coderr}/${sndp.run.place}/contents/${path}`;
let sha;
const existing=await fetch(url+`?ref=${encodeURIComponent(branch)}`,{
headers:{"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json"}
});
if(existing.ok){const data=await existing.json();sha=data.sha;}
const body={message,content:contentBase64,branch};
if(sha) body.sha=sha;
const response=await fetch(url,{
method:"PUT",
headers:{
"Authorization":`Bearer ${token}`,
"Accept":"application/vnd.github+json",
"Content-Type":"application/json",
"X-GitHub-Api-Version":"2026-03-10"
},
body:JSON.stringify(body)
});
if(!response.ok){
const error=await response.json();
throw new Error(error.message||"GitHub upload failed.");
}
return response.json();
}

async function updateIndex(owner,repo,branch,token,article){
const path="posts/index.json";
const url=`https://api.github.com/repos/${tempory-coderr}/${sndp.run.place}/contents/${path}`;
const response=await fetch(url+`?ref=${encodeURIComponent(branch)}`,{
headers:{"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json"}
});
if(!response.ok) throw new Error("Could not read article index.");
const data=await response.json();
const decoded=decodeBase64(data.content);
let posts=JSON.parse(decoded);
posts=posts.filter(post=>post.slug!==article.slug);
posts.push(article);
posts.sort((a,b)=>new Date(b.date)-new Date(a.date));
const newContent=stringToBase64(JSON.stringify(posts,null,2));
const update=await fetch(url,{
method:"PUT",
headers:{
"Authorization":`Bearer ${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}`,
"Accept":"application/vnd.github+json",
"Content-Type":"application/json",
"X-GitHub-Api-Version":"2026-03-10"
},
body:JSON.stringify({
message:"Update article index",
content:newContent,
sha:data.sha,
branch
})
});
if(!update.ok){
const error=await update.json();
throw new Error(error.message||"Could not update article index.");
}
}

function fileToBase64(file){
return new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result.split(",")[1]);
reader.onerror=reject;
reader.readAsDataURL(file);
});
}
function stringToBase64(text){
const bytes=new TextEncoder().encode(text);
let binary="";
bytes.forEach(byte=>binary+=String.fromCharCode(byte));
return btoa(binary);
}
function decodeBase64(base64){
const binary=atob(base64.replace(/\n/g,""));
const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
return new TextDecoder().decode(bytes);
}
function createSlug(text){
return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
}
function getExtension(filename){
const parts=filename.split(".");
return parts[parts.length-1].toLowerCase();
}
function showStatus(message,error=false){
statusBox.classList.remove("hidden");
statusBox.innerHTML=message;
statusBox.style.color=error?"#b00020":"#222";
}
