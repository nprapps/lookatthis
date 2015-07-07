var VIDEO = (function() {
    var $video;
    var video;
    var $videoPlayerProgress;
    var $videoPlayedBar;

    var setupVideo = function() {
        $video = $('video');
        video = $('video').get(0);
        $videoPlayerProgress = $('.video .player-progress');
        $videoPlayedBar = $('.video .played');

        $video.on('ended', VIDEO.onVideoEnded);
        $video.on('timeupdate', VIDEO.onVideoTimeupdate);
        $videoPlayerProgress.on('click', onSeekBarClick);
    }

    var checkForVideo = function(index) {
        var $thisSlideVideo = $slides.eq(index).find('video');
        if ($thisSlideVideo.length > 0) {
            if (!isTouch) {
                video.play();
                $videoControlBtn.removeClass('play').addClass('pause');

                if (NO_AUDIO) {
                    video.volume = 0;
                }
            }
        } else if ($thisSlideVideo.length <= 0 && !isTouch) {
            $videos.each(function() {
                $(this).get(0).currentTime = 0;
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
        $.deck('next');
        if (isTouch) {
            video.webkitExitFullscreen();
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

    return {
        'setupVideo': setupVideo,
        'checkForVideo': checkForVideo,
        'toggleVideo': toggleVideo,
        'onVideoEnded': onVideoEnded,
        'onVideoTimeupdate': onVideoTimeupdate
    }
}());