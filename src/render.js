import templateHTML from "./src/templates/main.html!text"
import Handlebars from 'handlebars'
import rp from 'request-promise'

export async function render() {

    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/1JKBWoq8AJD260VzwmPvgPeF2p5pdNW1dhzePDXe1nb8.json',
        json: true
    }).then((data) => {
			var content = Handlebars.compile( templateHTML, { commpat: true } );
      return content(data.sheets);
    });

}

