export default class videoInview {

    constructor(config, src) {

        this.config = config

        this.src = src

        this.pools = document.querySelectorAll('.pool-videos');

        this.videos = document.querySelectorAll('video');

    }

    setup() {

      this.pools.forEach( (video, index) => {

        video.setAttribute('src', this.src[index]);

        video.load();

      });

      let inview = new IntersectionObserver(function(entries, observer) {

        entries.forEach(video => {

          if (video.isIntersecting) {

              video.target.play(); 

          } else {

              video.target.pause(); 

          }

        });

      }, this.config);

      this.videos.forEach( (video, index) => {

        inview.observe(video);

      });

    }

}