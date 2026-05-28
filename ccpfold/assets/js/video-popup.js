// Video popup initialization
$(document).ready(function() {
  // Initialize Magnific Popup for video
  $('.popup-video').magnificPopup({
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,
    fixedContentPos: false,
    iframe: {
      markup: '<div class="mfp-iframe-scaler">'+
                '<div class="mfp-close"></div>'+
                '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
              '</div>',
      patterns: {
        youtube: {
          index: 'youtube.com/',
          id: function (url) {
            var match = url.match(/[?&]v=([^?&]+)/);
            return match && match[1] ? match[1] : url;
          },
          src: 'https://www.youtube.com/embed/%id%?autoplay=1&mute=1&rel=0'
        },
        youtu: {
          index: 'youtu.be/',
          id: function (url) {
            var match = url.match(/youtu\\.be\\/([^?&]+)/);
            return match && match[1] ? match[1] : url;
          },
          src: 'https://www.youtube.com/embed/%id%?autoplay=1&mute=1&rel=0'
        },
        vimeo: {
          index: 'vimeo.com/',
          id: '/',
          src: 'https://player.vimeo.com/video/%id%?autoplay=1'
        }
      },
      srcAction: 'iframe_src'
    }
  });
});
