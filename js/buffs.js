class Buffs {
    constructor() {
        this.init();
    }

    init() {
        this.buildBuffHash();
    }

    buildBuffHash() {
        this.buffs = {
            'playBuff': {
                'name': 'Playing!'
                , 'description': 'Extra joyful from having fun!'
                , 'effect': 'x<span id="e">2</span> joy/sec'
                , 'duration': 60000
                , 'modify': {
                    'resources': {
                        'joy': {
                            'g_mult': ['add', 1]
                        }
                    }
                }, 'stackable': false
                , 'eligible': true
                , 'random': false
                , 'cost': null
            }
            , 'jobBuff': {
                'name': 'Focused'
                , 'description': 'Your otters are on a roll! Increased job effects.'
                , 'effect': '+<span id="e">50</span>% job performance (food, wood, stone)'
                , 'duration': 60000
                , 'modify': {
                    'resources': {
                        'food': {
                            'g_mult_jobs': ['multiply', 1.5]
                        }
                        , 'wood': {
                            'g_mult_jobs': ['multiply', 1.5]
                        }
                        , 'stone': {
                            'g_mult_jobs': ['multiply', 1.5]
                        }
                    }
                }, 'stackable': false
                , 'eligible': true
                , 'random': true
                , 'cost': null
            }
            , 'foodDirect': {
                'name': 'Directing (A)'
                , 'description': 'Increasing the effect of your Aquafarmers.'
                , 'effect': 'x2 job performance (food)'
                , 'duration': -1
                , 'modify': {
                    'resources': {
                        'food': {
                            'g_mult_jobs': ['multiply', 2]
                        }
                    }
                }, 'stackable': false
                , 'eligible': true
                , 'random': true
                , 'cost': null
            }
            , 'woodDirect': {
                'name': 'Directing (L)'
                , 'description': 'Increasing the effect of your Loggers.'
                , 'effect': 'x2 job performance (wood)'
                , 'duration': -1
                , 'modify': {
                    'resources': {
                        'wood': {
                            'g_mult_jobs': ['multiply', 2]
                        }
                    }
                }, 'stackable': false
                , 'eligible': true
                , 'random': true
                , 'cost': null
            }
            , 'stoneDirect': {
                'name': 'Directing (M)'
                , 'description': 'Increasing the effect of your Miners.'
                , 'effect': 'x2 job performance (stone)'
                , 'duration': -1
                , 'modify': {
                    'resources': {
                        'stone': {
                            'g_mult_jobs': ['multiply', 2]
                        }
                    }
                }, 'stackable': false
                , 'eligible': true
                , 'random': true
                , 'cost': null
            }
        }
        this.buffSettings = {
            'poppable': [['jobBuff',1]]
            , 'baseChance': 0.0025
            , 'lockout': 0
        }
        this.resetCopy = JSON.parse(JSON.stringify(this.buffs));
        this.resetCopyBuffSettings = JSON.parse(JSON.stringify(this.buffSettings));
        this.activeBuffs = []
    }

    rollForBuff() {
        if(this.buffSettings.lockout == 0) {
            for(var pop of this.buffSettings['poppable']) {
                var chance = pop[1] * this.buffSettings['baseChance']
                chance = 1-Math.pow(1-chance,1/game.gameSpeed)
                var roll = Math.random()
                // console.log('chance: '+chance) 
                // console.log(chance + ' / ' + roll)
                if(roll < chance) {
                    game.addBuff(pop[0])
                    console.log('Buff popped: '+this.buffs[pop[0]]['name'])
                    this.lockout(10)
                }
            }
        } else {
            this.buffSettings['lockout'] -= 1000/game.gameSpeed
            // console.log('Locked out for '+(this.buffSettings['lockout']/1000)+'s')
        }
    }

    clearSupervise() {
        var dropIndex = []
        for(var i=this.activeBuffs.length-1; i>=0; --i) {
            if(this.activeBuffs[i][0].endsWith('Direct')) {
                dropIndex = dropIndex.concat([i])
            }
        }
        for(var index of dropIndex){
            this.activeBuffs.splice(index, 1)
        }
    }

    lockout(s) {
        this.buffSettings['lockout'] = s * 1000
        console.log('Locking out for '+s+'s')
    }

    resetBuffMetrics() {
        for(var buff of Object.keys(this.buffs)) {
            this.buffs[buff]['modify'] = JSON.parse(JSON.stringify(this.resetCopy[buff]['modify']));
            this.buffs[buff]['effect'] = this.resetCopy[buff]['effect'];
            this.buffs[buff]['duration'] = this.resetCopy[buff]['duration'];
        }
    }

    isEligibleForStacking(b) {
        var eligible = true;
        for(var buff of this.activeBuffs) {
            if((buff[0] == b) && (!this.buffs[buff[0]]['stackable'])) eligible = false;
        }
        return eligible;
    }

    dropBuff(name) {
        var dropIndex = [];
        for(var i=this.activeBuffs.length-1; i>=0; --i) {
            var buff = this.activeBuffs[i];
            if((buff[0] == name)) dropIndex = dropIndex.concat([i]);
        }
        for(var index of dropIndex){
            this.activeBuffs.splice(index, 1)
        }
    }

    refreshBuff(name) {
        for(var i=this.activeBuffs.length-1; i>=0; --i) {
            var buff = this.activeBuffs[i];
            if(buff[0] == name) {
                this.activeBuffs[i][1] = this.buffs[name]['duration'];
                this.showBuffBarfill(buff[0], buff[1], i)
                this.drawBuffs();
            }
        }
    }

    tickBuffs(time) {
        var dropOffs = []
        for(var i=this.activeBuffs.length-1; i>=0; --i) {
            if(this.activeBuffs[i][1]!=-1) {
                this.activeBuffs[i][1] -= (time - this.activeBuffs[i][2])
                this.activeBuffs[i][2] = time
                if(this.activeBuffs[i][1] <= 0) dropOffs = dropOffs.concat([i])
            }
        }
        if(dropOffs.length > 0) {
            for(var index of dropOffs){
                this.activeBuffs.splice(index, 1)
            }
            this.drawBuffs()
        }
        for(var i=0; i<this.activeBuffs.length; ++i) {
            var buff = this.activeBuffs[i];
            if(this.activeBuffs[i][1]!=-1) {
                $( '#'+buff[0]+'_'+i+' .cur').html(sec2time(buff[1]/1000))
            } else {
                $( '#'+buff[0]+'_'+i+' .cur').html('')
            }
            this.showBuffBarfill(buff[0], buff[1], i)
        }
        return(dropOffs.length > 0)
    }

    refillBuffBars() {
        for(var i=0; i<this.activeBuffs.length; ++i) {
            var buff = this.activeBuffs[i];
            this.showBuffBarfill(buff[0], buff[1], i)
        }
    }

    showBuffBarfill(name, time, id) {
        let bgWidth = Math.round( time * 100 / this.buffs[name]['duration'])
        if(name.endsWith('Direct')) {
            var job = name.substring(0,name.length-6)+"Job"
            $( '#'+name+'_'+id+' .bg' ).css('background-color' , game.community.jobs[job].color)
        } else {
            if(bgWidth < 25) {
                $( '#'+name+'_'+id+' .bg' ).css('background-color' , '#500')
            } else if(bgWidth > 75) {
                $( '#'+name+'_'+id+' .bg' ).css('background-color' , '#050')
            } else {
                $( '#'+name+'_'+id+' .bg' ).css('background-color' , '#550')
            }
        }
        var f = $('#'+name+'_'+id+' .bg').width() / $('#'+name+'_'+id+' .bg').parent().width() * 100;
        if(bgWidth != Math.round(f)) {
            // $( '#'+name+'_'+id+' .bg' ).animate({'width': Math.round(bgWidth-1).toString()+'%'}, {duration: 150, queue: false})
            $( '#'+name+'_'+id+' .bg' ).css({'width': Math.round(bgWidth-1).toString()+'%'})
        }
    }

    drawBuffs() {
        var divToShow = ""
        for(var i=0; i<this.activeBuffs.length; ++i) {
            var buff = this.activeBuffs[i];
            divToShow += "<div class='res' id='" + buff[0] + "_" + i + "'>";
            divToShow += "<div class='bg buffbg'></div><div class='resWrapper'><div class='resTitle'>" + this.buffs[buff[0]]['name'] + "</div>";
            divToShow += "<div class='resVal'><span class='cur'></span></div></div></div>";
        }
        $( '#buffArea' ).html(divToShow);
        this.drawBuffTooltips()
        $( document ).tooltip();
    }

    drawBuffTooltips() {
        for(var i=0; i<this.activeBuffs.length; ++i) {
            var buff = this.activeBuffs[i];
            this.drawBuffTooltip(''+buff[0]+'_'+i+'', buff[0]);
        }
    }

    drawTooltipStem() {
        this.drawBuffTooltips()
    }

    drawBuffTooltip(id, name) { 
        addText('#' + id, this.buffs[name]['description']+'<hr/><i id="etext">'+this.buffs[name]['effect']+'</i>');
        if(name == 'playBuff') {
            $( '#'+toTitleCase(id)+' #e' ).html(game.resources.resources['joy']['g_mult']);
        }
    }
}