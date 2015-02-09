var AUDIO = (function() {
    var setUpPlayer = function() {
        $playerWrapper.show();
        $player.jPlayer('play');

        $play.hide();
        $pause.show();
    }

    var onTimeupdate = function(e) {
        var timeText = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
        $('.current-time').text(timeText);

        // var totalTime = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        // // animate progress bar
        // var percentage = position / totalTime;

        // $('.bar').width($('.player-progress').width() * percentage);

        if (position > slideSwitchTime && slideSwitchTime !== null) {
            $.fn.fullpage.moveSlideRight();
        }

        if ($animatedElements) {
            for (var i = 0; i < $animatedElements.length; i++) {
                var entranceTime = $animatedElements.eq(i).data('entrance');
                var exitTime = $animatedElements.eq(i).data('exit');

                if (position > entranceTime) {
                    $animatedElements.eq(i).css('opacity', 1);
                }
                if (position > exitTime) {
                    $animatedElements.eq(i).css('opacity', 0);
                }
            }
        }

    }

    var _resumePlayer = function() {
        $player.jPlayer('play');
    }

    var _pausePlayer = function(end) {
        $player.jPlayer('pause');
        if (end) {
            $playedBar.css('width', $thisPlayerProgress.width() + 'px');
        }
    }

    var toggleAudio = function(e) {
        e.preventDefault();
        if ($player.data().jPlayer.status.paused) {
            _resumePlayer();
            $play.hide();
            $pause.show();
        } else {
            _pausePlayer(false);
            $play.show();
            $pause.hide();
        }
    }

    return {
        'toggleAudio': toggleAudio,
        'setUpPlayer': setUpPlayer,
        'onTimeupdate': onTimeupdate
    }
}());