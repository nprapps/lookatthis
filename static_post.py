#!/usr/bin/env python

import json

from flask import Blueprint

from fabfile.utils import _get_folder_for_slug
from render_utils import flatten_post_config
import static

post = Blueprint('post', __name__, url_prefix='/posts')

# Render LESS files on-demand
@post.route('/<string:slug>/less/<string:filename>')
def _post_less(slug, filename):
    folder_name = _get_folder_for_slug(slug)

    return static.less('posts/%s' % folder_name, filename)

@post.route('/<string:slug>/js/post_config.js')
def _post_config_js(slug):
    folder_name = _get_folder_for_slug(slug)

    config = flatten_post_config(folder_name)
    js = 'window.POST_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

# render copytext
@post.route('/<string:slug>/js/copy.js')
def _copy_js(slug):
    folder_name = _get_folder_for_slug(slug)

    return static.copy_js(folder_name)

# serve arbitrary static files on-demand
@post.route('/<string:slug>/<path:path>')
def _post_static(slug, path):
    folder_name = _get_folder_for_slug(slug)

    return static.static_file('posts/%s' % folder_name, path)
