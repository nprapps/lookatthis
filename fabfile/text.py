#!/usr/bin/env python

"""
Commands related to syncing copytext from Google Docs.
"""
from fabric.api import task
from fabric.state import env

from etc.gdocs import GoogleDoc

@task(default=True)
def update():
    """
    Downloads a Google Doc as an Excel file.
    """

    doc = {
        'key': env.copytext_key,
        'file_name': env.copytext_slug
    }

    g = GoogleDoc(**doc)
    g.get_auth()
    g.get_document()
