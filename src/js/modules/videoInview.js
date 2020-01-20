import shaka from "shaka-player";
shaka.polyfill.installAll();

export default class videoInview {

  constructor(config, src, path, folder, width) {

    this.config = config

    this.src = src

    this.path = path

    this.folder = folder

    this.width = width

    this.videos = document.querySelectorAll('video');

  }

  setup() {

    this.videos.forEach( (video, index) => {

      video.setAttribute('poster', `${this.path}/assets/images/${this.folder}/${this.src[index].poster}`);

      video.setAttribute('crossorigin', 'anonymous');

      //video.setAttribute('src', `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/videos/${this.width}/${this.src[index].video}`);

      /*
      // C ors is a pain
      https://github.com/minio/minio/issues/5748
      */

      if (shaka.Player.isBrowserSupported()) {

        this.initPlayer(video, `https://aus-video.s3-ap-southeast-2.amazonaws.com/ocean-pools/dash/${this.src[index].dash}`);

      } else {  

        video.setAttribute('src', `https://aus-video.s3-ap-southeast-2.amazonaws.com/ocean-pools/hls/${this.src[index].hls}`);

      }

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

  initPlayer(video, manifest) {

    var player = new shaka.Player(video);

    player.load(manifest).then(function() {

      console.log('The video has now been loaded!');

    }).catch(function(error){

      console.error('Error code', error.code, 'object', error);

    });

  }

}
