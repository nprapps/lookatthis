#!/usr/bin/env python

import imp
import json

import copytext
from flask import Blueprint, render_template
from render_utils import flatten_app_config
from render_utils import make_context, CSSIncluder, JavascriptIncluder
import static

import app_config

theme = Blueprint('theme', __name__, url_prefix='/tumblr', template_folder='tumblr/templates')

# Render LESS files on-demand
@theme.route('/less/<string:filename>')
def _theme_less(filename):

    return static.less('tumblr', filename)

# Render application configuration
@theme.route('/js/app_config.js')
def _app_config_js():
    config = flatten_app_config()
    js = 'window.APP_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

# render copytext
@theme.route('/js/copy.js')
def _copy_js():
    return static.copy_js('theme')

# serve arbitrary static files on-demand
@theme.route('/<path:path>')
def _theme_static(path):
    return static.static_file('tumblr', path)

@theme.route('/theme')
def _theme():
    context = make_context()
    context['COPY'] = copytext.Copy(filename='data/theme.xlsx')

    context['JS'] = JavascriptIncluder(asset_depth=0, static_path='tumblr', absolute=True)
    context['CSS'] = CSSIncluder(asset_depth=0, static_path='tumblr', absolute=True)

    context['tumblr_name'] = app_config.TUMBLR_NAME

    return render_template('theme.html', **context)
