// Global state
var $upNext = null;
var $document;
var $body;
var $section;
var $slides;
var $startCardButton;
var $imageGrid;
var $arrows;
var $storyBeginButton;
var $introText;
var $fullscreenButton;
var $fullscreenLabel;
var $nextPostWrapper;
var $imgWrapper;
var $videoWrapper;
var $video;
var video;

var $likeStory;
var $likeStoryButtons;
var $facebook;
var $facebookBtn;
var $emailStory;
var $emailBtn;
var $didNotLike;
var $dislikeEmail;

var $playerWrapper;
var $player;
var $playerUI;
var $playerButton;
var $play;
var $pause;
var $currentTime;
var $animatedElements = null;

var isTouch = Modernizr.touch;
var mobileSuffix;
var w;
var h;
var startTouch;
var lastSlideExitEvent;
var callToActionTest;
var curentTimeTest;
var currentIndex;
var carousel;
var fullscreenEnabled = false;

var completion = 0;
var swipeTolerance = 40;
var touchFactor = 1;

var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);

var resize = function() {
    /*
     * Resize the content
     */
    w = $(window).width();
    h = $(window).height();
    $section.height(h);
    $slides.width(w);

    if (isTouch) {
        // if the text overflows on the slide, resize the slide so it contains the overflow
        if ($introText.height() + 60 > h) {
            $slides.height($introText.height() + 60);
        } else {
            $slides.height(h);
        }
        $imgWrapper.css({
            'width': w * 2,
            'height': h * 2,
            'background-size': w * 4,
        });
    } else {
        $video.css({
            'width': w,
            'height': h
        });
    }
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
};

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

    if ($slide.find('.img-wrapper').data('bgimage') && isTouch) {
        $wrapper = $slide.find('.img-wrapper');
        var image_filename = $wrapper.data('bgimage').split('.')[0];
        var image_extension = '.' + $wrapper.data('bgimage').split('.')[1];
        // Mobile suffix should be blank by default.
        mobileSuffix = '';

        if (w < 769 && $slide.hasClass('mobile-crop')) {
            mobileSuffix = '-sq';
        }

        var image_path = 'assets/' + image_filename + mobileSuffix + image_extension;

        if ($wrapper.css('background-image') === 'none') {
            $wrapper.css('background-image', 'url(' + image_path + ')');
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
    if ($slides.last().index() === index) {
        $arrows.show();
        $nextArrow.hide().css('right', 0);
    } else {
        $arrows.hide();
        $playerWrapper.show();
    }
    if (isTouch) {
        resetArrows();
    }
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

var onSlideChange = function(e, fromIndex, toIndex) {
    /*
    * Called transitioning between slides.
    */
    lazyLoad(toIndex);
    document.activeElement.blur();
    showNavigation(toIndex);
    currentIndex = toIndex;

    if (!isTouch) {
        initVideo();
    } else {
        initAnimation();
    }

    /*
    * Suppress the first events that get fired on page load
    */
    ANALYTICS.exitSlide(fromIndex.toString());
    if (lastSlideExitEvent) {
        ANALYTICS.trackEvent(lastSlideExitEvent, fromIndex.toString());
    }
}

var initVideo = function() {
    /*
    * Load the video when we get to the slide.
    */
    $video.css({
        'width': w,
        'height': h
    });

    if ($video.length > 0 && !isTouch) {
        var sources = $video.find('source');

        if (!sources.attr('src')) {
            var videoPath = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/chris-clark/assets/' : 'http://assets.apps.npr.org/lookatthis/chris-clark/';
            var source = videoPath + sources.data('src');
            sources.attr('src', source);
            video.load();
        }
        video.play();
    }
}

var initAnimation = function() {
    var $slide = $slides.eq(currentIndex);

    if ($introText.height() + 60 > $slide.height()) {
        $slide.css({
            height: $introText.height() + 60
        });
    }
    $imgWrapper.css({
        'width': w * 2,
        'height': h * 2,
        'background-size': w * 4,
    });

    var animateImage = function($wrapper) {
        $imgWrapper.velocity({
            translateX: '-' + w + 'px',
            translateY: '-' + h/2 + 'px'
        }, {
            duration: 120000,
            easing: 'linear',
            complete: function() {
                $wrapper.velocity({
                    translateX: 0
                }, {
                    duration: 120000,
                    easing: 'linear',
                    complete: function() {
                        $wrapper.velocity({
                            translateX: '-' + w + 'px',
                            translateY: 0
                        }, {
                            duration: 120000,
                            easing: 'linear',
                            complete: function() {
                                $wrapper.velocity({
                                    translateX: 0
                                }, {
                                    duration: 120000,
                                    easing: 'linear',
                                    complete: function() {
                                        animateImage($wrapper);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    animateImage($imgWrapper);
}

var onStartCardButtonClick = function() {
    /*
    * Called when clicking the "go" button.
    */
    lastSlideExitEvent = 'exit-start-card-button-click';
    $.deck('next');
    AUDIO.setUpPlayer();
}

var onStoryBeginButtonClick = function() {
    $introText.velocity('fadeOut', {
        duration: 2000
    });
    $playerWrapper.css({
        'visibility': 'visible'
    });
    $playerWrapper.velocity({
        'opacity': 0.5,
    }, {
        duration: 2000
    });

    if (!isTouch) {
        $fullscreenButton.css({
            'display': 'block',
            'visibility': 'visible'
        });
        $fullscreenButton.velocity({
            'opacity': 0.5,
        }, {
            duration: 2000
        });
    } else {
        $slides.eq(currentIndex).css('height', h);
        $body.velocity("scroll", { duration: 500 });
    }

    ANALYTICS.trackEvent('begin-story');
    AUDIO.switchAudio();
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

var onNextPostClick = function(e) {
    /*
     * Click next post
     */
    e.preventDefault();
    ANALYTICS.trackEvent('next-post');
    window.top.location = NEXT_POST_URL;
    return true;
}

var onFullScreenButtonClick = function(e) {
    e.preventDefault();

    if (screenfull.enabled) {
        if (fullscreenEnabled) {
            screenfull.exit();
            fullscreenEnabled = false;
            $fullscreenLabel.text('Fullscreen');
            ANALYTICS.trackEvent('fullscreen-stop');
        } else {
            screenfull.request();
            fullscreenEnabled = true;
            $fullscreenLabel.text('Exit');
            ANALYTICS.trackEvent('fullscreen-start');
        }
    }
}

var determineTests = function() {
    var possibleCallToActionTests = ['facebook', 'email'];
    var possibleTimeTests = ['yes', 'no'];

    callToActionTest = possibleCallToActionTests[getRandomInt(0, possibleCallToActionTests.length)];
    currentTimeTest = possibleTimeTests[getRandomInt(0, possibleTimeTests.length)];

    if (currentTimeTest === 'no') {
        $currentTime.hide();
    }
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
            $emailStory.show();
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

var onEmailBtnClick = function(e) {
    e.preventDefault();

    var $this = $(this);
    var link = $this.attr('href');

    ANALYTICS.trackEvent('email-story-btn-click');

    window.top.location = link
    return true;
}

var onDislikeEmailClick = function() {
    ANALYTICS.trackEvent('email-btn-click');
}

// var onVisibilityChange = function() {
//     AUDIO.visibilityToggle();
// }

// var getHiddenProperty = function() {
//     var prefixes = ['webkit','moz','ms','o'];

//     // if 'hidden' is natively supported just return it
//     if ('hidden' in document) return 'hidden';

//     // otherwise loop over all the known prefixes until we find one
//     for (var i = 0; i < prefixes.length; i++){
//         if ((prefixes[i] + 'Hidden') in document)
//             return prefixes[i] + 'Hidden';
//     }

//     // otherwise it's not supported
//     return null;
// }

// var isHidden = function() {
//     var prop = getHiddenProperty();
//     if (!prop) return false;

//     return document[prop];
// }

$(document).ready(function() {
    $document = $(document);
    $body = $('body');
    $section = $('.section');
    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $startCardButton = $('.btn-start');
    $arrows = $('.controlArrow');
    $previousArrow = $('.prev');
    $nextArrow = $('.next');
    $storyBeginButton = $('.btn-video');
    $introText = $('.intro-text');
    $imgWrapper = $('.img-wrapper');
    $fullscreenButton = $('.fullscreen');
    $fullscreenLabel = $('.fullscreen .label');
    $nextPostWrapper = $('.next-post-wrapper');
    $videoWrapper = $('.video-bg');
    $video = $('video')
    video = $video.get(0);

    $upNext = $('.up-next');
    $likeStory = $('.like-story');
    $likeStoryButtons = $('.btn-like-story');
    $facebook = $('.facebook');
    $facebookBtn = $('.btn-facebook');
    $emailStory = $('.email-story');
    $emailBtn = $('.btn-email');
    $didNotLike = $('.did-not-like');
    $dislikeEmail = $('.dislike-email');

    $playerWrapper = $('.player-wrapper');
    $player = $('#player');
    $playerUI = $('.jp-audio');
    $playerButton = $('.player-button');
    $play = $('.play');
    $pause = $('.pause');
    $currentTime = $('.current-time');

    w = $(window).width();
    h = $(window).height();

    $startCardButton.on('click', onStartCardButtonClick);
    $likeStoryButtons.on('click', onLikeStoryButtonsClick);
    $facebookBtn.on('click', onFacebookBtnClick);
    $emailBtn.on('click', onEmailBtnClick);
    $dislikeEmail.on('click', onDislikeEmailClick);
    $upNext.on('click', onNextPostClick);
    $document.on('deck.change', onSlideChange);
    $playerButton.on('click', AUDIO.toggleAudio);
    $previousArrow.on('click', AUDIO.reset);
    $storyBeginButton.on('click', onStoryBeginButtonClick);
    $playerUI.hover(onPlayerUIEnter, onPlayerUIExit);
    $fullscreenButton.on('click', onFullScreenButtonClick);

    // Turn off Modernizr history so we don't get hashing
    Modernizr.history = null;

    $.deck($slides, {
        touch: {
            swipeDirection: false
        }
    });

    onPageLoad();
    resize();
    determineTests();

    $player.jPlayer({
        swfPath: 'js/lib',
        loop: false,
        supplied: 'mp3',
        timeupdate: AUDIO.onTimeupdate,
        cssSelectorAncestor: "#jp_container_1",
        // smoothPlayBar: true,
        volume: NO_AUDIO ? 0 : 1
    });

    // Redraw slides if the window resizes
    window.addEventListener("orientationchange", resize);
    $(window).resize(resize);

    // listen for page visibility changes
    // visibilityProperty = getHiddenProperty();
    // if (visibilityProperty) {
    //     var evtname = visibilityProperty.replace(/[H|h]idden/,'') + 'visibilitychange';
    //     document.addEventListener(evtname, onVisibilityChange);
    // }
});
