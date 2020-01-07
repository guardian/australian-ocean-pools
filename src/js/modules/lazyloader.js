const lazyloader = (function() {

  var screenwidth = document.documentElement.clientWidth

  function setDirectory(width) {

      return (width < 401) ? 400 : 
      (width < 601) ? 600 : 
      (width < 801) ? 800 : 1000 ;

  }

  var folder = setDirectory(screenwidth)

    const config = {

      rootMargin: '0px 0px 550px 0px',

      threshold: 0

    };        

    let lazyload = new IntersectionObserver(function(entries, exit) {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.src = `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/images/${folder}/${entry.target.getAttribute('data-lazy')}`

          exit.unobserve(entry.target);

        }

      });

    }, config);

    const imgs = document.querySelectorAll('[data-lazy]');

    imgs.forEach(img => {

      lazyload.observe(img);

    });

})() 