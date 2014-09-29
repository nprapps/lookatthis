#!/usr/bin/env python
# -*- coding: utf8 -*-

"""
TO RUN:

* pip install pillow
* fab post:colors update
* ./generate_quote_images.py
"""

from collections import namedtuple
import os
import re
import textwrap
import HTMLParser

from PIL import Image, ImageDraw, ImageFont

import copytext

Margin = namedtuple('Margin', ['top', 'right', 'bottom', 'left'])

OUT_DIR = 'www/share-images'

CANVAS_WIDTH = 640
CANVAS_HEIGHT = 640
BODY_MARGIN = Margin(top=200, right=40, bottom=200, left=200)
TEXT_MAX_WIDTH = CANVAS_WIDTH - (BODY_MARGIN[1] + BODY_MARGIN[3])

SIZE_MIN = 16
SIZE_MAX = 64
SIZE_DELTA = 4

LINE_MIN = 16
LINE_MAX = 50
LINE_DELTA = 2 

BACKGROUND = Image.open('www/assets/spectrum.jpg')\
    .resize((CANVAS_WIDTH, CANVAS_HEIGHT), Image.ANTIALIAS)

LOGO = Image.open('www/assets/npr-logo.png')\
    .resize((75, 26), Image.ANTIALIAS)

fonts = {}
fonts['normal'] = {}
fonts['bold'] = {}

def strip_tags(text):
    return re.sub('<[^<]+?>', '', text)

def compute_size(lines, fontsize):
    font = fonts['bold'][fontsize]
    width = 0
    height = 0

    for line in lines:
        x, y = font.getsize(line)

        width = max((width, x))
        height += y
    
    return width, height

def optimize_text(text, max_height):
    permutations = {}
    
    for size in fonts['bold'].keys():
        for wrap_count in xrange(LINE_MIN, LINE_MAX + 1, LINE_DELTA):
            lines = textwrap.wrap(text, wrap_count)

            width, height = compute_size(lines, size)
            height += height / len(lines) * 3

            # Throw away any that exceed canvas space
            if width > TEXT_MAX_WIDTH:
                continue

            if height > max_height:
                continue

            permutations[(size, wrap_count)] = (width, height)

    optimal = (0, 0)

    # Find the largest font size that's in the butter zone
    for k, v in permutations.items():
        size, wrap_count = k
        width, height = v

        if size > optimal[0]:
            optimal = k
        elif size == optimal[0] and wrap_count > optimal[1]:
            optimal = k

    return optimal

def render(slug, icon_filename, title, body):
    img = Image.new('RGB', (640, 640), (17, 17, 17))
    draw = ImageDraw.Draw(img)

    parse = HTMLParser.HTMLParser()

    # Background
    img.paste(BACKGROUND, (0, 0))

    # Logo
    img.paste(LOGO, (40, 40), mask=LOGO)

    # Brand
    text = 'LOOK AT THIS'
    font = fonts['bold'][16]
    width = font.getsize(text)[0]

    draw.text((40, 80), text, font=font, fill=(255, 255, 255))
    draw.line([(40, 100), (width + 40, 100)], width=2, fill='#F60062')

    # Icon
    if icon_filename != '' and os.path.exists('www/assets/%s' % icon_filename):
        icon = Image.open('www/assets/%s' % icon_filename)
        icon = icon.resize((60, 60), Image.ANTIALIAS)

        img.paste(icon, (BODY_MARGIN.left - 80, BODY_MARGIN.top - 40), mask=icon)

    # Title
    text = parse.unescape(title.upper())
    font = fonts['bold'][24]
    width = font.getsize(text)[0]

    draw.text((BODY_MARGIN.left, BODY_MARGIN.top - 40), text, font=font, fill=(255, 255, 255))
    draw.line([(BODY_MARGIN.left, BODY_MARGIN.top - 16), (BODY_MARGIN.left + width, BODY_MARGIN.top - 16)], width=4, fill=(255, 255, 255))

    # Body
    text = parse.unescape(strip_tags(body))

    max_height = CANVAS_HEIGHT - (BODY_MARGIN.top + BODY_MARGIN.bottom) 
    size, wrap_count = optimize_text(text, max_height)
    lines = textwrap.wrap(text, wrap_count)

    y = BODY_MARGIN.top

    for i, line in enumerate(lines):

        draw.text((BODY_MARGIN.left, y), line, font=fonts['normal'][size], fill=(255, 255, 255))

        y += size * 1.15

    y += 40

    img.save('%s/%s.png' % (OUT_DIR, slug), 'PNG')

def main():
    for size in xrange(SIZE_MIN, SIZE_MAX + 1, SIZE_DELTA):
        fonts['normal'][size] =  ImageFont.truetype('www/assets/helveticaneuelt-roman.ttf', size)
        fonts['bold'][size] =  ImageFont.truetype('www/assets/helveticaneuelt-bd.ttf', size)

    slides = copytext.Copy('../../data/colors.xlsx')['content']

    if not os.path.exists(OUT_DIR):
        os.mkdir(OUT_DIR)

    for slide in slides:
        if slide['fact_icon']:
            print slide['slug']
            render(slide['slug'], slide['fact_icon'], slide['text2'], slide['text1'])

if __name__ == '__main__':
    main()
