import loadJson from '../components/load-json/'
import { Ocean } from './modules/ocean'
import places from './data/places.json'
import { Preflight } from './modules/preflight'
import settings from './data/settings'
import routes from './data/routes_offset.json'

var app = {

	init: (key) => {

		loadJson(`https://interactive.guim.co.uk/docsdata/${key}.json`)
			.then((data) => {

				var wrangle = new Preflight(data.sheets.Data, key, settings, places, routes)

				wrangle.process().then( (application) => {

					new Ocean(application)

				})
				
			})


	}

}

app.init("1JKBWoq8AJD260VzwmPvgPeF2p5pdNW1dhzePDXe1nb8")

// https://interactive.guim.co.uk/docsdata/1JKBWoq8AJD260VzwmPvgPeF2p5pdNW1dhzePDXe1nb8.json