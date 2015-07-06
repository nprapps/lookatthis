var TESTS = (function() {
    var $likeStory;
    var $likeStoryButtons;
    var $facebook;
    var $facebookBtn;
    var $support;
    var $supportBtn;
    var $didNotLike;
    var $dislikeEmail;

    var setupConclusion = function() {
        $likeStory = $('.like-story');
        $likeStoryButtons = $('.btn-like-story');
        $facebook = $('.facebook');
        $facebookBtn = $('.btn-facebook');
        $support = $('.support');
        $supportBtn = $('.btn-support');
        $didNotLike = $('.did-not-like');
        $dislikeEmail = $('.dislike-email');

        $likeStoryButtons.on('click', onLikeStoryButtonsClick);
        $facebookBtn.on('click', onFacebookBtnClick);
        $supportBtn.on('click', onSupportBtnClick);
        $dislikeEmail.on('click', onDislikeEmailClick);
    }

    var determineTests = function() {
        var possibleCallToActionTests = ['facebook', 'support'];

        callToActionTest = possibleCallToActionTests[getRandomInt(0, possibleCallToActionTests.length)];
    }

    var getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    var onLikeStoryButtonsClick = function(e) {
        e.preventDefault();

        $likeStory.hide();

        if ($(this).hasClass('yes')) {
            ANALYTICS.trackEvent('like-story-yes', callToActionTest);

            if (callToActionTest === 'facebook') {
                $facebook.show();
            } else {
                $emailStory.show();
            }
        } else {
            ANALYTICS.trackEvent('like-story-no');
            $didNotLike.show();
        }
    }

    var onFacebookBtnClick = function(e) {
        e.preventDefault();

        var $this = $(this);
        var link = $this.attr('href');

        ANALYTICS.trackEvent('facebook-share');

        window.top.location = link
        return true;
    }

    var onSupportBtnClick = function(e) {
        e.preventDefault();

        var $this = $(this);
        var link = $this.attr('href');

        ANALYTICS.trackEvent('support-btn-click');

        window.top.location = link
        return true;
    }

    var onDislikeEmailClick = function() {
        ANALYTICS.trackEvent('email-btn-click');
    }

    return {
        'setupConclusion': setupConclusion,
        'determineTests': determineTests
    }
}());

$(document).ready(function() {
    TESTS.determineTests();
    TESTS.setupConclusion();
});