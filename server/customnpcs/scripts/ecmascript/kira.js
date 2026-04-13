// Auto-generated NPC script for: Kira
// NPC ID: 569F5690C0DC71A4
// Key: kira

function init(event) {
    event.npc.display.setName("Kira");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
