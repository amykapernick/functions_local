require('dotenv').config()

const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	sgMail = require('@sendgrid/mail'),
	sendEmails = require('./analytics-emails/sendEmails').sendEmails

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
	res.send('<h1>Node Functions</h1><ul><li><a href="/analytics-emails">Monthly Analytics Reports</a></li></ul>')
})

app.get('/analytics-emails', (req, res) => {
	res.sendFile('./analytics-emails.html', { root: './' })
})

app.post('/analytics-emails', (req, res) => {
	const details = req.body

	sendEmails(req, res, details)
})

app.get('/expenses', (req, res) => {
	res.sendFile('./expenses/index.html', {root: './'})
})

app.listen(process.env.PORT || 3000, () => {
	console.log(`Express listening on port ${process.env.PORT || 3000}`)
})
