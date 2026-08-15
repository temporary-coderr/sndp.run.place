# sndp.run.place — Personal Blog

A static personal blog designed for GitHub Pages.

## Adding images

Put your images in the `images/` folder using these filenames:

- `hero.jpg` — homepage hero image
- `post-1.jpg` — featured article
- `post-2.jpg`
- `post-3.jpg`
- `post-4.jpg`
- `profile.jpg` — optional profile image

Then commit/push the files to GitHub. The website will automatically display them.

You can also change any image filename in `index.html`:

```html
<img src="images/my-photo.jpg" alt="Description">
```

## Creating a new article

For a simple one-page blog, duplicate one of the post cards and edit its title/text/image.

For full articles, create files such as:

```text
posts/
  my-first-post.html
  another-post.html
```

and change the `Read more` links to those files.

## GitHub Pages + custom domain

Set GitHub Pages to deploy from the `main` branch, then add:

`sndp.run.place`

to the repository's Pages custom-domain setting.

The backend cannot execute on GitHub Pages. If you later need comments, login, an admin panel, contact-form processing, or a database, keep the backend in the same Git repository but deploy it to a separate server/API.
