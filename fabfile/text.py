#!/usr/bin/env python

"""
Commands related to syncing copytext from Google Docs.
"""
import imp

from fabric.api import require, task
from fabric.state import env

import app_config
from etc.gdocs import GoogleDoc

@task(default=True)
def update():
    """
    Downloads a Google Doc as an Excel file.
    """
    doc = {}
    doc['key'] = env.copytext_key
    doc['file_name'] = env.copytext_file_name

    g = GoogleDoc(**doc)
    g.get_auth()
    g.get_document()