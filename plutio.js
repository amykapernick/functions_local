require('dotenv').config()

const fetch = require('node-fetch'),
	querystring = require('querystring'),
	csv = require('csvtojson'),
	fs = require('file-system')

const imports = async () => {
	const accessToken = await fetch(`https://api.plutio.com/v1.7/oauth/token`, {
		method: 'post',
		body: querystring.stringify({
			"client_id": process.env.PLUTIO_CLIENT_ID,
			"client_secret": process.env.PLUTIO_CLIENT_SECRET,
			"grant_type": "client_credentials"
		}),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Business: process.env.PLUTIO_SUBDOMAIN
		},
	}).then(res => res.json()).then(result => result.accessToken),
		api = 'invoices',
		headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`,
			Business: process.env.PLUTIO_SUBDOMAIN
		}

	// fetch(`https://api.plutio.com/v1.7/${deleteAPI}`, {
	// 	method: 'get',
	// 	headers: headers,
	// }).then(res => res.json()).then(res => {
	// 	res.forEach(p => {
	// 		console.log(p.title)
	// 		if (p['_id'] !== 'niccpHcGJ7vvQHuWm' && p['_id'] !== 'WbGg4pA4nDyi5TARD') {
	// 			fetch(`https://api.plutio.com/v1.7/${deleteAPI}`, {
	// 				method: 'delete',
	// 				body: JSON.stringify({
	// 					'_id': p['_id'],
	// 					status: 'deleted'
	// 				}),
	// 				headers: headers,
	// 			})
	// 		}
	// 	})
	// })

	fetch(`https://api.plutio.com/v1.7/${api}`, {
		method: 'put',
		headers: headers,
		body: JSON.stringify({
			"_id": "jBrHMWiisaeTY5ms4",
			"client": {
				"_id": "kMYPaJwoZvcQxuQqu",
				"entityType": "company"
			}
		})
	}).then(res => res.json()).then(res => { console.log(res) })


}

imports()