// Global state
var $upNext = null;
var $w;
var $h;
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
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var completion = 0;
var startTouch;
var tolerance;
var currentSlide;
var firstRightArrowClicked = false;
var TOUCH_FACTOR = 0.5;

var resize = function() {
    $w = $(window).width();
    $h = $(window).height();

    $section.height($h);
    $slides.width($w);

    optimalWidth = ($h * aspectWidth) / aspectHeight;
    optimalHeight = ($w * aspectHeight) / aspectWidth;

    w = $w;
    h = optimalHeight;

    if (optimalWidth > $w) {
        w = optimalWidth;
        h = $h;
    }
};

var onPageLoad = function() {
    currentSlide = 0;
    lazyLoad(0);
    $('.section').css({
      'opacity': 1,
      'visibility': 'visible',
    });
    showNavigation(0);
};

var trackCompletion = function(index) {
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
    * Sets up a list of slides based on your position in the deck.
    * Lazy-loads images in future slides because of reasons.
    */
    var slides = [
        $slides.eq(slideIndex - 2),
        $slides.eq(slideIndex - 1),
        $slides.eq(slideIndex),
        $slides.eq(slideIndex + 1),
        $slides.eq(slideIndex + 2)
    ];

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if ($w < 769) {
        mobileSuffix = '-sq';
    }

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
    if (index === 0) {
        $arrows.hide();
    }
    else if ($slides.last().index === index) {
        $arrows.show();
        $nextArrow.hide();
    } else {
        $arrows.show();
    }
    resetArrows()
}

var onSlideChange = function(e, fromIndex, toIndex) {
    /*
    * Called when leaving a slide.
    */
    lazyLoad(toIndex);
    showNavigation(toIndex);
    trackCompletion(toIndex);
    currentSlide = toIndex;
    ANALYTICS.exitSlide(toIndex.toString());
}

var onStartCardButtonClick = function() {
    $.deck('next');
    ANALYTICS.trackEvent('start-card-button-click')
}

var onDocumentKeyDown = function(e) {
    if (e.which === 37 || e.which === 39) {
        ANALYTICS.useKeyboardNavigation();
    }
    return true;
}

var onSlideClick = function(e) {
    if (isTouch) {
        ANALYTICS.trackEvent('slide-tap', currentSlide)
        $.deck('next');
    }
    return true;
}

var onNextPostClick = function(e) {
    e.preventDefault();

    ANALYTICS.trackEvent('next-post');
    window.top.location = NEXT_POST_URL;
    return true;
}

var fakeMobileHover = function() {
    $(this).css({
        'background-color': '#fff',
        'color': '#000',
        'opacity': .9
    });
}

var rmFakeMobileHover = function() {
    $(this).css({
        'background-color': 'rgba(0, 0, 0, 0.2)',
        'color': '#fff',
        'opacity': .3
    });
}

var onNextArrowClick = function() {
    $.deck('next');
    ANALYTICS.trackEvent('next-click', currentSlide)
}

var onPreviousArrowClick = function() {
    $.deck('prev');
    ANALYTICS.trackEvent('previous-click', currentSlide)
}


/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');
    ANALYTICS.copySummary();
}

var onTouchStart = function(e) {
    if (!startTouch) {
        startTouch = $.extend({}, e.originalEvent.targetTouches[0]);
    }
}

var onTouchMove = function(e) {
    $.each(e.originalEvent.changedTouches, function(i, touch) {
        if (!startTouch || touch.identifier !== startTouch.identifier) {
            return true;
        }
        var xDistance = touch.screenX - startTouch.screenX;
        var direction = (xDistance > 0) ? 'right' : 'left';

        if (direction == 'right' && xDistance > tolerance) {
            ANALYTICS.trackEvent('swipe-right', currentSlide);
        }
        //else if (direction == 'right' && xDistance < tolerance) {
            //$previousArrow.css({
                //'left': (xDistance * TOUCH_FACTOR) + 'px'
            //});
        //}

        if (direction == 'left' && Math.abs(xDistance) > tolerance) {
            ANALYTICS.trackEvent('swipe-left', currentSlide);
        }
        //else if (direction == 'left' && Math.abs(xDistance) < tolerance) {
            //$nextArrow.css({
                //'right': (Math.abs(xDistance) * TOUCH_FACTOR) + 'px'
            //});
        //}
    });
}

var onTouchEnd = function(e) {
    $.each(e.originalEvent.changedTouches, function(i, touch) {
        if (startTouch && touch.identifier === startTouch.identifier) {
            startTouch = undefined;
        }
    });
}

var resetArrows = function() {
    $nextArrow.animate({
        'right': 0
    });
    $previousArrow.animate({
        'left': 0
    });
}


$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

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

    tolerance = 60;
    $.deck($slides, {
        touch: { swipeTolerance: tolerance }
    });
    onPageLoad();
    resize();

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
    $document.keydown(onDocumentKeyDown);
});
