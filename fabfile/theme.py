#!/usr/bin/env python

"""
Commands that render and copy the theme
"""

from fabric.api import task, require
from render import less

@task(default=True)
def render():
    require('static_path', provided_by=['tumblr'])
    less()
