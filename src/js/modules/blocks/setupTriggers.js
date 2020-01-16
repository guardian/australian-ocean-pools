export default class scrollTriggers {

    constructor(element) {

        this.elements = document.querySelectorAll(element);

    }

    getTriggers() {

        var triggers = []

        this.elements.forEach( (trigger, id) => {

            var obj = {}

            obj.id = id

            obj.track = +trigger.getAttribute('data-track')

            obj.pool = +trigger.getAttribute('data-pool')

            obj.scroll = (trigger.getAttribute('data-type')==='scroll') ? true : false ;

            obj.zoom = +trigger.getAttribute('data-zoom')

            obj.base = +trigger.getAttribute('data-map')

            obj.distance = window.pageYOffset + trigger.getBoundingClientRect().top

            triggers.push(obj)

        });

        return triggers
    }

}