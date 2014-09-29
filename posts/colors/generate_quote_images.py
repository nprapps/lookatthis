#!/usr/bin/env python
# -*- coding: utf8 -*-

"""
TO RUN:

* pip install pillow
* fab post:colors update
* ./generate_quote_images.py
"""

import os
import textwrap
import HTMLParser

from PIL import Image, ImageDraw, ImageFont

import copytext

OUT_DIR = 'www/share-images'

CANVAS_WIDTH = 640
CANVAS_HEIGHT = 640
TEXT_MARGIN = (40, 40, 200, 40)
TEXT_MAX_WIDTH = CANVAS_WIDTH - (TEXT_MARGIN[1] + TEXT_MARGIN[3])

SIZE_MIN = 16
SIZE_MAX = 64
SIZE_DELTA = 4

LINE_MIN = 16
LINE_MAX = 50
LINE_DELTA = 2 

#LOGO = Image.open('www/assets/image-footer.png')

fonts = {}
fonts['book'] = {}
fonts['bold'] = {}
fonts['serif'] = {}

quote_width = {}

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

def render(slug, icon_filename, body):
    img = Image.new('RGB', (640, 640), (17, 17, 17))
    draw = ImageDraw.Draw(img)
    text_margin = TEXT_MARGIN

    parse = HTMLParser.HTMLParser()

    text = u'“%s”' % body 
    text = parse.unescape(text)

    if icon_filename != '' and os.path.exists('www/assets/%s' % icon_filename):
        text_margin = (230, 40, 200, 40)

        mask =  Image.open('www/assets/icon-mask.png')
        mask = mask.resize((150,150),1)

        mug = Image.open('www/assets/%s' % icon_filename)
        mug = mug.resize((150,150),1)
        mug_xy = (
            (CANVAS_WIDTH / 2) - mug.size[0] / 2,
            40
        )

        img.paste(mug, mug_xy, mask)

    max_height = CANVAS_WIDTH - (text_margin[0] + text_margin[2]) 
    size, wrap_count = optimize_text(text, max_height)
    #font = fonts['bold'][size]
    lines = textwrap.wrap(text, wrap_count)

    y = text_margin[0]

    for i, line in enumerate(lines):
        x = text_margin[1] - quote_width[size]

        if i > 0:
            x += quote_width[size]

        draw.text((x, y), line, font=fonts['bold'][size], fill=(255, 255, 255))

        y += size * 1.15

    y += 40

    logo="""logo_xy = (
        0,
        CANVAS_HEIGHT - LOGO.size[1]
    )

    img.paste(LOGO, logo_xy)"""

    img.save('%s/%s.png' % (OUT_DIR, slug), 'PNG')

def main():
    for size in xrange(SIZE_MIN, SIZE_MAX + 1, SIZE_DELTA):
        fonts['book'][size] =  ImageFont.truetype('/Library/Fonts/Arial.ttf', size)
        fonts['bold'][size] =  ImageFont.truetype('/Library/Fonts/Arial Bold.ttf', size)
        fonts['serif'][size] =  ImageFont.truetype('/Library/Fonts/Arial Italic.ttf', size)
        quote_width[size] = fonts['bold'][size].getsize(u'“')[0]

    slides = copytext.Copy('../../data/colors.xlsx')['content']

    if not os.path.exists(OUT_DIR):
        os.mkdir(OUT_DIR)

    for slide in slides:
        print slide['slug']

        if slide['fact_icon']:
            render(slide['slug'], slide['fact_icon'], slide['text1'])

if __name__ == '__main__':
    main()
