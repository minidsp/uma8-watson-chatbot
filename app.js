var fs = require('fs');
var mic = require('mic');
var lame = require('lame');
var Speaker = require('speaker');

var settings = require('./settings.js')

var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var speech_to_text = new SpeechToTextV1(settings.speechToText);

var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var text_to_speech = new TextToSpeechV1(settings.textToSpeech);

var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var conversation = new ConversationV1({
  version_date: ConversationV1.VERSION_DATE_2017_05_26,
  username: settings.conversation.username,
  password: settings.conversation.password
});

var exec = require('child_process').exec;
exec("amixer sset PCM,0 " + settings.volume);

var listening = false;
var chatContext;

var micInstance = mic({
  'device': 'hw:1,0',
  'bitwidth': 32,
  'channels': '2'
});
var micInputStream = micInstance.getAudioStream();

micInputStream
  .pipe(speech_to_text.createRecognizeStream({
    content_type: 'audio/l16; rate=44100'
  }))
  .setEncoding('utf8')
  .on('data', processSpeech);

micInstance.start();

console.log('App Started!');
talk("Hi, my name is " + settings.botNames[0] + "!");

function processSpeech(speech) {
  var speech = speech.toLowerCase();

  console.log('Incoming Voice: ' + speech);
  
  if (listening) {
    return conversation.message({
      input: {
        text: speech
      },
      workspace_id: settings.conversation.workspaceId,
      context: chatContext ? chatContext : {}
    }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
        chatContext = response.context;
        //console.log(JSON.stringify(response, null, 2));
        if (response.output.log_messages.length > 0) {
          listening = false;
          return talk('I don\'t know what that means.');
        }
        listening = false;
        talk(response.output.text);
      }
    });
    
  }
    
  var nameDetected = false;
  settings.botNames.forEach(function(name) {
    if (speech.indexOf(name) !== -1) nameDetected = true;
  });
  
  if (nameDetected) {
    listening = true;
    micInstance.pause();
    fs.createReadStream('ding.mp3')
      .pipe(new lame.Decoder)
      .pipe(new Speaker)
      .on('finish', function() {
        setTimeout(micInstance.resume, 400);
      });
  }
    
}

function talk(text) {
  console.log('Saying: ' + text)
  var params = {
    text: String(text),
    //voice: 'en-US_LisaVoice', // Optional voice 
    accept: 'audio/mp3'
  };

  var decoder = new lame.Decoder();
  decoder.on('format', function(format) {
    decoder.pipe(new Speaker(format))
      .on('finish', function() {
        micInstance.resume();
      });
  });

  micInstance.pause();
  text_to_speech.synthesize(params).pipe(decoder);
}