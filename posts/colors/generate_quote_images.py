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
BODY_MARGIN = Margin(top=200, right=40, bottom=75, left=150)
TEXT_MAX_WIDTH = CANVAS_WIDTH - (BODY_MARGIN.left + BODY_MARGIN.right)

SIZE_MIN = 12
SIZE_MAX = 24 
SIZE_DELTA = 2 

LINE_MIN = 16 
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
    text = text.replace('<p>', '')
    text = text.replace('</p>', '')
    text = text.replace('<i>', '')
    text = text.replace('</i>', '')
    text = text.replace('<em>', '')
    text = text.replace('</em>', '')
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
    
    for size in range(16, 24, 2):
        for wrap_count in xrange(LINE_MIN, LINE_MAX + 1, LINE_DELTA):
            lines = textwrap.wrap(text, wrap_count, replace_whitespace=False, drop_whitespace=False)

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

        img.paste(icon, (40, BODY_MARGIN.top - 50), mask=icon)

    # Title
    text = title.upper()
    font = fonts['bold'][24]
    width = font.getsize(text)[0]

    draw.text((BODY_MARGIN.left, BODY_MARGIN.top - 50), text, font=font, fill=(255, 255, 255))
    draw.line([(BODY_MARGIN.left, BODY_MARGIN.top - 24), (BODY_MARGIN.left + width, BODY_MARGIN.top - 24)], width=4, fill=(255, 255, 255))

    # Body
    text = strip_tags(unicode(body))
    text = text.replace('\n\n', 'SPLITHERE')

    max_height = CANVAS_HEIGHT - (BODY_MARGIN.top + BODY_MARGIN.bottom) 
    size, wrap_count = optimize_text(text, max_height)
    lines = textwrap.wrap(text, wrap_count)

    out_lines = []

    for line in lines:
        if 'SPLITHERE' in line:
            parts = line.split('SPLITHERE')
            out_lines.extend([parts[0], '', parts[1]])
        else:
            out_lines.append(line)

    y = BODY_MARGIN.top

    for i, line in enumerate(out_lines):
        draw.text((BODY_MARGIN.left, y), line, font=fonts['normal'][size], fill=(255, 255, 255))

        y += size * 1.25

    # Source
    if source:
        text = 'Source: %s' % source
        font = fonts['bold'][12]
        width = font.getsize(text)[0]
        draw.text((CANVAS_WIDTH - (15 + width), 585), text, font=font, fill=(255, 255, 255))

    # Footer
    img.paste(FOOTER, (0, CANVAS_HEIGHT - 35))

    text = 'http://n.pr/colors'
    font = fonts['bold'][16]
    width = font.getsize(text)[0]
    draw.text((CANVAS_WIDTH - (15 + width), 618), text, font=font, fill=(255, 255, 255))

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
