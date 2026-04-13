// Auto-generated NPC script for: Lyra
// NPC ID: 9EC4BC78CA791D33
// Key: lyra

function init(event) {
    event.npc.display.setName("Lyra");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
