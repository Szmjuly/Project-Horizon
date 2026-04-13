// Auto-generated NPC script for: Petra
// NPC ID: F865CEC72B55E568
// Key: petra

function init(event) {
    event.npc.display.setName("Petra");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
