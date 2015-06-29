#!/usr/bin/env python

import app as flat_app
import app_config
import assets
import boto
import data
import flat
import imp
import issues
import json
import os
import render
import subprocess
import text
import theme
import utils
import webbrowser

from distutils.spawn import find_executable
from fabric.api import local, prompt, require, settings, task
from fabric.state import env
from oauth import get_credentials
from time import sleep

# Bootstrap can only be run once, then it's disabled
if app_config.PROJECT_SLUG == '$NEW_PROJECT_SLUG':
    import bootstrap

SPREADSHEET_COPY_URL_TEMPLATE = 'https://www.googleapis.com/drive/v2/files/%s/copy'
SPREADSHEET_VIEW_TEMPLATE = 'https://docs.google.com/spreadsheet/ccc?key=%s#gid=1'

"""
Environments

Changing environment requires a full-stack test.
An environment points to both a server and an S3
bucket.
"""
env.post_root = 'lookatthis/posts'

@task
def production():
    """
    Run as though on production.
    """
    env.settings = 'production'
    app_config.configure_targets(env.settings)

@task
def staging():
    """
    Run as though on staging.
    """
    env.settings = 'staging'
    app_config.configure_targets(env.settings)

@task
def development():
    env.settings = 'development'
    app_config.configure_targets(env.settings)

"""
Running the app
"""
@task
def app(port='8000'):
    """
    Serve app.py.
    """
    local('gunicorn -b 0.0.0.0:%s --debug --reload app:wsgi_app' % port)

@task
def tests():
    """
    Run Python unit tests.
    """
    local('nosetests')

"""
Deployment

Changes to deployment requires a full-stack test. Deployment
has two primary functions: Pushing flat files to S3 and deploying
code to a remote server if required.
"""

@task
def update():
    """
    Update all application data not in repository (copy, assets, etc).
    """
    require('slug', provided_by=[post])

    text.update()
    assets.sync()

@task
def deploy(slug=''):
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    require('settings', provided_by=[staging, production])
    require('slug', provided_by=[post])

    update()
    render.render_all()

    flat.deploy_folder(
        '%s/www' % env.static_path,
        '%s/%s' % (env.post_root, env.post_config.DEPLOY_SLUG),
        max_age=app_config.DEFAULT_MAX_AGE,
        ignore=['%s/assets/*' % env.static_path]
    )

    flat.deploy_folder(
        '%s/www/assets' % env.static_path,
        '%s/%s/assets' % (env.post_root, env.post_config.DEPLOY_SLUG),
        max_age=app_config.ASSETS_MAX_AGE,
        warn_threshold=app_config.WARN_THRESHOLD
    )

"""
App-specific commands
"""

@task
def post(slug):
    """
    Set the post to work on.
    """
    # Force root path every time
    fab_path = os.path.realpath(os.path.dirname(__file__))
    root_path = os.path.join(fab_path, '..')
    os.chdir(root_path)

    env.slug = utils._find_slugs(slug)

    if not env.slug:
        utils.confirm('This post does not exist. Do you want to create a new post called %s?' % slug)
        _new(slug)
        return

    env.static_path = '%s/%s' % (app_config.POST_PATH, env.slug)

    if os.path.exists ('%s/post_config.py' % env.static_path):
        # set slug for deployment in post_config
        find = "DEPLOY_SLUG = ''"
        replace = "DEPLOY_SLUG = '%s'" % env.slug
        utils.replace_in_file('%s/post_config.py' % env.static_path, find, replace)

        env.post_config = imp.load_source('post_config', '%s/post_config.py' % env.static_path)
        env.copytext_key = env.post_config.COPY_GOOGLE_DOC_KEY
    else:
        env.post_config = None
        env.copytext_key = None

    env.copytext_slug = env.slug

def _new(slug):

    local('cp -r new_post %s/%s' % (app_config.POST_PATH, slug))
    post(slug)
    _check_credentials()
    old_key = env.post_config.COPY_GOOGLE_DOC_KEY
    new_key = _create_spreadsheet('%s Look At This COPY' % slug)
    if new_key:
        utils.replace_in_file('%s/post_config.py' % env.static_path, old_key, new_key)
        env.copytext_key = new_key
    update()

def _check_credentials():
    """
    Check credentials and spawn server and browser if not
    """
    credentials = get_credentials()
    if not credentials or 'https://www.googleapis.com/auth/drive' not in credentials.config['google']['scope']:
        try:
            with open(os.devnull, 'w') as fnull:
                print 'Credentials were not found or permissions were not correct. Automatically opening a browser to authenticate with Google.'
                gunicorn = find_executable('gunicorn')
                process = subprocess.Popen([gunicorn, '-b', '127.0.0.1:8888', 'app:wsgi_app'], stdout=fnull, stderr=fnull)
                webbrowser.open_new('http://127.0.0.1:8888/oauth')
                print 'Waiting...'
                while not credentials:
                    try:
                        credentials = get_credentials()
                        sleep(1)
                    except ValueError:
                        continue
                print 'Successfully authenticated!'
                process.terminate()
        except KeyboardInterrupt:
            print '\nCtrl-c pressed. Later, skater!'
            exit()

def _create_spreadsheet(title):
    """
    Copy the COPY spreadsheet
    """
    kwargs = {
        'credentials': get_credentials(),
        'url': SPREADSHEET_COPY_URL_TEMPLATE % env.post_config.COPY_GOOGLE_DOC_KEY,
        'method': 'POST',
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'title': title,
        }),
    }

    resp = app_config.authomatic.access(**kwargs)
    if resp.status == 200:
        spreadsheet_key = resp.data['id']
        spreadsheet_url = SPREADSHEET_VIEW_TEMPLATE % spreadsheet_key
        print 'New spreadsheet created successfully!'
        print 'View it online at %s' % spreadsheet_url
        return spreadsheet_key
    else:
        print 'Error creating spreadsheet (status code %s) with message %s' % (resp.status, resp.reason)
        return None

@task
def rename(new_slug, check_exists=True):
    require('slug', provided_by=[post])

    new_path = '%s/%s' % (app_config.POST_PATH, new_slug)
    local('mv %s %s' % (env.static_path, new_path))
    local('mv data/%s.xlsx data/%s.xlsx' % (env.slug, new_slug))

    post(new_slug)

@task
def delete():
    require('slug', provided_by=[post])

    local('fab post:%s assets.rm:"*"' % env.slug)
    local('rm -r %s' % env.static_path)
    local('rm data/%s.xlsx' % env.slug)

@task
def tumblr():
    env.static_path = 'tumblr'
    env.slug = 'tumblr'
    env.copytext_key = app_config.COPY_GOOGLE_DOC_KEY
    env.copytext_slug = 'theme'

@task
def sitemap():
    """
    Render and deploy sitemap.
    """
    require('settings', provided_by=[staging, production])

    app_config.configure_targets(env.get('settings', None))

    with flat_app.app.test_request_context(path='sitemap.xml'):
        print 'Rendering sitemap.xml'

        view = flat_app.__dict__['_sitemap']
        content = view().data

    with open('.sitemap.xml', 'w') as f:
        f.write(content)

    s3 = boto.connect_s3()

    flat.deploy_file(
        s3,
        '.sitemap.xml',
        app_config.PROJECT_SLUG,
        app_config.DEFAULT_MAX_AGE
    )

"""
Destruction

Changes to destruction require setup/deploy to a test host in order to test.
Destruction should remove all files related to the project from both a remote
host and S3.
"""

@task
def shiva_the_destroyer():
    """
    Deletes the app from s3
    """
    require('settings', provided_by=[production, staging])

    utils.confirm("You are about to destroy everything deployed to %s for this project.\nDo you know what you're doing?" % app_config.DEPLOYMENT_TARGET)

    with settings(warn_only=True):
        sync = 'aws s3 rm %s --recursive --region "us-east-1"'

        for bucket in app_config.S3_BUCKETS:
            local(sync % ('s3://%s/%s/' % (bucket, app_config.PROJECT_SLUG)))
