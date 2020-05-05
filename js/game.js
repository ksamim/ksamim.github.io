class OtterGame {
    constructor() {
        this.resources = new Res();
        this.buildings = new Bldg();
        this.upgrades = new Upgrades();
        this.buffs = new Buffs();
        this.community = new Community();
        this.rebuildAllModifications();
    }

    init() {
        this.gameSpeed = 10;
        this.setTickRate()

        this.settings = new Settings();
        this.settings.init();
        this.settings.load();
        this.community.buildOtters();
        this.rebuildAllModifications();
    }
    
    reset() {
        this.resources = new Res();
        this.buildings = new Bldg();
        this.upgrades = new Upgrades();
        this.buffs = new Buffs();
        this.community = new Community();
        this.rebuildAllModifications();
    }

    setTickRate(alterSpeed = 1) {
        if(this.updateCycle) {
            clearInterval(this.updateCycle)
            this.updateCycle = null
        }
        this.updateCycle = setInterval(function() {
            game.tick();
        }, (1000/this.gameSpeed)/alterSpeed);
    }

    tick() {
        this.resources.tick();
        this.buildings.checkEligibility();
        this.upgrades.checkEligibility();
        this.buffs.rollForBuff();
        if(this.buffs.activeBuffs.length > 0) {
            $( '.buffs' ).css('display', 'block')
            if(this.buffs.tickBuffs(this.settings.conf['time'])){
                this.rebuildAllModifications();
            }
        }
        if(this.buffs.activeBuffs.length == 0) {
            $( '.buffs' ).css('display', 'none')
        }
        this.community.tickOtters();
    }

    addResource(type) {
        this.resources.add(type);
    }

    addBuildingAndMod(type) {
        if(this.buildings.checkPurchase(type)) {
            this.resources.applyCost(this.buildings.buildings[type]['cost']);
            this.buildings.add(type, 1);
            this.rebuildAllModifications();
        }
    }

    buyUpgrade(id) {
        if(this.upgrades.checkPurchase(id)) {
            if(id == 'evoefficient') this.addBuff('jobBuff')
            if(id == 'centralize') {
                game.buildings.buildings.pit['v'] = Math.max(
                    game.buildings.buildings.food['v'],
                    game.buildings.buildings.wood['v'],
                    game.buildings.buildings.stone['v']
                )
                game.buildings.buildings.food['v'] = 0
                game.buildings.buildings.wood['v'] = 0
                game.buildings.buildings.stone['v'] = 0
            }
            this.resources.applyCost(this.upgrades.upgrades[id]['cost']);
            this.upgrades.upgrades[id]['completed'] = true;
            this.upgrades.upgrades[id]['available'] = false;
            this.rebuildAllModifications();
            this.upgrades.populateUpgradeTab();
            this.settings.updateNames();
            this.settings.generateTooltips();
            this.buildings.drawBuildingTooltips(this.buildings.getVisibleBuildings());
            this.buildings.populateBuildings();
            this.community.drawJobDiv();
            $( '.mouseTooltip' ).css("display", "none")
        }
    }

    modifyStem(name, modifyWith, classType, modSource = 'modify', otterLevel = 0) {
        if(modifyWith[name][modSource] == null) return;
        for(var modification of Object.keys(modifyWith[name][modSource])) {
            if(modification == 'resources') {
                this.modClassFromReference(this.resources.resources, modifyWith, name, modification, classType, modSource, otterLevel)
            } else if(modification == 'buildings') {
                this.modClassFromReference(this.buildings.buildings, modifyWith, name, modification, classType, modSource, otterLevel)
            } else if(modification == 'buffs') {
                this.modClassFromReference(this.buffs.buffs, modifyWith, name, modification, classType, modSource, otterLevel)
            } else if(modification == 'jobs') {
                this.modClassFromReference(this.community.jobs, modifyWith, name, modification, classType, modSource, otterLevel)
            }
        }
    }

    modClassFromReference(classToModify, modifyWith, id, modType, classType, modSource, otterLevel) {
        for(var resourceToModify of Object.keys(modifyWith[id][modSource][modType])) {
            for(var valueToModify of Object.keys(modifyWith[id][modSource][modType][resourceToModify])) { 
                var targetClass = classToModify[resourceToModify];
                var targetRef = ''
                if(valueToModify.includes(',')) {
                    var splitValue = valueToModify.split(",")
                    // console.log('splitting: '+splitValue)
                    for(var subscript in splitValue) {
                        // console.log('subscript: '+splitValue[subscript])
                        if(subscript != splitValue.length-1) {
                            targetClass = targetClass[splitValue[subscript]]
                        } else {
                            targetRef = splitValue[subscript]
                        }
                    }
                } else {
                    targetRef = valueToModify
                }
                // console.log('----')
                // console.log('resourceToModify/valueToModify/classtype: '+resourceToModify + ' / ' + valueToModify + ' / '+classType)
                // console.log('id: '+id)
                // console.log('target class: '+targetClass)
                // console.log('target ref: '+targetRef)
                // console.log('target class\'s target ref: '+targetClass[targetRef])
                // console.log('modified with: '+modifyWith[id][modSource][modType][resourceToModify][valueToModify])
                if((valueToModify == 't') || (valueToModify == 'description') || (valueToModify == 'buyable')) {
                    targetClass[targetRef] = modifyWith[id][modSource][modType][resourceToModify][valueToModify]
                } else if (valueToModify == 'v') {
                    var modded = modFunctions(
                        modifyWith[id][modSource][modType][resourceToModify][valueToModify][0]
                        , modifyWith[id][modSource][modType][resourceToModify][valueToModify][1]
                        , targetClass[targetRef]
                    )
                    console.log(modifyWith[id][modSource][modType][resourceToModify][valueToModify][0] + ' ' + modifyWith[id][modSource][modType][resourceToModify][valueToModify][1] + ' ' + targetClass[targetRef])
                    targetClass[targetRef] = modded
                }
                else {
                    var toMod = modifyWith[id][modSource][modType][resourceToModify][valueToModify][1]
                    if(classType == 'building') {
                        toMod *= modifyWith[id]['v']
                    }
                    if(classType == 'buff') {
                        if(id == 'playBuff' && game.upgrades.upgrades['partytime'].completed && valueToModify == 'g_mult') {
                            toMod += 0.05 * game.resources.resources.pop.v;
                        }
                    }
                    if(classType == 'job') {
                        // Modify effect with otter level
                        toMod *= (1 + otterLevel * 0.25)
                        // Further modify if there is a manager
                        if(this.upgrades.upgrades['managers'].completed) {
                            if(resourceToModify == 'joy') continue;
                            var manager = this.community.getManager(resourceToModify + 'Job')
                            if(manager > -1) toMod *= (1 + this.community.otters[manager].getImpact())
                        }
                    }
                    if(toMod > 0) {
                        var modded = modFunctions(
                            modifyWith[id][modSource][modType][resourceToModify][valueToModify][0]
                            , toMod
                            , targetClass[targetRef]
                        )
                        // console.log('mod output: '+modded)
                        targetClass[targetRef] = modded
                    }
                }
                // console.log(targetClass)
                // console.log('----')
            }
        }
    }

    addBuff(name) {
        var newBuff = this.buffs.buffs[name]
        if(name.endsWith('Direct')) {
            this.buffs.clearSupervise();
        }
        if(!this.buffs.isEligibleForStacking(name)) {
            this.buffs.refreshBuff(name);
        } else {
            this.buffs.activeBuffs = this.buffs.activeBuffs.concat([[name, newBuff['duration'], this.settings.conf['time']]])
            this.rebuildAllModifications();
        }
        $( '.buffs' ).css('display', 'block')
        this.settings.updateResources()
        this.buffs.drawBuffs();
    }

    rebuildAllModifications() {
        this.resources.resetResourceMetrics();
        this.buildings.resetBuildingMetrics();
        this.buffs.resetBuffMetrics();
        this.community.resetJobMetrics();
        this.modResourcesAndBuildings();
        this.buildings.rebuildAllCosts();
        if(this.settings != null) {
            this.settings.generateTooltips();
            this.settings.updateNames();
        }
        this.drawAllTooltips();
        this.buffs.refillBuffBars();
    }

    drawAllTooltips() {
        this.resources.drawTooltipStem();
        this.buildings.drawTooltipStem();
        this.buffs.drawTooltipStem();
        this.community.drawTooltipStem();
    }

    modResourcesAndBuildings() {
        for(var upgrade of this.upgrades.getUpgradesByCompletion(true)) {
            this.modifyStem(upgrade, this.upgrades.upgrades, 'upgrade');
            if(this.upgrades.upgrades[upgrade]['cbonus'] != null) {
                if(this.upgrades.eraComplete(upgrade)) {
                    this.modifyStem(upgrade, this.upgrades.upgrades, 'upgrade', 'cbonus');
                }
            }
        }
        for(var building of Object.keys(this.buildings.buildings)) {
            this.modifyStem(building, this.buildings.buildings, 'building')
        }
        for(var buff of this.buffs.activeBuffs) {
            this.modifyStem(buff[0], this.buffs.buffs, 'buff')
        }
        if(this.community.otters != null) {
            for(var otter of this.community.otters) {
                this.modifyStem(otter.otter['job'], this.community.jobs, 'job', 'modify', otter.otter['level'])
            }
        }
    }
}

var game;

$( document ).ready(function() {
    game = new OtterGame()
    game.init()
    game.buildings.checkEligibility()
})