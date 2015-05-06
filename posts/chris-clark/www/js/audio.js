var AUDIO = (function() {
    var isAnimating = false;

    var setUpPlayer = function() {
        var mp3FilePath = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/chris-clark/assets/prototype/whale.mp3' : 'http://assets.apps.npr.org/lookatthis/chris-clark/prototype/whale.mp3';

        $player.jPlayer('setMedia', {
            mp3: mp3FilePath
        });

        $player.jPlayer('play');
    }

    var switchAudio = function() {
        var mp3FilePath = APP_CONFIG.DEPLOYMENT_TARGET ? APP_CONFIG.S3_BASE_URL + '/posts/chris-clark/assets/prototype/audio.mp3' : 'http://assets.apps.npr.org/lookatthis/chris-clark/prototype/audio.mp3';

        $player.jPlayer('setMedia', {
            mp3: mp3FilePath
        });

        $player.jPlayer('play');

        $play.hide();
        $pause.show();
    }

    var onTimeupdate = function(e) {
        var timeText = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
        $('.current-time').text(timeText);

        var duration = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        // implementing my own ended event everything is terrible
        if (position > 0 && position >= duration - 0.5) {
            onEnded();
        }
    }

    var onEnded = function() {
        $.deck('next');
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

    var reset = function(e) {
        e.preventDefault();
        $.deck('go', 1);
        $player.jPlayer('playHead', 0);
        $player.jPlayer('play');

        $play.hide();
        $replay.hide();
        $pause.show();
    }

    return {
        'toggleAudio': toggleAudio,
        'setUpPlayer': setUpPlayer,
        'switchAudio': switchAudio,
        'onTimeupdate': onTimeupdate,
        'reset': reset,
        'onEnded': onEnded
    }
}());