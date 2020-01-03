const videoInview = (function() {

    const config = {

      rootMargin: '0px 0px 50px 0px',

      threshold: 0

    };  

    let inview = new IntersectionObserver(function(entries, observer) {

      entries.forEach(video => {

        if (video.isIntersecting) {

            video.target.play(); 

        } else {

            video.target.pause(); 

        }

      });

    }, config);

    const videos = document.querySelectorAll('video');

    videos.forEach(video => {

      inview.observe(video);

    });

})() 