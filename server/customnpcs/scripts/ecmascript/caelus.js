// Auto-generated NPC script for: Caelus
// NPC ID: A2886EC31F3A079D
// Key: caelus

function init(event) {
    event.npc.display.setName("Caelus");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
