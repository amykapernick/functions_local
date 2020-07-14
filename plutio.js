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
		api = 'companies',
		headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`,
			Business: process.env.PLUTIO_SUBDOMAIN
		}

	// fetch(`https://api.plutio.com/v1.7/${api}`, {
	// 	method: 'get',
	// 	headers: headers,
	// }).then(res => res.json()).then(res => {
	// 	console.log(res)
	// 	res.forEach(e => {
	// 		console.log(e.websiteLinks)
	// 		console.log(e.people)
	// 	})
	// })

	const clients = await csv({
		noheader: false,
		delimiter: ","
	})
		.fromString(fs.readFileSync('_data/clients.csv', 'utf8'))
		.then(jsonObj => {
			return jsonObj;
		});

	clients.forEach(async d => {
		const contact = d.first && await fetch(`https://api.plutio.com/v1.7/people`, {
			method: 'post',
			body: JSON.stringify({
				"name": {
					"first": d.first,
					"last": d.last
				},
				"status": "active",
				"invite": false,
				"email": d.email,
				"role": "client"
			}),
			headers: headers,
		}).then(res => res.json()).then(res => res['_id'])

		let details = d

		if (!contact) {
			details.contactEmails = [{
				address: d.email,
				type: 'email'
			}]
		}
		else {
			details.people = [
				{
					"_id": contact
				}
			]
		}

		details.address = {
			street: d.address,
			city: `${d.city}, ${d.state}`,
			country: d.country,
			zipCode: d.postcode
		}

		fetch(`https://api.plutio.com/v1.7/${api}`, {
			method: 'post',
			body: JSON.stringify({
				...details,
				title: d.company,
				websiteLinks: [
					{
						url: d.website,
						type: "website",
						title: "Company Website"
					}
				]
			}),
			headers: headers,
		}).then(res => res.json()).then(res => console.log(res))
	})
}

imports()