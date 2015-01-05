#!/usr/bin/env python

"""
Utilities used by multiple commands.
"""

from glob import glob
import re

from fabric.api import local, prompt
from fabric.state import env

import app_config


def confirm(message):
    """
    Verify a users intentions.
    """
    answer = prompt(message, default="Not at all")

    if answer.lower() not in ('y', 'yes', 'buzz off', 'screw you'):
        exit()

def _find_slugs(slug):
    posts = glob('%s/*' % app_config.POST_PATH)

    for folder in posts:
        folder_slug = folder.split('%s/' % app_config.POST_PATH)[1]

        if slug == folder_slug:
            return folder_slug

    return

def replace_in_file(filename, find, replace):
    with open(filename, 'r') as f:
        contents = f.read()

    contents = contents.replace(find, replace)

    with open(filename, 'w') as f:
        f.write(contents)
