#!/usr/bin/env python

import datetime
from glob import glob
import imp
import json
import os

import copytext
from fabric.api import local, require, settings, task
from fabric.state import env
from jinja2 import Template
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

# Bootstrap can only be run once, then it's disabled
if app_config.PROJECT_SLUG == '$NEW_PROJECT_SLUG':
    import bootstrap

env.folder_name = None

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

@task
def staging():
    """
    Run as though on staging.
    """
    env.settings = 'staging'
    app_config.configure_targets(env.settings)

@task
def development():
    """
    Run as though on development.
    """
    env.settings = 'development'
    app_config.configure_targets(env.settings)

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
    text.update()
    assets.sync()
    data.update()

@task
def post_to_tumblr():
    """
    Push the currently active post as a draft to the site

    TODO: Tweet in the post body
    """
    # authenticate
    secrets = app_config.get_secrets()
    client = pytumblr.TumblrRestClient(
        secrets.get('TUMBLR_CONSUMER_KEY'),
        secrets.get('TUMBLR_CONSUMER_SECRET'),
        secrets.get('TUMBLR_TOKEN'),
        secrets.get('TUMBLR_TOKEN_SECRET')
    )

    # get the copytext spreadsheet so we can parse some tumblr variables
    COPY = copytext.Copy(filename='data/%s.xlsx' % env.folder_name)

    title = unicode(COPY['tumblr']['title'])
    subtitle = unicode(COPY['tumblr']['subtitle'])
    description = unicode(COPY['tumblr']['description'])

    # read the caption template and write the caption based on variables in the copytext spreadsheet
    with open('%s/templates/caption.html' % env.static_path) as f:
        template = Template(f.read())
    caption = template.render(
        title=title,
        subtitle=subtitle,
        description=description
    )

    tumblr_photo = unicode(COPY['tumblr']['tumblr_dashboard_photo'])
    tumblr_photo_path = '%s/www/assets/%s' % (env.static_path, tumblr_photo)

    id_target = env.post_config.TARGET_IDS[env.settings]

    # if the post has a no ID, create the new post.
    if not id_target:
        params = {
            'state': 'draft',
            'format' : 'html',
            'data' : str(tumblr_photo_path),
            'caption' : caption,
            'slug' : env.folder_name
        }

        tags = unicode(COPY['tumblr']['tags']).split(',')

        if tags:
            params['tags'] = tags

        response = client.create_photo(
            app_config.TUMBLR_NAME,
            **params
        )

        if 'id' not in response:
            print 'Error creating new tumblr post'
            print response
            return

        post_config_path = '%s/post_config.py' % env.static_path

        find = "'%s': None," % env.settings
        replace = "'%s': '%s'," % (env.settings, response['id'])

        utils.replace_in_file(
            post_config_path,
            find,
            replace
        )

    # if the post already exists and has an ID,
    # update the existing post on Tumblr.
    else:
        params = {
            'id' : id_target,
            'type' :'photo',
            'format' : 'html',
            'data' : str(tumblr_photo_path),
            'caption' : caption,
            'slug' : env.folder_name
        }

        tags = unicode(COPY['tumblr']['tags']).split(',')

        if tags:
            params['tags'] = tags

        response = client.edit_post(
            app_config.TUMBLR_NAME,
            **params
        )

        if 'id' not in response:
            print 'Error editing tumblr post'
            print response
            return

        post_config_path = '%s/post_config.py' % env.static_path

        find = "'%s': '%s'," % (env.settings, id_target)
        replace = "'%s': '%s'," % (env.settings, response['id'])

        utils.replace_in_file(
            post_config_path,
            find,
            replace
        )

    _deploy_promo_photo(response['id'])

def _publish_to_tumblr():
    """
    Publish the currently active post
    """
    secrets = app_config.get_secrets()
    client = pytumblr.TumblrRestClient(
        secrets.get('TUMBLR_CONSUMER_KEY'),
        secrets.get('TUMBLR_CONSUMER_SECRET'),
        secrets.get('TUMBLR_TOKEN'),
        secrets.get('TUMBLR_TOKEN_SECRET')
    )

    now = datetime.datetime.now()

    id_target = env.post_config.TARGET_IDS[env.settings]

    response = client.edit_post(
        app_config.TUMBLR_NAME,
        id=id_target,
        state='published',
        slug=env.folder_name,
        date=now
    )

    if 'id' not in response:
        print 'Error publishing tumblr post'
        print response
        return

    post_config_path = '%s/post_config.py' % env.static_path

    find = "'%s': '%s'" % (env.settings, id_target)
    replace = "'%s': '%s'" % (env.settings, response['id'])

    utils.replace_in_file(
        post_config_path,
        find,
        replace
    )

    find = "'%s': False" % env.settings
    replace = "'%s': True" % env.settings

    utils.replace_in_file(
        post_config_path,
        find,
        replace
    )

    _deploy_promo_photo(response['id'])

def _delete_tumblr_post():
    """
    Delete a post on Tumblr
    """
    secrets = app_config.get_secrets()
    client = pytumblr.TumblrRestClient(
        secrets.get('TUMBLR_CONSUMER_KEY'),
        secrets.get('TUMBLR_CONSUMER_SECRET'),
        secrets.get('TUMBLR_TOKEN'),
        secrets.get('TUMBLR_TOKEN_SECRET')
    )

    app_config.configure_targets(env.get('settings', None))

    id_target = env.post_config.TARGET_IDS[env.settings]

    client.delete_post(
        app_config.TUMBLR_NAME,
        id_target
    )

def _deploy_promo_photo(id):
    """
    Rename the promo photo to the post ID and deploy it
    """

    COPY = copytext.Copy(filename='data/%s.xlsx' % env.folder_name)

    # Find the promo photo
    post_assets = '%s/www/assets' % env.static_path
    promo_photo = unicode(COPY['tumblr']['thumbnail_photo'])

    # Rename that file
    local('cp %s/%s tumblr/www/assets/homepage/%s.jpg' % (post_assets, promo_photo, id))

    sync_homepage_assets = 'aws s3 sync %s/ %s --acl "public-read" --cache-control "max-age=86400" --region "us-east-1"'

    for bucket in app_config.S3_BUCKETS:
        local(sync_homepage_assets % ('tumblr/www/assets/homepage', 's3://%s/%s/tumblr/assets/homepage' % (
                bucket,
                app_config.PROJECT_SLUG
            )
        ))
@task
def deploy(slug=''):
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    require('settings', provided_by=[development, staging, production])
    require('folder_name', provided_by=[post])

    update()
    render.render_all()
    utils._gzip('%s/www/' % (env.static_path), '.gzip/posts/%s' % env.folder_name)
    utils._deploy_to_s3('.gzip/posts/%s' % env.folder_name)
    post_to_tumblr()

"""
App-specific commands
"""

@task
def post(slug):
    env.folder_name = utils._get_folder_for_slug(slug)

    if not env.folder_name:
        utils.confirm('This post does not exist. Do you want to create a new post called %s?' % slug)
        _new(slug)
        return

    env.slug = slug
    env.static_path = '%s/%s' % (app_config.POST_PATH, env.folder_name)

    if os.path.exists ('%s/post_config.py' % env.static_path):
        env.post_config = imp.load_source('post_config', '%s/post_config.py' % env.static_path)
        env.copytext_key = env.post_config.COPY_GOOGLE_DOC_KEY
    else:
        env.post_config = None
        env.copytext_key = None

    env.copytext_slug = env.folder_name

def _new(slug):

    today = datetime.date.today()

    local('cp -r new_post %s/%s-%s' % (app_config.POST_PATH, today, slug))
    post(slug)
    text.update()


@task
def rename(slug, check_exists=True):
    require('folder_name', provided_by=[post])

    exists = utils._get_folder_for_slug(slug)

    if check_exists:
        if exists:
            print 'A post with this name already exists.'
            return

    today = datetime.date.today()
    timestamp_path = '%s-%s' % (today, slug)

    if exists == timestamp_path:
        return

    new_path = '%s/%s' % (app_config.POST_PATH, timestamp_path)
    local('mv %s %s' % (env.static_path, new_path))
    local('mv data/%s.xlsx data/%s.xlsx' % (env.folder_name, timestamp_path))
    post(slug)

@task
def publish():
    require('folder_name', provided_by=[post])
    require('settings', provided_by=[development, staging, production])

    # update the timestamp in slug
    rename(env.slug, False)

    update()
    render.render_all()
    utils._gzip('%s/www/' % (env.static_path), '.gzip/posts/%s' % env.folder_name)
    utils._deploy_to_s3('.gzip/posts/%s' % env.folder_name)
    _publish_to_tumblr()

    generate_index()


@task
def delete():
    require('folder_name', provided_by=[post])

    env.settings = 'development'
    _delete_tumblr_post()

    env.settings = 'staging'
    _delete_tumblr_post()

    env.settings = 'production'
    _delete_tumblr_post()

    local('fab post:%s assets.rm:"*"' % env.slug)

    local('rm -r %s' % env.static_path)
    local('rm data/%s.xlsx' % env.folder_name)


    generate_index()

@task
def generate_index():
    require('settings', provided_by=[development, staging, production])

    from app import _posts_index

    response = _posts_index()

    with open('.posts_index.json', 'w') as f:
        f.write(response)

    for bucket in app_config.S3_BUCKETS:
        local('aws s3 cp .posts_index.json s3://%s/%s/posts_index.json --acl "public-read" --cache-control "max-age=5" --region "us-east-1"' % (bucket, app_config.PROJECT_SLUG))

    local('rm .posts_index.json')

@task
def tumblr():
    require('settings', provided_by=[development, staging, production])

    env.static_path = 'tumblr'
    env.copytext_key = app_config.COPY_GOOGLE_DOC_KEY
    env.copytext_slug = 'theme'

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

