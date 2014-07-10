// Global state
var pymChild = null;
var $reblog = null;
var $like = null;
var $share = null;
var $notes = null;
var $nextPostTitle = null;
var $nextPostImage = null;
var $nextPostURL = null;

var $w;
var $h;
var $slides;

var onParentPost = function(data) {
    data = JSON.parse(data);

    var nextPost = data.next_post;

    console.log(data);

    $nextPostTitle.text(nextPost.title);
    $nextPostImage.attr('src', nextPost.image);
    $nextPostURL.attr('href', nextPost.url);

}

var setUpFullPage = function() {
    anchors = [];
    var anchor_count = 0;
    var bad_sections = [undefined, 'introduction'];

   _.each($slides, function(section, index, list) {
        /*
        * Sets up the anchor list, used elsewhere for navigation and such.
        */
        var anchor = $(section).data('anchor');
        if (bad_sections.indexOf(anchor) > -1) {
            return false;
        }
        anchors.push(anchor);

        /*
        * Numbers the stories according to their position.
        * Automates the appearance of the story numbers in the HTML.
        */
        var story_number = 'Story ' + anchor_count;
        $($(section).find('h4.story-number')[0]).html(story_number);
        $($('div.nav div.' + anchor + ' h4 em')[0]).html(story_number);
        anchor_count = anchor_count + 1;
    });

    $.fn.fullpage({
        autoScrolling: false,
        anchors: anchors,
        menu: '.nav',
        verticalCentered: false,
        fixedElements: '.primary-navigation, .nav',
        resize: false,
        css3: true,
        loopHorizontal: false,
        afterRender: onPageLoad,
        afterSlideLoad: lazyLoad,
        onSlideLeave: onSlideLeave
    });
};

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

var onPageLoad = function() {
    setSlidesForLazyLoading(0)
    $('body').css('opacity', 1);
};

// after a new slide loads

var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);

    slideStartTime = moment();

    if ($slides.last().hasClass('active')) {
        _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Slideshow - Reached Last Slide']);
    }
};

var setSlidesForLazyLoading = function(slideIndex) {
    /*
    * Sets up a list of slides based on your position in the deck.
    * Lazy-loads images in future slides because of reasons.
    */
    var thisSlide = $slides[slideIndex];
    var nextSlide = $slides[slideIndex + 1]

    if ($(thisSlide).data('anchor')) {
        currentSection = $(thisSlide).data('anchor');
        for (i=0; i < anchors.length; i++) {
            if (anchors[i] === currentSection) {
                currentSectionIndex = i;
            }
        }
    };

    var slides = [
        $slides[slideIndex - 2],
        $slides[slideIndex - 1],
        thisSlide,
        nextSlide,
        $slides[slideIndex + 2]
    ];

    findImages(slides);

    if (!$jplayer && $(thisSlide).hasClass('video')) {
        setupVideoPlayer();
    }
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
        var image_path = 'assets/img/' + image_filename + mobileSuffix + image_extension;

        if ($(container).css('background-image') === 'none') {
            $(container).css('background-image', 'url(' + image_path + ')');
        }
        if ($(container).hasClass('contained-image-container')) {
            setImages($(container));
        }

     }
};

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
    var thisSlide = $slides[slideIndex];

    if ($jplayer && $(thisSlide).hasClass('video')) {
        $(thisSlide).removeClass('video-playing');
        stopVideo();
    }

    var now = moment();
    var timeOnSlide = (now - slideStartTime);

    var hash = window.location.hash;

    if (hash[0] == '#') {
        hash = hash.substring(1);
    }

    _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Time on Slide', hash, timeOnSlide]);
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
            _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Navigation - Used Keyboard']);
            hasTrackedKeyboardNav = true;
            break;

        // escape
        case 27:
            animateNav();
            break;

    }


    // jquery.fullpage handles actual scrolling
    return true;
}

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {

    $reblog = $('.reblog');
    $like = $('.like');
    $share = $('.share');
    $notes = $('.notes');
    $nextPostTitle = $('.next-post-title');
    $nextPostImage = $('.next-post-image');
    $nextPostURL = $('.next-post-url');

    $slides = $('.slide');
    $components = $('.component');

    pymChild = new pym.Child();

    pymChild.on('post', onParentPost);
    pymChild.sendMessageToParent('handshake', 'b');

    setUpFullPage();
    resize();

    // Redraw slides if the window resizes
    $(window).resize(resize);
    $(window).resize(onResize);
    $(document).keydown(onDocumentKeyDown);
};

$(onDocumentLoad);
