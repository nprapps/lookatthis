#!/usr/bin/env python

import json

import argparse
import copytext
from glob import glob
import imp

from flask import Flask, render_template, render_template_string

import app_config
from render_utils import make_context, smarty_filter, urlencode_filter
import static

app = Flask(__name__)

app.jinja_env.filters['smarty'] = smarty_filter
app.jinja_env.filters['urlencode'] = urlencode_filter

# Example application views
@app.route('/')
def _graphics_list():
    """
    Renders a list of all posts for local testing.
    """
    context = make_context()
    context['posts'] = []

    posts = glob('%s/*' % app_config.POST_PATH)
    for post in posts:
        name = post.split('%s/' % app_config.POST_PATH)[1]
        context['posts'].append(name)
        print name

    context['posts_count'] = len(context['posts'])

    return render_template('index.html', **context)

@app.route('/posts/<slug>/')
def _post(slug):
    """
    Renders a post without the tumblr wrapper.
    """
    post_path = '%s/%s' % (app_config.POST_PATH, slug)

    context = make_context()
    context['slug'] = slug
    context['COPY'] = copytext.Copy(filename='data/%s.xlsx' % slug)

    try:
        post_config = imp.load_source('post_config', '%s/post_config.py' % post_path)
        context.update(post_config.__dict__)
    except IOError:
        pass

    with open('%s/templates/index.html' % post_path) as f:
        template = f.read().decode('utf-8')

    return render_template_string(template, **context)

app.register_blueprint(static.static)

# Boilerplate
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port')
    args = parser.parse_args()
    server_port = 8000

    if args.port:
        server_port = int(args.port)

    app.run(host='0.0.0.0', port=server_port, debug=app_config.DEBUG)
