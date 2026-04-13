// Auto-generated NPC script for: Lockhart
// NPC ID: 3D9D062A6C1153CD
// Key: lockhart

function init(event) {
    event.npc.display.setName("Lockhart");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
