#!/usr/bin/env python

"""
Commands related to syncing copytext from Google Docs.
"""

from fabric.api import require, task
from fabric.state import env
import imp

import app_config
from etc.gdocs import GoogleDoc

@task(default=True)
def update():
    """
    Downloads a Google Doc as an Excel file.
    """
    post_path = '%s/%s' % (app_config.POST_PATH, env.post)
    post_config = imp.load_source('post_config', '%s/post_config.py' % post_path)

    doc = {}
    doc['key'] = post_config.COPY_GOOGLE_DOC_KEY
    doc['file_name'] = env.post

    g = GoogleDoc(**doc)
    g.get_auth()
    g.get_document()

