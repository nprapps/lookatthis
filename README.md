Copyright 2014 NPR.  All rights reserved.  No part of these materials may be reproduced, modified, stored in a retrieval system, or retransmitted, in any form or by any means, electronic, mechanical or otherwise, without prior written permission from NPR.

(Want to use this code? Send an email to nprapps@npr.org!)


lookatthis
========================

* [What is this?](#what-is-this)
* [Assumptions](#assumptions)
* [What's in here?](#whats-in-here)
* [Bootstrap the project](#bootstrap-the-project)
* [Hide project secrets](#hide-project-secrets)
* [Save media assets](#save-media-assets)
* [Add a page to the site](#add-a-page-to-the-site)
* [Run the project](#run-the-project)
* [Developing posts](#developing-posts)
* [Starting a new post](#starting-a-new-post)
* [Working on an existing post](#working-on-an-existing-post)
* [Deploying a post](#deploying-and-publishing-a-post)
* [Deleting posts](#deleting-posts)
* [COPY editing](#copy-editing)
* [Arbitrary Google Docs](#arbitrary-google-docs)
* [Run Python tests](#run-python-tests)
* [Run Javascript tests](#run-javascript-tests)
* [Compile static assets](#compile-static-assets)
* [Test the rendered app](#test-the-rendered-app)
* [Deploy to S3](#deploy-to-s3)
* [Deploy to EC2](#deploy-to-ec2)
* [Install cron jobs](#install-cron-jobs)
* [Install web services](#install-web-services)
* [Run a remote fab command](#run-a-remote-fab-command)
* [Report analytics](#report-analytics)
* [Updating sitemap](#updating-sitemap)

What is this?
-------------

**TKTK: Describe lookatthis here.**

Assumptions
-----------

The following things are assumed to be true in this documentation.

* You are running OSX.
* You are using Python 2.7. (Probably the version that came OSX.)
* You have [virtualenv](https://pypi.python.org/pypi/virtualenv) and [virtualenvwrapper](https://pypi.python.org/pypi/virtualenvwrapper) installed and working.
* You have NPR's AWS credentials stored as environment variables locally.

For more details on the technology stack used with the app-template, see our [development environment blog post](http://blog.apps.npr.org/2013/06/06/how-to-setup-a-developers-environment.html).

What's in here?
---------------

The project contains the following folders and important files:

* ``data`` -- Data files, such as those used to generate HTML.
* ``fabfile`` -- [Fabric](http://docs.fabfile.org/en/latest/) commands for automating setup, deployment, data processing, etc.
* ``etc`` -- Miscellaneous scripts and metadata for project bootstrapping.
* ``new-post`` -- The default new post template.
* ``posts`` -- Where Look At This posts live
* ``posts/$SLUG/templates/slides`` -- Slide templates for a particular post
* ``posts/%SLUG/less/slides`` -- `.less` files for post slide templates
* ``templates`` -- HTML ([Jinja2](http://jinja.pocoo.org/docs/)) templates, to be compiled locally.
* ``app.py`` -- A [Flask](http://flask.pocoo.org/) app for rendering the project locally.
* ``app_config.py`` -- Global project configuration for scripts, deployment, etc.
* ``render_utils.py`` -- Code supporting template rendering.
* ``requirements.txt`` -- Python requirements.
* ``static.py`` -- Static Flask views used in both ``app.py`` and ``public_app.py``.
* ``static_post.py`` -- Helper Flask views for compiling posts
* ``static_post.py`` -- Helper Flask views for compiling Tumblr theme

Bootstrap the project
---------------------

Node.js is required for the static asset pipeline. If you don't already have it, get it like this:

```
brew install node
curl -L https://npmjs.org/install.sh | sh
```

Then bootstrap the project:

```
cd lookatthis
mkvirtualenv lookatthis
pip install -r requirements.txt
npm install
```

Hide project secrets
--------------------

Project secrets should **never** be stored in ``app_config.py`` or anywhere else in the repository. They will be leaked to the client if you do. Instead, always store passwords, keys, etc. in environment variables and document that they are needed here in the README.

The required environment variables for this project are in the `# lookatthis` section of [env.sh](https://github.com/nprapps/workinprivate/blob/master/env.sh) in the `workinprivate` repo. You will need to copy and paste those lines to your `~/.bash_profile`.

Save media assets
-----------------

Large media assets (images, videos, audio) are synced with an Amazon S3 bucket specified in ``app_config.ASSETS_S3_BUCKET`` in a folder with the name of the project. (This bucket should not be the same as any of your ``app_config.PRODUCTION_S3_BUCKETS`` or ``app_config.STAGING_S3_BUCKETS``.) This allows everyone who works on the project to access these assets without storing them in the repo, giving us faster clone times and the ability to open source our work.

Syncing these assets requires running a couple different commands at the right times. When you create new assets or make changes to current assets that need to get uploaded to the server, run ```fab post:$SLUG assets.sync```. This will do a few things:

* If there is an asset on S3 that does not exist on your local filesystem it will be downloaded.
* If there is an asset on that exists on your local filesystem but not on S3, you will be prompted to either upload (type "u") OR delete (type "d") your local copy.
* You can also upload all local files (type "la") or delete all local files (type "da"). Type "c" to cancel if you aren't sure what to do.
* If both you and the server have an asset and they are the same, it will be skipped.
* If both you and the server have an asset and they are different, you will be prompted to take either the remote version (type "r") or the local version (type "l").
* You can also take all remote versions (type "ra") or all local versions (type "la"). Type "c" to cancel if you aren't sure what to do.

Unfortunantely, there is no automatic way to know when a file has been intentionally deleted from the server or your local directory. When you want to simultaneously remove a file from the server and your local environment (i.e. it is not needed in the project any longer), run ```fab post:$SLUG assets.rm:"file_name_here.jpg"```

Run the project
---------------

A flask app is used to run the project locally. It will automatically recompile templates and assets on demand.

```
workon $PROJECT_SLUG
fab app
```

Visit [localhost:8000](http://localhost:8000) in your browser.

## Developing posts

Working with posts on the command line revolves around the `fab post:$SLUG` command. All commands that follow `fab post:$SLUG` will work with just the post specified.

### Starting a new post

1.  `fab post:$SLUG`: This function will ask you to create a new post and place it in the `posts` folder.
2.  Copy the [sample copy spreadsheet](https://docs.google.com/spreadsheet/ccc?key=0AqjLQISCZzBkdGdxRXdtVDNDMzIwNmN3S2RQd196NUE&usp=drive_web#gid=1) into a new spreadsheet and copy the URL. That URL should be pasted in the ``posts/$SLUG/post_config.py`` file with the variable ``COPY_GOOGLE_DOC_URL``.

### Working on an existing post

If you are working on a post that already exists in the repo for the first time, be sure to run `fab post:$SLUG update` to get the assets and copytext spreadsheet.

### Creating new slides

The default COPY document has several sheets. You will create new slides in the `content` sheet. Each slide is one row in this sheet. Each row includes:

* `id`: a unique ID for the slide (see below for guidelines)
* `template`: the name of the slide template
* `text1`, `text2`, `text3`: fields for the various pieces of text your template requires (see below for guidelines)
* `media`: images or video that your template will use (not required)
* `media_credit`: Photo/video credit (not the caption)
* `caption`: Caption for the photo
* `color`: a background color for the slide (not required)
* `author`: Author of the post (only on the title post)
* `date`: Date of publication
* `extra_class`: An extra class for style changes that don't require a change in the markup. Examples include `dark-overlay` and `blur-background`.

You may use `<em>` and `<strong>` in any of the text fields, when appropriate. You should avoid using `<h1>` or other context-specific tags.

### IDs

Each slide requires a unique ID, defined in the `id` column of the content spreadsheet. Each ID should use good slug style: all lowercase, descriptive of the content and uses dashes between words. For example:

* __Bad__: `slide1`, `slide2`, `slide3`
* __Good__: names that describe the content on the page.

* __Bad__: `To The Border`, `toTheBorder`, `totheborder`
* __Good__: `to-the-border`

### Slide templates

Each slideshow comes with these default templates.

* `slide`: A default slide with no special styles.
* `titlecard`: A slide for dividing sections of a post, includes title and subtitle.
* `start`: A titlecard that includes Look At This branding, author and date.
* `framed-text`: A framed box of text in the center of the screen in front of a background image.
* `full-bleed`: A bottom bar of text in front of a background image.
* `side-by-side`: An image (on the left) next to a block of text (on the right).
* `conclusion`: Promo for corresponding NPR story and share buttons.
* `next-post`: A slide that should be used at the end of a post to promote the share panel and the next post.

### Text fields

|   template  |                         text_1                          |  text_2  |        text_3        |
|:-----------:|:-----------------------------------------------------:  |:--------:|:---------------------:|
|    slide    | Text to go in the center of slide. Requires \<p\> tags. | N/A      | N/A                   |
|  titlecard  |                         Title                           | Subtitle | N/A                   |
|    start    |                         Title                           | Subtitle | Text for begin button |
|    quote    |                       Quotation                         | Citation | N/A                   |
| fixed-image |          Text to appear in upper-right corner           | N/A      | N/A                   |
|  next-post  |               The title of the next post                | Caption  | Link to next post     |

### Creating a new template

New templates should be created when the content requires a slide with a different markup structure than any of the existing templates.

To create a new template, follow these steps:

1. Go into the `posts` repo on your local machine, find the post you are working on, and navigate to the `templates` folder.
2. In the `slides` folder, create a new `.html` file with the name of your template, i.e. `essay.html`
3. Navigate back to the root of your post, and go to the `less` folder.
4. In the `slides` folder, create a new `.less` file with the name of your template, i.e. `essay.less`
5. Finally, in `app.less`, add an import line that imports your new `.less` file, i.e. `@import "./slides/essay.less"`.

You can now use this template in the `template` column of your `content` spreadsheet.

### Making style adjustments

If a slide needs style adjustments but not a new markup structure, use the `id` of the slide to make adjustments in CSS. Open the `nudges.less` file in your post's `less` directory to make these adjustments. For example:

```
#to-the-border {
    p {
        font-size: 20px;
    }
}
```

### Deploying a post

When deploying a post, make sure the deploy slug is what you want it to be. The slug defaults to the name of the folder, but can be overridden in `posts/$SLUG/post_config.py`. Define the variable `DEPLOY_SLUG` to what you want the published slug to be.

Also, make sure that the variable `NUM_SLIDES_AFTER_CONTENT` is equal to the number of slides *after* the last piece of story content. For example, if there is a share slide and an up next slide, the number should be 2. This is important for tracking completion rates in our analytics.

Deploy posts with the following command:
```
fab post:$SLUG staging deploy
```

This function will deploy the static assets to S3, and can be found at stage-apps.npr.org/lookatthis/posts/$SLUG.

### Deleting posts

If you want to delete a post, use the following command:

```
fab post:$SLUG delete
```

**Do not** specify a deployment target. This will also delete all assets related to the post in the assets rig.

COPY editing
------------

This app uses a Google Spreadsheet for a simple key/value store that provides an editing workflow.

View the [sample copy spreadsheet](https://docs.google.com/spreadsheet/ccc?key=0AqjLQISCZzBkdGdxRXdtVDNDMzIwNmN3S2RQd196NUE).

This document is specified in ``app_config`` with the variable ``COPY_GOOGLE_DOC_KEY``. To use your own spreadsheet, change this value to reflect your document's key (found in the Google Docs URL after ``&key=``).

A few things to note:

* If there is a column called ``key``, there is expected to be a column called ``value`` and rows will be accessed in templates as key/value pairs
* Rows may also be accessed in templates by row index using iterators (see below)
* You may have any number of worksheets
* This document must be "published to the web" using Google Docs' interface

The app template is outfitted with a few ``fab`` utility functions that make pulling changes and updating your local data easy.

To update the latest document, simply run:

```
fab post:$SLUG text.update
```

Note: ``text.update`` runs automatically whenever ``fab render`` is called.

At the template level, Jinja maintains a ``COPY`` object that you can use to access your values in the templates. Using our example sheet, to use the ``byline`` key in ``templates/index.html``:

```
{{ COPY.attribution.byline }}
```

More generally, you can access anything defined in your Google Doc like so:

```
{{ COPY.sheet_name.key_name }}
```

You may also access rows using iterators. In this case, the column headers of the spreadsheet become keys and the row cells values. For example:

```
{% for row in COPY.sheet_name %}
{{ row.column_one_header }}
{{ row.column_two_header }}
{% endfor %}
```

When naming keys in the COPY document, pleaseattempt to group them by common prefixes and order them by appearance on the page. For instance:

```
title
byline
about_header
about_body
about_url
download_label
download_url
```

Compile static assets
---------------------

Compile LESS to CSS, compile javascript templates to Javascript and minify all assets:

```
workon lookatthis
fab post:$SLUG render
```

(This is done automatically whenever you deploy to S3.)

Analytics
---------

The Google Analytics events tracked in this application are:

|Category|Action|Label|Value|Custom 1|Custom 2|
|--------|------|-----|-----|--------|--------|
|$POST_SLUG|tweet|`location`||||
|$POST_SLUG|facebook|`location`||||
|$POST_SLUG|email|`location`||||
|$POST_SLUG|new-comment||||
|$POST_SLUG|open-share-discuss||||
|$POST_SLUG|close-share-discuss||||
|$POST_SLUG|summary-copied||||
|$POST_SLUG|featured-tweet-action|`action`||``tweet_url``|
|$POST_SLUG|featured-facebook-action|`action`||``post_url``|
|$POST_SLUG|slide-exit|`slideIndex`|`timeOnSlide`||
|$POST_SLUG|keyboard-nav||||
|$POST_SLUG|next-post||||
|$POST_SLUG|completion|percent|||

(Not posts necessarily track all metrics.)

Updating sitemap
----------------

To add a project to the sitemap:

* Add a line to ``data/sitemap.csv``
* Run ``fab staging|production sitemap

