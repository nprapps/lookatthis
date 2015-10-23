// jQuery vars
var $container;
var $w;
var $modalClose
var $overlay;
var $slides
var $deepLinkNotice;
var $thisSlide;
var $inDepthButton;
var $inDepthArrow;
var $hamburger;
var $slideLinks;

// constants
var aspectWidth = 16;
var aspectHeight = 9;

// global objects
var transEndEventNames;
var transEndEventName;
var transitionSupport;
var swiper;

var onDocumentReady = function() {
    $container = $('.swiper-container');
    $w = $(window);
    $modalClose = $('.close-modal');
    $overlay = $('.overlay-menu');
    $slides = $('.swiper-slide');
    $deepLinkNotice = $('.deep-link-notice');
    $hamburger = $('.hamburger');
    $slideLinks = $('a[data-slide]');
    $prevButton = $('.swiper-button-prev');
    $nextButton = $('.swiper-button-next')

    transEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'msTransition': 'MSTransitionEnd',
        'transition': 'transitionend'
    };
    transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
    transitionSupport = { transitions : Modernizr.csstransitions };

    swiper = new Swiper($container, {
        effect: 'fade',
        speed: 1000,
        parallax: true,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
        direction: 'horizontal',
        hashnav: true,
        //freeMode: true,
        //freeModeSticky: true,
        // mousewheelControl: true,
        // mousewheelForceToAxis: true,
       // mousewheelReleaseOnEdges: true,
        keyboardControl: true,
        simulateTouch: false,
        nextButton: $nextButton,
        prevButton: $prevButton,
        preloadImages: false,
    });

    $thisSlide = $slides.eq(swiper.activeIndex);
    $slideLinks.on('click', onSlideLinkClick);
    swiper.on('slideChangeStart', onSlideChange);
    $hamburger.on('click', toggleOverlay);

    onPageLoad();
}

var onPageLoad = function() {
    checkModalStatus();
    onSlideChange();
}

var onSlideChange = function() {
    //update this slide to be the current active slide
    $thisSlide = $slides.eq(swiper.activeIndex);

    lazyLoad();

    if ($thisSlide.hasClass('deep-dive')) {
        checkForInDepth();
    }

    if ($thisSlide.hasClass('graphic')) {
        var graphicID = $thisSlide.attr('id');
        GRAPHICS.loadGraphic(graphicID);
    }
}

var lazyLoad = function() {
    /*
    * Lazy-load images in current and future slides.
    */
    var slides = [
        $thisSlide,
        $slides.eq(swiper.activeIndex + 1),
        $slides.eq(swiper.activeIndex + 2)
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

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if ($w.width() < 769 && $slide.hasClass('mobile-crop')) {
        mobileSuffix = '-sq';
    }

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

    var $images = $slide.find('img.lazy-load');
    if ($images.length > 0) {
        for (var i = 0; i < $images.length; i++) {
            var image = $images.eq(i).data('src');
            $images.eq(i).attr('src', 'assets/' + image);
        }
    }
};

var checkForInDepth = function() {
    var $titlecardWrapper = $thisSlide.find('.slide-content');
    var $inDepthContainer = $thisSlide.find('.in-depth');

    if ($inDepthContainer.length > 0) {
        $titlecardWrapper.height($w.height() + 'px');
        $inDepthContainer.css('top', $w.height() + 'px');
        $inDepthButton = $thisSlide.find('.scroll-button');
        $inDepthArrow = $thisSlide.find('.scroll-button i');
        $inDepthTextContainer = $thisSlide.find('.inner-text');
        $inDepthText = $thisSlide.find('.in-depth');

        $('.in-depth-scroll i').removeClass('animated fadeInUp');
        $inDepthArrow.addClass('animated fadeInUp');

        $inDepthButton.click(function() {
            $inDepthTextContainer.animate({
                scrollTop: $inDepthText.offset().top
            }, 1000, 'swing');
        });

        // $( ".after-jump" ).click(function() {
        //     $inDepthTextContainer.animate({
        //         scrollTop: $inDepthText.offset().top
        //     }, 0);
        // });
    }
}

var checkforGraphic = function() {

}

var onSlideLinkClick = function() {
    swiper.slideTo($(this).data('slide'));
}

var toggleOverlay = function() {
    if ($overlay.hasClass('open')) {
        $overlay.removeClass('open');
        $overlay.addClass('close');

        var onEndTransitionFn = function(ev) {
            if( support.transitions ) {
                if( ev.propertyName !== 'visibility' ) return;
                this.removeEventListener( transEndEventName, onEndTransitionFn );
            }
            $overlay.removeClass('open');
        };
        if( support.transitions ) {
            overlay.addEventListener( transEndEventName, onEndTransitionFn );
        }
        else {
            onEndTransitionFn();
        }
    }
    else if (!$overlay.hasClass('close')) {
        $overlay.addClass('open');
    }
}

// When modal closes, make sure it's not clickable
var onModalCloseClick = function() {
    $deepLinkNotice.css('visibility', 'hidden');
    $.cookie('npr_deeplink_status', '1', { expires: 1});
}

// If modal status is 1, hide the content warning on page load.
var checkModalStatus = function() {
    if ($.cookie('npr_deeplink_status') != '1' && swiper.activeIndex !== 0) {
        $deepLinkNotice.css('visibility', 'visible');
    }
}

//sizing titlecard to match viewport
var onWindowResize = function() {
    /*
    * Handles resizing our full-width images.
    * Makes decisions based on the window size.
    */

    // Calculate optimal width if height is constrained to window height.
    var wOptimal = ($w.height() * aspectWidth) / aspectHeight;

    // Calculate optimal height if width is constrained to window width.
    var hOptimal = ($w.width() * aspectHeight) / aspectWidth;

    // Decide whether to go with optimal height or width.
    var w = $w.width();
    var h = h_optimal;

    if (w_optimal > $w.width()) {
        var w = w_optimal;
        var h = $w.height();
    }

    //$titlecard.width(w + 'px').height(h + 'px');
    //$opener.height($w.height() + 'px');

    $titlecard_wrapper.height($w.height() + 'px');
    $container.css('marginTop', $w.height() + 'px');
};

$(onDocumentReady);