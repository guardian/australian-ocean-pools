import share from '../modules/share'

export default class shareable {

  constructor(social) {

    this.share = share(social.title, social.url, social.fbImg, social.twImg, social.twHash, social.message);

  }

  activate() {

    var self = this

    const platforms = document.querySelectorAll(".interactive-share");

    [...platforms].forEach(platform => {

        var network = platform.getAttribute('data-network');

        platform.addEventListener('click',() => self.share(network));

    });

  }

}
