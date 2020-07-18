function montaTabela(mes, ano){
	var dia = new Date(mes, ano, 0);
	document.write("<div class='csstable'>");
	for(var k=-1; k<24; k++){
		document.write("<div class='line' >");
		document.write("<div class='csscell1'>");
		if(k>=0){ document.write(k+":00");}
		document.write("</div>");
		for(var j=0; j<dia.getDate(); j++){ 
			document.write("<div class='csscell2"+(j+1)+" csscell2'>");
			if(k>=0){
				for(var i=0; i<12; i++){
					var x = "l"+k+"c"+(i+1)+"d"+(j+1);
					document.write("<div class='csscolumn' id='"+x+"'></div>");
				}
			}else{
				document.write(j+1);
			}
			document.write("</div>");
		}
		document.write("</div>");
	}
	document.write("</div>");
}

function getFields(startmilis, endmilis){
	var start = new Date(startmilis), end = new Date(endmilis);
	var result = [], first;
	let min = (start.getMinutes()/5)+1
	first = "l"+start.getHours() +"c"+ min +"d"+ start.getDate();
	
	result.push(first);
	
	while(start.getTime() < end.getTime()){
    start = new Date(start.getTime() + 5*60000);
    min = (start.getMinutes()/5)+1
    let current = "l"+start.getHours() +"c"+ min +"d"+ start.getDate();
    result.push(current);
	}
	return result;
}

function toDate(dato){
	var test = dato;
	var dd = test.getDate();
	var mm = test.getMonth();
	var yyyy = test.getFullYear();
	if(dd<10){dd='0'+dd} 
	if(mm<10){mm='0'+mm} 
	test = yyyy+'-'+mm+'-'+dd;
	return test;
}

function toTime(timo){
	var h = ("0"+timo.getHours()).slice(-2);
	var m = ("0"+timo.getMinutes()).slice(-2);
	return h+':'+m+':00';
}

$(function(){
	
	var startdate, enddate, dia, hora, min, socket = io();
	var mongodata = [];
	
	function paintGrid(){
		mongodata.forEach(function(trem){
			var asParada = getFields(trem.startdate, trem.enddate);
      asParada.forEach(function(id){
				$('#'+id).css('opacity', '1.0');
				$('#'+id).addClass(trem._id);
			});
		});
	}
	
  paintGrid();
  
  socket.emit('naps', {user: getUser()})
	
	$('.csscolumn').click(function(){
		if($('.ballon').css('display') != 'none' && $(this).css('opacity') != 1){
			var d = new Date();
			if($('#startd').text().length){
				$('#endd').text($('.ballon').text());
				$('.ballon').css('display', 'none');
        enddate = new Date(d.getFullYear(), d.getMonth(), dia, hora, min);	//take the page showing date
        let new_ob = {user: getUser(), startdate: startdate.getTime(), enddate: enddate.getTime()}
        console.log(new_ob)
        socket.emit('save', new_ob);
			}else{
				$('#startd').text($('.ballon').text());
				startdate = new Date(d.getFullYear(), d.getMonth(), dia, hora, min);	//take the page showing date
			}
		}else{
			if($(this).css('opacity') == 1){
        let id = $(this).attr('class').split(' ')[1]
				socket.emit('take', id);
			}
		}
	});
  
  $('#start').click(function(){
		$('#startd').empty();
		$('#endd').empty();
    $('.ballon').show();
    $('.ballon').text('Choose a start date');	
  });
  
  let sd = false
  let ed = false
  $('.csscolumn').mouseover(function(){
    var field = $(this).attr('id');
		
    if(isNaN(field.slice(2, 3))){
      hora = field.slice(1, 2);
    }else{ hora = field.slice(1, 3); }
		
		if(isNaN(field.slice(-2, -1))){
			dia = field.slice(-1);
		}else{ dia = field.slice(-2); }
		
		min = (field.slice(hora.length+2, hora.length+2+(field.length - (dia.length+hora.length+3)))-1) *5;
		min = ("0"+min).slice(-2);
		hora = ("0"+hora).slice(-2);
		
		if($('#startd').text().length){
			$('.ballon').text('End Date: '+dia+' '+hora+':'+min);
		}else{
			$('.ballon').text('Start Date: '+dia+' '+hora+':'+min);
    }
    /*if(!sd) $('#startd').text('Start Date: '+dia+' '+hora+':'+min)
    else $('#endd').text('End Date: '+dia+' '+hora+':'+min)*/
    
  });
  
  $(document).on('mousemove', function(event){
		if(event.pageX+200 >= $(window).width()){
			$('.ballon').offset({left: event.pageX-210, top: event.pageY-110});
		}else{
			$('.ballon').offset({left: event.pageX+10, top: event.pageY-110});
		}
	});
	
	$('#save').click(function(){
		$('.update').hide();
		var s = new Date($('#sdate').val()+' '+$('#stime').val());
		var e = new Date($('#edate').val()+' '+$('#etime').val());
    let id = $('#id').val()
    let nap = mongodata.reduce((acc, v) => v._id===id ? v : acc)
    let divs = getFields(nap.startdate, nap.enddate)
    erase(id, divs)
    let new_ob = {
      _id: id, 
      user: getUser(), 
      startdate: s.getTime(), 
      enddate: e.getTime()
    }
		socket.emit('save', new_ob);
		
  });
  
  let erase = (id, divs=[]) => {
		socket.emit('del', id)
    divs.forEach( el => {
			$('#'+el).css('opacity', '0')
			$('#'+el).removeClass(id)
		})
  }
	
	$('#del').click(function(){
		var s = new Date($('#sdate').val()+' '+$('#stime').val());
		var e = new Date($('#edate').val()+' '+$('#etime').val());
		var divs = getFields(s.getTime(), e.getTime());
		
    $('.update').hide();
    erase($('#id').val(), divs)
	});
	
	socket.on('saved', function(records){
    console.log(records)
    if(records){
      mongodata = records;
			paintGrid();
    }else{
      $('.msg').text('ERROR OMG FUK').show(200).delay(1000).fadeOut(200);
    }
  });
	
	socket.on('took', function(nap){
    console.log(nap)
		var fdato = new Date(nap.startdate);
		var ldato = new Date(nap.enddate);
		fdato.setMonth(fdato.getMonth()+1);
		ldato.setMonth(ldato.getMonth()+1);
		
		$('.update').show();
		
		$('#id').val(nap._id);
		$('#sdate').val(toDate(fdato));
		$("#stime").val(toTime(fdato));
		$('#edate').val(toDate(ldato));
		$("#etime").val(toTime(ldato));
	});
  
});  
