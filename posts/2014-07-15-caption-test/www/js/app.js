// Global state
var $nextPostTitle = null;
var $nextPostImage = null;
var $nextPostURL = null;
var NAV_HEIGHT = 75;

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

var onStartCardButtonClick = function() {
    $.fn.fullpage.moveSlideRight();

    // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Slideshow - Clicked Go']);
}

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
};

// after a new slide loads

var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);

    showNavigation();

    slideStartTime = moment();

    if ($slides.last().hasClass('active')) {
        // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Slideshow - Reached Last Slide']);
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

    //
    if ($w < 769 && isTouch) {
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
        /*
        * Title card gets no arrows and no nav.
        */
        $arrows.removeClass('active');
        $arrows.css({
            'opacity': 0,
            'display': 'none'
        });
        $primaryNav.css('opacity', '0');
    } else if ($slides.last().hasClass('active')) {
        /*
        * Last card gets no next arrow but does have the nav.
        */
        if (!$arrows.hasClass('active')) {
            animateArrows();
        }

        var $nextArrow = $arrows.filter('.next');

        $nextArrow.removeClass('active');
        $nextArrow.css({
            'opacity': 0,
            'display': 'none'
        });

        $primaryNav.css('opacity', '1');
    } else {
        /*
        * All of the other cards? Arrows and navs.
        */
        if ($arrows.filter('active').length != $arrows.length) {
            animateArrows();
        }

        $primaryNav.css('opacity', '1');
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
    $arrows.css('opacity', 1)
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

    // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Time on Slide', hash, timeOnSlide]);
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
            // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Navigation - Used Keyboard']);
            hasTrackedKeyboardNav = true;
            break;

        // escape
        case 27:
            break;

    }

    // jquery.fullpage handles actual scrolling
    return true;
}

var onControlArrowClick = function(e) {
    if (!hasTrackedSlideNav) {
        // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Navigation - Used Slide Controls']);
        hasTrackedSlideNav = true;
    }

    return true;
}

var receiveMessage = function(e) {
    var head = e.data.substr(0, 5);
    var tail = e.data.substr(5, e.data.length);
    if (head == 'post-') {
        var post = JSON.parse(tail);

        $nextPostTitle.text(post.title);
        $nextPostImage.attr('src', post.image);
        $nextPostURL.attr('href', post.url);
    }
}

$(document).ready(function() {
    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $primaryNav = $('.primary-navigation');
    $startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');

    $nextPostTitle = $('.next-post-title');
    $nextPostImage = $('.next-post-image');
    $nextPostURL = $('.next-post-url');

    setUpFullPage();
    resize();

    $startCardButton.on('click', onStartCardButtonClick);
    $arrows.on('click', onControlArrowClick);

    // Redraw slides if the window resizes
    $(window).resize(resize);
    $(window).resize(onResize);
    $(document).keydown(onDocumentKeyDown);

    window.addEventListener('message', receiveMessage, false);

    window.top.postMessage('handshake', '*');
});