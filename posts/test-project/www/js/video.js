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
    }

    var onSeekBarClick = function(e) {
        var duration = video.duration;
        var percentage = e.offsetX / $(this).width();
        var clickedPosition = duration * percentage;
        video.currentTime = clickedPosition;
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