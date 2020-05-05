class Res {
    constructor() {
        this.init();
    }

    init() {
        this.resources = {
            'food': {
                'description': 'Gather up something to eat!<hr/><i>+<span id="e">1</span> food</i>',
                'v': 0.0,
                'm': 0.0,
                'g': 0,
                'g_mult': 1,
                'g_mult_jobs': 1,
                'i': 1,
                't': 'gather shrimp'
            },
            'wood': {
                'description': 'Scrounge up some wood!<hr/><i>+<span id="e">1</span> wood</i>',
                'v': 0.0,
                'm': 0,
                'g': 0.0,
                'g_mult': 1,
                'g_mult_jobs': 1,
                'i': 1,
                't': 'collect twigs'
            },
            'stone': {
                'description': 'Dig around for some stones!<hr/><i>+<span id="e">1</span> stone</i>',
                'v': 0.0,
                'm': 0.0,
                'g': 0.0,
                'g_mult': 1,
                'g_mult_jobs': 1,
                'i': 1,
                't': 'collect pebbles'
            },
            'joy': {
                'description': 'Play for a bit to generate more joy!<hr/><i>Temporary x<span id="e">2</span> joy/sec</i>',
                'v': 0,
                'm': 5.0,
                'i': 1000000000,
                'g_base': .1,
                'g': .1,
                'g_mult_jobs': 1,
                'g_mult': 1,
                'g_mult_i': 1,
                't': 'play'
            },
            'pop': {
                'v': 1,
                'i': -1,
                'm': 0.0,
                'g_mult': 1
            }
        }
        this.clickable_resources = ['food', 'wood', 'stone', 'joy']
        this.resetCopy = JSON.parse(JSON.stringify(this.resources));
        this.setOnClicks();
    }

    add(type, amount = null) {
        if(amount == null) amount = this.resources[type]['i'];
        if((((this.resources[type]['v'] + amount) <= this.resources[type]['m']) && ((this.resources[type]['v'] + amount) >= 0))
            || ((this.resources[type]['v'] + amount) > this.resources[type]['m']) && (amount < 0)) {
            this.resources[type]['v'] += amount;
            return true;
        } else if((this.resources[type]['v'] + amount) > this.resources[type]['m']){
            if(this.resources[type]['v'] < this.resources[type]['m']) {
                this.resources[type]['v'] = this.resources[type]['m'];
            }
            return false;
        } else if((this.resources[type]['v'] + amount) < 0){
            this.resources[type]['v'] = 0;
            return false;
        }
    }

    setV(type, amount) {
        this.resources[type]['v'] = amount;
    }

    resetResourceMetrics() {
        for(var resource of Object.keys(this.resources)) {
            for(var trait of ['m','i','g','g_mult','g_mult_base','g_mult_jobs']) {
                this.resources[resource][trait] = this.resetCopy[resource][trait];
            }
        }
    }

    checkCosts(costs, modVal = 1.0) {
        let canBuy = true;
        for(var cost of Object.keys(costs)) {
            if((costs[cost] * modVal) > (this.resources[cost]['v'])) {
                canBuy = false;
            }
        }
        return canBuy;
    }

    applyCost(costs) {
        for(var cost of Object.keys(costs)) {
            this.add(cost, -1*costs[cost])
        }
    }

    modIntensity(type, amount = 1, preMult = 1, postMult = 1) {
        this.resources[type]['i'] = (this.resources[type]['i'] * preMult + amount) * postMult;
    }

    modMaxStorage(type, amount) {
        this.resources[type]['i'] = (this.resources[type]['i'] * preMult + amount) * postMult;
    }

    getCur(type) {
          return Math.round(this.resources[type]['v']);
    }

    getMax(type) {
          return this.resources[type]['m'];
    }

    getPPS(type) {
        if(type == 'food') return Math.round((this.resources[type]['g'] * this.resources[type]['g_mult'] * this.resources[type]['g_mult_jobs'] + this.resources['pop']['i'] * this.resources['pop']['v']) * 100)/100;
        return Math.round(this.resources[type]['g'] * this.resources[type]['g_mult'] * this.resources[type]['g_mult_jobs'] * 100)/100;
    }

    getIntensity(type) {
          return Math.round(this.resources[type]['i']*100)/100;
    }

    getTypeName(type) {
          return this.resources[type]['t'];
    }

    getClickable() {
        return this.clickable_resources
    }

    names() {
        return Object.keys(this.resources)
    }

    tick() {
        for(name of this.names()) {
            var nextGen = this.resources[name]['g'] * this.resources[name]['g_mult'] * this.resources[name]['g_mult_jobs'];
            if(name == 'food') nextGen += this.resources['pop']['v'] * this.resources['pop']['i'];
            this.add(name, nextGen * (1/game.gameSpeed)); // PREVENTS CHEATING
            // this.add(name, nextGen); // ALLOWS CHEATING
        }
        this.adjustJoyIntensity();
        this.rollForOtters();
    }

    adjustJoyIntensity() {
        var base = this.resources.joy['g_mult_jobs']
        var joyLog = Math.log((this.resources.food['v']+1)*this.resources.pop['v'])/Math.log(this.resources.joy['i'])
        base = Math.round(base * 100)/100
        joyLog = Math.round(joyLog * 100)/100
        var otterBonus = 0
        if(game.upgrades.upgrades['goodcompany']['completed']) otterBonus = 0.01 * game.resources.resources.pop['v'];

        this.resources.joy['g'] = base * joyLog * (1 + otterBonus)

        var toPrint = "<i>food</i>: "+printValueAndSign(joyLog)+"<br/><i>playmates</i>: "+printValueAndSign(Math.round((base-1)*100))+'%'
        if(otterBonus > 0) toPrint += "<br/><i>Pop. Bonus</i>: +" + Math.round(otterBonus * 100) + '%'
        if(this.resources.joy['g_mult'] > 1) toPrint += "<br/><i>Playing!</i>: x" + this.resources.joy['g_mult']
        $( '.joyPPS #e' ).html(
            toPrint
        )
    }

    rollForOtters() {
        // ((2/1.9)^(x-(110*(1+10/100)))))
        if(this.resources.pop['v']<this.resources.pop['m']) {
            var prob = (this.resources.joy['v']/(4*(20*this.resources.pop['v']/2 + 50))) * (1/game.gameSpeed);
            var roll = Math.random()
            $('#popRes #e').html((Math.round(compute_bindiff(0,game.gameSpeed,prob)*1000)/10)+'%')
            if(roll < prob) {
                this.resources.pop['v'] += 1;
                game.community.addOtter();
            }
        } else {
            var prob = (this.resources.joy['v']/(4*(20*this.resources.pop['v']/2 + 50))) * (1/game.gameSpeed);
            $('#popRes #e').html((Math.round(compute_bindiff(0,game.gameSpeed,prob)*1000)/10)+'%')
        }
    }

    setOnClicks() {
        for(name of this.names()) {
            $("#mk"+toTitleCase(name)).prop("onclick", null).off("click");
            $( "#mk"+toTitleCase(name) ).click(function() {
                var name = this.id.toLowerCase().substring(2);
                if(name != 'joy') {
                    if(game.upgrades.upgrades['supervise'].completed) {
                        game.addBuff(name+'Direct')
                    } else {
                        game.addResource(name);
                        game.settings.updateResourceValues(name);
                    }
                } else {
                    game.addBuff('playBuff');
                    game.settings.updateResourceValues(name);
                }
            });
        }
    }

    drawTooltipStem() {
        for(var res of Object.keys(this.resources)) {
            if(res == 'joy') {
                addText('#mk' + toTitleCase(res), this.resources[res]['description'])
                if(game != null) {
                    var mult = game.buffs.buffs['playBuff']['modify']['resources']['joy']['g_mult'][1];
                    if(game.upgrades.upgrades['partytime'].completed) mult += 0.05 * this.resources.pop.v
                    $('#mk' + toTitleCase(res) + ' #e').html(mult);
                }
            } else if (res == 'pop') {

            } else {
                addText('#mk' + toTitleCase(res), this.resources[res]['description'])
                $('#mk' + toTitleCase(res) + ' #e').html(this.resources[res]['i'])
            }
        }
        // addText('#mkFood', 'Gather up something to eat!<hr/><i>+<span id="e">'+this.getIntensity('food').toString()+'</span> food</i>')
        // addText('#mkWood', 'Scrounge up some wood!<hr/><i>+<span id="e">'+this.getIntensity('wood').toString()+'</span> wood</i>')
        // addText('#mkStone', 'Dig around for some stones!<hr/><i>+<span id="e">'+this.getIntensity('stone').toString()+'</span> stone</i>')
        // addText('#mkJoy', 'Play for a bit to generate more joy!<hr/><i>Temporary x<span id="e">2</span> joy/sec</i>')
        // if(game != null) {
        //     if(game.buffs.activeBuffs.map(x => x[0]).includes('playBuff')) {
        //         $( '#mkJoy #e' ).html(this.resources['joy']['g_mult']);
        //     }
        //     else {
        //         $( '#mkJoy #e' ).html(this.resources['joy']['g_mult']+game.buffs.buffs['playBuff']['modify']['resources']['joy']['g_mult'][1]);
        //     }
        // }
        addText(".joyPPS", 'Modifiers:<hr/><div id="e"></div>')
        addText("#popRes", 'Probability of new <br/>otter per second:<br/><span class="joyOdds" id="e"></span><br/><i>(affected by joy)</i>')
    }
}