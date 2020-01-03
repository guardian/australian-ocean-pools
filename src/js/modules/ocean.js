import ScrollyTeller from "../modules/scrollyteller"
import { $, $$, wait, getDimensions } from "../modules/util"
//import * as d3 from 'd3'
import * as turf from '@turf/turf' // npm:@turf/turf
import { Reprojection } from './reprojection'

import GoogleMapsLoader from 'google-maps';
import mapstyles from '../modules/bluetones.json'
import L from 'leaflet'
import '../modules/Leaflet.GoogleMutant.js'
import '../modules/L.CanvasOverlay.js'
import '../modules/lazyloader.js'
import '../modules/videoInview.js'

export class Ocean {

	constructor(database) {

		var self = this

        this.database = database

        this.posistion = 0

        this.currentBasemap = 0

        this.requestAnimationFrame = null;

        this.zoom = 12

        this.triggers = []

        this.setupTriggers()

	}

    setupTriggers() {

        var self = this

        const triggers = document.querySelectorAll('.scroll-text__inner');

        triggers.forEach( (trigger, id) => {

            var obj = {}

            obj.id = id

            obj.type = trigger.getAttribute('data-type')

            obj.zoom = +trigger.getAttribute('data-zoom')

            obj.base = +trigger.getAttribute('data-map')

            obj.distance = window.pageYOffset + trigger.getBoundingClientRect().top

            self.triggers.push(obj)

        });

        //this.basemap()

        this.googleizer()

    }

    basemap() {

        var self = this

        var loaded = []

        for (const basemap of this.database.settings.basemap) {

            basemap.projection = new Reprojection(basemap.image_width, basemap.image_height, self.database.settings.screenWidth, self.database.settings.screenHeight, basemap.north_west[0], basemap.south_east[0], basemap.south_east[1])

            basemap.image = new Image()

            basemap.image.src = basemap.src

            basemap.image.onload = (e) => {

                loaded.push(basemap.image_width)

                if (loaded.length === self.database.settings.basemap.length) {

                    // self.initMap()

                    self.googleizer()

                }
                
            };

        }

    }

    googleizer() {

        var self = this

        GoogleMapsLoader.KEY = 'AIzaSyD8Op4vGvy_plVVJGjuC5r0ZbqmmoTOmKk';
        GoogleMapsLoader.REGION = 'AU';
        GoogleMapsLoader.load(function(google) {
            self.initMap()
        });

    }

    initMap() {

        var self = this

        this.map = new L.Map('map', { 
            renderer: L.canvas(),
            center: new L.LatLng(self.database.records[0].latitude, self.database.records[0].longitude), 
            zoom: self.zoom,
            scrollWheelZoom: false,
            dragging: false,
            zoomControl: false,
            doubleClickZoom: false,
            zoomAnimation: true
        })
        
        var styled = L.gridLayer.googleMutant({

            styles: mapstyles

        }).addTo(self.map);

        this.setupCanvas()

    }

    setupCanvas() {

        var self = this

        self.canvas = document.createElement('canvas');
        self.context = self.canvas.getContext("2d");
        self.canvas.id     = "OceanPoolsLayer";
        self.canvas.width  = self.database.settings.screenWidth;
        self.canvas.height = self.database.settings.screenHeight;
        document.body.appendChild(self.canvas);

        var ocean = function() {

            this.onLayerDidMount = function (){      
                // prepare custom drawing    
            };

            this.onLayerWillUnmount  = function(){
                // custom cleanup    
            };

            this.setData = function (data={}) {

                this.needRedraw();

            };

            this.onDrawLayer = function (params) {

                /*
                canvas   : <canvas>,
                bounds   : <bounds in WGS84>
                size     : <view size>,
                zoomScale: <zoom scale is  1/resolution>,
                zoom     : <current zoom>,
                options  : <options passed >
                */

                //var dot = self.map.latLngToContainerPoint([d[0], d[1]]);

                var ctx = params.canvas.getContext('2d');

                ctx.globalAlpha = 0.8;

                var bounds = self.map.getBounds();

                var nw = [ bounds._northEast.lat, bounds._southWest.lng ]

                var se = [ bounds._southWest.lat, bounds._northEast.lng ]

                ctx.clearRect(0, 0, params.size.x, params.size.y);

                // self.database.settings.basemap[self.currentBasemap].projection.drawMap(ctx, self.database.settings.basemap[self.currentBasemap].image, nw, se)

                for (const record of self.database.records) {
                    var centre = self.map.latLngToContainerPoint([record.latitude, record.longitude]);
                    ctx.beginPath();
                    ctx.save();
                    ctx.fillStyle = 'yellow';
                    ctx.arc(centre.x, centre.y, 5, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.fillStyle="white";
                    //ctx.shadowColor="white";
                    //ctx.shadowBlur=5;
                    ctx.font = "15px 'Guardian Text Sans Web' Arial";
                    ctx.fillText(`${record.Pool}`, centre.x + 10, centre.y + 5 + (+record.y));
                    ctx.closePath();
                    ctx.restore();

                }

            }

        }
          
        ocean.prototype = new L.CanvasLayer(); 
          
        this.pools = new ocean();

        this.pools.addTo(self.map);

        this.scroll()

    }

    renderLoop() {

        var self = this

        this.requestAnimationFrame = requestAnimationFrame( function() {

            self.reposition().then( () => self.renderLoop())

        })
    }

    async reposition() {

        var self = this

        //var totalDistance = document.body.offsetHeight * window.pageYOffset //( 100 / document.body.offsetHeight * window.pageYOffset )

        var stageDistance = this.database.routes.features[self.currentBasemap].properties.distance

        var percentageStageDistance = ( 100 / ( self.stageEnd - self.stageStart )  * ( window.pageYOffset - self.stageStart ) )

        percentageStageDistance = (percentageStageDistance < 0) ? 0 : (percentageStageDistance > 100) ? 100 : percentageStageDistance ;

        var distance = ( stageDistance / 100 * percentageStageDistance )

        var along = turf.along( self.database.routes.features[self.currentBasemap], distance, { units: 'kilometers' });

        self.map.setView( new L.LatLng( along.geometry.coordinates[1], along.geometry.coordinates[0]), self.zoom);

        return true

    }

    scroll() {

        var self = this

        this.scrolly = new ScrollyTeller({
            parent: document.querySelector("#scrolly-1"),
            triggerTop: 1/3, // percentage from the top of the screen that the trigger should fire
            triggerTopMobile: 0.75,
            transparentUntilActive: true
        });

        for (const trigger of self.triggers) {

            this.scrolly.addTrigger({num: trigger.id, do: () => {

                self.current = trigger.id

                self.zoom = trigger.zoom

                self.currentBasemap = trigger.base

                var stage = self.triggers.filter( item => item.base === self.currentBasemap)

                self.stageStart = stage[0].distance

                self.stageEnd = stage[stage.length - 1].distance

                self[trigger.type](trigger.id)

            }});

        }

        this.scrolly.watchScroll();

    }

    tred(id) {

        this.cancelAFrame()

    }

    reorient(id) {

        var self = this

        console.log("Reposition the map")

        this.cancelAFrame()

        var latLng = self.database.routes.features[self.triggers[id].base].properties.start;

        self.map.panTo([latLng[1], latLng[0]])

    }

    explore(id) {

        var self = this

        if (self.requestAnimationFrame===null) {

            this.renderLoop()

        }

    }

    cancelAFrame() {

        var self = this
            
        if (self.requestAnimationFrame) {

           window.cancelAnimationFrame(self.requestAnimationFrame);

           self.requestAnimationFrame = null;

        }

    }

    rhumb(from, to, units="kilometers") {

        var options = { units: units };

        var start = turf.point(from);

        var finish = turf.point(to);

        var bearing = turf.rhumbBearing(start, finish);

        var distance = turf.rhumbDistance(start, finish, options);

        return { distance : distance, bearing : bearing }

    }

    resizer() {

        var self = this

        window.addEventListener("resize", function() {

            clearTimeout(document.body.data)

            document.body.data = setTimeout( function() { 

                self.resize()

            }, 200);

        });

    }

    resize() {

        var self = this

        this.database.settings.screenWidth = document.documentElement.clientWidth

        this.database.settings.screenHeight = document.documentElement.clientHeight                

        self.scrolly.doScrollAction(self.current)

    }

}