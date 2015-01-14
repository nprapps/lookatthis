// Global state
var $upNext = null;
var $w;
var $h;
var $slides;
var $arrows;
var $startCardButton;
var isTouch = Modernizr.Touch;
var mobileSuffix;
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var slideStartTime = new Date();
var completion = 0;

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
    var anchors = ['_'];
    for (var i = 0; i < copy.content.length; i++) {
        anchors.push(copy.content[i][0]);
    }
    $.fn.fullpage({
        anchors: (!APP_CONFIG.DEPLOYMENT_TARGET) ? anchors : false,
        autoScrolling: false,
        verticalCentered: false,
        fixedElements: '.primary-navigation, #share-modal',
        resize: false,
        css3: true,
        loopHorizontal: false,
        afterRender: onPageLoad,
        afterSlideLoad: lazyLoad,
        onSlideLeave: onSlideLeave
    });
};

var onPageLoad = function() {
    setSlidesForLazyLoading(0);
    $('.section').css({
      'opacity': 1,
      'visibility': 'visible',
    });
    showNavigation();
};

// after a new slide loads
var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);
    showNavigation();
    slideStartTime = Date.now();

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
    var $container = $slide.find('.bg-image');
    if ($container.data('bgimage')) {
        var image_filename = $container.data('bgimage').split('.')[0];
        var image_extension = '.' + $container.data('bgimage').split('.')[1];
        var image_path = 'assets/' + image_filename + mobileSuffix + image_extension;

        if ($container.css('background-image') === 'none') {
            $container.css('background-image', 'url(' + image_path + ')');
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

var showNavigation = function() {
    /*
    * Nav doesn't exist by default.
    * This function loads it up.
    */

    if ($slides.first().hasClass('active')) {
        $arrows.hide();
    }

    else if ($slides.last().hasClass('active')) {
        /*
        * Last card gets no next arrow but does have the nav.
        */
        if (!$arrows.hasClass('active')) {
            animateArrows();
        }

        var $nextArrow = $arrows.filter('.next');

        $nextArrow.removeClass('active');
        $nextArrow.css({
            'display': 'none'
        });
    } else {
        /*
        * All of the other cards? Arrows and navs.
        */
        if ($arrows.filter('active').length != $arrows.length) {
            animateArrows();
        }

        $('body').removeClass('titlecard-nav');
    }
}

var animateArrows = function() {
    /*
    * Everything looks better faded. Hair; jeans; arrows.
    */
    $arrows.addClass('active');

    if ($arrows.hasClass('active')) {
        $arrows.css('display', 'block');
    }
};

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    /*
    * Called when leaving a slide.
    */
    var timeOnSlide = Math.abs(new Date() - slideStartTime);
    ANALYTICS.exitSlide(slideIndex.toString(), timeOnSlide);
}

var onStartCardButtonClick = function() {
    $.fn.fullpage.moveSlideRight();
}

var onDocumentKeyDown = function(e) {
    if (e.which === 39) {
        ANALYTICS.useKeyboardNavigation();
    }
    // jquery.fullpage handles actual scrolling
    return true;
}

var onSlideClick = function(e) {
    if (isTouch) {
        $.fn.fullpage.moveSlideRight();
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

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    ANALYTICS.copySummary();
}

$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');
    $upNext = $('.up-next');

    $startCardButton.on('click', onStartCardButtonClick);
    $slides.on('click', onSlideClick);
    $upNext.on('click', onNextPostClick);
    $arrows.on('touchstart', fakeMobileHover);
    $arrows.on('touchend', rmFakeMobileHover);

    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));
    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    setUpFullPage();
    resize();

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
    $(document).keydown(onDocumentKeyDown);
});
