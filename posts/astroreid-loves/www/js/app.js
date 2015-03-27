// Global state
var $upNext = null;
var $w;
var $h;
var $slides;
var $arrows;
var $nextArrow;
var $startCardButton;
var isTouch = Modernizr.touch;
var mobileSuffix;
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var currentIndex;
var completion = 0;
var lastSlideExitEvent;
var hammer;
var $playerWrapper;
var $player;
var $playerButton;
var $play;
var $pause;
var $replay;
var slideEndTime = null;
var $animatedElements = null;
var callToActionTest;
var $likeStory;
var $likeStoryButtons;
var $facebook;
var $support;
var $didNotLike;
var $email;

var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);

var resize = function() {

    $w = $(window).width();
    $h = $(window).height();

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

var setUpFullPage = function() {
    $.fn.fullpage({
        autoScrolling: false,
        verticalCentered: false,
        keyboardScrolling: false,
        fixedElements: '.player-wrapper',
        resize: false,
        css3: true,
        loopHorizontal: false,
        afterRender: onPageLoad,
        afterSlideLoad: lazyLoad,
        onSlideLeave: onSlideLeave
    });
};


var onPageLoad = function() {
    setSlidesForLazyLoading(0)
    $('.section').css({
      'opacity': 1,
      'visibility': 'visible',
    });
};

// after a new slide loads

var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);
    slideStartTime = moment();
    currentIndex = slideIndex;

    if (currentIndex !== $slides.length - 1) {
        $replay.hide();
        if ($player.data().jPlayer.status.paused) {
            $play.show();
            $pause.hide();
        } else {
            $pause.show();
            $play.hide();
        }
    }

    var $thisSlide = $('#slide-' + slideAnchor);
    $animatedElements = $thisSlide.find('.animated');
    slideEndTime = $thisSlide.data('slide-end-time');

    if ($thisSlide.hasClass('fade-in-bg')) {
        $thisSlide.velocity({
            'opacity': 1
        },
        {
            duration: 2000,
            easing: 'ease-in'
        });
    }

    if ($thisSlide.hasClass('fade-overlay')) {
        $thisSlide.removeClass('fade-overlay');
    }
    if ($thisSlide.hasClass('fade-out-overlay')) {
        $thisSlide.addClass('fade-overlay');
    }

    // Completion tracking
    how_far = (slideIndex + 1) / ($slides.length - APP_CONFIG.NUM_SLIDES_AFTER_CONTENT);

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

    // fire event on last slide
    if (slideIndex === $slides.length - 1) {
        if (APP_CONFIG.POSTED_ON_FB && callToActionTest === 'facebook') {
            ANALYTICS.trackEvent('tests-run', 'facebook-post');
        } else if (!(APP_CONFIG.POSTED_ON_FB) && callToActionTest === 'facebook') {
            ANALYTICS.trackEvent('tests-run', 'facebook-page');
        } else {
            ANALYTICS.trackEvent('tests-run', callToActionTest);
        }

    }
};

var setSlidesForLazyLoading = function(slideIndex) {
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
        // mobileSuffix = '-sq';
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
            $images.eq(i).attr('src', image);
        }
    }
};

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    /*
    * Called when leaving a slide.
    */
}

var animateTweets = function(index) {
    var $thisSlide = $slides.eq(index);
    var $tweet = $thisSlide.find('.tweet-container').eq(0);
    var animation = $tweet.data('animation');

    $tweet.addClass(animation + ' animation');
}

var onStartCardButtonClick = function() {
    ANALYTICS.trackEvent('begin');

    lastSlideExitEvent = 'go';
    $('.start').css('opacity', 0);
    AUDIO.setUpPlayer();
    $('.start').one("webkitTransitionEnd transitionend", function(event) {
        $.fn.fullpage.moveSlideRight();
        animateTweets(1);
        $('#slide-intro').css('opacity', 1);
        $playerWrapper.css({
            'opacity': 1,
            'visibility': 'visible'
        });
    });
}

var onNextPostClick = function(e) {
    e.preventDefault();

    ANALYTICS.trackEvent('next-post');
    window.top.location = NEXT_POST_URL;
    return true;
}

var determineTests = function() {
    var possibleCallToActionTests = ['facebook', 'support-npr'];

    callToActionTest = possibleCallToActionTests[getRandomInt(0, possibleCallToActionTests.length)];
}

var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var onLikeStoryButtonsClick = function(e) {
    e.preventDefault();

    $likeStory.hide();

    if ($(this).hasClass('yes')) {
        if (APP_CONFIG.POSTED_ON_FB && callToActionTest === 'facebook') {
            ANALYTICS.trackEvent('like-story-yes', 'facebook-post');
        } else if (!(APP_CONFIG.POSTED_ON_FB) && callToActionTest === 'facebook') {
            ANALYTICS.trackEvent('like-story-yes', 'facebook-page');
        } else {
            ANALYTICS.trackEvent('like-story-yes', callToActionTest);
        }

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

    if (APP_CONFIG.POSTED_ON_FB) {
        ANALYTICS.trackEvent('facebook-post-click');
    } else {
        ANALYTICS.trackEvent('facebook-page-click');
    }

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

var onEmailClick = function() {
    ANALYTICS.trackEvent('email-btn-click');
}

$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides = $('.slide');
    $startCardButton = $('.btn-startcard');
    $upNext = $('.up-next');
    $playerWrapper = $('.player-wrapper');
    $player = $('#player');
    $playerButton = $('.player-button');
    $replay = $('.replay');
    $play = $('.play');
    $pause = $('.pause');
    $likeStory = $('.like-story');
    $likeStoryButtons = $('.btn-like-story');
    $facebook = $('.facebook');
    $facebookBtn = $('.btn-facebook');
    $support = $('.support');
    $supportBtn = $('.btn-support');
    $didNotLike = $('.did-not-like');
    $email = $('.email');

    $startCardButton.on('click', onStartCardButtonClick);
    $upNext.on('click', onNextPostClick);
    $playerButton.on('click', AUDIO.toggleAudio);
    $replay.on('click', AUDIO.reset);
    $likeStoryButtons.on('click', onLikeStoryButtonsClick);
    $facebookBtn.on('click', onFacebookBtnClick);
    $supportBtn.on('click', onSupportBtnClick);
    $email.on('click', onEmailClick);

    setUpFullPage();
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

    var mp3FilePath = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/spacepix/assets/wiseman2.mp3' : 'http://assets.apps.npr.org/lookatthis/astroreid-loves/wiseman2.mp3';

    $player.jPlayer('setMedia', {
        mp3: mp3FilePath
    });

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
});
