// Auto-generated NPC script for: Veridia
// NPC ID: 9085DCB9BAA4545A
// Key: veridia

function init(event) {
    event.npc.display.setName("Veridia");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
