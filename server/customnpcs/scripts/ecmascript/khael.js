// Auto-generated NPC script for: Khael
// NPC ID: C6AB0268F483F471
// Key: khael

function init(event) {
    event.npc.display.setName("Khael");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
