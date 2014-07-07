#!/usr/bin/env python

"""
Commands that render and copy the theme
"""

from fabric.api import execute, local, task, require
from fabric.state import env
from render import less
import utils

import app_config

@task(default=True)
def render():
    require('static_path', provided_by=['tumblr'])
    less()

@task
def deploy():
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    require('settings', provided_by=['production', 'staging'])
    require('static_path', provided_by=['tumblr'])

    execute('update')
    render()
    utils._gzip('%s/www/' % (env.static_path), '.gzip/tumblr/')
    utils._deploy_to_s3('.gzip/tumblr/')
    local('pbcopy < tumblr/theme.html.tpl')
    print 'The Tumblr theme HTML has been copied to your clipboard.'
    local('open https://www.tumblr.com/customize/%s' % app_config.TUMBLR_NAME)