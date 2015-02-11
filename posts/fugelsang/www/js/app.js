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
var likeStoryTest;
var callToActionTest;
var $likeStory;
var $likeStoryButtons;
var $follow;
var $support;
var $didNotLike;

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
        fixedElements: '.player',
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
    $('body').css('opacity', 1);
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
    ANALYTICS.exitSlide(slideIndex.toString(), lastSlideExitEvent);
}

var onStartCardButtonClick = function() {
    lastSlideExitEvent = 'go';
    $('.start').css('opacity', 0);
    AUDIO.setUpPlayer();
    $('.start').one("webkitTransitionEnd transitionend", function(event) {
        $.fn.fullpage.moveSlideRight();
        $('#slide-intro').css('opacity', 1);
        $playerWrapper.css('opacity', 1);
    });
}

var onNextPostClick = function(e) {
    e.preventDefault();

    ANALYTICS.trackEvent('next-post');
    window.top.location = NEXT_POST_URL;
    return true;
}

var determineTests = function() {
    var possibleLikeStoryTests = ['like-story', 'no-like-story'];
    var possibleCallToActionTests = ['follow-us', 'support-npr'];

    likeStoryTest = possibleLikeStoryTests[getRandomInt(0, possibleLikeStoryTests.length)];
    callToActionTest = possibleCallToActionTests[getRandomInt(0, possibleCallToActionTests.length)];

    console.log(likeStoryTest, callToActionTest);

    if (likeStoryTest === 'like-story') {
        $likeStory.show();
    } else {
        if (callToActionTest === 'follow-us') {
            $follow.show();
        } else {
            $support.show();
        }
    }
}

var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var onLikeStoryButtonsClick = function(e) {
    e.preventDefault();

    $likeStory.hide();

    if ($(this).hasClass('yes')) {
        ANALYTICS.trackEvent('like-story', 'yes');

        if (callToActionTest === 'follow-us') {
            $follow.show();
        } else {
            $support.show();
        }
    } else {
        ANALYTICS.trackEvent('like-story', 'no');
        $didNotLike.show();
    }
}

var onFollowBtnsClick = function(e) {
    e.preventDefault();

    var $this = $(this);
    var link = $this.attr('href');

    if ($this.hasClass('tu')) {
        ANALYTICS.trackEvent('follow-btn-click', 'tumblr', null, likeStoryTest);
    } else if ($this.hasClass('fb')) {
        ANALYTICS.trackEvent('follow-btn-click', 'facebook', null, likeStoryTest);
    } else {
        ANALYTICS.trackEvent('follow-btn-click', 'twitter', null, likeStoryTest);
    }

    window.top.location = link
    return true;
}

var onSupportBtnClick = function(e) {
    e.preventDefault();

    var $this = $(this);
    var link = $this.attr('href');

    ANALYTICS.trackEvent('support-btn-click', likeStoryTest);

    window.top.location = link
    return true;
}

$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides = $('.slide');
    $startCardButton = $('.btn-go');
    $upNext = $('.up-next');
    $playerWrapper = $('.player-wrapper');
    $player = $('#player');
    $playerButton = $('.player-button');
    $replay = $('.replay');
    $play = $('.play');
    $pause = $('.pause');
    $likeStory = $('.like-story');
    $likeStoryButtons = $('.btn-like-story');
    $follow = $('.follow');
    $followBtns = $('.btn-follow');
    $support = $('.support');
    $supportBtn = $('.btn-support');
    $didNotLike = $('.did-not-like');

    $startCardButton.on('click', onStartCardButtonClick);
    $upNext.on('click', onNextPostClick);
    $playerButton.on('click', AUDIO.toggleAudio);
    $replay.on('click', AUDIO.reset);
    $likeStoryButtons.on('click', onLikeStoryButtonsClick);
    $followBtns.on('click', onFollowBtnsClick);
    $supportBtn.on('click', onSupportBtnClick);

    setUpFullPage();
    resize();
    determineTests();

    $player.jPlayer({
        swfPath: 'js/lib',
        loop: false,
        supplied: 'mp3',
        timeupdate: AUDIO.onTimeupdate,
        cssSelectorAncestor: "#jp_container_1",
        smoothPlayBar: true
    });

    $player.jPlayer('setMedia', {
        mp3: 'http://assets.apps.npr.org/lookatthis/fugelsang/fugel-final.mp3'
    });

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
});
