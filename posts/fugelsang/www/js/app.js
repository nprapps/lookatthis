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
var $playAgain;
var slideEndTime = null;
var $animatedElements = null;

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
            $images.eq(i).attr('src', 'assets/' + image);
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

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    _gaq.push(['_trackEvent', EVENT_CATEGORY, 'summary-copied']);
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
    $playAgain = $('.play-again');
    $play = $('.play');
    $pause = $('.pause');

    $startCardButton.on('click', onStartCardButtonClick);
    $upNext.on('click', onNextPostClick);
    $playerButton.on('click', AUDIO.toggleAudio);
    $playAgain.on('click', AUDIO.reset);

    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));
    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    setUpFullPage();
    resize();

    $player.jPlayer({
        swfPath: 'js/lib',
        loop: false,
        supplied: 'mp3',
        timeupdate: AUDIO.onTimeupdate,
        cssSelectorAncestor: "#jp_container_1",
        smoothPlayBar: true
    });

    $player.jPlayer('setMedia', {
        mp3: 'http://assets.apps.npr.org/lookatthis/fugelsang/fugel-narr3.mp3'
    });

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
});
