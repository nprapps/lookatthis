var VIDEO = (function() {
    var video = $('video').get(0);
    var $thisPlayerProgress = $('.video .player-progress');
    var $videoPlayedBar = $('.video .played');
    var checkForVideo = function(index) {
        var $video = $slides.eq(index).find('video');
        if ($video.length > 0) {
            if (!isTouch) {
                video.play();
                $videoControlBtn.removeClass('play').addClass('pause');

                if (NO_AUDIO) {
                    video.volume = 0;
                }
            }
        } else if ($video.length <= 0 && !isTouch) {
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
        } else {
            video.pause();
            $this.removeClass('pause').addClass('play');
        }
    }

    var onVideoEnded = function() {
        AUDIO.startAmbientAudio();
        $.deck('next');
    }

    var onVideoTimeupdate = function() {
        var duration = video.duration;
        var position = video.currentTime;
        var percentage = position / duration;

        if (position > 0) {
            $videoPlayedBar.css('width', $thisPlayerProgress.width() *percentage + 'px');
            if (percentage === 1) {
                $videoControlBtn.removeClass('pause').addClass('play');
            }
        }
    }

    return {
        'checkForVideo': checkForVideo,
        'toggleVideo': toggleVideo,
        'onVideoEnded': onVideoEnded,
        'onVideoTimeupdate': onVideoTimeupdate
    }
}());