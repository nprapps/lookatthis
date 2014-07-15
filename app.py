#!/usr/bin/env python

import argparse
import copytext
from glob import glob
import imp
import json

from fabfile.utils import _get_folder_for_slug, _get_slug_for_folder

from flask import Blueprint, Flask, render_template, render_template_string, url_for

import app_config
from render_utils import make_context, smarty_filter, urlencode_filter, CSSIncluder, JavascriptIncluder
import static
import static_post
import static_theme

app = Flask(__name__)

app.jinja_env.filters['smarty'] = smarty_filter
app.jinja_env.filters['urlencode'] = urlencode_filter

posts = Blueprint('posts', __name__, template_folder='posts/')

# Example application views
@app.route('/')
def _posts_list():
    """
    Renders a list of all posts for local testing.
    """
    context = make_context()
    context['posts'] = []

    posts = glob('%s/*' % app_config.POST_PATH)
    for post in posts:
        name = post.split('%s/' % app_config.POST_PATH)[1]
        context['posts'].append(name)

    context['posts_count'] = len(context['posts'])

    return render_template('post_list.html', **context)

@posts.route('/posts/<slug>/')
def _post(slug):
    """
    Renders a post without the tumblr wrapper.
    """
    folder_name = _get_folder_for_slug(slug)

    post_path = '%s/%s' % (app_config.POST_PATH, folder_name)

    context = make_context()
    context['slug'] = folder_name
    context['COPY'] = copytext.Copy(filename='data/%s.xlsx' % folder_name)

    context['JS'] = JavascriptIncluder(asset_depth=2, static_path=post_path)
    context['CSS'] = CSSIncluder(asset_depth=2, static_path=post_path)

    try:
        post_config = imp.load_source('post_config', '%s/post_config.py' % post_path)
        context.update(post_config.__dict__)
    except IOError:
        pass

    with open('%s/templates/index.html' % post_path) as f:
        template = f.read().decode('utf-8')

    return render_template_string(template, **context)

@app.route('/posts/<slug>/preview')
def _post_preview(slug):
    """
    Renders a post with the Tumblr wrapper.
    """
    context = make_context()
    context['slug'] = slug

    return render_template('parent.html', **context)

@app.route('/posts_index.json')
def _posts_index():
    output = []
    posts = glob('%s/*' % app_config.POST_PATH)
    for post in reversed(posts):
        post_metadata = {}

        folder_name = post.split('%s/' % app_config.POST_PATH)[1]
        slug = _get_slug_for_folder(folder_name)

        post_config = imp.load_source('post_config', 'posts/%s/post_config.py' % folder_name)

        if app_config.DEPLOYMENT_TARGET and not post_config.IS_PUBLISHED[app_config.DEPLOYMENT_TARGET]:
            continue

        copy = copytext.Copy(filename='data/%s.xlsx' % folder_name)

        post_metadata['slug'] = slug
        post_metadata['title'] = unicode(copy['tumblr']['title'])
        post_metadata['image'] = unicode(copy['tumblr']['promo_photo'])

        if app_config.DEPLOYMENT_TARGET:
            post_metadata['url'] = 'http://%s.tumblr.com/post/%s/%s' % (
                app_config.TUMBLR_NAME,
                post_config.TARGET_IDS[app_config.DEPLOYMENT_TARGET],
                folder_name
            )
        else:
            post_metadata['url'] = url_for('_post_preview', slug=slug)

        output.append(post_metadata)

    data=json.dumps(output)
    return 'dataHandler(%s);' % data

app.register_blueprint(static.static)
app.register_blueprint(posts)
app.register_blueprint(static_post.post)
app.register_blueprint(static_theme.theme)

# Boilerplate
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port')
    args = parser.parse_args()
    server_port = 8000

    if args.port:
        server_port = int(args.port)

    app.run(host='0.0.0.0', port=server_port, debug=app_config.DEBUG)
