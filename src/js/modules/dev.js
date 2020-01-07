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
import { clamp, interpolate, easing } from '../modules//math2'
import * as topojson from "topojson"

export class Ocean {

    constructor(database) {

        var self = this

        this.database = database

        document.getElementById("map").style.marginLeft = `-${this.database.settings.offset}px`;

        this.requestAnimationFrame = null;

        this.currentPool = 1

        this.currentTrigger = { base: 0 , scroll : false , zoom : 12 , track: 0 }

        this.triggers = []

        this.setupTriggers()

    }

    setupTriggers() {

        var self = this

        const triggers = document.querySelectorAll('.scroll-text__inner');

        triggers.forEach( (trigger, id) => {

            var obj = {}

            obj.id = id

            obj.track = +trigger.getAttribute('data-track')

            obj.pool = +trigger.getAttribute('data-pool')

            obj.scroll = (trigger.getAttribute('data-type')==='scroll') ? true : false ;

            obj.zoom = +trigger.getAttribute('data-zoom')

            obj.base = +trigger.getAttribute('data-map')

            obj.distance = window.pageYOffset + trigger.getBoundingClientRect().top

            self.triggers.push(obj)

        });

        self.initMap()

        //this.basemap()

        //this.googleizer()

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
            zoom: self.currentTrigger.zoom,
            scrollWheelZoom: false,
            dragging: false,
            zoomControl: false,
            doubleClickZoom: false,
            zoomAnimation: true,
            tap: false
        })
        
        /*
        var styled = L.gridLayer.googleMutant({

            styles: mapstyles

        }).addTo(self.map);

        */


        var boundaryStyle = {
            "fillColor": "#2e5da1",
            "color": "#2e5da1",
            "weight": 1,
            "fillOpacity": 1,
            "opacity": 1
        };

        this.boundary = L.geoJSON(self.database.land, {

          style: boundaryStyle

        }).addTo(self.map);


        this.setupCanvas()

    }

    setCompositeOperation(ctx, mode='source-over', fallback=null) {
      ctx.globalCompositeOperation = mode
      let worked=(ctx.globalCompositeOperation == mode)
      if(!worked && fallback!=null)
        ctx.globalCompositeOperation=fallback
      return worked
    }

    getAngle(x,y,xx,yy) {
        return Math.atan2(y-yy,x-xx)
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

                console.log(data.status)

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

                //console.log(params)

                //var dot = self.map.latLngToContainerPoint([d[0], d[1]]);

                var ctx = params.canvas.getContext('2d');

                ctx.globalAlpha = 0.8;

                var bounds = self.map.getBounds();

                var nw = [ bounds._northEast.lat, bounds._southWest.lng ]

                var se = [ bounds._southWest.lat, bounds._northEast.lng ]

                ctx.clearRect(0, 0, params.size.x, params.size.y);

                // self.database.settings.basemap[self.currentBasemap].projection.drawMap(ctx, self.database.settings.basemap[self.currentBasemap].image, nw, se)

                var element = document.querySelectorAll('[data-lazy]')[self.currentPool - 1]

                var elementTop = window.pageYOffset + element.getBoundingClientRect().top

                var elementLeft = element.getBoundingClientRect().left

                var elementBottom = window.pageYOffset + element.getBoundingClientRect().bottom

                let halfWindowHeight = window.innerHeight / 2

                let falloff = halfWindowHeight * 0.9

                const PI = Math.PI
                            
                const PI2 = PI * 2

                for (const record of self.database.records) {

                    var centre = self.map.latLngToContainerPoint([record.latitude, record.longitude]);

                    if (centre.y > 0 && centre.y < window.innerHeight && +record.id === self.currentPool) {

                        if (elementTop > (window.pageYOffset) && elementBottom < ( window.pageYOffset + window.innerHeight) && !self.database.settings.singleColumn) {

                            let imageMiddle = elementTop + ( (elementBottom - elementTop ) / 2 ) - window.pageYOffset
                            let imageVisibility = (falloff - Math.abs(halfWindowHeight - imageMiddle)) / falloff
                            imageVisibility = easing.quad.out(clamp(imageVisibility))
                            let angle1 = self.getAngle(elementLeft + self.database.settings.offset,elementTop  - window.pageYOffset, centre.x, centre.y) + PI2
                            let angle2 = self.getAngle(elementLeft + self.database.settings.offset, elementBottom  - window.pageYOffset, centre.x, centre.y) + PI2
                            let angleDelta = Math.atan2(Math.sin(angle1 - angle2), Math.cos(angle1-angle2))
                            let angleMiddle = angle1 - (angleDelta / 2)
                            let radius = 2 * imageVisibility
                            let angleOrigin = angleMiddle +( PI / 2)
                            let originOffset = {
                                x:(radius+1) * Math.cos(angleOrigin),
                                y:(radius+1) * Math.sin(angleOrigin)
                            }
                            let colorValue=imageVisibility*0.3
                            ctx.fillStyle=`rgba(220,220,202,${colorValue})`
                            self.setCompositeOperation(ctx,'darken','source-over')
                            ctx.beginPath()
                            ctx.moveTo(
                                centre.x + originOffset.x,
                                centre.y + originOffset.y
                            )
                            ctx.lineTo(elementLeft + self.database.settings.offset, elementTop  - window.pageYOffset)
                            ctx.lineTo(elementLeft + self.database.settings.offset, elementBottom  - window.pageYOffset)
                            ctx.lineTo(
                                centre.x - originOffset.x,
                                centre.y - originOffset.y
                            )
                            ctx.fill()
                            self.setCompositeOperation(ctx)
                            ctx.save()
                        }

                    }

                    ctx.beginPath()
                    ctx.fillStyle = 'yellow';
                    ctx.arc(centre.x, centre.y, 5, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.fillStyle = "white";
                    ctx.textAlign = "end"; 
                    ctx.font = "15px 'Guardian Text Sans Web' Arial";
                    ctx.fillText(`${record.Pool}`, centre.x - 10, centre.y - 5 + (+record.y));
                    //ctx.closePath();
                    //ctx.restore();

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

        this.requestAnimationFrame = requestAnimationFrame( () => {

            (self.currentTrigger.scroll) ? self.reposition().then( () => self.renderLoop()) : self.static().then( () => self.renderLoop())

        })

    }

    async reposition() {

        var self = this

        var stageDistance = this.database.routes.features[self.currentTrigger.track].properties.distance

        var percentageStageDistance = ( 100 / ( self.stageEnd - self.stageStart )  * ( window.pageYOffset - self.stageStart ) )

        percentageStageDistance = (percentageStageDistance < 0) ? 0 : (percentageStageDistance > 100) ? 100 : percentageStageDistance ;

        var distance = ( stageDistance / 100 * percentageStageDistance )

        var along = turf.along( self.database.routes.features[self.currentTrigger.track], distance, { units: 'kilometers' });

        self.map.setView( new L.LatLng( along.geometry.coordinates[1], along.geometry.coordinates[0]), self.zoom);

        return true

    }

    async static() {

        var self = this

        console.log("Don't move")

        //this.pools.setData({status:"testing"});

        var latLng = self.database.routes.features[self.currentTrigger.track].properties.start;

        self.map.panTo([latLng[1], latLng[0]])


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

                self.currentTrigger = trigger

                if (trigger.pool > 0) {

                    self.currentPool = trigger.pool

                }

                var stage = self.triggers.filter( item => item.track === self.currentTrigger.track)

                self.stageStart = stage[0].distance

                self.stageEnd = stage[stage.length - 1].distance

                //self[trigger.type](trigger.id)


            }});

        }

        this.scrolly.watchScroll();

        this.renderLoop()

        this.resizer()

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

        //self.scrolly.doScrollAction(self.currentTrigger.current)

    }

}