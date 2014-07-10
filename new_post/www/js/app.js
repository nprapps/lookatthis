// Global state
var $nextPostTitle = null;
var $nextPostImage = null;
var $nextPostURL = null;
var NAV_HEIGHT = 75;
var EVENT_CATEGORY = 'Borderland';

var $w;
var $h;
var $slides;
var $components;
var $portraits;
var $video;
var $primaryNav;
var $navButton;
var $nav;
var $navItems;
var $secondaryNav;
var $arrows;
var $sectionNav;
var $closeNavButton;
var currentSection = '_'
var currentSectionIndex = 0;
var anchors;
var mobileSuffix;
var player;
var isTouch = Modernizr.touch;
var isIPhone = false;
var active_counter = null;
var begin = moment();
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var $jplayer = null;
var hasTrackedKeyboardNav = false;
var hasTrackedSlideNav = false;
var hasTrackedSectionNav = false;
var slideStartTime = moment();

var onTitleCardButtonClick = function() {
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
        var fade = _.debounce(fadeInArrows, 1);
        fade();
    }
};

var fadeInArrows = function() {
    /*
    * Debounce makes you do crazy things.
    */
    $arrows.css('opacity', 1)
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

    // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Time on Slide', hash, timeOnSlide]);
}

var animateNav = function() {
    $nav.toggleClass('active');
    if ($nav.hasClass('active')) {
        $nav.css('display', 'block');
        var fade = _.debounce(fadeInNav, 1);
        fade();
    }
    else {
        $nav.css('opacity', 0);
        var fade = _.debounce(fadeOutNav, 500);
        fade();
    }
}

var fadeInNav = function() {
    /*
    * Separate function because you can't pass an argument to a debounced function.
    */
    $nav.css('opacity', 1);
};

var fadeOutNav = function() {
    /*
    * Separate function because you can't pass an argument to a debounced function.
    */
    $nav.css('display', 'none');
};

var setupVideoPlayer = function() {
    /*
    * Setup jPlayer.
    */
    var computePlayerHeight = function() {
        return ($h - ($('.jp-interface').height() + NAV_HEIGHT))
    }

    $jplayer = $('.jp-jplayer').jPlayer({
        ready: function () {
            $(this).jPlayer('setMedia', {
                poster: '../assets/img/junior/junior.jpg',
                m4v: 'http://pd.npr.org/npr-mp4/npr/nprvid/2014/03/20140328_nprvid_junior-n-600000.mp4',
                webmv: '../assets/img/junior/junior-final.webm'
            });
        },
        play: function (){
            if (!isIPhone) {
                $('.jp-current-time').removeClass('hide');
                $('.jp-duration').addClass('hide');
            }

            // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Video - Play']);
        },
        ended: function(){
            if (!isIPhone) {
                $('.jp-current-time').addClass('hide');
                $('.jp-duration').removeClass('hide');
            }

            // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Video - Ended']);
        },
        size: {
            width: $w,
            height: computePlayerHeight() + 'px'
        },
        swfPath: 'js/lib',
        supplied: 'm4v, webmv',
        loop: false
    });

    $(window).resize(function() {
        $jplayer.jPlayer('option', { 'size': {
            width: $w,
            height: computePlayerHeight() + 'px'
        }});
    });
};

var startVideo = function() {
    if (!isIPhone) {
        $(this).parents('.slide.video').addClass('video-playing');
    }
    $('.jp-jplayer').jPlayer('play');
}

var stopVideo = function() {
    $('.jp-jplayer').jPlayer('stop');
}

var setTimeOnSite = function(e) {
    /*
    * Differrence between now and when you loaded the page, formatted all nice.
    */
    var now = moment();
    var miliseconds = (now - begin);

    var minutes = humanize.numberFormat(Math.floor(miliseconds/1000/60), decimals=0);
    var seconds = humanize.numberFormat(Math.floor((miliseconds/1000) % 60), decimals=0);

    $('div.stats h3 span.minutes').html(minutes);
    $('div.stats h3 span.seconds').html(seconds);
}

var onUpdateCounts = function(e) {
    /*
    * Updates the count based on elapsed time and known rates.
    */
    var now = moment();
    var elapsed_seconds = (now - begin) / 1000;
    var RATES = [
        ['marijuana', 0.08844],
        ['cocaine', 0.01116],
        ['illegal-entry', 0.01065],
        ['vehicles', 2.15096],
        ['pedestrians', 1.30102]
    ]

    _.each(RATES, function(count, i){
        var count_category = count[0];
        var count_number = count[1];
        var count_unit = count[2];
        var number = humanize.numberFormat(count_number * elapsed_seconds, decimals=0, thousandsSep = ',');
        $('#' + count_category + ' span.number').html(number);
    });

    setTimeOnSite();
};

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
            animateNav();
            break;

    }

    // jquery.fullpage handles actual scrolling
    return true;
}

var onSectionNavClick = function(e) {
    if (!hasTrackedSectionNav) {
        // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Navigation - Used Section Nav']);
        hasTrackedSectionNav = true;
    }

    return true;
}

var onControlArrowClick = function(e) {
    if (!hasTrackedSlideNav) {
        // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Navigation - Used Slide Controls']);
        hasTrackedSlideNav = true;
    }

    return true;
}

var loadSectionNavImages = function() {
    $('.section-tease').each(function(i, el) {
        var $el = $(el);
        var small = $el.data('menu-image-small');
        var large = $el.data('menu-image-large');


        var css = "url('assets/img/";

        // Tablets get larger images
        if ($w <= 991 && $w >= 768) {
            css += large;
        } else {
            css += small;
        }

        css += "')";

        $el.css('background-image', css);
    });
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
    $playVideo = $('.btn-video');
    $video = $('.video');
    $components = $('.component');
    $portraits = $('.section[data-anchor="people"] .slide')
    $navButton = $('.primary-navigation-btn');
    $primaryNav = $('.primary-navigation');
    $nav = $('.nav');
    $navItems = $('.nav .section-tease');
    $secondaryNav = $('.secondary-nav-btn');
    $sectionNav = $('.section-nav');
    $titleCardButton = $('.btn-play');
    $arrows = $('.controlArrow');
    $closeNavButton = $nav.find('.back');
    $nextPostTitle = $('.next-post-title');
    $nextPostImage = $('.next-post-image');
    $nextPostURL = $('.next-post-url');

    var hash = window.location.hash;

    if (hash) {
        if (hash[0] == '#') {
            hash = hash.substring(1);
        }

        if (hash && hash != '_' && hash != '_/') {
            // _gaq.push(['_trackEvent', EVENT_CATEGORY, 'Arrived via Deep Link', hash]);
        }
    }

    // Special case iphone for handling video
    if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
        isIPhone = true;
    }

    setUpFullPage();
    resize();

    $playVideo.on('click', startVideo);
    $navButton.on('click', animateNav);
    $navItems.on('click', animateNav);
    $secondaryNav.on('click', animateNav);
    $sectionNav.on('click', onSectionNavClick);
    $titleCardButton.on('click', onTitleCardButtonClick);
    $arrows.on('click', onControlArrowClick);
    $closeNavButton.on('click', animateNav);

    active_counter = setInterval(onUpdateCounts,500);

    // Redraw slides if the window resizes
    $(window).resize(resize);
    $(window).resize(onResize);
    $(document).keydown(onDocumentKeyDown);

    loadSectionNavImages();

    window.addEventListener('message', receiveMessage, false);

    window.top.postMessage('handshake', '*');
});