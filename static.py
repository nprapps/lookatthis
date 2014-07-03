#!/usr/bin/env python

import json
from mimetypes import guess_type

from flask import abort

import app_config
import copytext
import envoy
from flask import Blueprint
from render_utils import flatten_app_config, flatten_post_config

static = Blueprint('static', __name__)

# Render LESS files on-demand
@static.route('/posts/<string:slug>/less/<string:filename>')
def _post_less(slug, filename):

    r = envoy.run('node_modules/less/bin/lessc -rp=posts/%s/less/ posts/%s/less/%s' % (slug, slug, filename))

    return r.std_out, 200, { 'Content-Type': 'text/css' }

@static.route('/less/<string:filename>')
def _theme_less(filename):
    try:
        with open('tumblr/less/%s' % filename) as f:
            less = f.read()
    except IOError:
        abort(404)

    r = envoy.run('node_modules/less/bin/lessc -rp=tumblr/less/ tumblr/less/%s' % filename)

    return r.std_out, 200, { 'Content-Type': 'text/css' }

# Render application configuration
@static.route('/js/app_config.js')
def _app_config_js():
    config = flatten_app_config()
    js = 'window.APP_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

@static.route('/posts/<string:slug>/js/post_config.js')
def _post_config_js(slug):
    config = flatten_post_config(slug)
    js = 'window.POST_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

# render copytext
@static.route('/posts/<string:slug>/js/copy.js')
def _copy_js(slug):
    copy = 'window.copy = ' + copytext.Copy('data/%s.xlsx' % slug).json()
    return copy, 200, { 'content-type': 'application/javascript' }

# server arbitrary static files on-demand
@static.route('/posts/<string:slug>/<path:path>')
def _post_static(slug, path):
    real_path = 'posts/%s/www/%s' % (slug, path)

    try:
        with open('%s' % real_path) as f:
            return f.read(), 200, { 'Content-Type': guess_type(real_path)[0] }
    except IOError:
        abort(404)

# Server arbitrary static files on-demand
@static.route('/<path:path>')
def _theme_static(path):
    try:
        with open('tumblr/www/%s' % path) as f:
            return f.read(), 200, { 'Content-Type': guess_type(path)[0] }
    except IOError:
        abort(404)
