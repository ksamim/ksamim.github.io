class Community {
    constructor() {
        this.init();
    }

    init() {
        this.buildCommunityHash();
    }

    buildCommunityHash() {
        this.jobs = {
            'noJob': {
                'name': 'Playmates'
                , 'description': 'Otters without jobs play and generate extra joy!'
                , 'effect': '+<span id="e">10</span>% joy/sec'
                , 'i': .025
                , 'modify': {
                    'resources': {
                        'joy': {
                            'g_mult_jobs': ['add', .025]
                        }
                    }
                }, 'color': '#666'
            },
            'foodJob': {
                'name': 'Aquafarmers'
                , 'description': 'Dedicated fishmongers and fishmanagers.'
                , 'effect': '+<span id="e">10</span>% food/sec'
                , 'i': .025
                , 'modify': {
                    'resources': {
                        'food': {
                            'g_mult_jobs': ['add', .025]
                        }
                    }
                }, 'color': '#066'
            },
            'woodJob': {
                'name': 'Loggers'
                , 'description': 'Wood is hard to gather with paws!'
                , 'effect': '+<span id="e">10</span>% wood/sec'
                , 'i': .025
                , 'modify': {
                    'resources': {
                        'wood': {
                            'g_mult_jobs': ['add', .025]
                        }
                    }
                }, 'color': '#640'
            },
            'stoneJob': {
                'name': 'Miners'
                , 'description': 'The best job, rocks are endless fun!'
                , 'effect': '+<span id="e">10</span>% stone/sec'
                , 'i': .025
                , 'modify': {
                    'resources': {
                        'stone': {
                            'g_mult_jobs': ['add', .025]
                        }
                    }
                }, 'color': '#600'
            }
        }
        this.resetCopy = JSON.parse(JSON.stringify(this.jobs));
        this.otters = [new Otter()]
        this.otters[0].otter.expRate *= 3;
        this.setJobChangeButtons();
        this.curPage = 0
    }

    resetJobMetrics() {
        for(var job of Object.keys(this.jobs)) {
            this.jobs[job]['modify'] = JSON.parse(JSON.stringify(this.resetCopy[job]['modify']));
            this.jobs[job]['effect'] = this.resetCopy[job]['effect'];
            this.jobs[job]['description'] = this.resetCopy[job]['description'];
            this.jobs[job]['name'] = this.resetCopy[job]['name'];
            this.jobs[job]['i'] = this.resetCopy[job]['i'];
        }
    }

    buildOtters() {
        this.drawJobDiv();
    }

    setHashCSSColors() {
        for(var job of Object.keys(this.jobs)) {
            $( "."+job ).css({backgroundColor: this.jobs[job]['color']})
        }
    }

    addOtter(otter) {
        if(otter == null) otter = new Otter()
        this.otters = this.otters.concat([otter])
        this.drawJobDiv();
        game.rebuildAllModifications();
        game.settings.updateVillageClassifier();
    }

    setManager(job, otterId) {
        var oldManager = this.getManager(job);
        if(oldManager > -1) this.otters[oldManager].otter['manages'] = null;
        this.otters[otterId].otter['manages'] = job;
    }

    getManager(job) {
        for(var o in this.otters) {
            if(this.otters[o].otter['manages'] == job) {
                return parseInt(o);
            }
        }
        return -1;
    }

    updateJobCounts() {
        var jobPivot = this.otters.map(v => v.otter['job']);
        this.counts = {};
        for (var i = 0; i < jobPivot.length; i++) {
            this.counts[jobPivot[i]] = 1 + (this.counts[jobPivot[i]] || 0);
        }
        for(var job of Object.keys(this.counts)) {
            $( '#'+job + 'Container .jobValue').html(this.counts[job])
        }
        for(var job of Object.keys(this.jobs).filter(e => !jobPivot.includes(e))) {
            $( '#'+job + 'Container .jobValue').html(0)
        }
        this.drawOtterDiv();
        this.setHashCSSColors();
        game.rebuildAllModifications();
    }

    getRandomOtter(job) {
        var indexes = [];
        $.each(this.otters, function(i, val) {
            if (val.otter['job'] == job) {
                indexes.push(i);
            }
        });
        var curManager = this.getManager(job);
        if(indexes.length > 1) {
            if(curManager == -1) {
                var otter = indexes[Math.floor(Math.random() * indexes.length)];
            } else {
                var toChange = indexes[Math.floor(Math.random() * indexes.length)];
                while(toChange == curManager) {
                    toChange = indexes[Math.floor(Math.random() * indexes.length)];
                }
                var otter = toChange;
            }
        } else {
            var otter = indexes[0];
            if(otter == curManager) this.otters[otter].otter['manages'] = null;
        }
        return otter;
    }

    setJobChangeButtons() {
        var t = this;
        for(var job of Object.keys(this.jobs)) {
            if(job == 'noJob') continue;
            $( "#"+job + 'Container .removeJob').prop("onclick", null).off("click");
            $( '#'+job + 'Container .removeJob' ).click(function() {
                if((t.counts[this.id] != null) && (t.counts[this.id] > 0)) {
                    t.otters[t.getRandomOtter(this.id)].otter['job'] = 'noJob'
                }
                t.drawJobDiv();
                game.rebuildAllModifications();
            });
            $( "#"+job + 'Container .addJob').prop("onclick", null).off("click");
            $( '#'+job + 'Container .addJob' ).click(function() {
                if((t.counts['noJob'] != null) && (t.counts['noJob'] > 0)) {
                    t.otters[t.getRandomOtter('noJob')].otter['job'] = this.id
                }
                t.drawJobDiv();
                game.rebuildAllModifications();
            });
        }
    }

    tickOtters() {
        if(game.upgrades.upgrades['experiencegain'].completed) {
            for(var o in this.otters) {
                if(this.otters[o].tickExperience()) {
                    $( '#otter'+o+' .otterDesc .oLvl' ).html(this.otters[o].otter.level)
                }
            }
        }
    }

    drawTooltipStem() {
        this.drawJobTooltips()
    }

    drawJobTooltips() {
        for(var job of Object.keys(this.jobs)) {
            addText("#"+job+'Container', this.jobs[job]['description']+"<hr/><i>"+this.jobs[job]['effect']+'</i>')
            $('#'+job+'Container').css({backgroundColor: this.jobs[job]['color']})
            $('#'+job+'Container #e').html(Math.round(this.jobs[job]['i']*100))
        }
    }

    drawJobDiv() {
        var drawDiv = ''
        for(var job of Object.keys(this.jobs)) {
            var manager = 'No Manager'
            var set = ''
            var jobManager = this.getManager(job)
            if(jobManager > -1) {
                manager = this.otters[jobManager].otter['name']
                set = ' set'
            }
            drawDiv += "<div class='jobWrapper'>"
            drawDiv += "<div class='jobContainer' id='"+job+"Container'>"
            drawDiv += "<div class='jobName'>"+this.jobs[job]['name']+"</div>"
            drawDiv += "<div class='jobQuantity'>"
            drawDiv += "<div class='removeJob jQ' id='"+job+"'>-</div><div class='jobValue jQ'>0</div><div class='addJob jQ' id='"+job+"'>+</div>"
            drawDiv += "</div>"
            drawDiv += "</div>"
            if(game.upgrades.upgrades['managers'].completed && job != 'noJob') {
                drawDiv += "<div class='jobManagerContainer'><div class='jobManager"+set+"' id='"+job+"Manager'>" + manager + "</div></div>";
                $( "#setManager" ).css('visibility','visible')
            }
            drawDiv += "</div>"
        }
        $('#communityTabContents').html(drawDiv);
        this.drawJobTooltips();
        this.setJobChangeButtons();
        this.updateJobCounts();
        if(game.upgrades.upgrades['managers'].completed) this.drawManagerTooltips();
    }

    drawManagerTooltips() {
        var jobs = Object.keys(this.jobs)
        var managers = jobs.map(r => this.getManager(r))
        for(var job in jobs) {
            if(managers[job] != -1) {
                addText("#"+jobs[job]+'Manager', this.otters[managers[job]].otter["name"]+' increases '+this.jobs[jobs[job]]['name']+' performance by +'+Math.round(100*this.otters[managers[job]].getImpact())+'%')
            }
        }
    }

    drawOtterDiv() {
        var divPages = []
        var divPage = ''
        for(var otter in this.otters) {
            if((otter % 5) == 0) divPage += '<div class="otterRow">'
            divPage += '<div class="otterEntry '+this.otters[otter].otter['job']+'" id="otter'+otter+'"><div class="otterDesc"><div class="oLvl">'+this.otters[otter].otter.level+'</div><div class="oName">' + this.otters[otter].otter['name'] + '</div></div><div class="bg"></div></div>'
            if((otter % 5) == 4) divPage += '</div>'
            if(((otter % 30) == 29) && (otter > 0)) {
                divPages = divPages.concat([divPage])
                divPage = ''
            }
        }
        var filler = false;
        for(var i=(otter % 5); i < 4; ++i) {
            divPage += '<div class="otterFiller"></div>'
            filler = true;
        }
        if(filler) {
            divPage += "</div>"
        }
        if(divPage != '') {
            divPages = divPages.concat([divPage])
        }
        var drawDiv = ''
        var pages = ''
        var menu = ''
        if(divPages.length > 1) {
            menu += "<div class='otterPaginateMenu'><span class='pMenu' id='back'><</span>"
            for(var dP in divPages) {
                var isCurPage = ''
                if(dP == this.curPage) isCurPage = ' select'
                menu += "<span class='pMenu"+isCurPage+"' id='p"+dP+"'>"+(parseInt(dP)+1)+"</span>"
                pages += "<div class='otterPaginate"+isCurPage+"' id='p"+dP+"'>"
                pages += divPages[dP]
                pages += "</div>"
            }
            menu += "<span class='pMenu' id='next'>></span></div>"
            drawDiv += menu + pages
        } else {
            console.log('drawing single page')
            console.log(divPages)
            drawDiv = divPages[0]
        }
        $( '#nameList' ).html(drawDiv)
        this.setOtterPaginate();
        this.setHashCSSColors();
        game.settings.rebuildOtterActions();
    }

    setOtterPaginate() {
        if($( '.otterPaginateMenu .pMenu').length > 0) {
            var t = this;
            $( ".pMenu" ).prop("onclick", null).off("click");
            $( ".pMenu" ).click(function() {
                var goto = this.id
                if(goto == 'back') {
                    var limit = $('.otterPaginate').length
                    if(t.curPage == 0) {
                        goto = limit - 1
                    } else {
                        goto = t.curPage - 1
                    }
                } else if(goto == 'next') {
                    var limit = $('.otterPaginate').length
                    if(t.curPage == limit - 1) {
                        goto = 0
                    } else {
                        goto = t.curPage + 1
                    }
                } else {
                    goto = parseInt(goto.substring(1))
                }
                $('.otterPaginate').removeClass('select')
                $('.pMenu').removeClass('select')
                $('.otterPaginate#p'+goto).addClass('select')
                $('.pMenu#p'+goto).addClass('select')
                t.curPage = parseInt(goto)
            });
        }
    }
}