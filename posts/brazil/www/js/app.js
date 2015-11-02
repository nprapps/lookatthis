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

var isMobile = Modernizr.touch;

// constants
var aspectWidth = 16;
var aspectHeight = 9;

// global objects
var transEndEventNames;
var transEndEventName;
var transitionSupport;
var swiper;
var slideTemplateTextLocation;
var templateList;

var onDocumentReady = function() {
    $container = $('.swiper-container');
    $w = $(window);
    $modalClose = $('.close-modal');
    // $overlay = $('.overlay-menu');
    $slides = $('.swiper-slide');
    $deepLinkNotice = $('.deep-link-notice');
    // $hamburger = $('.hamburger');
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
        fade: {
            crossFade: true
        },
        speed: isMobile ? 500 : 1,
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

    slideTemplateTextLocation = {
        'slide': {
            'text1': '.slide-content'
        },
        'slide-bottom': {
            'text1': '.slide-content-bottom-item'
        },
        'graphic': {
            'text1': '.slide-content'
        }
    }

    $thisSlide = $slides.eq(swiper.activeIndex);
    $slideLinks.on('click', onSlideLinkClick);
    swiper.on('slideChangeStart', onSlideChange);
    // $hamburger.on('click', toggleOverlay);
    $modalClose.on('click', onModalCloseClick);
    $(window).on('resize', onResize);
    onPageLoad();
}

var onPageLoad = function() {
    checkModalStatus();
    GRAPHICS.loadGraphic('porto-velho');
    GRAPHICS.loadGraphic('amazon');
    onSlideChange();
    $container.css('opacity', 1);
}

var onSlideChange = function() {
    //update this slide to be the current active slide
    $thisSlide = $slides.eq(swiper.activeIndex);

    lazyLoad();

    if ($thisSlide.hasClass('deep-dive')) {
        checkForInDepth();
    }

    if ($thisSlide.hasClass('fade')) {
        $thisSlide.find('.imgLiquid.second').css('opacity', 1);
    }

    // empty out the resize function
    var graphicID = $thisSlide.attr('id');
    if ($thisSlide.hasClass('graphic') && graphicID !== 'locator-map') {
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

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if ($w.width() < 769 && $slide.hasClass('mobile-crop')) {
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

var onResize = function() {
    if ($thisSlide.hasClass('graphic')) {
        var graphicID = $thisSlide.attr('id');
        GRAPHICS.resizeGraphic(graphicID);
    }
}

var onSlideLinkClick = function() {
    swiper.slideTo($(this).data('slide'));
}

// var toggleOverlay = function() {
//     if ($overlay.hasClass('open')) {
//         $overlay.removeClass('open');
//         $overlay.addClass('close');

//         var onEndTransitionFn = function(ev) {
//             if( support.transitions ) {
//                 if( ev.propertyName !== 'visibility' ) return;
//                 this.removeEventListener( transEndEventName, onEndTransitionFn );
//             }
//             $overlay.removeClass('open');
//         };
//         if( support.transitions ) {
//             overlay.addEventListener( transEndEventName, onEndTransitionFn );
//         }
//         else {
//             onEndTransitionFn();
//         }
//     }
//     else if (!$overlay.hasClass('close')) {
//         $overlay.addClass('open');
//     }
// }

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
