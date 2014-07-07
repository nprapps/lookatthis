#!/usr/bin/env python

import json
from mimetypes import guess_type

from flask import abort

import app_config
import copytext
import envoy
from flask import Blueprint
from render_utils import flatten_app_config, flatten_post_config

theme = Blueprint('theme', __name__, url_prefix='/tumblr')

# Render LESS files on-demand
@theme.route('/less/<string:filename>')
def _theme_less(slug, filename):

    return static.less('tumblr', filename)

# Render application configuration
@theme.route('/js/app_config.js')
def _app_config_js():
    config = flatten_app_config()
    js = 'window.APP_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

# render copytext
@theme.route('/js/copy.js')
def _copy_js(slug):
    return static.copy_js('theme')

# serve arbitrary static files on-demand
@theme.route('/<path:path>')
def _theme_static(slug, path):
    return static.static_file('tumblr', path)
