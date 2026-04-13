// Auto-generated NPC script for: Sera
// NPC ID: 67642061AEA55718
// Key: sera

function init(event) {
    event.npc.display.setName("Sera");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
