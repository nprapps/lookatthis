var $progressIndicator;
var $currentProgress;

var PROGRESS_BAR = (function() {
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

    return {
        'animateProgress': animateProgress
    }
}());

$(document).ready(function() {
    $progressIndicator = $('.progress-indicator');
    $currentProgress = $('.current-progress');
});