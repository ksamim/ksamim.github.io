class Upgrades {
    constructor() {
        this.init();
    }

    init() {
        this.buildUpgradeHash();
        this.populateUpgradeTab();
    }

    buildUpgradeHash() {
        this.upgrades = {
            "evoadaptable": {
                'name': 'Adaptable'
                , 'description': 'Infinite uses of finite resources'
                , 'effect': 'Increase joy cap to 100.<br/>Food affects joy more.<hr/><span class="mastery">Mastery:</span><br/>Cheaper Generators'
                , 'cost': {
                    'joy': 5
                }
                , 'req': null
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'joy': {
                            'm': ['set',100],
                            'i': ['divide', 10000]
                        }
                    }
                },
                'cbonus': {
                    // 'buildings': {
                    //     'foodgen': {
                    //         'costScaling': ['multiply', 1]
                    //     },
                    //     'woodgen': {
                    //         'costScaling': ['multiply', 1]
                    //     },
                    //     'stonegen': {
                    //         'costScaling': ['multiply', 1]
                    //     }
                    // },
                    'buildings': {
                        'foodgen': {
                            'cost,food': ['multiply', 0.9],
                            'cost,stone': ['multiply', 0.9]
                        },
                        'woodgen': {
                            'cost,food': ['multiply', 0.9],
                            'cost,wood': ['multiply', 0.9],
                            'cost,stone': ['multiply', 0.9]
                        },
                        'stonegen': {
                            'cost,food': ['multiply', 0.9],
                            'cost,wood': ['multiply', 0.9],
                            'cost,stone': ['multiply', 0.9]
                        }
                    },
                    'description': 'Food/Wood/Stone Generators -10% Cost'
                }
            },
            "clamhunting": {
                'name': 'Clam Hunting'
                , 'description': 'Dig up clams and crack em open with rocks!'
                , 'effect': '+1 food/click'
                , 'cost': {
                    'joy': 15
                    , 'wood': 10
                    , 'stone': 25
                }
                , 'req': ['evoadaptable']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'food': {
                            't': 'gather clams',
                            'i': ['add',1]
                        }
                    }
                }
            },
            "branches": {
                'name': 'Tree Branches'
                , 'description': 'Pick through driftwood for bigger branches.'
                , 'effect': '+1 wood/click'
                , 'cost': {
                    'joy': 30
                    , 'wood': 25
                }
                , 'req': ['evoadaptable']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'wood': {
                            't': 'collect branches',
                            'i': ['add',1]
                        }
                    }
                }
            },
            "diggingstick": {
                'name': 'Digging Stick'
                , 'description': 'You found a great stick with a narrow end, great for digging out bigger stones in the silt!'
                , 'effect': '+1 stone/click'
                , 'cost': {
                    'joy': 30
                    , 'wood': 35
                }
                , 'req': ['evoadaptable', "branches"]
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'stone': {
                            't': 'collect rocks',
                            'i': ['add',1]
                        }
                    }
                }
            },
            "clamfarms": {
                'name': 'Clam Farms'
                , 'description': 'You\'ve developed a taste for clams. Upgrade to clam farms!'
                , 'effect': '+50% food/sec'
                , 'cost': {
                    'joy': 35
                    , 'food': 50
                    , 'wood': 50
                }
                , 'req': ['evoadaptable', "clamhunting"]
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'foodgen': {
                            't': 'clam farm',
                            'i': ['multiply',1.5],
                            'modify,resources,food,g,1': ['multiply',1.5]
                        }
                    }
                }
            },
            "biggerdams": {
                'name': 'Bolster Dams'
                , 'description': 'Add branches to your dams, making them snag more wood!'
                , 'effect': '+50% wood/sec'
                , 'cost': {
                    'joy': 50
                    , 'food': 50
                    , 'wood': 75
                }
                , 'req': ['evoadaptable', "branches"]
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'woodgen': {
                            't': 'log jam',
                            'i': ['multiply',1.5],
                            'modify,resources,wood,g,1': ['multiply',1.5]
                        }
                    }
                }
            },
            "quarries": {
                'name': 'Rock Quarries'
                , 'description': 'Pebbles are fun, but rocks are more useful! Search the rocky areas past the shore.'
                , 'effect': '+50% stone/sec'
                , 'cost': {
                    'joy': 50
                    , 'food': 50
                    , 'stone': 75
                }
                , 'req': ['evoadaptable', "diggingstick"]
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'stonegen': {
                            't': 'rock quarries',
                            'description': 'Search the rocky areas past the shore.',
                            'i': ['multiply',1.5],
                            'modify,resources,stone,g,1': ['multiply',1.5]
                        }
                    }
                }
            },
            "pebblejuggling": {
                'name': 'Pebble Juggling'
                , 'description': 'Tossing rocks is a really fun game!'
                , 'effect': 'Playing increases joy by x3'
                , 'cost': {
                    'joy': 25
                    , 'stone': 50
                }
                , 'req': ['evoadaptable']
                , 'optional': true
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buffs': {
                        'playBuff': {
                            'modify,resources,joy,g_mult,1': ['add',1]
                        }
                    }
                }
            },
            "rockstacking": {
                'name': 'Stack Rocks'
                , 'description': 'Stack rocks for longer-lasting fun!'
                , 'effect': 'x3 \"Playing!\" buff duration'
                , 'cost': {
                    'joy': 75
                    , 'stone': 125
                }
                , 'req': ['evoadaptable', 'pebblejuggling', 'diggingstick']
                , 'optional': true
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buffs': {
                        'playBuff': {
                            'duration': ['multiply',3]
                        }
                    }
                }
            },
            "evocommunal": {
                'name': 'Communal'
                , 'description': 'A village is powered by its numbers'
                , 'effect': 'Increase joy cap to 250.<br/>Unlocks new building.<hr/><span class="mastery">Mastery:</span><br/>Otters Learn Faster'
                , 'cost': {
                    'joy': 100
                }
                , 'req': null
                , 'req_all': ['evoadaptable']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'joy': {
                            'm': ['set',250]
                        }
                    }
                },
                'cbonus': {
                    'buildings': {
                        'foodgen': {
                            'cost,food': ['multiply', 1],
                        }
                    },
                    'description': 'x2 Otter Job Exp.'
                }
            },
            "sharing": {
                'name': 'Sharing'
                , 'description': 'Lower food consumption by sharing meals.'
                , 'effect': 'Otters eat <span id="e">30%</span> less food.'
                , 'cost': {
                    'joy': 100
                    , 'food': 150
                }
                , 'req': ['evocommunal']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'pop': {
                            'i': ['multiply',0.7]
                        }
                    }
                }
            },
            "aquarotation": {
                'name': 'Aqua-Rotation'
                , 'description': 'Bolster food production by rotating generations of farm animals between farms.'
                , 'effect': '+50% food/sec'
                , 'cost': {
                    'joy': 100
                    , 'food': 150
                }
                , 'req': ['evocommunal']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'foodgen': {
                            't': 'seeded clam farm',
                            'i': ['multiply',1.5],
                            'modify,resources,food,g,1': ['multiply',1.5]
                        }
                    }
                }
            },
            "partytime": {
                'name': 'Party Time!'
                , 'description': 'Everyone plays together!'
                , 'effect': '+5% "Playing!" effect<br/>per otter.'
                , 'cost': {
                    'joy': 135
                    , 'food': 185
                    , 'stone': 125
                    , 'wood': 85
                }
                , 'req': ['evocommunal', 'sharing']
                , 'optional': true
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'joy': {
                            't': 'play together!'
                        }
                    }
                }
            },
            "goodcompany": {
                'name': 'Good Company'
                , 'description': 'The more the merrier!'
                , 'effect': 'Each additional otter increases Joy generation by <span id="e">1</span>%'
                , 'cost': {
                    'joy': 115
                    , 'food': 100
                }
                , 'req': ['evocommunal']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'pop': {
                            'i': ['multiply',0.8]
                        }
                    }
                }
            },
            "snuggleup": {
                'name': 'Snuggle Up'
                , 'description': 'Time to get cozy.'
                , 'effect': '+1 otters/Den'
                , 'cost': {
                    'joy': 150
                    , 'food': 125
                    , 'stone': 85
                    , 'wood': 85
                }
                , 'req': ['evocommunal', 'goodcompany']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'home1': {
                            'i': ['set',3],
                            't': 'cozy den',
                            'modify,resources,pop,m,1': ['set',3]
                        }
                    }
                }
            },
            "experiencegain": {
                'name': 'Practice Makes Perfect'
                , 'description': 'You can\'t do the same thing 8 hours a day without improving.'
                , 'effect': 'Otters earn experience in their jobs over time, improving the job\'s effects.'
                , 'cost': {
                    'joy': 125
                    , 'food': 85
                    , 'stone': 150
                    , 'wood': 150
                }
                , 'req': ['evocommunal']
                , 'optional': false
                , 'available': false
                , 'completed': false
            },
            "woodstorage": {
                'name': 'Build It Together'
                , 'description': 'With help, you can upgrade your storage buildings using heavier materials!'
                , 'effect': 'Storage +50%.'
                , 'cost': {
                    'joy': 150
                    , 'stone': 225
                    , 'wood': 225
                }
                , 'req': ['evocommunal', 'experiencegain']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'food': {
                            'modify,resources,food,m,1': ['multiply', 2]
                            , 'i': ['multiply', 2]
                            , 't': 'driftwood food burrow'
                        },
                        'wood': {
                            'modify,resources,wood,m,1': ['multiply', 2]
                            , 'i': ['multiply', 2]
                            , 't': 'driftwood wood pen'
                        },
                        'stone': {
                            'modify,resources,stone,m,1': ['multiply', 2]
                            , 'i': ['multiply', 2]
                            , 't': 'driftwood stone hoard'
                        },
                        'pit': {
                            'modify,resources,food,m,1': ['multiply', 2]
                            , 'modify,resources,wood,m,1': ['multiply', 2]
                            , 'modify,resources,stone,m,1': ['multiply', 2]
                            , 'i': ['multiply', 2]
                            , 't': 'driftwood storage pit'
                        }
                    },
                }
            },
            "managers": {
                'name': 'Managers'
                , 'description': 'Let the cream rise to the top!'
                , 'effect': 'Unlocks managers for jobs, who level faster and boost their managed otters\' effects.<hr/>Select managers from Community > Pals.'
                , 'cost': {
                    'joy': 165
                    , 'food': 85
                    , 'stone': 150
                    , 'wood': 150
                }
                , 'req': ['evocommunal', 'experiencegain']
                , 'optional': false
                , 'available': false
                , 'completed': false
            },
            "evoefficient": {
                'name': 'Efficient'
                , 'description': 'Learn to be a well-oiled machine'
                , 'effect': 'Increase joy cap to 1000.<br/>Occasional timed job-boosting buff.<hr/><span class="mastery">Mastery:</span><br/>More Random Buffs'
                , 'cost': {
                    'joy': 250
                }
                , 'req': null
                , 'req_all': ['evocommunal']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'joy': {
                            'm': ['set',1000]
                        }
                    }
                },
                'cbonus': {
                    'buildings': {
                        'foodgen': {
                            'cost,food': ['multiply', 1],
                        }
                    },
                    'description': 'More Random Buffs, More Frequently'
                }
            },
            "centralize": {
                'name': 'Centralize'
                , 'description': 'Ditch specialized storage.'
                , 'effect': 'Convert your storage to a single, more efficient building.'
                , 'cost': {
                    'joy': 275
                    , 'food': 325
                    , 'stone': 300
                    , 'wood': 300
                }
                , 'req': ['evoefficient']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'pit': {
                            'buyable': true
                        },
                        'food': {
                            'buyable': false
                        },
                        'wood': {
                            'buyable': false
                        },
                        'stone': {
                            'buyable': false
                        }
                    }
                }
            },
            "organize": {
                'name': 'Organize'
                , 'description': 'Use more of your pit space by stacking resources higher!'
                , 'effect': '2x pit storage'
                , 'cost': {
                    'joy': 250
                    , 'food': 400
                    , 'stone': 500
                    , 'wood': 500
                }
                , 'req': ['evoefficient','centralize']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buildings': {
                        'pit': {
                            'modify,resources,food,m,1': ['multiply', 2]
                            , 'modify,resources,wood,m,1': ['multiply', 2]
                            , 'modify,resources,stone,m,1': ['multiply', 2]
                            , 'i': ['multiply', 2]
                        }
                    }
                }
            },
            "supervise": {
                'name': 'Supervise'
                , 'description': 'Your time is wasted manually gathering, use it to direct workers.'
                , 'effect': 'Instead of clicking, you now buff one resource at a time.'
                , 'cost': {
                    'joy': 500
                    , 'food': 415
                    , 'stone': 450
                    , 'wood': 440
                }
                , 'req': ['evoefficient']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'resources': {
                        'food': {
                            't': 'Direct Aquafarmers'
                        },
                        'wood': {
                            't': 'Direct Loggers'
                        },
                        'stone': {
                            't': 'Direct Miners'
                        }
                    }
                }
            },
            "choreography": {
                'name': 'Choreography'
                , 'description': 'Dancing around the gathering grounds lifts your spirits all day!'
                , 'effect': 'x10 \"Playing!\" buff duration (30m)'
                , 'cost': {
                    'joy': 500
                    , 'food': 415
                    , 'stone': 450
                    , 'wood': 440
                }
                , 'req': ['evoefficient']
                , 'optional': false
                , 'available': false
                , 'completed': false
                , 'modify': {
                    'buffs': {
                        'playBuff': {
                            'duration': ['multiply',10]
                        }
                    }
                }
            }
        }
        this.resetCopy = JSON.parse(JSON.stringify(this.upgrades));
    }

    checkPurchase(id) {
        return game.resources.checkCosts(this.upgrades[id]['cost']);
    }

    updateAvailableUpgrades() {
        var completedUpgrades = this.getUpgradesByCompletion(true)
        for(var upgrade of this.getUpgradesByCompletion(false)) {
            if(!this.upgrades[upgrade]['available'] && 
                ((this.upgrades[upgrade]['req'] == null) || this.upgrades[upgrade]['req'].every(r => completedUpgrades.includes(r))) &&
                ((this.upgrades[upgrade]['req_all'] == null) || this.upgrades[upgrade]['req_all'].every(r => this.eraComplete(r, false)))
            ) {
                this.upgrades[upgrade]['available'] = true;
            }
        }
    }

    eraComplete(era, optionals = true) {
        var curAndMax = this.getCurAndMaxOfCategory(era, optionals)
        return(curAndMax[0] == curAndMax[1])
    }

    setCompleted(name, truth) {
        this.upgrades[name]['completed'] = truth
    }

    checkEligibility() {
        var hasEligible = false;
        for(var upgrade of this.getAvailableUpgrades(true)) {
            if(game.resources.checkCosts(this.upgrades[upgrade]['cost'])) {
                $( '#upgradeId' + toTitleCase(upgrade) ).removeClass('dis');
                $( '#upgradeId' + toTitleCase(upgrade) ).addClass('pro');
                hasEligible = true;
            } else {
                $( '#upgradeId' + toTitleCase(upgrade) ).removeClass('pro');
                $( '#upgradeId' + toTitleCase(upgrade) ).addClass('dis');
            }
        }
        if(hasEligible) {
            $( '#upgBtn' ).addClass('menuGlow');
            if(($( '#upgBtn' ).css("display") == 'none') && !(game.upgrades.getUpgradesByCompletion(true).length > 0)) {
                var fadeSpeed = 250;
                $( '#upgBtn' ).fadeOut(0).fadeIn(fadeSpeed).fadeOut(fadeSpeed).fadeIn(fadeSpeed).fadeOut(fadeSpeed).fadeIn(fadeSpeed);
            }
            $( '#upgBtn' ).css("display", "block");
        } else {
            $( '#upgBtn' ).removeClass('menuGlow');
        }
        return(hasEligible)
    }

    getUpgradesByCompletion(completed) {
        return Object.keys(this.upgrades).filter(key => this.upgrades[key]['completed'] === completed);
    }

    getAvailableUpgrades(available) {
        return Object.keys(this.upgrades).filter(key => this.upgrades[key]['available'] === available && this.upgrades[key]['completed'] === false);
    }

    getCompletedEras() {
        return Object.keys(this.upgrades).filter(key => this.upgrades[key]['completed'] === true && key.startsWith('evo'));
    }

    populateUpgradeTab() {
        this.updateAvailableUpgrades();
        var available = this.getAvailableUpgrades(true);
        var completed = this.getUpgradesByCompletion(true);
        var eras = this.getCompletedEras();
        this.draw(available, 'availableUpgrades', true);
        this.draw(completed, 'completedUpgrades', false);
        this.drawUpgradeTooltips(available.concat(completed));
        this.drawCompletionBonus(eras)
    }

    draw(list, divToPopulate) {
        if(divToPopulate == 'availableUpgrades') {
            var divToDraw = "<div class='actRow'>"
            var i = 0;
            var evo_offset = 0;
            var splitDrawDiv = ['','']
            var toggleSplit = 0
            for(i=0; i < list.length; ++i) {
                if(list[i].startsWith('evo')) {
                    toggleSplit = 0
    
                    splitDrawDiv[toggleSplit] += "<div class='actCol'>"
                    splitDrawDiv[toggleSplit] += "<div class='actCell'><div class='action dis evo' id='upgradeId" + toTitleCase(list[i]) + "'>";
                    splitDrawDiv[toggleSplit] += "<span class='actionItem'>" + this.upgrades[list[i]]['name']+'</span>';
                    splitDrawDiv[toggleSplit] += "</div></div>";
                    splitDrawDiv[toggleSplit] += "</div>"
                    evo_offset += 1;
                } else {
                    toggleSplit = 1
    
                    if(((i + evo_offset) % 2) == 0) {
                        splitDrawDiv[toggleSplit] += "<div class='actCol'>"
                    }
                    splitDrawDiv[toggleSplit] += "<div class='actCell'><div class='action dis' id='upgradeId" + toTitleCase(list[i]) + "'>";
                    splitDrawDiv[toggleSplit] += "<span class='actionItem'>" + this.upgrades[list[i]]['name']+'</span>';
                    splitDrawDiv[toggleSplit] += "</div></div>";
                    if(((i + evo_offset) % 2) == 1) {
                        splitDrawDiv[toggleSplit] += "</div>"
                    }
                }
            }
            if(((i + evo_offset) % 2) == 1) {
                splitDrawDiv[1] += "<div class='actCell'></div></div>"
            }
            divToDraw += splitDrawDiv[0] + splitDrawDiv[1] + "</div>"
            
            $( '#'+divToPopulate ).html(divToDraw)
        } else {
            var evoCategories = this.getUpgradesByCompletion(true).filter(e => e.startsWith('evo'))
            var catCount = 0;
            var divToDraw = '';
            for(var evo of evoCategories) {
                if((catCount % 3) == 0) {
                    divToDraw = "<div class='actCol'>";
                }
                divToDraw += "<div class='actRow upgCompleteElement'>";

                divToDraw += "<div class='actCol'>"
                divToDraw += "<div class='actCell'><div class='action dis evo' id='upgradeId" + toTitleCase(evo) + "'>";
                divToDraw += "<div class='actionItem'>" + this.upgrades[evo]['name']+'</div>';
                divToDraw += "</div></div></div>";

                var i = 0;
                for(var element of list) {
                    if(element.startsWith('evo')) continue;

                    if(this.upgrades[element]['req'].includes(evo)){
                        if((i % 2) == 0) {
                            divToDraw += "<div class='actCol'>"
                        }
                        divToDraw += "<div class='actCell'><div class='action dis' id='upgradeId" + toTitleCase(element) + "'>";
                        divToDraw += "<div class='actionItem'>" + this.upgrades[element]['name']+'</div>';
                        divToDraw += "</div></div>";
                        if((i % 2) == 1) {
                            divToDraw += "</div>"
                        }
                        i += 1;
                    }
                }
                if(((i) % 2) == 1) {
                    divToDraw += "<div class='actCell'></div></div>"
                }
                var curAndMax = this.getCurAndMaxOfCategory(evo)
                var setFinished = '';
                if(curAndMax[0] == curAndMax[1]) setFinished = ' setFinished'
                divToDraw += "<div class='upgCatValue"+setFinished+"' id='bonus"+toTitleCase(evo)+"'>"+curAndMax[0]+" / "+curAndMax[1]+"</div></div>"
                if((catCount % 3) == 2) {
                    divToDraw += "</div>";
                }
                catCount += 1;
            }
            if((catCount % 3) != 0) {
                for(var t = 0; t < (3 - (catCount % 3)); ++t) {
                    divToDraw += "<div class='actRow upgCompleteElement uCFiller'></div>"
                }
            }
            divToDraw += "</div>";
            $( '#'+divToPopulate ).html(divToDraw)
        }
        this.setOnClicks();
    }

    getCurAndMaxOfCategory(category, optionals = true) {
        var cur = 0;
        var max = 0;
        for(var upgrade of Object.keys(this.upgrades)) {
            if(upgrade.startsWith('evo')) continue;
            if(this.upgrades[upgrade]['req'].includes(category)) {
                if(optionals || !this.upgrades[upgrade]['optional']) {
                    max += 1;
                    if(this.upgrades[upgrade]['completed']) {
                        cur += 1;
                    }
                }
            }
        }
        return [cur, max]
    }

    setOnClicks() {
        var available = this.getAvailableUpgrades(true);
        var t = this;
        for(var id of available) {
            $( "#upgradeId"+toTitleCase(id) ).prop("onclick", null).off("click");
            $( "#upgradeId"+toTitleCase(id) ).click(function() {
                var name = this.id.toLowerCase().substring(9);
                game.buyUpgrade(name)
            });
        }
    }

    drawTooltipStem() {
        var available = this.getAvailableUpgrades(true);
        var completed = this.getAvailableUpgrades(false);
        var eras = this.getCompletedEras();
        this.drawUpgradeTooltips(available.concat(completed))
        this.drawCompletionBonus(eras)
    }

    drawUpgradeTooltips(list) {
        for(var i=0; i < list.length; ++i) {
            var id = list[i];
            this.drawUpgradeTooltip(id)
        }
    }

    drawUpgradeTooltip(id) {
        var costText = null;
        if(!this.upgrades[id]['completed']) {
            costText = this.upgrades[id]['cost'];
        }
        addText('#upgradeId'+toTitleCase(id), this.upgrades[id]['description']+'<hr/><i>'+this.upgrades[id]['effect']+'</i>',costText);
    }

    drawCompletionBonus(list) {
        for(var i=0; i < list.length; ++i) {
            addText('#bonus'+toTitleCase(list[i]), '<span class="bonusIncomplete">'+this.upgrades[list[i]]['cbonus']['description']+'</span>');
        }
    }
}