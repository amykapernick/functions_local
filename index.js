require('dotenv').config()

const express = require('express'),
	app = express(),
	sgMail = require('@sendgrid/mail'),
	customers = require('./analytics_emails').customers

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

app.get('/', (req, res) => {
	res.send('<h1>Express App</h1>')
})

app.get('/analytics-emails', (req, res) => {
	res.write('<h1>Sending Emails</h1>')
	let msg,
		month = 'October',
		year = '2019',
		reportUrl = `https://analytics.aimhigherweb.design/{website}-${year}${month}`

	customers.forEach(customer => {
		msg = {
			to: [],
			cc: [],
			from: {
				name: 'Amy | AimHigher Web Design',
				email: 'amy@aimhigherweb.design',
			},
			subject: `${customer.company} Analytics Report - ${month}`,
		}

		customer.contacts.forEach(contact => {
			msg.to.push({
				email: contact.email,
			})
		})

		customer.extras.forEach(contact => {
			msg.cc.push({
				email: contact.email,
			})
		})

		let name = customer.contacts[0].name,
			text = {},
			html = {},
			url = reportUrl.replace('{website}', customer.sites[0].slug)

		text.opening = `Hi ${name},\n`
		text.report = `I've put together your analytics report for ${month} and you can view it here - ${url}\n
            You can print it off if you like, but you'll then lose a lot of the interactivity so I recommend you view it on a computer.`
		text.ending = `This is just our standard analytics report, if there's anything else you'd like to know about your website (or if there's anything in the report you're not really interested in), let me know and I can customise the report for you.\n
            Let me know if you have any further questions.\n
            --\n
            Thanks,\n
            \n
            Amy Kapernick Front End Jedi\n
            m 0438 984 242\n
			e amy@aimhigherweb.design | w https://aimhigherweb.design`
		text.url = url

		html.opening = `<p>Hi ${name},</p>`
		html.report = `<p>I've put together your analytics report for ${month} and you can view it here - ${url}</p><p>You can print it off if you like, but you'll then lose a lot of the interactivity so I recommend you view it on a computer.</p>`
		html.ending = `<p>This is just our standard analytics report, if there's anything else you'd like to know about your website (or if there's anything in the report you're not really interested in), let me know and I can customise the report for you.</p><p>Let me know if you have any further questions.</p><p>---</p><p>Thanks,</p><table style="font-family:Arial,sans-serif" cellspacing="0" cellpadding="0" border="0" width="466"><tbody><tr><td style="border-right:5px solid #007cbb" width="140"><img src="https://amyskapers.tech/img/amy_small.png" style="border-radius: 4px; width: 104px; height: auto;" alt="" moz-do-not-send="true"></td><td width="326"><table style="margin-left:22px;width:336px;height:124px" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td style="font-size:14px;color:#007cbb;line-height:25px">Amy Kapernick <span style="font-size:12px;color:#302E2C"> Front End Jedi</span></td></tr><tr><td style="font-size:14px;color:#007cbb;line-height:25px"><img src="https://amyskapers.tech/img/aimhigher.png" style="width: 217px; height: auto;" moz-do-not-send="true"></td></tr><tr><td style="font-size:11px;color:#302E2C;line-height:20px;padding-top:3px"><span style="color:#00acbb">m</span> <a href="tel:+61438984242" style="color:#007cbb;text-decoration:underline" target="_blank" moz-do-not-send="true"> 0438 984 242</a></td></tr><tr><td style="font-size:11px;color:#302E2C;line-height:18px"><span style="color:#00acbb">e</span>&nbsp;<span class="_pb_placeholder">this.email</span> | <span style="color:#00acbb">w</span> <a href="https://aimhigherweb.design" style="color:#007cbb;text-decoration:underline" target="_blank" moz-do-not-send="true"> https://aimhigherweb.design</a></td></tr><tr><td style="padding-top:5px" valign="bottom"><a href="https://www.facebook.com/aimhigherwebdesign" target="_blank" moz-do-not-send="true"><img style="padding-right: 5px;" src="http://postbox-images.s3.amazonaws.com/signatures/fb-c.jpg" alt="" moz-do-not-send="true" height="24" width="24"></a> <a href="https://twitter.com/amys_kapers" target="_blank" moz-do-not-send="true"><img style="padding-right: 5px;" src="http://postbox-images.s3.amazonaws.com/signatures/twitter-c.jpg" alt="" moz-do-not-send="true" height="24" width="24"></a> <a href="https://www.linkedin.com/en/amykapernick" target="_blank" moz-do-not-send="true"><img style="padding-right: 5px;" src="http://postbox-images.s3.amazonaws.com/signatures/in-c.jpg" alt="" moz-do-not-send="true" height="24" width="24"></a></td></tr></tbody></table></td></tr></tbody></table>`
		html.url = `<a href="${url}" target="_blank">${url}</a>`

		if (customer.sites.length > 1) {
			text.url = ''
			html.url = ''

			customer.sites.forEach(site => {
				text.url = `${text.url}\n\t- ${site.name} - ${reportUrl.replace('{website}', site.slug)}\n`
				html.url = `${html.url}<li><strong>${site.name}</strong> - <a href="${reportUrl.replace(
					'{website}',
					site.slug
				)}" target="_blank">${reportUrl.replace('{website}', site.slug)}</a></li>`
			})

			text.report = `I've put together your analytics report for ${month} and you can view them below\n
              ${text.url}\n
		You can print it off if you like, but you'll then lose a lot of the interactivity so I recommend you view it on a computer.\n`
			html.report = `<p>I've put together your analytics report for ${month} and you can view them below</p><ul>${html.url}</ul>`
		}

		msg.text = `${text.opening}\n${text.report}\n${text.ending}`
		msg.html = `${html.opening}${html.report}${html.ending}`

		// console.log(msg)

		sgMail.send(msg)

		res.write(`<h2>Sent ${customer.company} - ${month} ${year}</h2>`)
		res.write(`${html.url}`)

		res.end()
	})
})

app.listen(3000, () => {
	console.log('Example app listening on port 3000!')
})
