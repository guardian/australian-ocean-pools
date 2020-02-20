import shaka from "shaka-player";
shaka.polyfill.installAll();



export default class videoInview {

  constructor(config, src, path, folder, width, app) {

    this.config = config

    this.src = src

    this.path = path

    this.folder = folder

    this.width = width

    this.app = app

    this.videos = document.querySelectorAll('video');

    this.pools = document.querySelectorAll('.pool-videos');
  
  }

  setup() {

    this.pools.forEach( (video, index) => {

      var id = index + 1

      video.setAttribute('poster', `${this.path}/assets/images/${this.folder}/${this.src[id].poster}`);

      video.setAttribute('crossorigin', 'anonymous');

      //video.setAttribute('src', `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/videos/${this.width}/${this.src[id].video}`);

      /*
      // C ors is a pain
      https://github.com/minio/minio/issues/5748
      */

      if (this.app.isIos) { //this.app.isApp || 

        video.setAttribute('src', `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/${this.width}/${this.src[id].video}`);

        video.load();

      } else {

        if (shaka.Player.isBrowserSupported()) {

          this.initPlayer(video, `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/dash/${this.src[id].dash}`);

          console.log(`https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/dash/${this.src[id].dash}`)

        } else {  

          //video.setAttribute('src', `https://aus-video.s3-ap-southeast-2.amazonaws.com/ocean-pools/hls/${this.src[id].hls}`);

          video.setAttribute('src', `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/${this.width}/${this.src[id].video}`);

          video.load();

        } 

      }

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
