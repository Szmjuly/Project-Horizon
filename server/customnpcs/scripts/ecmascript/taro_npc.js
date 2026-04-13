// Auto-generated NPC script for: Taro Npc
// NPC ID: 029E57C0EA39F61B
// Key: taro_npc

function init(event) {
    event.npc.display.setName("Taro Npc");
}

function interact(event) {
    var player = event.player;
    var dialog = event.npc.dialog;

    dialog.say("Hello there, trainer!");
}
