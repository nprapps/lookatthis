#!/usr/bin/env python

import app_config
import argparse
import copytext
import csv
import imp
import json
import oauth
import os
import static
import static_post
import static_theme

from flask import Blueprint, Flask, make_response, render_template, render_template_string
from glob import glob
from render_utils import make_context, smarty_filter, urlencode_filter, number_filter, CSSIncluder, JavascriptIncluder
from werkzeug.debug import DebuggedApplication

app = Flask(__name__)
app.debug = app_config.DEBUG

app.jinja_env.filters['smarty'] = smarty_filter
app.jinja_env.filters['urlencode'] = urlencode_filter
app.jinja_env.filters['format_number'] = number_filter

posts = Blueprint('posts', __name__, template_folder='posts/')

# Example application views
@app.route('/')
@oauth.oauth_required
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

    return make_response(render_template('post_list.html', **context))

@app.route('/sitemap.xml')
def _sitemap():
    """
    Render a simple sitemap for look content.
    """
    context = make_context()

    with open('data/sitemap.csv') as f:
        posts = csv.reader(f)
        posts.next()
        context['posts'] = list(posts)

    return make_response(render_template('sitemap.xml', **context))

@posts.route('/posts/<slug>/')
@oauth.oauth_required
def _post(slug):
    """
    Renders a post without the tumblr wrapper.
    """
    post_path = '%s/%s' % (app_config.POST_PATH, slug)

    context = make_context()
    context['slug'] = slug
    context['COPY'] = copytext.Copy(filename='data/%s.xlsx' % slug)
    context['JS'] = JavascriptIncluder(asset_depth=2, static_path=post_path)
    context['CSS'] = CSSIncluder(asset_depth=2, static_path=post_path)

    try:
        post_config = imp.load_source('post_config', '%s/post_config.py' % post_path)
        context.update(post_config.__dict__)
    except IOError:
        pass

    if os.path.exists('%s/featured.json' % post_path):
        with open('%s/featured.json' % post_path) as f:
            context['featured'] = json.load(f)

    with open('%s/templates/index.html' % post_path) as f:
        template = f.read().decode('utf-8')

    return make_response(render_template_string(template, **context))

app.register_blueprint(static.static)
app.register_blueprint(posts)
app.register_blueprint(oauth.oauth)
app.register_blueprint(static_post.post)
app.register_blueprint(static_theme.theme)

# Enable Werkzeug debug pages
if app_config.DEBUG:
    wsgi_app = DebuggedApplication(app, evalex=False)
else:
    wsgi_app = app

# Boilerplate
if __name__ == '__main__':
    print 'This command has been removed! Please run "fab app" instead!'

    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port')
    args = parser.parse_args()
    server_port = 8000

    if args.port:
        server_port = int(args.port)

    app.run(host='0.0.0.0', port=server_port, debug=app_config.DEBUG)