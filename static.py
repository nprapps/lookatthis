#!/usr/bin/env python

import json
from mimetypes import guess_type

from flask import abort

import app_config
import copytext
import envoy
from flask import Blueprint
from render_utils import flatten_app_config

static = Blueprint('static', __name__)

# Render LESS files on-demand
@static.route('/posts/<string:slug>/less/<string:filename>')
def _less(slug, filename):

    r = envoy.run('node_modules/less/bin/lessc -rp=posts/%s/less/ posts/%s/less/%s' % (slug, slug, filename))

    return r.std_out, 200, { 'Content-Type': 'text/css' }

# Render application configuration
@static.route('/posts/<string:slug>/js/app_config.js')
def _app_config_js(slug):
    config = flatten_app_config()
    js = 'window.APP_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

# Render copytext
@static.route('/posts/<string:slug>/js/copy.js')
def _copy_js(slug):
    copy = 'window.COPY = ' + copytext.Copy(app_config.COPY_PATH).json()

    return copy, 200, { 'Content-Type': 'application/javascript' }

# Server arbitrary static files on-demand
@static.route('/posts/<string:slug>/<path:path>')
def _static(slug, path):
    real_path = 'posts/%s/www/%s' % (slug, path)
    print real_path

    try:
        with open('%s' % real_path) as f:
            return f.read(), 200, { 'Content-Type': guess_type(real_path)[0] }
    except IOError:
        abort(404)
