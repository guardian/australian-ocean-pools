export default class imageInview {

  constructor(config, folder, path) {

    this.config = config

    this.folder = folder

    this.path = path

    this.images = document.querySelectorAll('[data-lazy]');

  }

  setup() {

    var self = this

    let lazyload = new IntersectionObserver(function(entries, exit) {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.src = `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/images/${self.folder}/${entry.target.getAttribute('data-lazy')}`

          exit.unobserve(entry.target);

        }

      });

    }, this.config);

    const imgs = document.querySelectorAll('[data-lazy]');

    imgs.forEach(img => {

      lazyload.observe(img);

    });

  }

}
