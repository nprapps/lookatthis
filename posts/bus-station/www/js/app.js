// Global state
var $upNext = null;
var $document;
var $body;
var $section;
var $slides;
var $arrows;
var $nextArrow;
var $previousArrow;
var $startCardButton;
var isTouch = Modernizr.touch;

var mobileSuffix;
var w;
var h;
var startTouch;
var lastSlideExitEvent;
var firstSlideExit;

var completion = 0;
var swipeTolerance = 40;
var touchFactor = 1;

var resize = function() {
    /*
     * Resize the content
     */
    w = $(window).width();
    h = $(window).height();
    $section.height(h);
    $slides.width(w);
};

var onPageLoad = function() {
    /*
    * Set up page on load.
    */
    lazyLoad(0);
    $section.css({
        'opacity': 1,
        'visibility': 'visible',
    });
    $slides.show();
    showNavigation(0);
};

var trackCompletion = function(index) {
    /*
    * Track completion based on slide index.
    */
    how_far = (index + 1) / ($slides.length - APP_CONFIG.NUM_SLIDES_AFTER_CONTENT);

    if (how_far >= completion + 0.25) {
        completion = how_far - (how_far % 0.25);

        if (completion === 0.25) {
            ANALYTICS.completeTwentyFivePercent();
        }
        else if (completion === 0.5) {
            ANALYTICS.completeFiftyPercent();
        }
        else if (completion === 0.75) {
            ANALYTICS.completeSeventyFivePercent();
        }
        else if (completion === 1) {
            ANALYTICS.completeOneHundredPercent();
        }
    }
}

var lazyLoad = function(slideIndex) {
    /*
    * Lazy-load images in current and future slides.
    */
    var slides = [
        $slides.eq(slideIndex),
        $slides.eq(slideIndex + 1),
        $slides.eq(slideIndex + 2)
    ];

    // Mobile suffix should be blank by default.
    mobileSuffix = '';
/*
    if (w < 769) {
        mobileSuffix = '-sq';
    }
*/
    for (var i = 0; i < slides.length; i++) {
        loadImages(slides[i]);
    };

}

var loadImages = function($slide) {
    /*
    * Sets the background image on a div for our fancy slides.
    */
    if ($slide.data('bgimage')) {
        var image_filename = $slide.data('bgimage').split('.')[0];
        var image_extension = '.' + $slide.data('bgimage').split('.')[1];
        var image_path = 'assets/' + image_filename + mobileSuffix + image_extension;

        if ($slide.css('background-image') === 'none') {
            $slide.css('background-image', 'url(' + image_path + ')');
        }
    }

    var $images = $slide.find('img.lazy-load');
    if ($images.length > 0) {
        for (var i = 0; i < $images.length; i++) {
            var image = $images.eq(i).data('src');
            $images.eq(i).attr('src', 'assets/' + image);
        }
    }
};

var showNavigation = function(index) {
    /*
    * Hide and show arrows based on slide index
    */
    if (index === 0) {
        $arrows.hide();
        $previousArrow.css('left', 0);
        $nextArrow.css('right', 0);
    } else if ($slides.last().index() === index) {
        $arrows.show();
        $nextArrow.hide().css('right', 0);
    } else {
        $arrows.show();
    }

    if (isTouch) {
        resetArrows();
    }
}

var onSlideChange = function(e, fromIndex, toIndex) {
    /*
    * Called transitioning between slides.
    */
    lazyLoad(toIndex);
    showNavigation(toIndex);
    trackCompletion(toIndex);
    document.activeElement.blur();

    /*
    * Enable fades without totally screwing up the slides around them
    */

    setTimeout(function() {
        if ($slides.eq(toIndex + 1).hasClass('fade')) {
            $slides.eq(toIndex).addClass('fade');
        }
    }, 50);

    if (firstSlideExit) {
        ANALYTICS.exitSlide(fromIndex.toString());
    }
    if (lastSlideExitEvent) {
        ANALYTICS.trackEvent(lastSlideExitEvent, fromIndex.toString());
    }

    firstSlideExit = true;
}

var onStartCardButtonClick = function() {
    /*
    * Called when clicking the "go" button.
    */
    lastSlideExitEvent = 'exit-start-card-button-click';
    $.deck('next');
}

var onDocumentKeyDown = function(e) {
    /*
    * Called when key is pressed
    */
    var keyOptions = $.deck('getOptions').keys;
    var keys = keyOptions.next.concat(keyOptions.previous);
    if (keys.indexOf(e.which) > -1) {
        lastSlideExitEvent = 'exit-keyboard';
        ANALYTICS.useKeyboardNavigation();
    }
    return true;
}

var onSlideClick = function(e) {
    /*
    * Advance on slide tap on touch devices
    */
    if (isTouch && !$(e.target).is('button')) {
        lastSlideExitEvent = 'exit-tap';
        $.deck('next');
    }
}

var onNextPostClick = function(e) {
    /*
     * Click next post
     */
    e.preventDefault();
    ANALYTICS.trackEvent('next-post');
    window.top.location = NEXT_POST_URL;
    return true;
}

var fakeMobileHover = function() {
    /*
     * Fake hover when tapping buttons
     */
    $(this).css({
        'background-color': '#fff',
        'color': '#000',
        'opacity': .9
    });
}

var rmFakeMobileHover = function() {
    /*
     * Remove fake hover when tapping buttons
     */
    $(this).css({
        'background-color': 'rgba(0, 0, 0, 0.2)',
        'color': '#fff',
        'opacity': .3
    });
}

var onNextArrowClick = function() {
    /*
     * Next arrow click
     */
    lastSlideExitEvent = 'exit-next-button-click';
    $.deck('next');
}

var onPreviousArrowClick = function() {
    /*
     * Previous arrow click
     */
    lastSlideExitEvent = 'exit-previous-button-click';
    $.deck('prev');
}


var onClippyCopy = function(e) {
    /*
     * Text copied to clipboard.
     */
    alert('Copied to your clipboard!');
    ANALYTICS.copySummary();
}

var onTouchStart = function(e) {
    /*
     * Capture start position when swipe initiated
     */
    if (!startTouch) {
        startTouch = $.extend({}, e.originalEvent.targetTouches[0]);
    }
}

var onTouchMove = function(e) {
    /*
     * Track finger swipe
     */


    $.each(e.originalEvent.changedTouches, function(i, touch) {
        if (!startTouch || touch.identifier !== startTouch.identifier) {
            return true;
        }


        var yDistance = touch.screenY - startTouch.screenY;
        var xDistance = touch.screenX - startTouch.screenX;
        var direction = (xDistance > 0) ? 'right' : 'left';

        if (Math.abs(yDistance) < Math.abs(xDistance)) {
            e.preventDefault();
        }

        if (direction == 'right' && xDistance > swipeTolerance) {
            lastSlideExitEvent = 'exit-swipe-right';
        } else if (direction == 'right' && xDistance < swipeTolerance) {
            $previousArrow.filter(':visible').css({
                'left': (xDistance * touchFactor) + 'px'
            });
        }

        if (direction == 'left' && Math.abs(xDistance) > swipeTolerance) {
            lastSlideExitEvent = 'exit-swipe-left';
        } else if (direction == 'left' && Math.abs(xDistance) < swipeTolerance) {
            $nextArrow.filter(':visible').css({
                'right': (Math.abs(xDistance) * touchFactor) + 'px'
            });
        }
    });
}

var onTouchEnd = function(e) {
    /*
     * Clear swipe start position when swipe ends
     */
    $.each(e.originalEvent.changedTouches, function(i, touch) {
        if (startTouch && touch.identifier === startTouch.identifier) {
            startTouch = undefined;
        }
    });
}

var resetArrows = function() {
    /*
     * Reset arrows when advancing slides
     */
    $nextArrow.animate({
        'right': 0
    });
    $previousArrow.animate({
        'left': 0
    });
}

$(document).ready(function() {
    $document = $(document);
    $body = $('body');
    $section = $('.section');
    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');
    $previousArrow = $arrows.filter('.prev');
    $nextArrow = $arrows.filter('.next');
    $upNext = $('.up-next');

    $startCardButton.on('click', onStartCardButtonClick);
    $slides.on('click', onSlideClick);

    $upNext.on('click', onNextPostClick);
    $document.on('deck.change', onSlideChange);

    $previousArrow.on('click', onPreviousArrowClick);
    $nextArrow.on('click', onNextArrowClick);


    if (isTouch) {
        $arrows.on('touchstart', fakeMobileHover);
        $arrows.on('touchend', rmFakeMobileHover);
        $body.on('touchstart', onTouchStart);
        $body.on('touchmove', onTouchMove);
        $body.on('touchend', onTouchEnd);
    }

    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));
    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    // Turn off Modernizr history when deploying
    if (APP_CONFIG.DEPLOYMENT_TARGET) {
        Modernizr.history = null;
    }

    $.deck($slides, {
        touch: { swipeTolerance: swipeTolerance }
    });

    onPageLoad();
    resize();

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
    $document.keydown(onDocumentKeyDown);
});
