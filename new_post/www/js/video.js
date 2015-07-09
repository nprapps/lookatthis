var VIDEO = (function() {
    var $video;
    var video;
    var $videoPlayerProgress;
    var $videoPlayedBar;
    var $videoControlBtn;

    var setupVideo = function() {
        $video = $('video');
        $videoPlayerProgress = $('.video .player-progress');
        $videoControlBtn = $('.video .control-btn');

        $video.on('ended', VIDEO.onVideoEnded);
        $video.on('timeupdate', VIDEO.onVideoTimeupdate);
        $videoPlayerProgress.on('click', onSeekBarClick);
        $videoControlBtn.on('click', onVideoControlBtnClick);

        // fix for IE11
        if (!isTouch) {
            $video.parents('.full-block-content').width(w);
            $video.parents('.full-block-content').height(h);
        } else {
            $video.attr('controls', true);
        }
    }

    var checkForVideo = function(index) {
        var $currentSlide = $slides.eq(index);
        var $thisSlideVideo = $currentSlide.find('video');
        $videoPlayedBar = $currentSlide.find('.played');

        if ($thisSlideVideo.length > 0) {
            video = $thisSlideVideo.get(0);
            if (!isTouch) {
                video.currentTime = 0;
                video.play();
                $videoControlBtn.removeClass('play').addClass('pause');

                if (NO_AUDIO) {
                    video.volume = 0;
                }
            }
        } else if ($thisSlideVideo.length <= 0 && !isTouch) {
            $video.each(function() {
                $(this).get(0).pause();
            });
        }
    }

    var toggleVideo = function($this) {
        if (video.paused) {
            video.play();
            $this.removeClass('play').addClass('pause');
            ANALYTICS.trackEvent('resume-video');
        } else {
            video.pause();
            $this.removeClass('pause').addClass('play');
            ANALYTICS.trackEvent('pause-video');
        }
    }

    var onVideoEnded = function() {
        if (isTouch) {
            video.webkitExitFullscreen();
        } else {
            $.deck('next');
        }
        ANALYTICS.trackEvent('video-ended');
    }

    var onVideoTimeupdate = function() {
        var duration = video.duration;
        var position = video.currentTime;
        var percentage = position / duration;

        if (position > 0) {
            $videoPlayedBar.css('width', $videoPlayerProgress.width() *percentage + 'px');
            if (percentage === 1) {
                $videoControlBtn.removeClass('pause').addClass('play');
            }
        }

        _trackCompletion(position, duration);
    }

    var _trackCompletion = function(position, duration) {
        var completion = position / duration;

        if (position > 5 && !fourFiveSeconds) {
            ANALYTICS.trackEvent('video-five-seconds');
            fourFiveSeconds = true;
        }

        if (completion >= 0.25 && !twentyFiveComplete) {
            ANALYTICS.trackEvent('video-completion', '0.25');
            twentyFiveComplete = true;
        } else if (completion >= 0.5 && !fiftyComplete) {
            ANALYTICS.trackEvent('video-completion', '0.50');
            fiftyComplete = true;
        } else if (completion >= 0.75 && !seventyFiveComplete) {
            ANALYTICS.trackEvent('video-completion', '0.75');
            seventyFiveComplete = true;
        }
    }

    var onSeekBarClick = function(e) {
        var duration = video.duration;

        var x;
        if (e.offsetX) {
            x = e.offsetX
        } else {
            x = e.pageX - $(this).offset().left;
        }

        var percentage = x / $(this).width();
        var clickedPosition = duration * percentage;
        video.currentTime = parseFloat(clickedPosition);
        ANALYTICS.trackEvent('video-seek');
    }

    var onVideoControlBtnClick = function(e) {
        var $this = $(this);
        e.preventDefault();
        VIDEO.toggleVideo($this);
        e.stopPropagation();
    }

    return {
        'setupVideo': setupVideo,
        'checkForVideo': checkForVideo,
        'toggleVideo': toggleVideo,
        'onVideoEnded': onVideoEnded,
        'onVideoTimeupdate': onVideoTimeupdate
    }
}());

$(document).ready(function() {
    VIDEO.setupVideo();
});