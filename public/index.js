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
        socket.emit('save', new_ob);
			}else{
				$('#startd').text($('.ballon').text());
				startdate = new Date(d.getFullYear(), d.getMonth(), dia, hora, min);	//take the page showing date
			}
		}else{
			if($(this).css('opacity') == 1){
				socket.emit('take', $(this).attr('class').split(' ')[1]);
			}
		}
	});
  
  $('#start').click(function(){
		$('#startd').empty();
		$('#endd').empty();
    $('.ballon').show();
    $('.ballon').text('Choose a start date');	
  });
  
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
		let new_ob = {
      _id: $('#id').val(), 
      user: getUser(), 
      startdate: s.getTime(), 
      enddate: e.getTime()
    }
		socket.emit('save', new_ob);
		
		var ids = getFields(s.getTime(), e.getTime());
		ids.forEach(function(id){
			$('#'+id).css('opacity', '1.0');
			$('#'+id).addClass($('#id').val());
		});
	});
	
	$('#del').click(function(){
		var s = new Date($('#sdate').val()+' '+$('#stime').val());
		var e = new Date($('#edate').val()+' '+$('#etime').val());
		var ids = getFields(s.getTime(), e.getTime());
		
		$('.update').hide();
		socket.emit('del', $('#id').val());
		ids.forEach(function(id){
			$('#'+id).css('opacity', '0');
			$('#'+id).removeClass($('#id').val());
		});
	});
	
	socket.on('saved', function(records){
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
  
  // code for highlights
  
   $( ".csscell21").on( "mouseover", function() 
  {$( ".csscell21").css( "background-color", "#002200" );});
   $( ".csscell21").on( "mouseout", function()  
  {$( ".csscell21").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell22").on( "mouseover", function() 
  {$( ".csscell22").css( "background-color", "#002200" );});
   $( ".csscell22").on( "mouseout", function()  
  {$( ".csscell22").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell23").on( "mouseover", function() 
  {$( ".csscell23").css( "background-color", "#002200" );});
   $( ".csscell23").on( "mouseout", function()  
  {$( ".csscell23").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell24").on( "mouseover", function() 
  {$( ".csscell24").css( "background-color", "#002200" );});
   $( ".csscell24").on( "mouseout", function()  
  {$( ".csscell24").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell25").on( "mouseover", function() 
  {$( ".csscell25").css( "background-color", "#002200" );});
   $( ".csscell25").on( "mouseout", function()  
  {$( ".csscell25").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell26").on( "mouseover", function() 
  {$( ".csscell26").css( "background-color", "#002200" );});
   $( ".csscell26").on( "mouseout", function()  
  {$( ".csscell26").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell27").on( "mouseover", function() 
  {$( ".csscell27").css( "background-color", "#002200" );});
   $( ".csscell27").on( "mouseout", function()  
  {$( ".csscell27").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell28").on( "mouseover", function() 
  {$( ".csscell28").css( "background-color", "#002200" );});
   $( ".csscell28").on( "mouseout", function()  
  {$( ".csscell28").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell29").on( "mouseover", function() 
  {$( ".csscell29").css( "background-color", "#002200" );});
   $( ".csscell29").on( "mouseout", function()  
  {$( ".csscell29").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell210").on( "mouseover", function() 
  {$( ".csscell210").css( "background-color", "#002200" );});
   $( ".csscell210").on( "mouseout", function()  
  {$( ".csscell210").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell211").on( "mouseover", function() 
  {$( ".csscell211").css( "background-color", "#002200" );});
   $( ".csscell211").on( "mouseout", function()  
  {$( ".csscell211").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell212").on( "mouseover", function() 
  {$( ".csscell212").css( "background-color", "#002200" );});
   $( ".csscell212").on( "mouseout", function()  
  {$( ".csscell212").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell213").on( "mouseover", function() 
  {$( ".csscell213").css( "background-color", "#002200" );});
   $( ".csscell213").on( "mouseout", function()  
  {$( ".csscell213").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell214").on( "mouseover", function() 
  {$( ".csscell214").css( "background-color", "#002200" );});
   $( ".csscell214").on( "mouseout", function()  
  {$( ".csscell214").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell215").on( "mouseover", function() 
  {$( ".csscell215").css( "background-color", "#002200" );});
   $( ".csscell215").on( "mouseout", function()  
  {$( ".csscell215").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell216").on( "mouseover", function() 
  {$( ".csscell216").css( "background-color", "#002200" );});
   $( ".csscell216").on( "mouseout", function()  
  {$( ".csscell216").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell217").on( "mouseover", function() 
  {$( ".csscell217").css( "background-color", "#002200" );});
   $( ".csscell217").on( "mouseout", function()  
  {$( ".csscell217").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell218").on( "mouseover", function() 
  {$( ".csscell218").css( "background-color", "#002200" );});
   $( ".csscell218").on( "mouseout", function()  
  {$( ".csscell218").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell219").on( "mouseover", function() 
  {$( ".csscell219").css( "background-color", "#002200" );});
   $( ".csscell219").on( "mouseout", function()  
  {$( ".csscell219").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell220").on( "mouseover", function() 
  {$( ".csscell220").css( "background-color", "#002200" );});
   $( ".csscell220").on( "mouseout", function()  
  {$( ".csscell220").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell221").on( "mouseover", function() 
  {$( ".csscell221").css( "background-color", "#002200" );});
   $( ".csscell221").on( "mouseout", function()  
  {$( ".csscell221").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell222").on( "mouseover", function() 
  {$( ".csscell222").css( "background-color", "#002200" );});
   $( ".csscell222").on( "mouseout", function()  
  {$( ".csscell222").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell223").on( "mouseover", function() 
  {$( ".csscell223").css( "background-color", "#002200" );});
   $( ".csscell223").on( "mouseout", function()  
  {$( ".csscell223").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell224").on( "mouseover", function() 
  {$( ".csscell224").css( "background-color", "#002200" );});
   $( ".csscell224").on( "mouseout", function()  
  {$( ".csscell224").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell225").on( "mouseover", function() 
  {$( ".csscell225").css( "background-color", "#002200" );});
   $( ".csscell225").on( "mouseout", function()  
  {$( ".csscell225").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell226").on( "mouseover", function() 
  {$( ".csscell226").css( "background-color", "#002200" );});
   $( ".csscell226").on( "mouseout", function()  
  {$( ".csscell226").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell227").on( "mouseover", function() 
  {$( ".csscell227").css( "background-color", "#002200" );});
   $( ".csscell227").on( "mouseout", function()  
  {$( ".csscell227").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell228").on( "mouseover", function() 
  {$( ".csscell228").css( "background-color", "#002200" );});
   $( ".csscell228").on( "mouseout", function()  
  {$( ".csscell228").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell229").on( "mouseover", function() 
  {$( ".csscell229").css( "background-color", "#002200" );});
   $( ".csscell229").on( "mouseout", function()  
  {$( ".csscell229").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell230").on( "mouseover", function() 
  {$( ".csscell230").css( "background-color", "#002200" );});
   $( ".csscell230").on( "mouseout", function()  
  {$( ".csscell230").css( "background-color", "rgba(0,0,0,0)" );});
  
   $( ".csscell231").on( "mouseover", function() 
  {$( ".csscell231").css( "background-color", "#002200" );});
   $( ".csscell231").on( "mouseout", function()  
  {$( ".csscell231").css( "background-color", "rgba(0,0,0,0)" );});
});  
