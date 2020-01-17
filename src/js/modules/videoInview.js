import shaka from "shaka-player";
shaka.polyfill.installAll();

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

      /*

      if (shaka.Player.isBrowserSupported()) {

        this.initPlayer(video);

      } else {  

        video.setAttribute('src', this.src[index]);

        video.load();

      }

      */

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

  initPlayer(video) {

    var manifestUri = 'https://interactive.guim.co.uk/embed/aus/2020/firestorm/firezone/dash/A_feeling_of_being_invaded-manifest.mpd'

    //'<%= path %>/assets/firezone/dash/A_feeling_of_being_invaded-manifest.mpd';

    var player = new shaka.Player(video);

    player.load(manifestUri).then(function() {

      console.log('The video has now been loaded!');

    }).catch(function(error){

      console.error('Error code', error.code, 'object', error);

    });

  }

}
