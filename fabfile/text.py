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
    g = GoogleDoc(key=env.copytext_key)
    g.get_auth()
    g.get_document()
