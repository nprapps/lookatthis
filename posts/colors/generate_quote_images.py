#!/usr/bin/env python
# -*- coding: utf8 -*-

"""
TO RUN:

* pip install pillow
* fab post:colors update
* ./generate_quote_images.py
"""

from collections import namedtuple
from HTMLParser import HTMLParser
import os
import re
import textwrap

from PIL import Image, ImageDraw, ImageFont

import copytext

Margin = namedtuple('Margin', ['top', 'right', 'bottom', 'left'])

OUT_DIR = 'www/share-images'

CANVAS_WIDTH = 640
CANVAS_HEIGHT = 640
BODY_MARGIN = Margin(top=200, right=40, bottom=75, left=150)
TEXT_MAX_WIDTH = CANVAS_WIDTH - (BODY_MARGIN.left + BODY_MARGIN.right)

LINE_MIN = 16 
LINE_MAX = 50
LINE_DELTA = 2 

BACKGROUND = Image.open('www/assets/spectrum.jpg')\
    .resize((CANVAS_WIDTH, CANVAS_HEIGHT), Image.ANTIALIAS)

LOGO = Image.open('www/assets/look-logo.png')

FOOTER = Image.open('www/assets/color-band.png')

BODY_FONT_SIZE = 36
BODY_FONT = ImageFont.truetype('www/assets/helveticaneuelt-roman.ttf', BODY_FONT_SIZE)
TITLE_FONT_SIZE = 24
TITLE_FONT = ImageFont.truetype('www/assets/helveticaneuelt-bd.ttf', TITLE_FONT_SIZE)
LOGO_FONT_SIZE = 20
LOGO_FONT = ImageFont.truetype('www/assets/helveticaneuelt-bd.ttf', LOGO_FONT_SIZE)
SOURCE_FONT_SIZE = 12
SOURCE_FONT = ImageFont.truetype('www/assets/helveticaneuelt-bd.ttf', SOURCE_FONT_SIZE)
FOOTER_FONT_SIZE = 16
FOOTER_FONT = ImageFont.truetype('www/assets/helveticaneuelt-bd.ttf', FOOTER_FONT_SIZE)

ICONS = {}

fonts = {}
fonts['normal'] = {}
fonts['bold'] = {}

class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)
    
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(text):
    s = MLStripper()
    s.feed(text)
    text = s.get_data()

    text = text.replace('--', u'—')

    # Smart double quotes
    text = re.sub(r'([a-zA-Z0-9.,?!;:\'\"])"', u'”', text)
    text = text.replace('"', u'“')

    # Smart single quotes
    text = re.sub(r"([a-zA-Z0-9.,?!;:\"\'])'", u'’', text)
    text = text.replace("'", u'‘')

    return text 

def compute_size(lines):
    width = 0
    height = 0

    for line in lines:
        x, y = BODY_FONT.getsize(line)

        width = max((width, x))
        height += y
    
    return width, height

def optimize_text(text, max_height):
    permutations = {}
    
    for wrap_count in xrange(LINE_MIN, LINE_MAX + 1, LINE_DELTA):
        lines = textwrap.wrap(text, wrap_count)

        width, height = compute_size(lines)
        height += height / len(lines) * 3

        # Throw away any that exceed canvas space
        if width > TEXT_MAX_WIDTH:
            continue

        if height > max_height:
            continue

        permutations[wrap_count] = (width, height)

    optimal = 0

    # Find the largest font size that's in the butter zone
    for k, v in permutations.items():
        wrap_count = k
        width, height = v

        if wrap_count > optimal:
            optimal = k

    return optimal

def render(slug, icon_filename, title, body):
    img = Image.new('RGB', (640, 640), (17, 17, 17))
    draw = ImageDraw.Draw(img)

    # Background
    img.paste(BACKGROUND, (0, 0))

    # Logo
    img.paste(LOGO, (40, 40), mask=LOGO)
    draw.text((40, 100), '#colorfacts', font=LOGO_FONT, fill=(255, 255, 255))

    # Icon
    if icon_filename != '':
        if icon_filename not in ICONS:
            icon = Image.open('www/assets/%s' % icon_filename)
            width = 70
            height = int((float(icon.size[1]) / icon.size[0]) * width)

            ICONS[icon_filename] = icon.resize((width, height), Image.ANTIALIAS)

        icon = ICONS[icon_filename]

        try:
            img.paste(icon, (40, BODY_MARGIN.top - 50), mask=icon)
        except ValueError:
            print icon_filename

    # Title
    text = title.upper()
    width = TITLE_FONT.getsize(text)[0]

    draw.text((BODY_MARGIN.left, BODY_MARGIN.top - 50), text, font=TITLE_FONT, fill=(255, 255, 255))
    draw.line([(BODY_MARGIN.left, BODY_MARGIN.top - 24), (BODY_MARGIN.left + width, BODY_MARGIN.top - 24)], width=4, fill=(255, 255, 255))

    # Body
    text = strip_tags(unicode(body))

    max_height = CANVAS_HEIGHT - (BODY_MARGIN.top + BODY_MARGIN.bottom) 
    wrap_count = optimize_text(text, max_height)
    lines = textwrap.wrap(text, wrap_count)

    y = BODY_MARGIN.top

    for i, line in enumerate(lines):
        draw.text((BODY_MARGIN.left, y), line, font=BODY_FONT, fill=(255, 255, 255))

        y += BODY_FONT_SIZE * 1.25

    # Footer
    img.paste(FOOTER, (0, CANVAS_HEIGHT - 35))

    text = 'http://n.pr/colors'
    width = FOOTER_FONT.getsize(text)[0]
    draw.text((CANVAS_WIDTH - (15 + width), 618), text, font=FOOTER_FONT, fill=(255, 255, 255))

    img.save('%s/%s.png' % (OUT_DIR, slug), 'PNG')

def main():
    slides = copytext.Copy('../../data/colors.xlsx')['content']

    if not os.path.exists(OUT_DIR):
        os.mkdir(OUT_DIR)

    for slide in slides:
        if slide['share_text']:
            print slide['slug']
            render(slide['slug'], slide['fact_icon'], slide['text2'], slide['share_text'])

if __name__ == '__main__':
    main()
