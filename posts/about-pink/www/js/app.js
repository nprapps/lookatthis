// Global state
var $nextPostTitle = null;
var $nextPostImage = null;
var $upNext = null;
var NAV_HEIGHT = 75;
var EVENT_CATEGORY = 'lookatthis';
var MESSAGE_DELIMITER = ';';

var $w;
var $h;
var $slides;
var $primaryNav;
var $arrows;
var $startCardButton;
var mobileSuffix;
var isTouch = Modernizr.touch;
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var hasTrackedKeyboardNav = false;
var hasTrackedSlideNav = false;
var slideStartTime = moment();
var completion = 0;

/*var onStartCardButtonClick = function() {
    $.fn.fullpage.moveSlideRight();
}*/

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
    setSlidesForLazyLoading(0)
    $('body').css('opacity', 1);
    showNavigation();
};

// after a new slide loads

var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);

    showNavigation();

    slideStartTime = moment();

    // Completion tracking
    how_far = (slideIndex + 1) / $slides.length;

    if (how_far >= completion + 0.25) {
        completion = how_far - (how_far % 0.25);

        trackEvent([EVENT_CATEGORY, 'completion', completion]);
    }
};

var setSlidesForLazyLoading = function(slideIndex) {
    /*
    * Sets up a list of slides based on your position in the deck.
    * Lazy-loads images in future slides because of reasons.
    */

    var slides = [
        $slides[slideIndex - 2],
        $slides[slideIndex - 1],
        $slides[slideIndex],
        $slides[slideIndex + 1],
        $slides[slideIndex + 2]
    ];

    findImages(slides);

}

var findImages = function(slides) {
    /*
    * Set background images on slides.
    * Should get square images for mobile.
    */

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    if ($w < 769) {
        mobileSuffix = '-sq';
    }

    _.each($(slides), function(slide) {

        getBackgroundImage(slide);
        var containedImage = $(slide).find('.contained-image-container, .contained-image');
        getBackgroundImage(containedImage);
    });
};

var getBackgroundImage = function(container) {
    /*
    * Sets the background image on a div for our fancy slides.
    */

    if ($(container).data('bgimage')) {

        var image_filename = $(container).data('bgimage').split('.')[0];
        var image_extension = '.' + $(container).data('bgimage').split('.')[1];
        var image_path = 'assets/' + image_filename + mobileSuffix + image_extension;

        if ($(container).css('background-image') === 'none') {
            $(container).css('background-image', 'url(' + image_path + ')');
        }
        if ($(container).hasClass('contained-image-container')) {
            setImages($(container));
        }

     }
};

var showNavigation = function() {
    /*
    * Nav doesn't exist by default.
    * This function loads it up.
    */

    if ($slides.first().hasClass('active')) {
        if (!$arrows.hasClass('active')) {
            animateArrows();
        }

        var $prevArrow = $arrows.filter('.prev');

        $prevArrow.removeClass('active');
        $prevArrow.css({
            //'opacity': 0,
            'display': 'none'
        });

        $('body').addClass('titlecard-nav');

        //$primaryNav.css('opacity', '1');
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
            //'opacity': 0,
            'display': 'none'
        });

        //$primaryNav.css('opacity', '1');
    } else {
        /*
        * All of the other cards? Arrows and navs.
        */
        if ($arrows.filter('active').length != $arrows.length) {
            animateArrows();
        }

        $('body').removeClass('titlecard-nav');

        //$primaryNav.css('opacity', '1');
    }
}

var animateArrows = function() {
    /*
    * Everything looks better faded. Hair; jeans; arrows.
    */
    $arrows.addClass('active');

    if ($arrows.hasClass('active')) {
        $arrows.css('display', 'block');
        fadeInArrows();
    }
};

var fadeInArrows = _.debounce(function() {
    /*
    * Debounce makes you do crazy things.
    */
    //$arrows.css('opacity', 1)
}, 1);


var setImages = function(container) {
    /*
    * Image resizer from the Wolves lightbox + sets background image on a div.
    */

    // Grab Wes's properly sized width.
    var imageWidth = w;

    // Sometimes, this is wider than the window, shich is bad.
    if (imageWidth > $w) {
        imageWidth = $w;
    }

    // Set the hight as a proportion of the image width.
    var imageHeight = ((imageWidth * aspectHeight) / aspectWidth);

    // Sometimes the lightbox width is greater than the window height.
    // Center it vertically.
    if (imageWidth > $h) {
        imageTop = (imageHeight - $h) / 2;
    }

    // Sometimes the lightbox height is greater than the window height.
    // Resize the image to fit.
    if (imageHeight > $h) {
        imageWidth = ($h * aspectWidth) / aspectHeight;
        imageHeight = $h;
    }

    // Sometimes the lightbox width is greater than the window width.
    // Resize the image to fit.
    if (imageWidth > $w) {
        imageHeight = ($w * aspectHeight) / aspectWidth;
        imageWidth = $w;
    }

    // Set the top and left offsets. Image bottom includes offset for navigation
    var imageBottom = ($h - imageHeight) / 2 + 70;
    var imageLeft = ($w - imageWidth) / 2;

    // Set styles on the map images.
    $(container).css({
        'width': imageWidth + 'px',
        'height': imageHeight + 'px',
        'bottom': imageBottom + 'px',
        'left': imageLeft + 'px',
    });

};

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    /*
    * Called when leaving a slide.
    */

    var now = moment();
    var timeOnSlide = (now - slideStartTime);

    trackEvent([EVENT_CATEGORY, 'slide-exit', slideIndex, timeOnSlide]);
}

var onResize = function(e) {
    if ($('.slide.active').hasClass('image-split')) {
        setImages($('.slide.active').find('.contained-image-container')[0]);
    }
}

var onDocumentKeyDown = function(e) {
    if (hasTrackedKeyboardNav) {
        return true;
    }

    switch (e.which) {

        //left
        case 37:

        //right
        case 39:
            trackEvent([EVENT_CATEGORY, 'keyboard-nav']);
            hasTrackedKeyboardNav = true;
            break;

        // escape
        case 27:
            break;

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
    window.top.location = NEXT_POST_URL;

    trackEvent([EVENT_CATEGORY, 'next-post']);

    return true;
}

var makeMessage = function(messageType, args) {
    var bits = ['lookatthis', messageType];
    bits.push.apply(bits, args)

    return bits.join(MESSAGE_DELIMITER);
}

var trackEvent = function(args) {
    var message = makeMessage('trackEvent', args)

    window.top.postMessage(message, '*');
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

$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $primaryNav = $('.primary-navigation');
    //$startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');

    $nextPostTitle = $('.next-post-title');
    $nextPostImage = $('.next-post-image');
    $upNext = $('.up-next');

    //$startCardButton.on('click', onStartCardButtonClick);
    $slides.on('click', onSlideClick);
    $upNext.on('click', onNextPostClick);

    $arrows.on('touchstart', fakeMobileHover);
    $arrows.on('touchend', rmFakeMobileHover);

    setUpFullPage();
    resize();

    // Redraw slides if the window resizes
    $(window).resize(resize);
    $(window).resize(onResize);
    $(document).keydown(onDocumentKeyDown);
});
