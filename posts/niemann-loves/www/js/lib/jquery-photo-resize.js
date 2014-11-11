/*
 * Copyright © 2012 by Scott Perry
 * Released under the MIT License; its terms are at the end of this file.
 *
 * This file depends on:
 * • jQuery (tested against 1.7.1)
 *   http://jquery.com/
 *
 * Basic logic of this file:
 * + if irsz_auto is true
 *   • when each image is loaded, each image is resized to fit with a smooth animation.
 *   • when the viewport is resized, each image is resized to fit as the window changes size.
 * • when the image is clicked, it toggles (smooth animation) between resized to fit and full size
 *
 * resized to fit means:
 * + if image aspect ratio is more extreme (less square) than 2:1/1:2
 *   • scale the smaller dimension between irsz_min_* and the original size,
 *     intermediates correspond to the dimension of the viewport minus irsz_padding[#]
 * - if the aspect ratio is sane
 *   • scale the image between irsz_min_* and the original size,
 *     intermediates fitting both dimensions within the viewport minus irsz_padding[#]
 */

var irsz_selector = ".feature-pic",
    irsz_min_height = 100,
    irsz_min_width = 100,
    irsz_auto = true,
    irsz_padding = [0, 0];

(function() {
    $(document).ready(function() {
        $(irsz_selector).load(function() {
            if (irsz_auto) {
                image_fit(this, true);
            }
        });

        $(window).resize(function() {
            if (irsz_auto) {
                $(irsz_selector).each(function(i, e) {
                    image_fit(e, false);
                });
            }
        });

        $(irsz_selector).each(function(i, e) {
            $(e).click(function() {
                image_toggle(this, true);
                return false;
            });
        })
    });

    function image_toggle(image, animate) {
        $("<img/>") // Make in memory copy of image to avoid css issues
        .attr("src", $(image).attr("src"))
            .load(function() {
                var actual_width = this.width, // Note: $(this).width() will not
                    actual_height = this.height; // work for in-memory images.

                // check both dimensions in case there's a bug elsewhere we're resetting
                if ($(image).width() < actual_width || $(image).height < actual_height) {
                    image_resize(image, actual_width, actual_height, animate);
                } else {
                    image_fit(image, animate);
                }
            });
    }

    function image_fit(image, animate) {
        $("<img/>") // Make in memory copy of image to avoid css issues
        .attr("src", $(image).attr("src"))
            .load(function() {
                var actual_width = this.width, // Note: $(this).width() will not
                    actual_height = this.height, // work for in-memory images.
                    aspect_ratio = Math.max(this.width / this.height, this.height / this.width),
                    target_width = $(window).width() - irsz_padding[0],
                    target_height = $(window).height() - irsz_padding[1],
                    new_height = 0,
                    new_width = 0,
                    w_width, w_height, h_width, h_height;

                // do not bother with images that are already smaller than the minima
                if (actual_height < irsz_min_height) {
                    return;
                }
                if (actual_width < irsz_min_width) {
                    return;
                }

                function compute_width(height) {
                    return Math.round(actual_width * height / actual_height);
                }

                function compute_height(width) {
                    return Math.round(actual_height * width / actual_width);
                }

                if (aspect_ratio > 2) {
                    // if ratio > 2, check and fit to *smaller* image dimension (assume image intended to be scrolled)
                    if (actual_width < actual_height) {
                        new_width = target_width > irsz_min_width ? target_width : irsz_min_width;
                        new_height = compute_height(new_width);
                    } else {
                        new_height = target_height > irsz_min_height ? target_height : irsz_min_height;
                        new_width = compute_width(new_height);
                    }
                } else {
                    // fit image entirely within viewport
                    w_width = target_width > irsz_min_width ? target_width : irsz_min_width;
                    w_height = compute_height(w_width);
                    h_height = target_height > irsz_min_height ? target_height : irsz_min_height;
                    h_width = compute_width(h_height);

                    // do not enlarge image beyond its limits
                    w_width = w_width < actual_width ? w_width : actual_width;
                    w_height = w_height < actual_height ? w_height : actual_height;
                    h_width = h_width < actual_width ? h_width : actual_width;
                    h_height = h_height < actual_height ? h_height : actual_height;

                    if (w_height > h_height) {
                        // width-based dimensions are too tall
                        new_width = h_width;
                        new_height = h_height;
                    } else {
                        // height-based dimensions are too wide/just right
                        new_width = w_width;
                        new_height = w_height;
                    }
                }

                if (new_height != $(image).height() && new_height <= actual_height) {
                    //console.log("need to change size to "+new_width+"x"+new_height+", currently "+$(image).width()+"x"+$(image).height());
                    image_resize(image, new_width, new_height, animate);
                }
            });
    }

    function image_resize(image, new_width, new_height, animate) {
        if (animate) {
            $(image).animate({
                width: new_width + "px",
                height: new_height + "px"
            }, 0);
            
        } else {
            image.style.height = new_height + "px";
            image.style.width = new_width + "px";
        }
        $(".pic-wrap").animate({
                width: new_width + "px"
        }, 0);
    }
})();