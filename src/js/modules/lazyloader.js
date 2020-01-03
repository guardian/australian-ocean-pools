const lazyloader = (function() {

    const config = {

      rootMargin: '0px 0px 550px 0px',

      threshold: 0

    };        

    let lazyload = new IntersectionObserver(function(entries, exit) {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.src = `https://interactive.guim.co.uk/embed/aus/2020/ocean-pools/images/1000/${entry.target.getAttribute('data-lazy')}`

          console.log("Troigger now")

          exit.unobserve(entry.target);

        }

      });

    }, config);

    const imgs = document.querySelectorAll('[data-lazy]');

    imgs.forEach(img => {

      lazyload.observe(img);

    });

})() 