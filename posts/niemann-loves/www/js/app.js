// Global state
var $nextPostTitle = null;
var $nextPostImage = null;
var $upNext = null;
var NAV_HEIGHT = 75;
// TODO: use deploy slug
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
    
    resizeThePic();
};


/*
var featPic = $('#feat-pic'); // Get my img elem
var pic_real_width, pic_real_height;
$('#feat-pic') // Make in memory copy of image to avoid css issues
.attr('src', $('#feat-pic').attr('src'))
.load(function() {
    pic_real_width = this.width;   // Note: $(this).width() will not
    pic_real_height = this.height; // work for in memory images.
    console.log(pic_real_width, pic_real_height);
    
    if (pic_real_width > pic_real_height) {
        console.log("wider");
    } else {
        console.log("taller");
    }
});
*/

var fitPic = function() {
    $("#the-pic").toggleClass("fitme");
    resizeThePic();
};

 $('#toggle-bg').click(function() {
      $("#the-pic").toggleClass("fitme");
      resizeThePic();
    });

var resizeThePic = function(){
    
    //if we're in fit mode, do this stuff
    
    if($("#the-pic").hasClass('fitme')){
        var aspect = window.innerWidth / window.innerHeight;
        
        var imageAspect = 16/9;
        
        //TODO: get the real ratio, either hardcoded or calculated
        
        //if we're trying to fit a vertical image
        
        //else its a horizontal image
        
        if (aspect > imageAspect) {
            
            if (imageAspect > 1) { //horiz
                $("#the-pic").css('width',(100 * (imageAspect) / aspect) + 'vw');                
            } else { // vertical
                $("#the-pic").css('height',(100 * (imageAspect) / aspect) + 'vh');            
            }

        } else {
            $("#the-pic").css('width',"100vw");
        }
        
        console.log('fitting');
    }
};



var setUpFullPage = function() {
    $.fn.fullpage({
        autoScrolling: false,
        verticalCentered: false,
        fixedElements: '.primary-navigation, .audio-controls, #photo-detail, .photo-modal-trigger',
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

        trackEvent([EVENT_CATEGORY, 'completion', completion.toString()]);
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

   /* if ($w < 769) {
        mobileSuffix = '-sq';
    }*/

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
            'display': 'none'
        });
        
        $('body').addClass('final-slide');

    } else {
        /*
        * All of the other cards? Arrows and navs.
        */
        if ($arrows.filter('active').length != $arrows.length) {
            animateArrows();
        }

        $('body').removeClass('titlecard-nav');
        $('body').removeClass('final-slide');
        
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

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    /*
    * Called when leaving a slide.
    */

    var now = moment();
    var timeOnSlide = (now - slideStartTime);

    trackEvent([EVENT_CATEGORY, 'slide-exit', slideIndex.toString(), timeOnSlide]);
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

var onNextPostClick = function(e) {
    window.top.location = NEXT_POST_URL;

    trackEvent([EVENT_CATEGORY, 'next-post']);

    return true;
}

var trackEvent = function(args) {
    args.splice(0, 0, '_trackEvent');
    _gaq.push(args)
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
    $navButton = $('.primary-navigation-btn');
    $primaryNav = $('.primary-navigation');
    //$startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');

    $nextPostTitle = $('.next-post-title');
    $nextPostImage = $('.next-post-image');
    $upNext = $('.up-next');

    $upNext.on('click', onNextPostClick);

    $arrows.on('touchstart', fakeMobileHover);
    $arrows.on('touchend', rmFakeMobileHover);

   

    setUpFullPage();
    resize();
    
    //audio
	
	$('#moodmusic').mediaelementplayer({
        audioWidth: '100%',
        audioHeight: 50,
        features: ['playpause','progress'],
            
    });
    
    var audiolab = $("#moodmusic")[0];
    
    $(".btn-go").click(function() {
        $.fn.fullpage.moveSlideRight();
        $(".audio-reveal").addClass("active");
        audiolab.play();
      
    });

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);
    $(document).keydown(onDocumentKeyDown);
});
