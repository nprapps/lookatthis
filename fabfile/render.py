#!/usr/bin/env python

"""
Commands for rendering various parts of the app stack.
"""

from glob import glob
import imp
import os

from fabric.api import local, require, task
from fabric.state import env

import app
import app_config

@task
def less():
    post_path = '%s/%s' % (app_config.POST_PATH, env.post)

    """
    Render LESS files to CSS.
    """
    for path in glob('%s/less/*.less' % post_path):
        filename = os.path.split(path)[-1]
        name = os.path.splitext(filename)[0]
        out_path = '%s/www/css/%s.less.css' % (post_path, name)

        try:
            local('node_modules/less/bin/lessc %s %s' % (path, out_path))
        except:
            print 'It looks like "lessc" isn\'t installed. Try running: "npm install"'
            raise

@task
def app_config_js():
    """
    Render app_config.js to file.
    """
    from static import _app_config_js

    response = _app_config_js()
    js = response[0]

    with open('www/js/app_config.js', 'w') as f:
        f.write(js)

@task
def post_config_js():
    """
    Render app_config.js to file.
    """
    from static import _post_config_js

    post_path = '%s/%s' % (app_config.POST_PATH, env.post)

    response = _post_config_js(env.post)
    js = response[0]

    with open('%s/www/js/post_config.js' % post_path, 'w') as f:
        f.write(js)

@task
def copytext_js():
    """
    Render COPY to copy.js.
    """
    from static import _copy_js

    post_path = '%s/%s' % (app_config.POST_PATH, env.post)

    response = _copy_js(env.post)
    js = response[0]

    with open('%s/www/js/copy.js' % post_path, 'w') as f:
        f.write(js)

@task(default=True)
def render_all():
    """
    Render HTML templates and compile assets.
    """
    from flask import g, url_for

    less()
    post_config_js()
    copytext_js()

    compiled_includes = {}

    app_config.configure_targets(env.get('settings', None))

    post_path = '%s/%s' % (app_config.POST_PATH, env.post)

    slug = post_path.split('%s/' % app_config.POST_PATH)[1].split('/')[0]

    with app.app.test_request_context():
        path = 'posts/%s/www/index.html' % slug

    with app.app.test_request_context(path=post_path):
        print 'Rendering %s' % path

        g.compile_includes = True
        g.compiled_includes = compiled_includes

        view = app.__dict__['_post']
        content = view(slug)

    with open(path, 'w') as f:
        f.write(content.encode('utf-8'))

    # for rule in app.app.url_map.iter_rules():
    #     rule_string = rule.rule
    #     name = rule.endpoint

    #     if name == 'static' or name.startswith('_'):
    #         print 'Skipping %s' % name
    #         continue

    #     if rule_string.endswith('/'):
    #         filename = 'www' + rule_string + 'index.html'
    #     elif rule_string.endswith('.html'):
    #         filename = 'www' + rule_string
    #     else:
    #         print 'Skipping %s' % name
    #         continue

    #     dirname = os.path.dirname(filename)

    #     if not (os.path.exists(dirname)):
    #         os.makedirs(dirname)

    #     print 'Rendering %s' % (filename)

    #     with app.app.test_request_context(path=rule_string):
    #         g.compile_includes = True
    #         g.compiled_includes = compiled_includes

    #         bits = name.split('.')

    #         # Determine which module the view resides in
    #         if len(bits) > 1:
    #             module, name = bits
    #         else:
    #             module = 'app'

    #         view = globals()[module].__dict__[name]
    #         content = view()

    #         compiled_includes = g.compiled_includes

    #     with open(filename, 'w') as f:
    #         f.write(content.encode('utf-8'))