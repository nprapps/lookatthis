// Global state
var $upNext = null;
var $document;
var $body;
var $section;
var $slides;
var $startCardButton;
var $imageGrid;
var $arrows;

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
var $playerButton;
var $play;
var $pause;
var $replay;
var $animatedElements = null;

var isTouch = Modernizr.touch;
var mobileSuffix;
var w;
var h;
var startTouch;
var lastSlideExitEvent;
var callToActionTest;
var currentIndex;
var carousel;

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
    // showNavigation(0);
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
    };

}

var loadImages = function($slide) {
    /*
    * Sets the background image on a div for our fancy slides.
    */
    if ($slide.data('bgimage')) {
        var image_filename = $slide.data('bgimage').split('.')[0];
        var image_extension = '.' + $slide.data('bgimage').split('.')[1];
        // Mobile suffix should be blank by default.
        mobileSuffix = '';

        if (w < 769 && $slide.hasClass('mobile-crop')) {
            mobileSuffix = '-sq';
        }

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
    if ($slides.last().index() === index) {
        $arrows.show();
        $nextArrow.hide().css('right', 0);
        $playerWrapper.hide();
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
    trackCompletion(toIndex);
    document.activeElement.blur();
    showNavigation(toIndex);
    currentIndex = toIndex;

    if (!isTouch) {
        initVideo();
    }

    /*
    * Suppress the first events that get fired on page load
    */
    ANALYTICS.exitSlide(fromIndex.toString());
    if (lastSlideExitEvent) {
        ANALYTICS.trackEvent(lastSlideExitEvent, fromIndex.toString());
    }

    if (toIndex === $slides.length - 1) {
        if (APP_CONFIG.POSTED_ON_FB && callToActionTest === 'facebook') {
            ANALYTICS.trackEvent('tests-run', 'facebook-post');
        } else if (!(APP_CONFIG.POSTED_ON_FB) && callToActionTest === 'facebook') {
            ANALYTICS.trackEvent('tests-run', 'facebook-page');
        } else {
            ANALYTICS.trackEvent('tests-run', callToActionTest);
        }
    }
}

var initVideo = function() {
    /*
    * Load the video when we get to the slide.
    */
    var $video = $slides.eq(currentIndex).find('video');
    if ($video.length > 0 && !isTouch) {
        var sources = $video.find('source');
        var video = $video.get(0);

        if (!sources.attr('src')) {
            sources.attr('src', sources.data('src'));
            video.load();
        }
        video.play();
    }
}

// var initCarousel = function() {
//     /*
//     * Initialize the carousel for mobile devices
//     */
//     $imageGrid = $slides.eq(currentIndex).find('.image-grid');
//     $imageGrid.addClass('carousel');

//     var $carouselItems = $imageGrid.children('.block');
//     $carouselItems.css({
//         'display': 'block',
//         'opacity': 0
//     })
//     var currentItem = 0;
//     $carouselItems.eq(currentItem).velocity('fadeIn', {
//         duration: 800,
//     });

//     if (!carousel) {
//         carousel = setInterval(function() {
//             $carouselItems.eq(currentItem).velocity('fadeOut', {
//                 duration: 800,
//                 complete: function() {
//                     if (currentItem < $carouselItems.length - 1) {
//                         currentItem = currentItem + 1;
//                     } else {
//                         currentItem = 0;
//                     }

//                     $carouselItems.eq(currentItem).velocity('fadeIn', {
//                         duration: 800
//                     });
//                 }
//             });
//         }, 8000);
//     }
// }

var onStartCardButtonClick = function() {
    /*
    * Called when clicking the "go" button.
    */
    lastSlideExitEvent = 'exit-start-card-button-click';
    AUDIO.setUpPlayer();
    $.deck('next');
    $playerWrapper.css({
        'opacity': 1,
        'visibility': 'visible'
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

var determineTests = function() {
    var possibleCallToActionTests = ['facebook', 'email'];

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

$(document).ready(function() {
    $document = $(document);
    $body = $('body');
    $section = $('.section');
    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');
    $previousArrow = $('.prev');
    $nextArrow = $('.next');

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
    $playerButton = $('.player-button');
    $replay = $('.replay');
    $play = $('.play');
    $pause = $('.pause');

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

    // Turn off Modernizr history so we don't get hashing
    Modernizr.history = null;

    $.deck($slides, {
        touch: { swipeTolerance: swipeTolerance }
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
        smoothPlayBar: true,
        volume: NO_AUDIO ? 0 : 1
    });

    var mp3FilePath = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/chris-clark/assets/prototype/lc-430.mp3' : 'http://assets.apps.npr.org/lookatthis/chris-clark/prototype/lc-430.mp3';

    $player.jPlayer('setMedia', {
        mp3: mp3FilePath
    });

    // Redraw slides if the window resizes
    $(window).on("orientationchange", resize);
    $(window).resize(resize);
});
