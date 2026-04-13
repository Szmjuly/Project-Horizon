// Auto-generated NPC script for: Mara
// NPC ID: 620E03A14EB4DD2B
// Key: mara

function init(event) {
    event.npc.display.setName("Mara");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
