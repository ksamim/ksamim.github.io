class Bldg {
    constructor() {
        this.init()
    }

    init() {
        var t = this;
        this.buildings = {
            'food': {
                'v': 1.0,
                'i': 25,
                't': 'thatch food burrow',
                'cost': {
                    'food': 16,
                    'wood': 8,
                    'stone': 8
                },
                'costScaling': 1.25,
                'description': 'Build more food storage.',
                'effect': '+<span id="e">25</span> max food',
                'modify': {
                    'resources': {
                        'food': {
                            'm': ['add',25]
                        }
                    }
                },
                'visible': true,
                'buyable': true
            },
            'wood': {
                'v': 1.0,
                'i': 25,
                't': 'thatch wood pen',
                'cost': {
                    'food': 8,
                    'wood': 15,
                    'stone': 10
                },
                'costScaling': 1.25,
                'description': 'Build more wood storage.',
                'effect': '+<span id="e">25</span> max wood',
                'modify': {
                    'resources': {
                        'wood': {
                            'm': ['add',25]
                        }
                    }
                },
                'visible': true,
                'buyable': true
            },
            'stone': {
                'v': 1.0,
                'i': 25,
                't': 'thatch stone hoard',
                'cost': {
                    'food': 8,
                    'wood': 10,
                    'stone': 15
                },
                'costScaling': 1.25,
                'description': 'Build more stone storage.',
                'effect': '+<span id="e">25</span> max stone',
                'modify': {
                    'resources': {
                        'stone': {
                            'm': ['add',25]
                        }
                    }
                },
                'visible': true,
                'buyable': true
            },
            'pit': {
                'v': 0.0,
                'i': 25,
                't': 'thatch storage pit',
                'cost': {
                    'food': 11,
                    'wood': 13,
                    'stone': 13
                },
                'costScaling': 1.25,
                'description': 'Build an efficient storage pit to secure your resources.',
                'effect': '+<span id="e">25</span> max food/wood/stone',
                'modify': {
                    'resources': {
                        'food': {
                            'm': ['add',25]
                        },
                        'wood': {
                            'm': ['add',25]
                        },
                        'stone': {
                            'm': ['add',25]
                        }
                    }
                },
                'visible': true,
                'buyable': false
            },
            'foodgen': {
                'v': 1.0,
                'i': 1,
                't': 'shrimp farm',
                'cost': {
                    'food': 25,
                    'stone': 10
                },
                'costScaling': 1.66,
                'description': 'Populate a food farm to generate more food!',
                'effect': '+<span id="e">1</span>/sec food',
                'modify': {
                    'resources': {
                        'food': {
                            'g': ['add',1]
                        }
                    }
                },
                'visible': true,
                'buyable': true
            },
            'woodgen': {
                'v': 0.0,
                'i': 1,
                't': 'driftwood dam',
                'cost': {
                    'food': 10,
                    'wood': 25,
                    'stone': 10
                },
                'costScaling': 1.66,
                'description': 'Copy the beavers and dam up the river to snag wood!',
                'effect': '+<span id="e">1</span>/sec wood',
                'modify': {
                    'resources': {
                        'wood': {
                            'g': ['add',1]
                        }
                    }
                },
                'visible': false,
                'buyable': true
            },
            'stonegen': {
                'v': 0.0,
                'i': 1,
                't': 'pebble puddles',
                'cost': {
                    'food': 10,
                    'wood': 10,
                    'stone': 25
                },
                'costScaling': 1.66,
                'description': 'Search the shoreline for rocks!',
                'effect': '+<span id="e">1</span>/sec stone',
                'modify': {
                    'resources': {
                        'stone': {
                            'g': ['add',1]
                        }
                    }
                },
                'visible': false,
                'buyable': true
            },
            'home1': {
                'v': 0,
                'i': 2,
                't': 'den',
                'cost': {
                    'food': 100,
                    'wood': 100,
                    'stone': 100
                },
                'costScaling': 1.25,
                'description': 'The water is cold!<br/>Build a den.',
                'effect': '+<span id="e">1</span> otters',
                'modify': {
                    'resources': {
                        'pop': {
                            'm': ['add',2]
                        }
                    }
                },
                'visible': false,
                'buyable': true
            },
            'jobmodifier': {
                'v': 0.0,
                'i': 2,
                't': 'gathering grounds',
                'cost': {
                    'food': 150,
                    'wood': 125,
                    'stone': 125
                },
                'costScaling': 3,
                'description': 'A place for your otters to congregate. Makes jobs more effective.',
                'effect': 'x<span id="e">2</span> job effect',
                'req_upg': ['evocommunal'],
                'modify': {
                    'jobs': {
                        'noJob': {
                            'modify,resources,joy,g_mult_jobs,1': ['multiply',2]
                            , 'i': ['multiply',2]
                        },
                        'foodJob': {
                            'modify,resources,food,g_mult_jobs,1': ['multiply',2]
                            , 'i': ['multiply',2]
                        },
                        'woodJob': {
                            'modify,resources,wood,g_mult_jobs,1': ['multiply',2]
                            , 'i': ['multiply',2]
                        },
                        'stoneJob': {
                            'modify,resources,stone,g_mult_jobs,1': ['multiply',2]
                            , 'i': ['multiply',2]
                        }
                    }
                },
                'visible': false,
                'buyable': true
            }
        }
        this.resetCopy = JSON.parse(JSON.stringify(this.buildings));
        this.populateBuildings();
    }

    resetBuildingMetrics() {
        for(var building of Object.keys(this.buildings)) {
            this.buildings[building]['i'] = this.resetCopy[building]['i'];
            this.buildings[building]['costScaling'] = this.resetCopy[building]['costScaling'];
            this.buildings[building]['modify'] = JSON.parse(JSON.stringify(this.resetCopy[building]['modify']));
            this.buildings[building]['cost'] = JSON.parse(JSON.stringify(this.resetCopy[building]['cost']));
        }
    }

    rebuildAllCosts() {
        for(var building of Object.keys(this.buildings)) {
            for(var i=0; i<this.buildings[building]['v']; ++i) {
                for(var resource of Object.keys(this.buildings[building]['cost'])) {
                    this.buildings[building]['cost'][resource] = this.buildings[building]['cost'][resource] * this.buildings[building]['costScaling'];
                }
            }
        }
    }

    add(type, amount) {
        this.buildings[type]['v'] += amount;
        this.updatePurchasedCount(type)
        this.modCosts(type);
    }

    setV(type, amount) {
        this.buildings[type]['v'] = amount;
    }

    modCosts(type) {
        for(var cost of Object.keys(this.buildings[type]['cost'])) {
            this.buildings[type]['cost'][cost] = Math.round(this.buildings[type]['cost'][cost] * this.buildings[type]['costScaling'])
        }
        this.drawBuildingTooltip(type);
    }

    modIntensity(type, amount = 1, preMult = 1, postMult = 1) {
        this.buildings[type]['i'] = (this.buildings[type]['i'] * preMult + amount) * postMult;
    }

    getTypeName(type) {
        return this.buildings[type]['t'];
    }

    getAmt(type) {
        return this.buildings[type]['v'];
    }

    getPower(type) {
        return this.buildings[type]['i'];
    }

    names() {
        return Object.keys(this.buildings)
    }

    getVisibleBuildings() {
        return Object.keys(this.buildings).filter(key => (this.buildings[key]['visible'] === true) & (this.buildings[key]['buyable'] === true ));
    }

    checkEligibility() {
        var madeVisible = false;
        for(var building of Object.keys(this.buildings)) {
            if(!this.buildings[building]['visible'] && game.resources.checkCosts(this.buildings[building]['cost'], 0.5) && 
                ((this.buildings[building]['req_upg'] == null) || (this.buildings[building]['req_upg'].every(u => game.upgrades.upgrades[u]['completed'] == true)))) {
                this.buildings[building]['visible'] = true;
                madeVisible = true;
            }

            if(game.resources.checkCosts(this.buildings[building]['cost'])) {
                $( '#mk' + toTitleCase(building) + 'Bldg' ).removeClass('dis');
                $( '#mk' + toTitleCase(building) + 'Bldg' ).addClass('pro');
            } else {
                if(this.buildings[building]['visible'] == true) {
                    $( '#mk' + toTitleCase(building) + 'Bldg' ).removeClass('pro');
                    $( '#mk' + toTitleCase(building) + 'Bldg' ).addClass('dis');
                }
            }
        }
        if(madeVisible) {
            this.populateBuildings();
            this.checkEligibility();
        }
    }

    setVisible(type, truth) {
        this.buildings[type]['visible'] = truth;
    }

    setBuyable(type, truth) {
        this.buildings[type]['buyable'] = truth;
    }

    checkPurchase(name) {
        return game.resources.checkCosts(this.buildings[name]['cost']);
    }

    populateBuildings() {
        var available = this.getVisibleBuildings();
        this.draw(available);
        this.drawBuildingTooltips(available);
    }

    draw(list) {
        var divToDraw = "<div class='actRow'>"
        var i = 0;
        for(i=0; i < list.length; ++i) {
            if((i % 2) == 0) {
                divToDraw += "<div class='actCol'>"
            }
            divToDraw += "<div class='actCell'><div class='action dis' id='mk" + toTitleCase(list[i]) + "Bldg'>";
            divToDraw += "<span class='actionItem name'>" + toTitleCase(this.buildings[list[i]]['t'])+'</span>';
            divToDraw += "<span class='bldgValue'>(" + Math.round(this.buildings[list[i]]['v'])+')</span>';
            divToDraw += "</div></div>";
            if((i % 2) == 1) {
                divToDraw += "</div>"
            }
        }
        if((i % 2) == 1) {
            divToDraw += "<div class='actCell'></div></div>"
        }
        divToDraw += "</div>"
        $( '#buildingsDiv' ).html(divToDraw)
        this.setOnClicks();
    }

    updatePurchasedCount(name) {
        $( '#mk'+toTitleCase(name)+'Bldg .bldgValue' ).html('('+this.buildings[name]['v']+')')
    }

    drawTooltipStem() {
        var available = this.getVisibleBuildings();
        this.drawBuildingTooltips(available)
    }

    drawBuildingTooltips(list) {
        for(var i=0; i < list.length; ++i) {
            var id = list[i];
            this.drawBuildingTooltip(id);
        }
    }

    drawBuildingTooltip(id) {
        addText('#mk'+toTitleCase(id)+'Bldg', this.buildings[id]['description']+'<hr/><i id="etext">'+this.buildings[id]['effect']+'</i>',this.buildings[id]['cost']);
        $( '#mk'+toTitleCase(id)+'Bldg #eText #e' ).html(this.buildings[id]['i']);
    }

    setOnClicks() {
        for(name of this.names()) {
            $( "#mk"+toTitleCase(name)+"Bldg" ).prop("onclick", null).off("click");
            $( "#mk"+toTitleCase(name)+"Bldg" ).click(function() {
                var name = this.id.toLowerCase().substring(2,this.id.length-4);
                game.addBuildingAndMod(name, 1)
                game.settings.updateResources();
                if(name.startsWith('home')) {
                    game.settings.setVisibilities();
                }
                $( '.mouseTooltip' ).html($( '#' + this.id + ' .tooltiptext' ).html())
            });
        }
    }
}