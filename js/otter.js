class Otter {
    constructor(hash = null) {
        this.makeOtterHash(hash);
    }

    makeOtterHash(hash) {
        if(hash != null) {
            this.otter = hash;
        } else {
            this.otter = {
                'name': this.pickUniqueName(),
                'job': 'noJob',
                'level': 0,
                'exp': 0,
                'expRate': 0.25,
                'manages': null,
                'impact': 0.25
            }
        }
    }

    nextCutoff() {
        return 100*Math.pow(2,this.otter.level)
    }

    pickUniqueName() {
        var name = '';
        var unique = false;
        while(!unique) {
            name = toTitleCase(otterNames[Math.floor(Math.random() * otterNames.length)]);
            unique = true;
            if(game != null) {
                if(game.community != null) {
                    for(var o of game.community.otters) {
                        if(name.localeCompare(o.otter['name']) == 0) unique = false;
                    }
                }
            }
        }
        return name;
    }

    getImpact() {
        return this.otter['impact'] * (this.otter['level'] + 1)
    }

    getOtterHash() {
        return this.otter;
    }

    setOtterHash(newHash) {
        this.otter = newHash;
    }

    tickExperience() {
        var nextTick = this.otter.expRate
        if(this.otter.manages != null) nextTick *= 3
        if(game.upgrades.eraComplete('evocommunal')) nextTick *= 2
        this.otter.exp += nextTick * (game.gameSpeed/1000);
        if(this.otter.exp >= this.nextCutoff()) {
            this.otter.exp = 0;
            this.otter.level += 1;
            return true;
        }
        return false;
    }
}