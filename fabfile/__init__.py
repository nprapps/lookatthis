#!/usr/bin/env python

import imp
import os

from fabric.api import local, require, settings, task
from fabric.state import env
import pytumblr

import app_config

# Other fabfiles
import assets
import data
import issues
import render
import text
import theme
import utils

if app_config.DEPLOY_TO_SERVERS:
    import servers

if app_config.DEPLOY_CRONTAB:
    import cron_jobs

# Bootstrap can only be run once, then it's disabled
if app_config.PROJECT_SLUG == '$NEW_PROJECT_SLUG':
    import bootstrap

"""
Base configuration
"""
env.user = app_config.SERVER_USER
env.forward_agent = True

env.hosts = []
env.settings = None

"""
Environments

Changing environment requires a full-stack test.
An environment points to both a server and an S3
bucket.
"""
@task
def production():
    """
    Run as though on production.
    """
    env.settings = 'production'
    app_config.configure_targets(env.settings)
    env.hosts = app_config.SERVERS

@task
def staging():
    """
    Run as though on staging.
    """
    env.settings = 'staging'
    app_config.configure_targets(env.settings)
    env.hosts = app_config.SERVERS

"""
Deployment

Changes to deployment requires a full-stack test. Deployment
has two primary functions: Pushing flat files to S3 and deploying
code to a remote server if required.
"""
def _deploy_to_s3(path='.gzip'):
    """
    Deploy the gzipped stuff to S3.
    """
    # Clear files that should never be deployed
    local('rm -rf %s/live-data' % path)
    local('rm -rf %s/sitemap.xml' % path)

    exclude_flags = ''
    include_flags = ''

    with open('gzip_types.txt') as f:
        for line in f:
            exclude_flags += '--exclude "%s" ' % line.strip()
            include_flags += '--include "%s" ' % line.strip()

    exclude_flags += '--exclude "www/assets" '

    sync = 'aws s3 sync %s/ %s --acl "public-read" ' + exclude_flags + ' --cache-control "max-age=5" --region "us-east-1"'
    sync_gzip = 'aws s3 sync %s/ %s --acl "public-read" --content-encoding "gzip" --exclude "*" ' + include_flags + ' --cache-control "max-age=5" --region "us-east-1"'
    sync_assets = 'aws s3 sync %s/ %s --acl "public-read" --cache-control "max-age=86400" --region "us-east-1"'

    for bucket in app_config.S3_BUCKETS:
        local(sync % (path, 's3://%s/%s/%s' % (
            bucket,
            app_config.PROJECT_SLUG,
            path.split('.gzip/')[1]
        )))

        local(sync_gzip % (path, 's3://%s/%s/%s' % (
            bucket,
            app_config.PROJECT_SLUG,
            path.split('.gzip/')[1]
        )))

        local(sync_assets % ('www/assets/', 's3://%s/%s/assets/' % (
            bucket,
            app_config.PROJECT_SLUG
        )))

def _gzip(in_path='www', out_path='.gzip'):
    """
    Gzips everything in www and puts it all in gzip
    """
    local('python gzip_assets.py %s %s' % (in_path, out_path))

@task
def update():
    """
    Update all application data not in repository (copy, assets, etc).
    """
    text.update()
    assets.sync()
    data.update()

def _post_to_tumblr():
    """
    Push the currently active post as a draft to the site

    TODO: Tweet in the post body
    """

    secrets = app_config.get_secrets()
    client = pytumblr.TumblrRestClient(
        secrets.get('TUMBLR_CONSUMER_KEY'),
        secrets.get('TUMBLR_CONSUMER_SECRET'),
        secrets.get('TUMBLR_TOKEN'),
        secrets.get('TUMBLR_TOKEN_SECRET')
    )

    # if the post has a no ID, create the new post.
    if env.post_config.ID == '$NEW_POST_ID':
        params = {
            'state': 'draft',
            'format' : 'html',
            'source' : env.post_config.PROMO_PHOTO,
            'caption' : env.post_config.CAPTION,
            'slug' : env.post
        }

        if env.post_config.TAGS:
            params['tags'] = env.post_config.TAGS

        response = client.create_photo(
            app_config.TUMBLR_NAME,
            **params
        )

        if 'id' not in response:
            print 'Error creating new tumblr post'
            print response
            return

        post_config_path = '%s/post_config.py' % env.static_path
        local('sed -i "" \'s|%s|%s|g\' %s' % ('$NEW_POST_ID', response['id'], post_config_path))

    # if the post already exists and has an ID,
    # update the existing post on Tumblr.
    else:
        params = {
            'id' : env.post_config.ID,
            'state': 'draft',
            'type' :'photo',
            'format' : 'html',
            'source' : env.post_config.PROMO_PHOTO,
            'caption' : env.post_config.CAPTION,
            'slug' : env.post
        }

        if env.post_config.TAGS:
            params['tags'] = env.post_config.TAGS

        response = client.edit_post(
            app_config.TUMBLR_NAME,
            **params
        )

        if 'id' not in response:
            print 'Error editing tumblr post'
            print response
            return

@task
def publish():
    """
    Publish the currently active post
    """
    post_path = '%s/%s/' % (app_config.POST_PATH, env.post)
    post_config = imp.load_source('post_config', '%s/post_config.py' % post_path)

    secrets = app_config.get_secrets()
    client = pytumblr.TumblrRestClient(
        secrets.get('TUMBLR_CONSUMER_KEY'),
        secrets.get('TUMBLR_CONSUMER_SECRET'),
        secrets.get('TUMBLR_TOKEN'),
        secrets.get('TUMBLR_TOKEN_SECRET')
    )

    client.edit_post(
        'tylertesting',
        id=post_config.ID,
        state='published'
    )

@task
def deploy(slug=''):
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    require('settings', provided_by=[production, staging])
    require('post', provided_by=[post])

    slug = env.post
    if not slug:
        utils.confirm('You are about about to deploy ALL posts. Are you sure you want to do this? (Deploy a single post with "deploy:SLUG".)')

    update()
    render.render_all()
    _gzip('www', '.gzip')
    _gzip('%s/www/' % (env.static_path), '.gzip/posts/%s' % slug)
    _post_to_tumblr()
    _deploy_to_s3('.gzip/posts/%s' % slug)

"""
App-specific commands
"""

@task
def post(slug):
    env.post = slug
    env.static_path = '%s/%s' % (app_config.POST_PATH, env.post)

    if os.path.exists ('%s/post_config.py' % env.static_path):
        env.post_config = imp.load_source('post_config', '%s/post_config.py' % env.static_path)
        env.copytext_key = env.post_config.COPY_GOOGLE_DOC_KEY
    else:
        env.post_config = None
        env.copytext_key = None

    env.copytext_file_name = slug

@task
def new():
    require('post', provided_by=[post])
    local('cp -r new_post %s' % env.static_path)
    post(env.post)
    text.update()

@task
def tumblr():
    env.static_path = 'tumblr'
    env.copytext_key = app_config.COPY_GOOGLE_DOC_KEY
    env.copytext_file_name = 'data/theme.xlsx'

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

        if app_config.DEPLOY_TO_SERVERS:
            servers.delete_project()

            if app_config.DEPLOY_CRONTAB:
                servers.uninstall_crontab()

            if app_config.DEPLOY_SERVICES:
                servers.nuke_confs()

