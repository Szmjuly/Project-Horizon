// Auto-generated NPC script for: Theron
// NPC ID: F9CE754991FFD81B
// Key: theron

function init(event) {
    event.npc.display.setName("Theron");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
