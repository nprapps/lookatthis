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
var $likeStory;
var $likeStoryButtons;
var $facebook;
var $facebookBtn;
var $support;
var $supportBtn;
var $didNotLike;
var $dislikeEmail;
var $startAudio;
var $audioPlayer;
var $playerWrapper;
var $play;
var $pause;
var $replay;
var $playerButton;
var $playerUI;
var $animatedElements;
var $seekBar;

var mobileSuffix;
var w;
var h;
var startTouch;
var currentIndex;
var lastSlideExitEvent;
var callToActionTest;
var ASSETS_PATH = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/' + APP_CONFIG.DEPLOY_SLUG + '/assets/' : 'http://assets.apps.npr.org.s3.amazonaws.com/lookatthis/sultan/';
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);

var completion = 0;
var swipeTolerance = 40;
var touchFactor = 1;

var resize = function() {
    /*
     * Resize the content
     */
    w = $(window).width();
    h = $(window).height();
    if ($section.height() < h) {
        $section.height(h);
    }
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

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if (w < 769) {
        // mobileSuffix = '-sq';
    }

    var $thisSlide = $slides.eq(slideIndex);
    $animatedElements = $thisSlide.find('.animated');

    $slides.css('opacity', 0);
    if ($thisSlide.hasClass('fade-in-bg')) {
        $thisSlide.velocity({
            'opacity': 1
        },
        {
            duration: 1000,
            easing: 'ease-in'
        });
    } else {
        $thisSlide.css('opacity', 1);
    }

    for (var i = 0; i < slides.length; i++) {
        loadImages(slides[i]);
        if (APP_CONFIG.FILMSTRIP) {
            FILMSTRIP.initFilmstrip(slides[i])
        }
    };

}

var loadImages = function($slide) {
    /*
    * Sets the background image on a div for our fancy slides.
    */
    var $container = $slide.find('.imgLiquid');
    var bgimg = $container.children('img');

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
    // trackCompletion(toIndex);
    checkOverflow(toIndex);
    document.activeElement.blur();
    currentIndex = toIndex;

    if (APP_CONFIG.VIDEO) {
        VIDEO.checkForVideo(toIndex);
    }
    if (APP_CONFIG.FILMSTRIP) {
        FILMSTRIP.clearFilmstrip(fromIndex);
        FILMSTRIP.animateFilmstrip(toIndex);
    }
    if (APP_CONFIG.PROGRESS_BAR) {
        PROGRESS_BAR.animateProgress(toIndex);
    }

    ANALYTICS.exitSlide(fromIndex.toString());
    ANALYTICS.trackEvent(lastSlideExitEvent, fromIndex.toString());
    if (toIndex === $slides.length - 1) {
        ANALYTICS.trackEvent('tests-run', callToActionTest);
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

var onStartCardButtonClick = function() {
    /*
    * Called when clicking the "go" button.
    */
    lastSlideExitEvent = 'exit-start-card-button-click';
    $.deck('next');
}

var onStartAudioClick = function() {
    lastSlideExitEvent = 'exit-audio-start-button-click';
    $.deck('next');
    $playerWrapper.css({
       'visibility': 'visible'
    });
    $playerWrapper.velocity({
       'opacity': 0.5,
    }, {
       duration: 2000
    });
    AUDIO.playAudio();
    ANALYTICS.trackEvent('audio-started');
}

var onPlayerUIEnter = function() {
    $playerWrapper.velocity({
        opacity: 1
    }, {
        duration: 500,
    });
}

var onPlayerUIExit = function() {
    $playerWrapper.velocity({
        opacity: 0.5
    }, {
        duration: 500,
    });
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

var determineTests = function() {
    var possibleCallToActionTests = ['facebook', 'support'];

    callToActionTest = possibleCallToActionTests[getRandomInt(0, possibleCallToActionTests.length)];
}

var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var onLikeStoryButtonsClick = function(e) {
    e.preventDefault();

    $likeStory.hide();

    if ($(this).hasClass('yes')) {
        ANALYTICS.trackEvent('like-story-yes', callToActionTest);

        if (callToActionTest === 'facebook') {
            $facebook.show();
        } else {
            $support.show();
        }
    } else {
        ANALYTICS.trackEvent('like-story-no');
        $didNotLike.show();
    }
}

var onFacebookBtnClick = function(e) {
    e.preventDefault();

    var $this = $(this);
    var link = $this.attr('href');

    ANALYTICS.trackEvent('facebook-share');

    window.top.location = link
    return true;
}

var onSupportBtnClick = function(e) {
    e.preventDefault();

    var $this = $(this);
    var link = $this.attr('href');

    ANALYTICS.trackEvent('support-btn-click');

    window.top.location = link
    return true;
}

var onDislikeEmailClick = function() {
    ANALYTICS.trackEvent('email-btn-click');
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
    $likeStory = $('.like-story');
    $likeStoryButtons = $('.btn-like-story');
    $facebook = $('.facebook');
    $facebookBtn = $('.btn-facebook');
    $support = $('.support');
    $supportBtn = $('.btn-support');
    $didNotLike = $('.did-not-like');
    $dislikeEmail = $('.dislike-email');
    $startAudio = $('.btn-audio');
    $playerWrapper = $('.player-wrapper');
    $play = $('.play');
    $pause = $('.pause');
    $replay = $('.replay');
    $playerButton = $('.player-button');
    $playerUI = $('.jp-audio');
    $seekBar = $('.jp-seek-bar');

    $startCardButton.on('click', onStartCardButtonClick);
    $likeStoryButtons.on('click', onLikeStoryButtonsClick);
    $facebookBtn.on('click', onFacebookBtnClick);
    $supportBtn.on('click', onSupportBtnClick);
    $dislikeEmail.on('click', onDislikeEmailClick);
    $startAudio.on('click', onStartAudioClick);
    $playerButton.on('click', AUDIO.toggleAudio);
    $replay.on('click', AUDIO.reset);
    $upNext.on('click', onNextPostClick);
    $playerUI.hover(onPlayerUIEnter, onPlayerUIExit);
    $seekBar.on('click', AUDIO.onSeekBarClick);

    $document.on('deck.change', onSlideChange);
    Modernizr.history = null;

    $.deck($slides, {
        touch: {
            swipeDirection: false
        }
    });

    onPageLoad();
    resize();
    determineTests();

    // Redraw slides if the window resizes
    $(window).on("orientationchange", resize);
    $(window).resize(resize);
});
