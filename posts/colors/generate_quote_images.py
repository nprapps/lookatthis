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
import textwrap

from PIL import Image, ImageDraw, ImageFont

import copytext

Margin = namedtuple('Margin', ['top', 'right', 'bottom', 'left'])

OUT_DIR = 'www/share-images'

CANVAS_WIDTH = 640
CANVAS_HEIGHT = 640
BODY_MARGIN = Margin(top=200, right=40, bottom=200, left=150)
TEXT_MAX_WIDTH = CANVAS_WIDTH - (BODY_MARGIN.left + BODY_MARGIN.right)

SIZE_MIN = 16 
SIZE_MAX = 64
SIZE_DELTA = 4

LINE_MIN = 20
LINE_MAX = 50
LINE_DELTA = 2 

BACKGROUND = Image.open('www/assets/spectrum.jpg')\
    .resize((CANVAS_WIDTH, CANVAS_HEIGHT), Image.ANTIALIAS)

LOGO = Image.open('www/assets/look-logo.png')

FOOTER = Image.open('www/assets/color-band.png')

ICONS = {}

fonts = {}
fonts['normal'] = {}
fonts['bold'] = {}

def strip_tags(text):
    text = text.replace(u'<p>', u'')
    text = text.replace('</p>', '\n\n')
    text = text.replace('&#34;', '"')
    text = text.replace('&quot;', '"')
    text = text.replace('&mdash;', u'—')

    text = text.replace('--', u'—')

    return text

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

def render(slug, icon_filename, title, body, source):
    img = Image.new('RGB', (640, 640), (17, 17, 17))
    draw = ImageDraw.Draw(img)

    # Background
    img.paste(BACKGROUND, (0, 0))

    # Logo
    img.paste(LOGO, (40, 40), mask=LOGO)

    font = fonts['bold'][20]
    draw.text((40, 100), '#colorfacts', font=font, fill=(255, 255, 255))

    # Icon
    if icon_filename != '':
        if icon_filename not in ICONS:
            icon = Image.open('www/assets/%s' % icon_filename)
            width = 70
            height = int((float(icon.size[1]) / icon.size[0]) * width)

            ICONS[icon_filename] = icon.resize((width, height), Image.ANTIALIAS)

        icon = ICONS[icon_filename]

        img.paste(icon, (40, BODY_MARGIN.top - 40), mask=icon)

    # Title
    text = title.upper()
    font = fonts['bold'][24]
    width = font.getsize(text)[0]

    draw.text((BODY_MARGIN.left, BODY_MARGIN.top - 40), text, font=font, fill=(255, 255, 255))
    draw.line([(BODY_MARGIN.left, BODY_MARGIN.top - 16), (BODY_MARGIN.left + width, BODY_MARGIN.top - 16)], width=4, fill=(255, 255, 255))

    # Body
    text = strip_tags(unicode(body))

    max_height = CANVAS_HEIGHT - (BODY_MARGIN.top + BODY_MARGIN.bottom) 
    size, wrap_count = optimize_text(text, max_height)
    lines = textwrap.wrap(text, wrap_count)

    y = BODY_MARGIN.top

    for i, line in enumerate(lines):

        draw.text((BODY_MARGIN.left, y), line, font=fonts['normal'][size], fill=(255, 255, 255))

        y += size * 1.15

    # Footer
    img.paste(FOOTER, (0, CANVAS_HEIGHT - 35))

    font = fonts['bold'][16]
    draw.text((490, 618), 'http://n.pr/colors', font=font, fill=(255, 255, 255))

    img.save('%s/%s.png' % (OUT_DIR, slug), 'PNG')

def main():
    for size in xrange(SIZE_MIN, SIZE_MAX + 1, SIZE_DELTA):
        fonts['normal'][size] =  ImageFont.truetype('www/assets/helveticaneuelt-roman.ttf', size)
        fonts['bold'][size] =  ImageFont.truetype('www/assets/helveticaneuelt-bd.ttf', size)

    slides = copytext.Copy('../../data/colors.xlsx')['content']

    if not os.path.exists(OUT_DIR):
        os.mkdir(OUT_DIR)

    for slide in slides:
        if slide['template'] == 'fact':
            print slide['slug']
            render(slide['slug'], slide['fact_icon'], slide['text2'], slide['text1'], slide['text3'])

if __name__ == '__main__':
    main()
