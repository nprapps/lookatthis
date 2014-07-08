#!/usr/bin/env python

from mimetypes import guess_type

from flask import abort

import copytext
import envoy
from flask import Blueprint

static = Blueprint('static', __name__)

# Render LESS files on-demand
def less(static_path, filename):

    r = envoy.run('node_modules/less/bin/lessc -rp=%s/less/ %s/less/%s' % (static_path, static_path, filename))

    return r.std_out, 200, { 'Content-Type': 'text/css' }

# render copytext
def copy_js(slug):
    copy = 'window.copy = ' + copytext.Copy('data/%s.xlsx' % slug).json()
    return copy, 200, { 'content-type': 'application/javascript' }

# server arbitrary static files on-demand
def static_file(static_path, path):
    real_path = '%s/www/%s' % (static_path, path)

    try:
        with open('%s' % real_path) as f:
            return f.read(), 200, { 'Content-Type': guess_type(real_path)[0] }
    except IOError:
        abort(404)
