// Auto-generated NPC script for: Tomo
// NPC ID: 324939731A85475E
// Key: tomo

function init(event) {
    event.npc.display.setName("Tomo");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
