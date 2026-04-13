// Auto-generated NPC script for: Brenna
// NPC ID: A89BD03C00B54D86
// Key: brenna

function init(event) {
    event.npc.display.setName("Brenna");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
