#!/usr/bin/env python

from mimetypes import guess_type
import os
from re import findall
import subprocess

from flask import abort
from werkzeug.datastructures import Headers

import copytext
from flask import Blueprint

static = Blueprint('static', __name__)

# Render LESS files on-demand
def less(static_path, filename):

    r = subprocess.check_output(["node_modules/less/bin/lessc", "%s/less/%s" % (static_path, filename)])

    return r, 200, { 'Content-Type': 'text/css' }

# render copytext
def copy_js(slug):
    copy = 'window.copy = ' + copytext.Copy('data/%s.xlsx' % slug).json()
    return copy, 200, { 'content-type': 'application/javascript' }

# Audio route to serve range headers for Safari.
@static.route('/posts/<string:slug>/assets/<string:filename>.mp3')
def audio(slug, filename):
    from flask import Response, request

    path = 'posts/%s/www/assets/%s.mp3' % (slug, filename)
    with open(path) as f:
        headers = Headers()
        headers.add('Content-Disposition', 'attachment', filename=filename)
        headers.add('Content-Transfer-Encoding','binary')

        status = 200
        size = os.path.getsize(path)
        begin = 0
        end = size - 1

        if request.headers.has_key('Range'):
            ranges = findall(r'\d+', request.headers['Range'])
            begin = int(ranges[0])
            if len(ranges) > 1:
                end = int(ranges[1])

            if begin != 0 or end != size - 1:
                status = 206

            headers.add('Accept-Ranges', 'bytes')
            headers.add('Content-Range', 'bytes %i-%i/%i' % (begin, end, end - begin) )

        headers.add('Content-Length', str( (end - begin) + 1) )

        print headers

        response = Response(
            file(path),
            status = status,
            mimetype = 'application/octet-stream',
            headers = headers,
            direct_passthrough = True
        )

        return response

# server arbitrary static files on-demand
def static_file(static_path, path):
    real_path = '%s/www/%s' % (static_path, path)

    try:
        with open('%s' % real_path) as f:
            return f.read(), 200, { 'Content-Type': guess_type(real_path)[0] }
    except IOError:
        abort(404)

