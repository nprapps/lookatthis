// jQuery vars
var $document;
var $body;
var $section;
var $slides;
var $arrows;
var $nextArrow;
var $previousArrow;
var $startCardButton;
var isTouch = Modernizr.touch;
var $modalClose
var $deepLinkNotice;
var $thisSlide;
var $startOver;

// constants
var aspectWidth = 16;
var aspectHeight = 9;
var mobileSuffix;
var w;
var h;
var startTouch;
var lastSlideExitEvent;

var ASSETS_PATH = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/' + APP_CONFIG.DEPLOY_SLUG + '/assets/' : 'http://assets.apps.npr.org.s3.amazonaws.com/lookatthis/' + APP_CONFIG.DEPLOY_SLUG + '/';
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);

var completion = 0;
var swipeTolerance = 40;
var touchFactor = 1;

// global objects
var swiper;
var slideTemplateTextLocation;
var templateList;

var onDocumentReady = function() {
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
    $modalClose = $('.close-modal');
    $deepLinkNotice = $('.deep-link-notice');
    $startOver = $('.start-over');

    $startCardButton.on('click', onStartCardButtonClick);
    $slides.on('click', onSlideClick);
    $modalClose.on('click', onModalCloseClick);
    $startOver.on('click', onStartOverClick);

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

    $.deck($slides, {
        touch: { swipeTolerance: swipeTolerance }
    });

    onPageLoad();
    onResize();

    slideTemplateTextLocation = {
        'slide': {
            'text1': '.slide-content'
        },
        'slide-bottom': {
            'text1': '.slide-content-bottom-item'
        },
        'graphic': {
            'text1': '.graphic-text'
        }
    }

    $(window).on("orientationchange", onResize);
    $(window).resize(onResize);
    $document.keydown(onDocumentKeyDown);
}

var onPageLoad = function() {
    GRAPHICS.loadGraphic('porto-velho');
    GRAPHICS.loadGraphic('amazon');
    lazyLoad(0);
    $section.css({
        'opacity': 1,
        'visibility': 'visible'
    });
    showNavigation(0);
    $thisSlide = $.deck('getSlide');
    checkModalStatus();
}

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

var lazyLoad = function(index) {
    /*
    * Lazy-load images in current and future slides.
    */
    var slides = [
        $slides.eq(index - 2),
        $slides.eq(index - 1),
        $slides.eq(index),
        $slides.eq(index + 1),
        $slides.eq(index + 2)
    ];

    for (var i = 0; i < slides.length; i++) {
        loadImages(slides[i]);
    };

}

var loadImages = function($slide) {
    /*
    * Sets the background image on a div for our fancy slides.
    */
    var $container = $slide.find('.imgLiquid');

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if (w < 769 && $slide.hasClass('mobile-crop')) {
        mobileSuffix = '-sq';
    }

    $container.each(function(key, value) {
        var bgimg = $(value).children('img');

        if (bgimg.data('bgimage')) {
            var imageFilename = bgimg.data('bgimage').split('.')[0];
            var imageExtension = '.' + bgimg.data('bgimage').split('.')[1];
            var imagePath = 'assets/' + imageFilename + mobileSuffix + imageExtension;

            bgimg.attr('src', imagePath);
        }

        if (bgimg.attr('src')) {
            $container.imgLiquid({
                fill: true,
                horizontalAlign: "center",
                verticalAlign: "center",
            });
        }
    });

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

var checkOverflow = function(index) {
    var $thisSlide = $slides.eq(index);
    var slideHeight = $thisSlide.height();
    var blockHeight = $thisSlide.find('.full-block').height();

    if (blockHeight > slideHeight) {
        $thisSlide.parents('.section').height(blockHeight);
    } else {
        $thisSlide.parents('.section').height(h);
    }
}

var onSlideChange = function(e, fromIndex, toIndex) {
    //update this slide to be the current active slide
    $thisSlide = $slides.eq(toIndex);
    lazyLoad(toIndex);
    showNavigation(toIndex);
    trackCompletion(toIndex);
    checkOverflow(toIndex);
    document.activeElement.blur();

    if (APP_CONFIG.PROGRESS_BAR) {
        PROGRESS_BAR.animateProgress(toIndex);
    }

    if ($thisSlide.hasClass('fade')) {
        $thisSlide.find('.imgLiquid.second').css('opacity', 1);
    }

    // empty out the resize function
    var graphicID = $thisSlide.attr('id');
    if ($thisSlide.hasClass('graphic') && graphicID !== 'locator-map') {
        GRAPHICS.loadGraphic(graphicID);
    }

    ANALYTICS.exitSlide(fromIndex.toString());
    ANALYTICS.trackEvent(lastSlideExitEvent, fromIndex.toString());
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

var onResize = function() {
    /*
     * Resize the content
     */
    w = $(window).width();
    h = $(window).height();
    if ($section.height() < h) {
        $section.height(h);
    }
    $slides.width(w);

    if ($thisSlide.hasClass('graphic')) {
        var graphicID = $thisSlide.attr('id');
        GRAPHICS.resizeGraphic(graphicID);
    }
};

// When modal closes, make sure it's not clickable
var onModalCloseClick = function() {
    $deepLinkNotice.css('visibility', 'hidden');
    $.cookie('npr_deeplink_status', '1', { expires: 1});
}

// If modal status is 1, hide the content warning on page load.
var checkModalStatus = function() {
    if (window.location.hash && window.location.hash !== '#s25') {
        if ($.cookie('npr_deeplink_status') !== '1')  {
            $deepLinkNotice.css('visibility', 'visible');
        }
    }
}

var onStartOverClick = function() {
    $.deck('go', 0);
}

var switchLanguage = function(language) {
    for (var i = 0; i < $slides.length; i++) {
        var $currentSlide = $slides.eq(i);
        var template = $currentSlide.data('template');
        var textLocations = slideTemplateTextLocation[template];

        for (var column in textLocations) {
            if (textLocations.hasOwnProperty(column)) {
                var container = $currentSlide.find(textLocations[column]);
                var languageColumn = language + '_' + column;

                for (var j = 0; j < COPY.content.length; j++) {
                    if ($currentSlide.attr('id') === COPY.content[j].id) {
                        container.text(COPY.content[j][languageColumn]);
                    }
                }
            }
        }
    }
}

$(onDocumentReady);
