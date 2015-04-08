#!/usr/bin/env python

"""
Commands related to syncing copytext from Google Docs.
"""
from fabric.api import task
from fabric.state import env

from oauth import get_document

@task(default=True)
def update():
    """
    Downloads a Google Doc as an Excel file.
    """
    get_document(env.copytext_key, 'data/%s.xlsx' % env.copytext_slug)

