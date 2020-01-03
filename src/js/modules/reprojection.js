export class Reprojection {

	constructor(mapWidth, mapHeight, screenWidth, screenHeight, mapLngLeft, mapLngRight, mapLatBottom) {

		this.mapWidth = mapWidth

		this.mapHeight = mapHeight

		this.mapLngLeft = mapLngLeft

		this.mapLngRight = mapLngRight

		this.mapLatBottom = mapLatBottom

		this.screenWidth = screenWidth

		this.screenHeight = screenHeight

	}

	resize(width, height) {

		this.screenWidth = width

		this.screenHeight = height

	}

	convertGeoToPixel(latitude, longitude) {

        var self = this

        const mapLatBottomRad = self.mapLatBottom * Math.PI / 180
        const latitudeRad = latitude * Math.PI / 180
        const mapLngDelta = (self.mapLngRight - self.mapLngLeft)

        const worldMapWidth = ((self.mapWidth / mapLngDelta) * 360) / (2 * Math.PI)
        const mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomRad)) / (1 - Math.sin(mapLatBottomRad))))

        const x = (longitude - self.mapLngLeft) * (self.mapWidth / mapLngDelta)
        const y = self.mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(latitudeRad)) / (1 - Math.sin(latitudeRad)))) - mapOffsetY)

        return { x, y }
    }

    drawMap(context, image, nw, se) {

        var self = this

        var nw = self.convertGeoToPixel(nw[0], nw[1])

        var se = self.convertGeoToPixel(se[0], se[1])  

        var width = se.x - nw.x

        var height = se.y - nw.y

        context.clearRect(0, 0, self.screenWidth, self.screenHeight);

        context.drawImage(image, nw.x, nw.y, width, height, 0, 0, self.screenWidth, self.screenHeight); 

    }
}