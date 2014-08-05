#!/usr/bin/env python

"""
Commands that render and copy the theme
"""

from fabric.api import execute, local, task, require
from fabric.state import env
from render import less, copytext_js
import utils

import app
import app_config
import static_theme

@task(default=True)
def render():
    from flask import g

    require('static_path', provided_by=['tumblr'])
    require('settings', provided_by=['development', 'staging', 'production'])
    less()
    app_config_js()
    copytext_js('theme')

    compiled_includes = {}

    app_config.configure_targets(env.get('settings', None))

    with app.app.test_request_context():
        path = 'tumblr/www/index.html'

    with app.app.test_request_context(path=env.static_path):
        print 'Rendering %s' % path


        if env.settings == 'development':
            g.compile_includes = False
        else:
            g.compile_includes = True

        g.compiled_includes = compiled_includes

        view = static_theme.__dict__['_theme']
        content = view()

    with open(path, 'w') as f:
        f.write(content.encode('utf-8'))

    local('pbcopy < tumblr/www/index.html')
    print 'The Tumblr theme HTML has been copied to your clipboard.'
    local('open https://www.tumblr.com/customize/%s' % app_config.TUMBLR_NAME)

def app_config_js():
    """
    Render app_config.js to file.
    """
    from static_theme import _app_config_js

    response = _app_config_js()
    js = response[0]

    with open('tumblr/www/js/app_config.js', 'w') as f:
        f.write(js)

@task
def deploy():
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    require('settings', provided_by=['production', 'staging', 'development'])
    require('static_path', provided_by=['tumblr'])

    # execute('update')
    render()
    utils._gzip('%s/www/' % (env.static_path), '.gzip/tumblr/')
    utils._deploy_to_s3('.gzip/tumblr/')
