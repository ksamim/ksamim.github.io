class Settings {
    constructor() {
        this.setConf()
    }

    init() {
        this.setVisibilities();
        this.setSaveButtons();
        this.setOptionButtons();
        this.initializeRefresh();
        this.generateTooltips();
        this.setAutoSaveInterval();
        this.setMenuButtons();
        this.setOtterOptions();
        this.otterAction = null;
    }

    setConf() {
        this.conf = {
            'updateSpeed': 50,
            'time': 0,
            'autosaveTime': 60000,
            'autosave': true,
            'lastTab': 'act',
            'showCompleted': true,
            'tutorial': true,
            'version': '0.1.16',
            'name': 'Ellie'
        }
        $( "#autosaveRange" ).val(this.conf['autosaveTime'] / 1000)
        game.community.otters[0].otter['name'] = this.conf['name']
    }

    resetOrLoad() {
        this.updateResources();
        this.updateNames();
        this.initializeRefresh();
        this.setVisibilities(true);
        this.checkAndSetAutoSave();
        this.openLastView();
        this.updateVillageClassifier();
        this.setOtterOptions();
        this.otterAction = null;
    }

    /**
     * Save, load, and wipe functions
     */
    getSavePayload() {
        return {
            'r': game.resources.resources,
            'b': game.buildings.buildings,
            'u': game.upgrades.upgrades,
            'c': game.settings.conf,
            'buff': game.buffs.buffs,
            'buffSettings': game.buffs.buffSettings,
            'activeBuff': game.buffs.activeBuffs,
            'community': game.community.jobs,
            'otters': game.community.otters.map(o => o.getOtterHash()),
            'lastSave': (new Date()).toString(),
            'resetCopies': {
                'buffs': JSON.parse(JSON.stringify(game.buffs.resetCopy)),
                'buffSettings': JSON.parse(JSON.stringify(game.buffs.resetCopyBuffSettings)),
                'community': JSON.parse(JSON.stringify(game.community.resetCopy)),
                'buildings': JSON.parse(JSON.stringify(game.buildings.resetCopy)),
                'resources': JSON.parse(JSON.stringify(game.resources.resetCopy)),
                'upgrades': JSON.parse(JSON.stringify(game.upgrades.resetCopy))
            }
        }
    }
    save(savetype = 0) {
        let savePayload = this.getSavePayload();
        localStorage.setItem('ottergame_save_v0.0.1', LZString.compressToBase64(JSON.stringify(savePayload)));
    
        let prevColor = $( '.loadIt' ).css('background-color');
        $( '.saveIt' ).animate({backgroundColor: '#080'}, 50);
        $( '.saveIt' ).animate({backgroundColor: prevColor}, 400);
        
        if(savetype == 0) {
            console.log('Manually saved.')
        } else if (savetype == 1) {
            console.log('Autosaved.')
        }
    }

    load(loadtype = 0) {
        var savegame = localStorage.getItem('ottergame_save_v0.0.1');
        if (savegame !== null) {
            savegame = JSON.parse(LZString.decompressFromBase64(savegame));
            if(!this.detectAndFixVersionUpdate(savegame)) {
                game.resources.resources = savegame['r'];
                game.buildings.buildings = savegame['b'];
                game.upgrades.upgrades = savegame['u'];
                game.buffs.buffs = savegame['buff'];
                game.buffs.buffSettings = savegame['buffSettings'];
                game.buffs.activeBuffs = savegame['activeBuff'];
                game.community.jobs = savegame['community'];
                game.community.otters = savegame['otters'].map(o => new Otter(o));
                game.settings.conf = savegame['c'];

                if(loadtype == 0) {
                    console.log('Loaded!')
                }
            }

            this.computeOfflineEarnings(savegame['lastSave']);
        } else {
            console.log('No savegame detected. Setting initial savegame.')
            this.save(2);
        }
        this.resetOrLoad();
        this.repopulateWindows();
    }

    detectAndFixVersionUpdate(savegame) {
        var toMigrate = false;
        var resetCopies = savegame['resetCopies']
        var modded = []
        var modClasses = [[savegame['buff'], game.buffs, 'buffs', game.buffs.buffs]
        , [savegame['buffSettings'], game.buffs, 'buffSettings', game.buffs.buffSettings]
        , [savegame['r'], game.resources, 'resources', game.resources.resources]
        , [savegame['b'], game.buildings, 'buildings', game.buildings.buildings]
        , [savegame['u'], game.upgrades, 'upgrades', game.upgrades.upgrades]
        , [savegame['community'], game.community, 'community', game.community.jobs]]
        for(var mod of modClasses) {
            var rc = null
            if(mod[2] == 'buffSettings') {
                rc = mod[1].resetCopyBuffSettings
            } else {
                rc = mod[1].resetCopy
            }
            if(JSON.stringify(rc).trim().localeCompare(JSON.stringify(resetCopies[mod[2]]).trim()) != 0) {
                // for(var res of Object.keys(mod[0])) {
                //     if(mod[1].resetCopy[res] == null) {
                //         console.log('New version missing '+res);
                //         toMigrate = true;
                //         continue;
                //     }
                //     if(JSON.stringify(mod[1].resetCopy[res]).trim().localeCompare(JSON.stringify(resetCopies[mod[2]][res]).trim()) != 0) {
                //         console.log(res + ' not equal ('+JSON.stringify(mod[1].resetCopy[res]).trim().localeCompare(JSON.stringify(resetCopies[mod[2]][res]).trim())+")")
                //         console.log('savegame resetCopy: \n'+JSON.stringify(mod[1].resetCopy[res]))
                //         console.log('current resetCopy: \n'+JSON.stringify(resetCopies[mod[2]][res]))
                //     }
                // }
                toMigrate = true;
                modded = modded.concat(['* '+toTitleCase(mod[2])])
            }
            // for(var res of Object.keys(mod[1].resetCopy)) {
            //     if(mod[0][res] == null) {
            //         console.log('Old version missing '+res)
            //         toMigrate = true;
            //     }
            // }
        }
        // Specially check if the otter schema has changed
        if(JSON.stringify(Object.keys((new Otter()).otter)).localeCompare(JSON.stringify(Object.keys(savegame['otters'][0])))) {
            toMigrate = true;
            modded = modded.concat(['* Otters'])
        }
        if(toMigrate)
        {
            console.log('New version detected. Updates include:')
            console.log(modded.join('\n'))

            // Migrate new hash definitions from savegame
            for(var modClass of modClasses) {
                var oldSavegameClass = modClass[0];
                var newClassToModify = modClass[1];
                var nameOfModifiedClass = modClass[2];

                for(var nameOfObjectInOldClass of Object.keys(oldSavegameClass)) {
                    var rc = null;
                    if(nameOfModifiedClass == 'buffSettings') {
                        rc = newClassToModify.resetCopyBuffSettings
                    } else {
                        rc = newClassToModify.resetCopy
                    }

                    // Check if New has this object -- just continue if it doesn't
                    if(rc[nameOfObjectInOldClass] == null) continue;

                    for(var resource of Object.keys(oldSavegameClass[nameOfObjectInOldClass])) {
                        if(resource == 'v') {
                            newClassToModify.setV(nameOfObjectInOldClass, oldSavegameClass[nameOfObjectInOldClass][resource])
                        } else if (resource == 'completed') {
                            newClassToModify.setCompleted(nameOfObjectInOldClass, oldSavegameClass[nameOfObjectInOldClass][resource])
                        } else if (resource == 'visible') {
                            newClassToModify.setVisible(nameOfObjectInOldClass, oldSavegameClass[nameOfObjectInOldClass][resource])
                        } //else if (resource == 'buyable') {
                        //     newClassToModify.setBuyable(nameOfObjectInOldClass, oldSavegameClass[nameOfObjectInOldClass][resource])
                        // }
                        // newClassToModify.resetCopy[nameOfObjectInOldClass][resource] = JSON.parse(JSON.stringify(resetCopies[nameOfModifiedClass][nameOfObjectInOldClass][resource]))
                    }
                }
            }

            // Copy over otters, specially handle the first otter
            for(var oldOtter in savegame['otters']) {
                var newOtter = new Otter();
                for(var attribute of Object.keys(newOtter.otter)) {
                    if(savegame['otters'][oldOtter][attribute] != null) {
                        newOtter.otter[attribute] = savegame['otters'][oldOtter][attribute];
                    }
                }
                if(oldOtter == 0) {
                    game.community.otters[0] = newOtter;
                } else {
                    game.community.addOtter(newOtter)
                }
            }

            for(var c of Object.keys(savegame['c'])) {
                if(c != 'version') {
                    this.conf[c] = savegame['c'][c]
                }
            }
            $( "#autosaveRange" ).val(this.conf['autosaveTime'] / 1000)

            game.rebuildAllModifications();
            game.buffs.drawTooltipStem();
            game.community.drawTooltipStem();
            game.buildings.drawTooltipStem();
            game.resources.drawTooltipStem();

            return true;
        }
        return false;
    }

    computeOfflineEarnings(saveTime) {
        var timeOffset = (new Date() - new Date(saveTime));
        $( '.offlineEarnings .earningsTime span' ).html(dhm(timeOffset));
        var printEarningsValue = ''
        for(var resource of Object.keys(game.resources.resources)) {
            if(resource == 'pop') continue;
            var nextEarningValue = game.resources.getPPS(resource) * timeOffset/1000;
            if(nextEarningValue > (game.resources.getMax(resource) - game.resources.getCur(resource))) nextEarningValue = game.resources.getMax(resource) - game.resources.getCur(resource);
            game.resources.add(resource, nextEarningValue);
            printEarningsValue += '<div class="earningResource">'+resource+'</span>: <span class="earningValue">' + Math.round(nextEarningValue) + '</div>';
            $( '.offlineEarnings .earnings' ).html(printEarningsValue);
        }
        if(timeOffset > 300000) {
            $( '.offlineEarnings' ).css('display', 'block');
            this.save(2);
        }
    }

    repopulateWindows() {
        game.buildings.populateBuildings();
        game.upgrades.populateUpgradeTab();
        this.toggleCompletedUpgradeView(this.conf['showCompleted'])
        game.buffs.drawBuffs();
    }
    
    wipe() {
        localStorage.removeItem('ottergame_save_v0.0.1');
        console.log('Wiped!');
        location.reload(true)
    }

    setSaveButtons() {
        var t = this;
        $( ".optToggle" ).prop("onclick", null).off("click");
        $( ".optToggle" ).click(function() {
            if($( ".optionView ").css('display') == 'none') {
                $( ".popup" ).css('display', 'none');
                $( ".optionView ").css('display', 'block');
            } else {
                $( ".optionView ").css('display', 'none');
            }
        });
    
        $( ".loadIt" ).prop("onclick", null).off("click");
        $( ".loadIt").click(function() {
            $( ".popup" ).css('display', 'none');
            if($( ".loadConfirm ").css('display') == 'none') {
                $( ".loadConfirm ").css('display', 'block');
            } else {
                $( ".loadConfirm ").css('display', 'none');
            }
        });
    
        $( ".wipe" ).prop("onclick", null).off("click");
        $( ".wipe").click(function() {
            $( ".popup" ).css('display', 'none');
            if($( ".wipeConfirm ").css('display') == 'none') {
                $( ".wipeConfirm ").css('display', 'block');
            } else {
                $( ".wipeConfirm ").css('display', 'none');
            }
        });
    
        $( ".confirm div div" ).prop("onclick", null).off("click");
        $( ".confirm div div").click(function() {
            $( ".loadConfirm ").css('display', 'none');
            $( ".wipeConfirm ").css('display', 'none');
            $( ".importConfirm ").css('display', 'none');
        });
    
        $( ".saveIt" ).prop("onclick", null).off("click");
        $( ".saveIt").click(function() {
            t.save()
        });
    
        $( ".loadConfirm .confirmWindow .confYes").click(function() {
            t.load()
        });
    
        $( ".wipeConfirm .confirmWindow .confYes").click(function() {
            t.wipe()
        });

        this.setCheatBar();
    }

    setCheatBar() {
        if(document.getElementById('cheater') != null) {
            $( ".cheatMaxResources" ).prop("onclick", null).off("click");
            $( ".cheatMaxResources").click(function() {
                for(var resource of Object.keys(game.resources.resources)) {
                    if(resource == 'pop') {
                        continue
                    }
                    game.resources.resources[resource]['v'] = game.resources.resources[resource]['m'];
                }
            });
            
            $( ".cheatResourceStorage" ).prop("onclick", null).off("click");
            $( ".cheatResourceStorage").click(function() {
                for(var resource of Object.keys(game.resources.resources)) {
                    if((resource == 'pop')) {
                        continue
                    }
                    game.resources.resources[resource]['m'] *= 2;
                }
            });
            
            var speedOpts = [1,2,5,10];
            for(var i of speedOpts) {
                $( ".cheatSpeed#"+i+"x" ).prop("onclick", null).off("click");
                $( ".cheatSpeed#"+i+"x").click(function() {
                    var speed = parseInt(this.id.substring(0, this.id.length-1))
                    console.log('Game speed set to '+speed)
                    game.setTickRate(speed);
                });
            }
        }
    }

    setOptionButtons() {
        var t = this;
        $( ".toggleAutosave" ).prop("onclick", null).off("click");
        $( ".toggleAutosave").click(function() {
            if($( ".toggleAutosave ").hasClass( "on" )) {
                t.conf['autosave'] = false;
            } else {
                t.conf['autosave'] = true;
            }
            t.autosaveVisibility();
            t.checkAndSetAutoSave();
        });

        $( "#autosaveRange" ).on('change', function() {
            t.conf['autosaveTime'] = $( "#autosaveRange" ).val() * 1000;
            t.checkAndSetAutoSave();
        });

        $( "#autosaveRange" ).on('input', function() {
            $( '.asSetting' ).html($( "#autosaveRange" ).val()+'s')
        });

        addText('.setName', '1-15 Characters<br/>A-Z and "-"')
        $( ".setName" ).prop("onclick", null).off("click");
        $( ".setName").click(function() {
            if((($('#nameBox').val().length > 1) && ($('#nameBox').val().length <= 15) && (!/[^A-Za-z\-]/i.test($('#nameBox').val())))){
                t.conf['name'] = $('#nameBox').val()
                game.community.otters[0].otter['name'] = t.conf['name']
                game.community.drawOtterDiv();
                $('#nameBox').val('')
                $('#nameBox').attr("placeholder", t.conf['name']);
                let prevColor = $( '#nameBox' ).css('background-color');
                let prevBorder = $( '#nameBox' ).css('border');
                $( '#nameBox' ).animate({backgroundColor: '#afa', borderColor: '#0f0'}, 100).animate({backgroundColor: prevColor, borderColor: prevBorder}, 100)
                t.updateVillageClassifier();
            } else {
                [1,2,3].forEach(function(i) {
                    let prevColor = $( '#nameBox' ).css('background-color');
                    let prevBorder = $( '#nameBox' ).css('border');
                    $( '#nameBox' ).animate({backgroundColor: '#faa', borderColor: '#f00'}, 100).animate({backgroundColor: prevColor, borderColor: prevBorder}, 100)
                });
                
            }
        });
        $( ".offlineEarnings .fancyLink" ).prop("onclick", null).off("click");
        $( ".offlineEarnings .fancyLink").click(function() {
            $( '.offlineEarnings' ).css('display', 'none');
        });

        $( ".importView" ).prop("onclick", null).off("click");
        $( ".importView").click(function() {
            $( '#ieTextBox .ieBox' ).css('display', 'none')
            $( '#ieTextBox #importText' ).css('display', 'block')
        });

        $( ".exportView" ).prop("onclick", null).off("click");
        $( ".exportView").click(function() {
            $( '#ieTextBox .ieBox' ).css('display', 'none')
            $( '#ieTextBox #exportText' ).css('display', 'block')
            var exportString = LZString.compressToBase64(JSON.stringify(t.getSavePayload()))
            $( '#ieTextBox #exportText #exportTextBox' ).html(exportString)
        });

        $( ".exportFile" ).prop("onclick", null).off("click");
        $( ".exportFile").click(function() {
            $( '#ieTextBox .ieBox' ).css('display', 'none')
            $( '#ieTextBox #emptyText' ).css('display', 'block')
        });

        $( "#exportButton" ).prop("onclick", null).off("click");
        $( "#exportButton").click(function() {
            let prevColor = $( '.loadIt' ).css('background-color');
            $( '#exportButton .fancyLink' ).animate({backgroundColor: '#080'}, 50);
            $( '#exportButton .fancyLink' ).animate({backgroundColor: prevColor}, 400);
            var copyText = $( '#ieTextBox #exportText #exportTextBox' ).html()
            copyToClipboard(copyText)
        });

        $( "#exportFileButton" ).prop("onclick", null).off("click");
        $( "#exportFileButton a").click(function() {
            let prevColor = $( '.loadIt' ).css('background-color');
            $( '#exportFileButton .fancyLink' ).animate({backgroundColor: '#080'}, 50);
            $( '#exportFileButton .fancyLink' ).animate({backgroundColor: prevColor}, 400);
            this.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(LZString.compressToBase64(JSON.stringify(t.getSavePayload())));
            this.download = $('#fileName').val()+'.txt';
        });

        $( ".importButton" ).prop("onclick", null).off("click");
        $( ".importButton").click(function() {
            $( ".popup" ).css('display', 'none');
            $( ".importConfirm ").css('display', 'block');
        });

        $( ".importConfirm .confirmWindow .confYes" ).prop("onclick", null).off("click");
        $( ".importConfirm .confirmWindow .confYes").click(function() {
            var customPayload = $( '#importTextBox' ).val();
            if(LZString.decompressFromBase64(customPayload) == '' || LZString.decompressFromBase64(customPayload) == null) alert('This doesn\'t appear to be a valid save file. Check your savegame.');
            localStorage.setItem('ottergame_save_v0.0.1', customPayload);
            location.reload(true)
        });
    }

    setOtterOptions() {
        $( "#reassignView ").css('display', 'block');
        var t = this;

        for(var r of ['NoJob', 'FoodJob', 'WoodJob', 'StoneJob']) {
            $( "#r"+r).css('background-color', game.community.jobs[r.charAt(0).toLowerCase() + r.substring(1)].color)
            $( "#r"+r ).prop("onclick", null).off("click");
            $( "#r"+r ).click(function() {
                var r = this.id.substring(1)
                $( ".reassignButton" ).css('border-color', '#666')
                $( ".managerButton" ).css('border-color', 'darkgoldenrod')
                $( "#r"+r).css('border-color', '#eee')
                $( ".otterEntry" ).addClass('activeAction')
                t.otterAction = ['reassign', r.charAt(0).toLowerCase() + r.substring(1)]
            });

            $( "#m"+r).css('background-color', game.community.jobs[r.charAt(0).toLowerCase() + r.substring(1)].color)
            $( "#m"+r ).prop("onclick", null).off("click");
            $( "#m"+r ).click(function() {
                var r = this.id.substring(1)
                $( ".reassignButton" ).css('border-color', '#666')
                $( ".managerButton" ).css('border-color', 'darkgoldenrod')
                $( "#m"+r).css('border-color', 'gold')
                $( ".otterEntry" ).addClass('activeAction')
                t.otterAction = ['manage', r.charAt(0).toLowerCase() + r.substring(1)]
            });
        }

        for(var s of ['reassign', 'setManager', 'sort']) {
            $( "#"+s ).prop("onclick", null).off("click");
            $( "#"+s).click(function() {
                var s = this.id
                $( ".otterSetting" ).css('display', 'none');
                $( ".otterOptionTab" ).addClass('dis');
                $( "#"+s).removeClass('dis')
                $( "#"+s+"View ").css('display', 'block');
            });
        }

        $( "#clearOtterOption" ).prop("onclick", null).off("click");
        $( "#clearOtterOption" ).click(function() {
            $( ".managerButton" ).css('border-color', 'darkgoldenrod')
            $( ".reassignButton" ).css('border-color', '#666')
            $( ".otterEntry" ).removeClass('activeAction')
            t.otterAction = null
        });
    }

    rebuildOtterActions() {
        var t = this;
        for(var o in game.community.otters) {
            $( "#otter"+o ).prop("onclick", null).off("click");
            $( "#otter"+o ).click(function() {
                if(t.otterAction != null) {
                    var thisOtter = parseInt(this.id.substring(5));
                    if(t.otterAction[0] == 'reassign') {
                        game.community.otters[thisOtter].otter['job'] = t.otterAction[1]
                        if(game.community.otters[thisOtter].otter['manages'] != null) {
                            if(game.community.otters[thisOtter].otter['manages'] != t.otterAction[1]) game.community.otters[thisOtter].otter['manages'] = null
                        }
                        game.community.drawJobDiv();
                        $( ".otterEntry" ).addClass('activeAction')
                    } else if (t.otterAction[0] == 'manage') {
                        game.community.otters[thisOtter].otter['job'] = t.otterAction[1]
                        game.community.setManager(t.otterAction[1], thisOtter)
                        game.community.drawJobDiv();
                        $( ".otterEntry" ).addClass('activeAction');
                    }
                }
            });
        }
    }

    autosaveVisibility() {
        if(this.conf['autosave']) {
            $( ".toggleAutosave ").removeClass( "off" );
            $( ".toggleAutosave ").addClass( "on" );
            $( ".toggleAutosave ").html("On");
            $( ".slidecontainer" ).fadeTo(250,1);
            $( ".slidecontainer" ).css("pointer-events","auto");
        } else {
            $( ".toggleAutosave ").removeClass( "on" );
            $( ".toggleAutosave ").addClass( "off" );
            $( ".toggleAutosave ").html("Off");
            $( ".slidecontainer" ).fadeTo(250,0);
            $( ".slidecontainer" ).css("pointer-events","none");
        }
    }

    setMenuButtons() {
        var t = this;
        var tabs = ['act', 'upg', 'pop']
        for(var tab of tabs) {
            $( '#' + tab + 'Btn').prop("onclick", null).off("click");
            $( '#' + tab + 'Btn' ).click(function() {
                var name = this.id.toLowerCase().substring(0,this.id.length-3);
                t.clearAndSetActiveView(name);
            });
        }
        $( ".hideUpgrades" ).prop("onclick", null).off("click");
        $( '.hideUpgrades').click(function() {
            if($( "#complDiv ").css('display') == 'none') {
                t.toggleCompletedUpgradeView(true);
            } else {
                t.toggleCompletedUpgradeView(false);
            }
        });
    }

    toggleCompletedUpgradeView(toToggle) {
        if(toToggle) {
            $( "#complDiv ").css('display', 'block');
            $( ".hideUpgrades ").html('Hide Completed');
            this.conf['showCompleted'] = true;
        } else {
            $( "#complDiv ").css('display', 'none');
            $( ".hideUpgrades ").html('Show Completed');
            this.conf['showCompleted'] = false;
        }
    }

    clearAndSetActiveView(prefix) {
        $( '.subView' ).css('display', 'none');
        $( '.activeBtn' ).removeClass('activeBtn');
        $( '#' + prefix + 'Btn' ).addClass('activeBtn');
        $( '#' + prefix + 'View' ).css('display', 'block' )
        this.conf['lastTab'] = prefix
    }

    setAutoSaveInterval() {
        var t = this;
        if(this.autosaveInterval) {
            clearInterval(this.autosaveInterval)
            this.autosaveInterval = null
        }
        this.autosaveInterval = setInterval(function() {
            t.save(1);
        }, t.conf['autosaveTime']);
    }

    checkAndSetAutoSave() {
        $( '.asSetting' ).html((this.conf['autosaveTime']/1000)+'s');
        $( '#autosaveRange' ).val(this.conf['autosaveTime']/1000);
        if(this.conf['autosave']) {
            this.setAutoSaveInterval();
        } else {
            if(this.autosaveInterval) {
                clearInterval(this.autosaveInterval)
                this.autosaveInterval = null
            }
        }
    }

    setVisibilities (reload = false) {
        $('#nameBox').attr("placeholder", this.conf['name']);
        if(game.buffs.activeBuffs.length == 0) {
            $( ".buffs" ).css("display", "none")
        } else {
            $( ".buffs" ).css("display", "block")
        }
        if(game.resources.resources['pop']['m'] > 0) {
            $( '.popTabMenu' ).css("display", "block");
            if($( '#popRes' ).css("display") == 'none') {
                this.triggerPopulationTab();
                var fadeSpeed = 250;
                if(!reload) $( '.popTabMenu' ).fadeOut(0).fadeIn(fadeSpeed).fadeOut(fadeSpeed).fadeIn(fadeSpeed).fadeOut(fadeSpeed).fadeIn(fadeSpeed);
            }
            $( '#popRes' ).css("display", "block");
        }
        if(game.upgrades.checkEligibility() || (game.upgrades.getUpgradesByCompletion(true).length > 0)) {
            if($( '#upgBtn' ).css("display") == 'none') {
                var fadeSpeed = 250;
                if(!reload) $( '#upgBtn' ).fadeOut(0).fadeIn(fadeSpeed).fadeOut(fadeSpeed).fadeIn(fadeSpeed).fadeOut(fadeSpeed).fadeIn(fadeSpeed);
            }
            $( '#upgBtn' ).css("display", "block");
        }
        this.autosaveVisibility();
        $( ".subView" ).css("display", "none")
        $( "#defaultView" ).css("display", "none")
        $( "#actView" ).css( "display", "block" )
        $( "#actBtn" ).addClass( 'activeBtn' )
        $( ".version" ).html('v'+this.conf['version'])
    }

    openLastView() {
        $( ".subView" ).css("display", "none")
        $( "#"+this.conf['lastTab']+"View" ).css( "display", "block" )
        $( ".menuBtn" ).removeClass( 'activeBtn' )
        $( "#"+this.conf['lastTab']+'Btn' ).addClass( 'activeBtn' )
    }

    triggerPopulationTab() {

    }

    setRefreshRate(refresh) {
        this.conf['updateSpeed'] = refresh;
        this.initializeRefresh();
    }

    initializeRefresh() {
        var t = this;
        if(this.refreshInterval) {
            clearInterval(this.refreshInterval)
            this.refreshInterval = null
        }
        this.refreshInterval = setInterval(function() {
            t.updateResources();
            t.updateOtters();
            t.conf['time'] += t.conf['updateSpeed'];
        }, t.conf['updateSpeed']);
    }

    /**
     * Set visual updates to screen
     */
    updateNames() {
        for(name of game.resources.getClickable()) {
            this.updateName(name, game.resources);
        }
        for(name of game.buildings.names()) {
            this.updateName(name, game.buildings, 'Bldg');
        }
    }
    updateName(type, group, subtext = '') {
        $( '#mk'+toTitleCase(type)+subtext+' .name' ).html(toTitleCase(group.getTypeName(name)))
    }
    updateResources() {
        for(name of game.resources.names()) {
            this.updateResourceValues(name);
        }
    }
    updateOtters() {
        if(game.upgrades.upgrades['experiencegain'].completed) {
            for(var o in game.community.otters) {
                var expProgress = Math.round(game.community.otters[o].otter.exp * 100 / game.community.otters[o].nextCutoff())
                $( '#otter'+o+' .bg').css('width', expProgress+'%')
            }
        }
    }
    updateResourceValues(name) {
        $( '#'+name+'Res .resWrapper .resVal .cur' ).html(game.resources.getCur(name))
        $( '#'+name+'Res .resWrapper .resVal .max' ).html(game.resources.getMax(name))
        var pps = game.resources.getPPS(name)
        if(pps != 0) {
            var ppsToS = pps.toString()+'/s';
            if(pps > 0) {
                ppsToS = '+'+ppsToS;
                $( '#'+name+'Res .resWrapper .resVal .pps' ).css('color','#0e0')
            } else {
                ppsToS = ppsToS;
                $( '#'+name+'Res .resWrapper .resVal .pps' ).css('color','#f00')
            }
            $( '#'+name+'Res .resWrapper .resVal .pps' ).html(ppsToS)
        } else {
            $( '#'+name+'Res .resWrapper .resVal .pps' ).html('')
        }
        let bgWidth = Math.round(game.resources.getCur(name) * 100 / game.resources.getMax(name))
        if(name != 'joy')
        {
            if(bgWidth < 25) {
                $( '#'+name+'Res .bg' ).css('background-color' , '#500')
            } else if(bgWidth > 75) {
                $( '#'+name+'Res .bg' ).css('background-color' , '#050')
            } else {
                $( '#'+name+'Res .bg' ).css('background-color' , '#550')
            }
        } else {
            let percDisp = 100 + Math.round(100*bgWidth / 100)
            $( '#'+name+'Res .bg' ).css('background-color' , 'rgb('+percDisp+','+percDisp+','+percDisp+')')
        }
        if(bgWidth > 100) bgWidth = 100;
        $( '#'+name+'Res .bg' ).css('width' , (bgWidth).toString()+'%')
        // this.updateVillageClassifier();
        // var f = $('#'+name+'Res .bg').width() / $('#'+name+'Res .bg').parent().width() * 100;
        // if(bgWidth != Math.round(f))
        // $( '#'+name+'Res .bg' ).animate({'width': Math.round(bgWidth).toString()+'%'}, {duration: 50, queue: false})
    }
    updateVillageClassifier() {
        if(game.resources == null) return;
        var names = ['Bevy', 'Romp', 'Lodge', 'Family', 'Village'];
        var cutoffs = [1, 10, 25, 50, 100];
        var otterCount = game.resources.resources['pop']['v'];
        for(var i in cutoffs) {
            if((i == 0) & (otterCount < cutoffs[i])) {
                $( '#commType' ).html("<i>You're all alone!</i>");
            } else if((i == (cutoffs.length - 1)) & (cutoffs[i] <= otterCount)) {
                $( '#commType' ).html(this.conf['name'] + "\'s " + names[i]);
            } else {
                if((otterCount >= cutoffs[i-1]) & (otterCount < cutoffs[i])) {
                    $( '#commType' ).html(this.conf['name'] + "\'s " + names[i-1]);
                }
            }
        }
    }

    generateTooltips() {
        addText('#mkFood', 'Gather up something to eat!<hr/><i>+<span id="e">'+game.resources.getIntensity('food').toString()+'</span> food</i>')
        addText('#mkWood', 'Scrounge up some wood!<hr/><i>+<span id="e">'+game.resources.getIntensity('wood').toString()+'</span> wood</i>')
        addText('#mkStone', 'Dig around for some stones!<hr/><i>+<span id="e">'+game.resources.getIntensity('stone').toString()+'</span> stone</i>')
        addText('#mkJoy', 'Play for a bit to generate more joy!<hr/><i>Temporary x<span id="e">2</span> joy/sec</i>')
        if(game.buffs.activeBuffs.map(x => x[0]).includes('playBuff')) {
            $( '#mkJoy #e' ).html(game.resources.resources['joy']['g_mult']);
        }
        else {
            $( '#mkJoy #e' ).html(game.resources.resources['joy']['g_mult']+game.buffs.buffs['playBuff']['modify']['resources']['joy']['g_mult'][1]);
        }
        addText(".joyPPS", 'Modifiers:<hr/><div id="e"></div>')
        addText("#popRes", 'Probability of new <br/>otter per second:<br/><span class="joyOdds" id="e"></span><br/><i>(affected by joy)</i>')
    }
}