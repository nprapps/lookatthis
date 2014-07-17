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
Tumblr posts

Functions for creating, updating and deleting posts on Tumblr.
"""

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

    # see if we have an id already for this deployment target
    id_target = env.post_config.TARGET_IDS[env.settings]

    # if we already have a published post, we want to render a link to it
    if env.post_config.IS_PUBLISHED[env.settings]:
        pass_link = True
    else:
        pass_link = False

    COPY = copytext.Copy(filename='data/%s.xlsx' % env.slug)

    # render the caption
    caption = _render_caption(COPY, pass_link)

    # find the photo for the dashboard
    tumblr_photo = unicode(COPY['tumblr']['tumblr_dashboard_photo'])
    tumblr_photo_path = '%s/www/assets/%s' % (env.static_path, tumblr_photo)

    # if the post has a no ID, create the new post.
    if not id_target:
        params = {
            'state': 'draft',
            'format' : 'html',
            'data' : str(tumblr_photo_path),
            'caption' : caption,
            'slug' : env.slug
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

        # Take the id tumblr returns and write it to the post config.
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
            'slug' : env.slug
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

        # Take the id tumblr returns and write it to the post config.
        post_config_path = '%s/post_config.py' % env.static_path

        find = "'%s': '%s'," % (env.settings, id_target)
        replace = "'%s': '%s'," % (env.settings, response['id'])

        utils.replace_in_file(
            post_config_path,
            find,
            replace
        )

    # if the post is published,
    if env.post_config.IS_PUBLISHED[env.settings]:
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

    COPY = copytext.Copy(filename='data/%s.xlsx' % env.slug)

    caption = _render_caption(COPY, pass_link=True)

    id_target = env.post_config.TARGET_IDS[env.settings]

    params = {
        'id': id_target,
        'type': 'photo',
        'state': 'published',
        'slug': env.slug,
        'caption': caption
    }

    response = client.edit_post(
        app_config.TUMBLR_NAME,
        **params
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

    _delete_promo_photo(id_target)

    client.delete_post(
        app_config.TUMBLR_NAME,
        id_target
    )

def _deploy_promo_photo(id):
    """
    Rename the promo photo to the post ID and deploy it
    """

    COPY = copytext.Copy(filename='data/%s.xlsx' % env.slug)

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

    local('fab tumblr assets.sync')

def _delete_promo_photo(id):
    if id:
        local('fab tumblr assets.rm:homepage/%s.jpg' % id)
    else:
        return

def _render_caption(COPY, pass_link):
    # get the copytext spreadsheet so we can parse some tumblr variables

    title = unicode(COPY['tumblr']['title'])
    subtitle = unicode(COPY['tumblr']['subtitle'])
    description = unicode(COPY['tumblr']['description'])
    if pass_link:
        link = '%s/%s' % (app_config.S3_BASE_URL, env.static_path)
    else:
        link = ''

    # read the caption template and write the caption based on variables in the copytext spreadsheet
    with open('%s/templates/caption.html' % env.static_path) as f:
        template = Template(f.read())

    rendered = template.render(
        title=title,
        subtitle=subtitle,
        description=description,
        link=link
    )

    return rendered


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
def deploy(slug=''):
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    require('settings', provided_by=[development, staging, production])
    require('slug', provided_by=[post])

    update()
    render.render_all()
    utils._gzip('%s/www/' % (env.static_path), '.gzip/posts/%s' % env.slug)
    utils._deploy_to_s3('.gzip/posts/%s' % env.slug)
    post_to_tumblr()

"""
App-specific commands
"""

@task
def post(slug):
    env.slug = utils._find_slugs(slug)

    if not env.slug:
        utils.confirm('This post does not exist. Do you want to create a new post called %s?' % slug)
        _new(slug)
        return

    env.static_path = '%s/%s' % (app_config.POST_PATH, env.slug)

    if os.path.exists ('%s/post_config.py' % env.static_path):
        env.post_config = imp.load_source('post_config', '%s/post_config.py' % env.static_path)
        env.copytext_key = env.post_config.COPY_GOOGLE_DOC_KEY
    else:
        env.post_config = None
        env.copytext_key = None

    env.copytext_slug = env.slug

def _new(slug):

    local('cp -r new_post %s/%s' % (app_config.POST_PATH, slug))
    post(slug)
    text.update()


@task
def rename(new_slug, check_exists=True):
    require('slug', provided_by=[post])

    new_path = '%s/%s' % (app_config.POST_PATH, new_slug)
    local('mv %s %s' % (env.static_path, new_path))
    local('mv data/%s.xlsx data/%s.xlsx' % (env.slug, new_slug))
    post(new_slug)

@task
def publish():
    require('slug', provided_by=[post])
    require('settings', provided_by=[development, staging, production])

    update()
    _publish_to_tumblr()
    render.render_all()
    utils._gzip('%s/www/' % (env.static_path), '.gzip/posts/%s' % env.slug)
    utils._deploy_to_s3('.gzip/posts/%s' % env.slug)

@task
def delete():
    require('slug', provided_by=[post])

    env.settings = 'development'
    _delete_tumblr_post()

    env.settings = 'staging'
    _delete_tumblr_post()

    env.settings = 'production'
    _delete_tumblr_post()

    local('fab post:%s assets.rm:"*"' % env.slug)

    local('rm -r %s' % env.static_path)
    local('rm data/%s.xlsx' % env.slug)

@task
def tumblr():
    env.static_path = 'tumblr'
    env.slug = 'tumblr'
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

