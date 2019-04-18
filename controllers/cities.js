require('dotenv').config()

let express = require('express')
let router = express.Router()
let mapBoxClient = require('@mapbox/mapbox-sdk')
let mapBoxGeocode = require('@mapbox/mapbox-sdk/services/geocoding')
let db = require('../models')

// Give mapbox our key
const mapBoxKey = process.env.MAPBOX_KEY
const mb = mapBoxClient({ accessToken: mapBoxKey })
const geocode = mapBoxGeocode(mb)

router.get('/search', (req, res) => {
	res.render('cities/search')
})

router.get('/results', (req, res) => {
	if (req.query.name) {
		console.log(req.query)
		// forward Geocode with req.query.name and req.query.state
		geocode.forwardGeocode({
			query: req.query.name + ', ' + req.query.state,
			types: ['place'], 
			countries: ['us']
		})
		.send()
		.then((response) => {
			console.log(response)
			let results = response.body.features.map((city) => {
				let placeNameArray = city.place_name.split(', ')
				return {
					name: placeNameArray[0],
					state: placeNameArray[1],
					lat: city.center[1],
					long: city.center[0]
				}
			})
			res.render('cities/results', { 
				results: results, 
				city: req.query.name, 
				state: req.query.state })
		})
		.catch((error) => {
			console.log('error', error)
			res.render('404')
		})
	} else {
		res.send('nothin')
	}
})

router.get('/cities/faves', (req, res) => {
	db.city.findAll()
	.then((faves) => {
		
		res.render('cities/faves', { faves })
	})
	.catch((error) => {
		console.log('error', error)
	})
})

router.post('/faves', (req, res) => {
	db.city.findOrCreate({
		where: { name: req.body.name },
		defaults: req.body
	})
	.spread((city, created) => {
		if (created) {
			console.log('Created', city.name)
		}
		res.redirect('/cities/faves')
	})
	.catch((error) => {
		console.log('error', error)
		res.render('404')
	})
})

module.exports = router