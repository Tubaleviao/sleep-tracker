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
	var mongodata = [], token;
	
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

	const tk = getToken()
	if(tk !==""){
		localStorage.setItem('tk', tk)
		token = tk
	}else{
		const lctk = localStorage.getItem('tk')
		if(lctk !== null){
			token = lctk
		}
	}
  
	let sd = false
	let ed = false

	$('.csscolumn').click(function(){
		if($(this).css('opacity') != 1){
			var d = new Date();
			if(sd){
        ed = true
				$('#endd').text('End Date: '+dia+' '+hora+':'+min);
        enddate = new Date(d.getFullYear(), d.getMonth(), dia, hora, min);	//take the page showing date
        let new_ob = {user: getUser(), startdate: startdate.getTime(), enddate: enddate.getTime()}
        console.log(new_ob)
        socket.emit('save', {new_ob, token}); // add token here
        dia = undefined
        hora = undefined
        min = undefined
			}else{
        sd = true
				$('#startd').text('Start Date: '+dia+' '+hora+':'+min);
				startdate = new Date(d.getFullYear(), d.getMonth(), dia, hora, min);	//take the page showing date
			}
		}else{
			if($(this).css('opacity') == 1){
        let id = $(this).attr('class').split(' ')[1]
				socket.emit('take', id);
			}
		}
	})
  
  $('.csscolumn').mouseover(function(){
    var field = $(this).attr('id')
		
    if(isNaN(field.slice(2, 3))) hora = field.slice(1, 2);
    else hora = field.slice(1, 3)
		
		if(isNaN(field.slice(-2, -1))) dia = field.slice(-1);
		else dia = field.slice(-2)
		
		min = (field.slice(hora.length+2, hora.length+2+(field.length - (dia.length+hora.length+3)))-1) *5;
		min = ("0"+min).slice(-2);
		hora = ("0"+hora).slice(-2);
		
    if(!sd) $('#startd').text('Start Date: '+dia+' '+hora+':'+min)
    else if(!ed) $('#endd').text('End Date: '+dia+' '+hora+':'+min)
    $('.ballon').text(dia+' '+hora+':'+min)
  });
  
  $(document).on('mousemove', function(event){
		if(event.pageX+130 >= $(window).width()){
			$('.ballon').offset({left: event.pageX-120, top: event.pageY-30});
		}else{
			$('.ballon').offset({left: event.pageX+20, top: event.pageY-30});
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
      enddate: e.getTime(),
      comments: $('#comments').val(),
    }
		socket.emit('save', {new_ob, token});
		
  });
  
  let erase = (id, divs=[]) => {
		socket.emit('del', {id, token})
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
		$('#startd').empty();
		$('#endd').empty();
		sd = false
		ed = false
		mongodata = records;
			paintGrid();
		}
		$('.msg').empty()
	});

  let loadNap = nap => {
    console.log(nap)
    var fdato = new Date(nap.startdate);
    var ldato = new Date(nap.enddate);
    fdato.setMonth(fdato.getMonth()+1);
    ldato.setMonth(ldato.getMonth()+1);
    
    $('.update').show();
    
    $('#id').val(nap._id);
    $('#comments').val(nap.comments);
    $('#sdate').val(toDate(fdato));
    $("#stime").val(toTime(fdato));
    $('#edate').val(toDate(ldato));
    $("#etime").val(toTime(ldato));
  }
	
	socket.on('took', loadNap)

	socket.on('msg', msg => {
		$('.msg').text(msg)
	})
  
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
