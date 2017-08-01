var ConversationV1 = require('watson-developer-cloud/conversation/v1');

var settings = {
  conversation: {
    username: 'ABC123',
    password: 'ABC123',
    workspaceId: 'ABC123'
  },
  speechToText: {
    username: 'ABC123',
    password: 'ABC123'
  },
  textToSpeech: {
    username: 'ABC123',
    password: 'ABC123'
  },
  botNames: [ // An array containing names your bot will respond to
    'duncan',
    'dunkin'
  ],
  volume: '100%'
}

module.exports = settings;