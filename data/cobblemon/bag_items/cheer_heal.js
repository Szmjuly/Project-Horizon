{
    use(battle, pokemon, itemId, data) {
        var origin = data[0];
        battle.log = battle.log.filter(line => !(line.startsWith('|bagitem|') && line.includes('cheer')));

        battle.add('cheer', 'cheer_heal', origin);
        for (let p of battle.sides[0].pokemon) {
            if (!p) continue;
            p.heal(Math.floor(p.maxhp * 0.5));
            p.cureStatus();
            battle.add('-heal', p, p.getHealth, '[from] bagitem: ' + itemId);
        }
    }
}
