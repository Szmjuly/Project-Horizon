// Auto-generated NPC script for: The Watcher
// NPC ID: 3F74D61571C83D0E
// Key: the_watcher

function init(event) {
    event.npc.display.setName("The Watcher");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
