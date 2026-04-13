// Auto-generated NPC script for: Yshara
// NPC ID: B9F64BCF0AE01B1F
// Key: yshara

function init(event) {
    event.npc.display.setName("Yshara");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
