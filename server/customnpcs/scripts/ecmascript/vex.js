// Auto-generated NPC script for: Vex
// NPC ID: 21B21942D9C9A7F2
// Key: vex

function init(event) {
    event.npc.display.setName("Vex");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
