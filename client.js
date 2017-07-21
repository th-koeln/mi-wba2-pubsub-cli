'use strict'

// Load schema for prompt
const schema = require(__dirname+'/schema/promptschema.js')

// PubSubController
const PubSubController = require(`${__dirname}/controller/pubsubcontroller.js`)
const controller = new PubSubController({ promptSchema: schema })

// Display prompt to CLI
controller.menuForService()
