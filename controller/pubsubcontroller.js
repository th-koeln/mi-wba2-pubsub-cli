'use strict'

const prompt = require('prompt')
const faye = require('faye')
const io = require('socket.io-client')

class PubSubController {

	constructor(options) {
		this.schema = options.promptSchema
		prompt.start()
		process.stdin.setEncoding('utf8')
	}

	/**
	 * Fires up a socket.io client instance.
	 * 
	 * @param {*} socketresult 
	 */
	socketIOClient(socketresult) {
			var s = io.connect(socketresult.host)

			s.on('connect', (socket) => {
				console.log(`Connecte to ${socketresult.host}`)
				console.log(`Type text and hit [Enter] to send messages to '${socketresult.writingsocket}'`)

				if (socketresult.writingsocket != null) {
					process.stdin.on('readable', () => {
						var chunk = process.stdin.read()

						if (chunk !== null) {
							s.emit(socketresult.writingsocket, chunk.toString().replace('\n', '\t'))
						}
					});
				}
			});

			s.on(socketresult.readingsocket, (data) => {
				console.log(`Data from ${socketresult.host} on ${socketresult.readingsocket}: \n${JSON.stringify(data)}`)
			});

			s.on('disconnect', (socket) => {
				console.log(`Disconnected from ${socketresult.host}`)
			});
	}

	/**
	 * Fires up a Faye subscriber.
	 */
	fayeSubscriber() {
		prompt.get(this.schema.fayesub, (err, subresult) => {
			if (err != null) { console.log(err) }

			var client = new faye.Client(subresult.host+"/faye")
			console.log(`INFO: Incoming messages are assumed to be in JSON format.`)

			client.subscribe(subresult.topic, function(message) {
				console.log(`Received message: ${JSON.stringify(message)}`)
			}).then(() => {
				console.log(`Subscribed to ${subresult.topic} on ${subresult.host}!`)
			}, (error) => {
				console.log(`There was an error subscribing: ${error}`)
			})
		})
	}

	/**
	 * Fires up a Faye publisher.
	 */
	fayePublisher() {
		prompt.get(this.schema.fayepub, (err, pubresult) => {
			if (err) { console.log(err) }
			var client = new faye.Client(pubresult.host+"/faye")

			client.publish( pubresult.topic, { text: pubresult.message } ).then(() => {
				console.log(`Message received by server!`);
			}, (error) => {
				console.log(`There was an error publishing: ${error.message}`);
			})
		})
	}

	/**
	 * Prompts the user for service input.
	 */
	menuForService() {
		// Prompt to select service type
		prompt.get(this.schema.service, (err, serviceresult) => {

			if (err !== null) { console.log(err) }

			// SOCKETIO
			if (serviceresult.service == `socketio`) {

				console.log(`----- SOCKET.IO -----`)
				prompt.get(this.schema.socketio, (err, socketresult) => {
					if (err != null) { console.log(err) }
					this.socketIOClient(socketresult)
				});

			// FAYE
			} else if (serviceresult.service == "faye") {
				console.log(`----- FAYE -----`)
				prompt.get(this.schema.faye, (err, fayeresult) => {
					if (err != null) { console.log(err) }

					if (fayeresult.suborpub == "sub") { this.fayeSubscriber() }
					else if (fayeresult.suborpub == "pub") { this.fayePublisher() }
				})
			}
		})
	}

}

module.exports = PubSubController