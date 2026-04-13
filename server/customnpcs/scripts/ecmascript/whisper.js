// Auto-generated NPC script for: Whisper
// NPC ID: 9B725E0560E6035A
// Key: whisper

function init(event) {
    event.npc.display.setName("Whisper");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
