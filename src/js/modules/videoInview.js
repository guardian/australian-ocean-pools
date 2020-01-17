import shaka from "shaka-player";
shaka.polyfill.installAll();

export default class videoInview {

  constructor(config, src, path, folder) {

    this.config = config

    this.src = src

    this.path = path

    this.folder = folder

    this.pools = document.querySelectorAll('.pool-videos');

    this.videos = document.querySelectorAll('video');

  }

  setup() {

    this.pools.forEach( (video, index) => {

      video.setAttribute('poster', `${this.path}/assets/images/${this.folder}/${this.src[index].poster}`);

      video.setAttribute('src', `${this.path}/assets/videos/${this.src[index].video}`);

      video.load();

      /*

      if (shaka.Player.isBrowserSupported()) {

        this.initPlayer(video, `${this.path}/assets/videos/${this.src[index].dash}`);

      } else {  

        video.setAttribute('src', `${this.path}/assets/videos/${this.src[index].hls}`);

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

  initPlayer(video, manifest) {

    var player = new shaka.Player(video);

    player.load(manifestUri).then(function() {

      console.log('The video has now been loaded!');

    }).catch(function(error){

      console.error('Error code', error.code, 'object', error);

    });

  }

}
