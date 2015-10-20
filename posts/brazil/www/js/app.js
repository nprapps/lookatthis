// Global state
var $container;
var $titlecard;
var $titlecard_wrapper;
var $w = $(window);
var aspect_width = 16;
var aspect_height = 9;
$modalClose = $('.close-modal');
var swiper;

// When modal closes, make sure it's not clickable
var onModalCloseClick = function() {
    $('.deep-link-notice').css('visibility', 'hidden');
    $.cookie('npr_deeplink_status', '1', { expires: 1});
}

// If modal status is 1, hide the content warning on page load.
var checkModalStatus = function() {
    if ($.cookie('npr_deeplink_status') != '1' && swiper.activeIndex !== 0) {
        $('.deep-link-notice').css('visibility', 'visible');
        //console.log('this is not the index');
    }
}

$modalClose.on('click', onModalCloseClick);

//nav menu
var overlay = document.querySelector( 'div.overlay-menu' );
    var transEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'msTransition': 'MSTransitionEnd',
            'transition': 'transitionend'
        };
var transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
var support = { transitions : Modernizr.csstransitions };

//sizing titlecard to match viewport
var on_window_resize = function() {
    /*
    * Handles resizing our full-width images.
    * Makes decisions based on the window size.
    */

    // Calculate optimal width if height is constrained to window height.
    w_optimal = ($w.height() * aspect_width) / aspect_height;

    // Calculate optimal height if width is constrained to window width.
    h_optimal = ($w.width() * aspect_height) / aspect_width;

    // Decide whether to go with optimal height or width.
    w = $w.width();
    h = h_optimal;

    if (w_optimal > $w.width()) {
        w = w_optimal;
        h = $w.height();
    }

    //$titlecard.width(w + 'px').height(h + 'px');
    //$opener.height($w.height() + 'px');

    $titlecard_wrapper.height($w.height() + 'px');
    $container.css('marginTop', $w.height() + 'px');
};

$(document).ready(function() {
    //swiper parameters
    swiper = new Swiper('.swiper-container', {
        //initialSlide: '4',
        //autoplay: 5000,
        //speed: 0,
        effect: 'fade',
        speed: 1000,
        parallax: true,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
        pagination: '.swiper-pagination',
        paginationClickable: true,
        direction: 'horizontal',
        hashnav: true,
        //freeMode: true,
        //freeModeSticky: true,
        mousewheelControl: true,
        mousewheelForceToAxis: true,
       // mousewheelReleaseOnEdges: true,
        keyboardControl: true,
        simulateTouch: false,
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',

    });
    $('a[data-slide]').on('click', function () {
        swiper.slideTo($(this).data('slide'));
    });

    checkModalStatus();

    //sizing the title card
    $container = $('.in-depth');
    $titlecard = $('.titlecard');
    $titlecard_wrapper = $('.titlecard-wrapper, .after-before');

    $w.on('resize', on_window_resize);
    on_window_resize();

    //////////// Targeting the current slide ///////////////
    //console.log(this);

    //each slide gets a class of swiper-slide. Let's make these a jquery object, which is an array of the matched DOM elements.
    $slides = $('.swiper-slide');

    //thisSlide is equal to the current slide
    var $thisSlide = $slides.eq(swiper.activeIndex);

    //find the smooth scroll button within the current slide
    var $inDepthButton = $thisSlide.find('.scroll-button');

    //find the down arrow inside the smooth scroll button within the current slide
    var $inDepthArrow = $thisSlide.find('.scroll-button i');

    //find the in depth text container
    var $inDepthTextContainer = $thisSlide.find('.inner-text');

    //find the in depth text for the current slide
    var $inDepthText = $thisSlide.find('.in-depth');

    //smooth scroll to the text of the current slide
    $inDepthButton.click(function() {
            $inDepthTextContainer.animate({
                scrollTop: $inDepthText.offset().top
            }, 1000, 'swing');
        });



    //add a class to the arrow in the current slide to animate it.
    $inDepthArrow.addClass('animated fadeInUp');

    //this is a swiper function that will fire each time you enter a frame
    swiper.on('slideChangeStart', function() {

        //update this slide to be the current active slide
        $thisSlide = $slides.eq(swiper.activeIndex);

        //update the smooth scroll button
        $inDepthButton = $thisSlide.find('.scroll-button');

         //update the active arrow
        $inDepthArrow = $thisSlide.find('.scroll-button i');

        //update in depth text
        $inDepthTextContainer = $thisSlide.find('.inner-text');

        //find the in depth text for the current slide
        $inDepthText = $thisSlide.find('.in-depth');

        //remove animation classes from all other instances of the smooth scroll arrow
        $('.in-depth-scroll i').removeClass('animated fadeInUp');

        // and lastly add animation to the current arrow
        $inDepthArrow.addClass('animated fadeInUp');

        $inDepthButton.click(function() {
            $inDepthTextContainer.animate({
                scrollTop: $inDepthText.offset().top
            }, 1000, 'swing');
        });

    });

    //before after jump
    $( ".after-jump" ).click(function() {
        $inDepthTextContainer.animate({
            scrollTop: $inDepthText.offset().top
        }, 0);
    });


    //nav menu
    function toggleOverlay() {
        if( classie.has( overlay, 'open' ) ) {
            classie.remove( overlay, 'open' );
            classie.add( overlay, 'close' );
            var onEndTransitionFn = function( ev ) {
                if( support.transitions ) {
                    if( ev.propertyName !== 'visibility' ) return;
                    this.removeEventListener( transEndEventName, onEndTransitionFn );
                }
                classie.remove( overlay, 'close' );
            };
            if( support.transitions ) {
                overlay.addEventListener( transEndEventName, onEndTransitionFn );
            }
            else {
                onEndTransitionFn();
            }
        }
        else if( !classie.has( overlay, 'close' ) ) {
            classie.add( overlay, 'open' );
        }
    };

    $(".hamburger, .menu-toggle li, .overlay-menu-close").click(function() {
      toggleOverlay();
    });


});