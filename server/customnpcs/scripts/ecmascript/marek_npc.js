// Auto-generated NPC script for: Marek Npc
// NPC ID: 463778DEA2A26F85
// Key: marek_npc

function init(event) {
    event.npc.display.setName("Marek Npc");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
