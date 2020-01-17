import ScrollyTeller from "../modules/scrollyteller"
//import * as turf from '@turf/turf' // npm:@turf/turf
import turf from './turfImporter';
import L from 'leaflet'
import '../modules/L.CanvasOverlay.js'
//import '../modules/lazyloader.js'
import { clamp, interpolate, easing } from '../modules//math2'
import scrollTriggers from "../modules/blocks/setupTriggers.js";
import videoInview from "../modules/videoInview";
import imageInview from "../modules/imageInview";
import shareable from "../modules/shareable";


export class Ocean {

	constructor(database) {

		var self = this

        this.database = database

        this.requestAnimationFrame = null;

        this.currentPool = 1

        this.currentTrigger = { base: 0 , scroll : false , zoom : 12 , track: 0 }

        this.setup()

	}

    setup() {

        console.log(this.database.settings.folder)

        this.triggers = new scrollTriggers('.scroll-text__inner').getTriggers()

        new shareable(this.database.settings.social).activate()

        new videoInview({

              rootMargin: '0px 0px 50px 0px',

              threshold: 0

            }, this.database.videos, this.database.settings.filepath, this.database.settings.folder).setup()

        new imageInview({

              rootMargin: '0px 0px 550px 0px',

              threshold: 0

            }, this.database.settings.folder, this.database.settings.filepath).setup()


        this.initMap()

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
        
    setupCanvas() {

        var self = this

        L.CanvasLayer.Renderer = L.CanvasLayer.extend({

            setData: function(data={}) {

                this.needRedraw();

            },

            getAngle: function(x,y,xx,yy) {

                return Math.atan2(y-yy,x-xx)

            },

            setCompositeOperation: function(ctx, mode='source-over', fallback=null) {

              ctx.globalCompositeOperation = mode

              let worked = (ctx.globalCompositeOperation == mode)

              if (!worked && fallback!=null) ctx.globalCompositeOperation = fallback

              return worked

            },

            onDrawLayer: function(params) {

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

                let halfWindowHeight = window.innerHeight / 2

                let falloff = halfWindowHeight * 0.9

                const PI = Math.PI
                            
                const PI2 = PI * 2

                self.database.records.forEach( (record, index) => {

                    var centre = self.map.latLngToContainerPoint([record.latitude, record.longitude]);

                    if ( !self.database.settings.singleColumn) {

                        var element = document.querySelectorAll('[data-lazy]')[index]

                        var elementTop = window.pageYOffset + element.getBoundingClientRect().top

                        var elementLeft = element.getBoundingClientRect().left

                        var elementBottom = window.pageYOffset + element.getBoundingClientRect().bottom

                        if (elementTop > (window.pageYOffset) && elementBottom < ( window.pageYOffset + window.innerHeight)) {

                            let imageMiddle = elementTop + ( (elementBottom - elementTop ) / 2 ) - window.pageYOffset
                            let imageVisibility = (falloff - Math.abs(halfWindowHeight - imageMiddle)) / falloff
                            imageVisibility = easing.quad.out(clamp(imageVisibility))
                            let angle1 = this.getAngle(elementLeft + self.database.settings.offset,elementTop  - window.pageYOffset, centre.x, centre.y) + PI2
                            let angle2 = this.getAngle(elementLeft + self.database.settings.offset, elementBottom  - window.pageYOffset, centre.x, centre.y) + PI2
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
                            this.setCompositeOperation(ctx,'darken','source-over')
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
                            this.setCompositeOperation(ctx)
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

                })


            }

        });

        L.canvasLayer.renderer = () => new L.CanvasLayer.Renderer();

        L.canvasLayer.renderer().addTo(self.map);

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

        var bounds = self.map.getBounds();

        var offset = ( bounds._northEast.lat - bounds._southWest.lat ) / 1.5

        self.map.setView( new L.LatLng( along.geometry.coordinates[1], along.geometry.coordinates[0] + offset), self.zoom);

        return true

    }

    async static() {

        var self = this

        var latLng = self.database.routes.features[self.currentTrigger.track].properties.start;

        var bounds = self.map.getBounds();

        var offset = ( bounds._northEast.lat - bounds._southWest.lat ) / 1.5

        self.map.panTo([latLng[1], latLng[0] + offset])

        return true

    }

    scroll() {

        var self = this

        this.scrolly = new ScrollyTeller({
            parent: document.querySelector("#scrolly-1"),
            triggerTop: 1 / 3, // percentage from the top of the screen that the trigger should fire
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