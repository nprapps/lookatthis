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
var $videoControlBtn;
var $thisPlayerProgress;
var $playedBar;
var $ambientPlayer;
var $skipIntroBtn;
var $videoSlide;
var $videoControls;

var mobileSuffix;
var w;
var h;
var startTouch;
var lastSlideExitEvent;
var callToActionTest;
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var ASSETS_PATH = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/' + APP_CONFIG.DEPLOY_SLUG + '/assets/' : 'http://assets.apps.npr.org.s3.amazonaws.com/lookatthis/' + APP_CONFIG.DEPLOY_SLUG + '/';
var remove;
var videoElevenSeconds = false;

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
    $('.section').css({
        'opacity': 1,
        'visibility': 'visible',
    });
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

    for (var i = 0; i < slides.length; i++) {
        loadImages(slides[i]);
        FILMSTRIP.initFilmstrip(slides[i]);
    };

}

var loadImages = function($slide) {
    /*
    * Sets the background image on a div for our fancy slides.
    */
    var $container = $slide.find('.imgLiquid');
    var bgimg = $container.children('img.liquid');

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if (w < 769 && $slide.hasClass('mobile-crop')) {
        mobileSuffix = '-sq';
    }

    if (bgimg.data('bgimage')) {
        var image_filename = bgimg.data('bgimage').split('.')[0];
        var image_extension = '.' + bgimg.data('bgimage').split('.')[1];
        var image_path = 'assets/' + image_filename + mobileSuffix + image_extension;

        bgimg.attr('src', image_path);
    }

    if (bgimg.attr('src')) {
        $container.imgLiquid({
            fill: true,
            horizontalAlign: "center",
            verticalAlign: "center",
        });
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
    } else if (index === 2) {
        $arrows.show();
        $previousArrow.css('opacity', 0.3);
        $nextArrow.css('opacity', 1);
    } else {
        $arrows.show();
        $arrows.css('opacity', 0.3);
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
    VIDEO.checkForVideo(toIndex);
    FILMSTRIP.clearFilmstrip(fromIndex);
    FILMSTRIP.animateFilmstrip(toIndex);
    showNavigation(toIndex);
    trackCompletion(toIndex);
    document.activeElement.blur();
    ANALYTICS.exitSlide(fromIndex.toString());
    ANALYTICS.trackEvent(lastSlideExitEvent, fromIndex.toString());
    if (toIndex === $slides.length - 1) {
        ANALYTICS.trackEvent('tests-run', callToActionTest);
    }
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
    if (e.keyCode === 32 && $slides.filter('.deck-current').hasClass('video')) {
        VIDEO.toggleVideo($videoControlBtn);
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

var onVideoControlBtnClick = function(e) {
    var $this = $(this);
    e.preventDefault();
    VIDEO.toggleVideo($this);
    e.stopPropagation();
}

var onSkipIntroBtnClick = function(e) {
    e.preventDefault();
    $.deck('next');
    ANALYTICS.trackEvent('skip-video');
    e.stopPropagation();
}

var onVideoSlideMove = function(e) {
    $videoControls.css('opacity', 1);
    $arrows.css('opacity', 0.3);
    if (remove) {
        clearInterval(remove);
    }

    if (videoElevenSeconds) {
        remove = setInterval(function() {
            $videoControls.css('opacity', 0);
            if ($slides.filter('.deck-current').hasClass('video')) {
                $arrows.css('opacity', 0);
            }
        }, 3000)
    }
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
    $videoControlBtn = $('.video .control-btn');
    $ambientPlayer = $('#ambient-player');
    $videos = $('video');
    $skipIntroBtn = $('.skip-intro');
    $videoSlide = $('.slide.video');
    $videoControls = $('.video .controls');

    $startCardButton.on('click', onStartCardButtonClick);
    $slides.on('click', onSlideClick);
    $videoControlBtn.on('click', onVideoControlBtnClick);
    $upNext.on('click', onNextPostClick);
    $document.on('deck.change', onSlideChange);
    $skipIntroBtn.on('click', onSkipIntroBtnClick);
    $previousArrow.on('click', onPreviousArrowClick);
    $nextArrow.on('click', onNextArrowClick);
    $videoSlide.on('mousemove', onVideoSlideMove);

    if (isTouch) {
        $arrows.on('touchstart', fakeMobileHover);
        $arrows.on('touchend', rmFakeMobileHover);
        // $body.on('touchstart', onTouchStart);
        // $body.on('touchmove', onTouchMove);
        // $body.on('touchend', onTouchEnd);
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
        keys: {
           // enter, space, page down, right arrow, down arrow
           next: [13, 34, 39, 40],
           // backspace, page up, left arrow, up arrow
           previous: [8, 33, 37, 38]
        },
    });

    onPageLoad();
    resize();
    VIDEO.setupVideo();

    // Redraw slides if the window resizes
    $(window).on("orientationchange", resize);
    $(window).resize(resize);
    $document.keydown(onDocumentKeyDown);
});
