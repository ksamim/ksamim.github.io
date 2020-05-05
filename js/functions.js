function toTitleCase(str) {
    return str.toLowerCase().replace(/(?:^|\s|\-)\w/g, function(match) {
        return match.toUpperCase();
    });
};

function addText(element, tooltipText, cost = null, costSpecificity = 0) {
    costText = ''
    specificity = Math.pow(10,costSpecificity)
    if(cost != null) {
        costText += '<hr/>';
        for(var key of Object.keys(cost)) {
            costText += '<i>'+key+'</i>: ' + (Math.round(cost[key] * specificity)/specificity) + '<br/>';
        }
    }
    if($( element + ' .tooltiptext').length == 0) {
        $( element ).html($( element ).html()+'<span class="tooltiptext">'+tooltipText+costText+'</span>')
    } else {
        $( element + ' .tooltiptext').html(tooltipText+costText)
    }
    $( element ).prop("mouseenter", null).off("mouseenter");
    $( element ).mouseenter(function() {
        $( '.mouseTooltip' ).css("display", "block")
        $( '.mouseTooltip' ).html($( '#' + this.id + ' .tooltiptext' ).html())
        $( ".mouseTooltip" ).css({
            "left" : event.pageX+10,
            "top" : event.pageY+10
          });
    });
    $( element ).prop("mouseleave", null).off("mouseleave");
    $( element ).mouseleave(function() {
        $( '.mouseTooltip' ).css("display", "none")
    });
    $( element ).prop("mousemove", null).off("mousemove");
    $( element ).mousemove(function(event) {
        $( ".mouseTooltip" ).css({
            "left" : event.pageX+10,
            "top" : event.pageY+10
          });
    });
};

function modFunctions(by, left, right, removal = false) {
    var modBy = by;
    if(removal) {
        switch(by) {
            case 'add':
                modBy = 'subtract'
                break;
            case 'subtract':
                modBy = 'add'
                break;
            case 'multiply':
                modBy = 'divide'
                break;
            case 'divide':
                modBy = 'multiply'
                break;
        }
    }
    switch(modBy) {
        case 'add':
            return left + right;
        case 'subtract':
            return right - left;
        case 'multiply':
            return left * right;
        case 'divide':
            return right / left;
        case 'set':
            return left;
    }
};

function printValueAndSign(value) {
    if(value<0) {
        return '-'+value;
    } else {
        return '+'+value;
    }
};

function LogGamma(Z) {
	with (Math) {
		var S=1+76.18009173/Z-86.50532033/(Z+1)+24.01409822/(Z+2)-1.231739516/(Z+3)+.00120858003/(Z+4)-.00000536382/(Z+5);
		var LG= (Z-.5)*log(Z+4.5)-(Z+4.5)+log(S*2.50662827465);
	}
	return LG
}

function Betinc(X,A,B) {
	var A0=0;
	var B0=1;
	var A1=1;
	var B1=1;
	var M9=0;
	var A2=0;
	var C9;
	while (Math.abs((A1-A2)/A1)>.00001) {
		A2=A1;
		C9=-(A+M9)*(A+B+M9)*X/(A+2*M9)/(A+2*M9+1);
		A0=A1+C9*A0;
		B0=B1+C9*B0;
		M9=M9+1;
		C9=M9*(B-M9)*X/(A+2*M9-1)/(A+2*M9);
		A1=A0+C9*A1;
		B1=B0+C9*B1;
		A0=A0/B1;
		B0=B0/B1;
		A1=A1/B1;
		B1=1;
	}
	return A1/A
}

function compute_bindiff(X, N, P) {
    with (Math) {
		if (N<=0) {
			// alert("sample size must be positive")
		} else if ((P<0)||(P>1)) {
			// alert("probability must be between 0 and 1")
		} else if (X<0) {
			bincdf=0
		} else if (X>=N) {
			bincdf=1
		} else {
			X=floor(X);
			Z=P;
			A=X+1;
			B=N-X;
			S=A+B;
			BT=exp(LogGamma(S)-LogGamma(B)-LogGamma(A)+A*log(Z)+B*log(1-Z));
			if (Z<(A+1)/(S+2)) {
				Betacdf=BT*Betinc(Z,A,B)
			} else {
				Betacdf=1-BT*Betinc(1-Z,B,A)
			}
			bincdf=1-Betacdf;
		}
		bincdf=round(bincdf*100000)/100000;
	}
    return 1 - bincdf;
}

function dhm(t){
    var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = Math.floor( (t - d * cd) / ch),
        m = Math.round( (t - d * cd - h * ch) / 60000),
        pad = function(n){ return n < 10 ? '0' + n : n; };
    if( m === 60 ){
    h++;
    m = 0;
    }
    if( h === 24 ){
    d++;
    h = 0;
    }
    var timeToPrint = []
    if(d > 0) {
        var s = ''
        if(d > 1) s = 's'
        timeToPrint = timeToPrint.concat([d+' day'+s]);
    }
    if(h > 0)  {
        var s = ''
        if(h > 1) s = 's'
        timeToPrint = timeToPrint.concat([h+' hour'+s]);
    }
    if(m > 0)  {
        var s = ''
        if(m > 1) s = 's'
        timeToPrint = timeToPrint.concat([m+' minute'+s]);
    }
    return timeToPrint.join(', ');
}

function copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}

function sec2time(timeInSeconds) {
    var pad = function(num, size) { return ('000' + num).slice(size * -1); },
    time = parseFloat(timeInSeconds).toFixed(3),
    hours = Math.floor(time / 60 / 60),
    minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time - minutes * 60),
    milliseconds = time.slice(-3);
    var toReturn = ''
    if((minutes == 0) & (seconds > 0) & (hours == 0)) {
        toReturn = seconds
    } else { toReturn = pad(seconds, 2) }
    if((minutes > 0) & (hours == 0)) toReturn = minutes + ':' + toReturn
    if((minutes >= 0) & (hours > 0)) toReturn = pad(minutes, 2) + ':' + toReturn
    if(hours > 0) toReturn = pad(hours, 2) + ':' + toReturn

    return toReturn;
}