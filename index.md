-----------------------------------------------------------------------------
title: Home page
----------------------------------------------------------------------------

<div hidden markdown>
</div>

## Zetti

*Zetti* is a showdown based static site generator for a personal knowledge base, or digital garden. Files are stored mainly in markdown format (notes), and can be edited in any text editor, or by using a note-taking app such as [Obsidian](https://obsidian.md). A range of other files is supported for deployment, including html, pdf, txt, image and javascript files. The site is generated using node.js scripts for initial setup (which can be executed from within obsidian), github pages for deployment, and can be hosted on any web server. The site generated includes full regex search and a powerful network graph view.

Yes - but why?

In "A Life of One's Own", Marion Milner (as Joanna Field) wrote (in 1932):

> The reason for writing the book was not the same as the reason for publishing it. It was written in the spirit of a detective who, baffled by the multitude of his facts, goes over and makes a summary of the progress of his investigations in the hope of finding something he has missed. So, when I began to write this book, in the fourth year of my enterprise, I did not know, or could only perceive very dimly, what the end would be. In this sense the book is a contemporary journal of an exploration which involved doubts, delays, and expeditions on false trails, and the writing of it was an essential part of the search.
> The reason for publishing the book is that although what I found is probably peculiar to my own temperament and circumstances, I think the method by which I found it may be useful to others, even to those whose discoveries about themselves may be the opposite of my own. The need for such a method in these days is obvious, a method for discovering one's true likes and dislikes, for finding and setting up a standard of values that is truly one's own and not a borrowed mass-produced ideal.

'Keeping notes', whether of one's own life, or of one's work, is a way of exploring and discovering. It is a way of making sense of the world, and of oneself. It is a way of learning, and of understanding. Publishing those notes is a way of sharing, and of communicating.

*Zetti* provides a fairly simple and straightforward means for publishing one's notes, thoughts and research in a form that is accessible to both oneself and to others, and which can be used for further exploration and discovery.

### Links and embedding

Zetti is designed to be used with systems like Foam and Obsidian, and so uses link styles which are compatible with these approaches.
[This note identifies the link styles](docs/links.md) and the outcomes for each. 'On-site' files/notes are those in the same site as the file/note being viewed, 'off-site' files are those in other sites.

### Example notes & files

Markdown: [headaches](test/health/Headaches.md)
Markdown with image: [helmets](test/bike/bicycle helmets the dutch way.md)
Markdown with :gift_heart:: [[test/The book of secret knowledge.md|The book of secret knowledge]]
Pdf: [inhalers](test/health/inhaled cortico steroids.pdf)
Pdf: [the Portable Dragon](test/The Portable Dragon.pdf)

### Katex

Latex style math can be used in markdown files using katex, eg.

$$x=\frac{ -b\pm\sqrt{ b^2-4ac } } {2a}$$

See [this note](docs/katex.md) for more examples.

### Scripts and editable, executable javascript codeblocks

This doc file shows how scripts can be defined in  [[javascript|javascript codeblocks]], and executed.

### Deployment
Your site can be deployed to github pages, or any other web server. See [[docs/deployment.md|deployment]] for details.

### Alternatives

Here are some [[docs/alternatives.md|alternatives]] for publishing notes and research to the web.




