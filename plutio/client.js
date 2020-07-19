const clients = await csv({
	noheader: false,
	delimiter: ","
})
	.fromString(fs.readFileSync('_data/clients.csv', 'utf8'))
	.then(jsonObj => {
		return jsonObj;
	});

clients.forEach(async d => {
	if (d.display == '') {
		return
	}
	const contact = d.first && await fetch(`https://api.plutio.com/v1.7/people`, {
		method: 'post',
		body: JSON.stringify({
			"name": {
				"first": d.first,
				"last": d.last
			},
			"status": d.status,
			"invite": false,
			"email": d.email,
			"role": "client"
		}),
		headers: headers,
	}).then(res => res.json()).then(res => res['_id']).catch(err => console.log({ err, d }))

	let details = {
		title: d.display,

	}

	if (d.address !== ' ') {
		details.address = {
			street: d.address,
			city: `${d.city}, ${d.state}`,
			country: d.country,
			zipCode: d.postcode
		}
	}

	if (d.website) {
		details.websiteLinks = [
			{
				url: d.website,
				type: "website",
				title: "Company Website"
			}
		]
	}

	if (!contact && RegExp('/@/').test(d.email)) {
		details.contactEmails = [{
			address: d.email,
			type: 'email'
		}]
	}
	else if (contact) {
		details.people = [
			{
				"_id": contact
			}
		]
	}

	fetch(`https://api.plutio.com/v1.7/${api}`, {
		method: 'post',
		body: JSON.stringify(details),
		headers: headers,
	}).then(res => {
		if (res.status == '503') {
			console.log(`${d.display} failed`)
			return { err: 'error' }
		}
		return res.json()
	}).then(res => console.log({ res })).catch((err) => console.log({ err, d }))

	const wait = setTimeout(() => { console.log('waiting') }, 5000)

	clearTimeout(wait)
})