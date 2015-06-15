var VIDEO = (function() {
    var toggleVideo = function(index) {
        var $video = $slides.eq(index).find('video');
        if ($video.length > 0) {
            var video = $video.get(0);

            if (!isTouch) {
                video.play();

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

    var onVideoEnded = function() {
        AUDIO.startAmbientAudio();
        $.deck('next');
    }

    return {
        'toggleVideo': toggleVideo,
        'onVideoEnded': onVideoEnded
    }
}());