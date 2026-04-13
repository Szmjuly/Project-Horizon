// Auto-generated NPC script for: Aren
// NPC ID: 383A01AEF137130F
// Key: aren

function init(event) {
    event.npc.display.setName("Aren");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
