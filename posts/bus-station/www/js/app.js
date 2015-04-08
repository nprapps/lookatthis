// Global state
var $upNext = null;
var $w;
var $h;
var $slides;
var $arrows;
var $nextArrow;
var $startCardButton;
var $controlBtn;
var $thisPlayerProgress;
var $playedBar;
var $subtitleWrapper;
var $subtitles;
var $slideTitle;
var $ambientPlayer;
var $narrativePlayer;
var $share;
var $shareModal;
var $progressIndicator
var $currentProgress;
var $support;
var $supportBtn;
var $question;
var $careStory;
var $careStoryBtns;
var $email;
var $emailBtn;
var isTouch = Modernizr.touch;
var mobileSuffix;
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var completion = 0;
var arrowTest;
var progressTest;
var conclusionTest;
var firstRightArrowClicked = false;
var presentedConclusion = false;
// var hammer;
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var visibilityProperty = null;

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
        keyboardScrolling: false,
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
    AUDIO.checkForAudio(slideAnchor);
    animateProgress(slideIndex);

    if (slideIndex === 0) {
        $share.hide();
    } else {
        $share.show();
    }

    if (slideIndex === $slides.length - 1) {
        buildConclusionSlide();
    }

    // Completion tracking
    how_far = (slideIndex + 1) / ($slides.length - 1);

    if (how_far >= completion + 0.25) {
        completion = how_far - (how_far % 0.25);

        if (completion === 0.25) {
            ANALYTICS.completeTwentyFivePercent(progressTest);
        }
        else if (completion === 0.5) {
            ANALYTICS.completeFiftyPercent(progressTest);
        }
        else if (completion === 0.75) {
            ANALYTICS.completeSeventyFivePercent(progressTest);
        }
        else if (completion === 1) {
            ANALYTICS.completeOneHundredPercent(progressTest);
        }
    }
};

var setSlidesForLazyLoading = function(slideIndex) {
    /*
    * Sets up a list of slides based on your position in the deck.
    * Lazy-loads images in future slides because of reasons.
    */
    var slides = [
        $slides.eq(slideIndex),
        $slides.eq(slideIndex + 1),
        $slides.eq(slideIndex + 2),
        $slides.eq(slideIndex + 3),
        $slides.eq(slideIndex + 4)
    ];

    // Mobile suffix should be blank by default.
    mobileSuffix = '';
    /*
    if ($w < 769) {
        mobileSuffix = '-sq';
    }*/

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

var showNavigation = function() {
    /*
    * Nav doesn't exist by default.
    * This function loads it up.
    */

    if ($slides.first().hasClass('active')) {
        /*
        * Don't show arrows on titlecard
        */
        $arrows.hide();
    }

    else if ($slides.last().hasClass('active')) {
        /*
        * Last card gets no next arrow but does have the nav.
        */
        if (!$arrows.hasClass('active')) {
            showArrows();
        }

        $nextArrow.removeClass('active');
        $nextArrow.hide();
    } else if ($slides.eq(1).hasClass('active')) {
        showArrows();

        switch (arrowTest) {
            case 'bright-arrow':
                $nextArrow.addClass('titlecard-nav');
                break;
            case 'bouncy-arrow':
                $nextArrow.addClass('shake animated titlecard-nav');
                break;
            default:
                break;
        }

        $nextArrow.on('click', onFirstRightArrowClick);
    } else {
        /*
        * All of the other cards? Arrows and navs.
        */
        if ($arrows.filter('active').length != $arrows.length) {
            showArrows();
        }
        $nextArrow.removeClass('shake animated titlecard-nav');

        $nextArrow.off('click', onFirstRightArrowClick);
    }

    if (progressTest === 'progress-bar') {
        $progressIndicator.show();
    }
}

var showArrows = function() {
    /*
    * Show the arrows.
    */
    $arrows.addClass('active');
    $arrows.show();
};

var determineTest = function(possibleTests) {
    var test = possibleTests[getRandomInt(0, possibleTests.length)]
    return test
}

var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/*var setCustomVars = function() {
    ANALYTICS.setCustomVar(40, 'progress-test', progressTest);
}*/

var buildConclusionSlide = function() {
    ANALYTICS.trackEvent('tests-run', conclusionTest);

    if (!presentedConclusion) {
        presentedConclusion = true;
        if (conclusionTest === 'no-question') {
            $support.show();
        } else {
            $question.text(COPY['post_metadata'][conclusionTest]);
            $careStory.show();
        }
    }

}

var onCareStoryBtnClick = function(e) {
    e.preventDefault();

    var $this = $(this);

    $careStory.hide();

    if ($this.hasClass('yes')) {
        ANALYTICS.trackEvent('like-story-yes', conclusionTest);
        $support.show();
    } else {
        ANALYTICS.trackEvent('like-story-no', conclusionTest);
        $email.show();
    }
}

var onSupportBtnClick = function(e) {
    e.preventDefault();

    var $this = $(this);
    var link = $this.attr('href');

    ANALYTICS.trackEvent('support-btn-click', conclusionTest);

    window.top.location = link
    return true;
}

var onEmailBtnClick = function() {
    ANALYTICS.trackEvent('email-btn-click', conclusionTest);
}

var animateProgress = function(index) {
    var totalSlides = $slides.length;
    var percentage = (index + 1) / totalSlides;
    $currentProgress.css('width', percentage * 100 + '%');

    if (index === 0) {
        $progressIndicator.width(0);
    } else {
        $progressIndicator.width('100%');
    }
}

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    /*
    * Called when leaving a slide.
    */
    ANALYTICS.exitSlide(slideIndex.toString());
}

var onFirstRightArrowClick = function() {
    if (firstRightArrowClicked === false) {
        ANALYTICS.firstRightArrowClick(arrowTest);
        firstRightArrowClicked = true;
    }
}

var onStartCardButtonClick = function() {
    ANALYTICS.trackEvent('begin');

    $.fn.fullpage.moveSlideRight();
    if (isTouch) {
        AUDIO.fakeAmbientPlayer();
        AUDIO.fakeNarrativePlayer();
    }
}

var onDocumentKeyDown = function(e) {
    if (e.which === 37 || e.which === 39) {
        ANALYTICS.useKeyboardNavigation();
        if (e.which === 37) {
            $.fn.fullpage.moveSlideLeft();
        } else if (e.which === 39) {
            $.fn.fullpage.moveSlideRight();
        }
    }
    // jquery.fullpage handles actual scrolling
    return true;
}

var onSlideClick = function(e) {
    if (isTouch) {
        if ($slides.first().hasClass('active')) {
            AUDIO.fakeAmbientPlayer();
            AUDIO.fakeNarrativePlayer();
        }
        $.fn.fullpage.moveSlideRight();
    }
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
        'background-color': 'rgba(0, 0, 0, 0.5)',
        'color': '#fff',
        'opacity': .5
    });
}

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    ANALYTICS.copySummary();
}

var onControlBtnClick = function(e) {
    e.preventDefault();
    AUDIO.toggleNarrativeAudio();
    ANALYTICS.trackEvent('pause-button');

    e.stopPropagation();
}

var onVisibilityChange = function() {
    AUDIO.toggleAllAudio();
}

var getHiddenProperty = function() {
    var prefixes = ['webkit','moz','ms','o'];

    // if 'hidden' is natively supported just return it
    if ('hidden' in document) return 'hidden';

    // otherwise loop over all the known prefixes until we find one
    for (var i = 0; i < prefixes.length; i++){
        if ((prefixes[i] + 'Hidden') in document)
            return prefixes[i] + 'Hidden';
    }

    // otherwise it's not supported
    return null;
}

var isHidden = function() {
    var prop = getHiddenProperty();
    if (!prop) return false;

    return document[prop];
}


/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    ANALYTICS.openShareDiscuss();
}

/*
 * Share modal closed.
 */
var onShareModalHidden = function(e) {
    ANALYTICS.closeShareDiscuss();
}


$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides = $('.slide');
    $navButton = $('.primary-navigation-btn');
    $startCardButton = $('.btn-go');
    $arrows = $('.controlArrow');
    $nextArrow = $arrows.filter('.next');
    $upNext = $('.up-next');
    $controlBtn = $('.control-btn');
    $narrativePlayer = $('#narrative-player');
    $ambientPlayer = $('#ambient-player');
    $share = $('.share');
    $shareModal = $('#share-modal')
    $progressIndicator = $('.progress-indicator');
    $currentProgress = $('.current-progress');
    $support = $('.support')
    $supportBtn = $('.support-btn');
    $careStory = $('.care-story');
    $question = $('.question');
    $careStoryBtns = $('.care-story-btn');
    $email = $('.email');
    $emailBtn = $('.email-btn');

    arrowTest = determineTest(['faded-arrow', 'bright-arrow', 'bouncy-arrow']);
    progressTest = determineTest(['progress-bar', 'no-progress-bar']);
    conclusionTest = determineTest(['no-question', 'question_a', 'question_b', 'question_c', 'question_d']);

    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $startCardButton.on('click', onStartCardButtonClick);
    $slides.on('click', onSlideClick);
    $controlBtn.on('click', onControlBtnClick);
    $arrows.on('touchstart', fakeMobileHover);
    $arrows.on('touchend', rmFakeMobileHover);
    $careStoryBtns.on('click', onCareStoryBtnClick);
    $supportBtn.on('click', onSupportBtnClick);
    $emailBtn.on('click', onEmailBtnClick);
    $(document).keydown(onDocumentKeyDown);

    AUDIO.setUpNarrativePlayer();
    AUDIO.setUpAmbientPlayer();
    setUpFullPage();
    resize();
   // setCustomVars();

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);

    // listen for page visibility changes
    visibilityProperty = getHiddenProperty();
    if (visibilityProperty) {
        var evtname = visibilityProperty.replace(/[H|h]idden/,'') + 'visibilitychange';
        document.addEventListener(evtname, onVisibilityChange);
    }
});