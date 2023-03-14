var view = this;
var desafectado = false;


this.cerrarPanelesLiquidadores = function(){
	var liquidadoresSeleccionados = this.context.options.liquidadoresSeleccionados.get("value").items;
	
	//this.context.options.liquidadoresSeleccionados.get("value").get(index).get("comentarios").get("comentarios").set("items", comentarios);
	if (!b.f.s.isEmptyList(liquidadoresSeleccionados)){	
		for (var i =0; i < liquidadoresSeleccionados.length; i++){
			this.context.options.liquidadoresSeleccionados.get("value").get(i).get("comentarios").get("comentarios").set("initiallyCollapsed", true);		
		}
	}
	console.log("CV Informacion Liquidadores - cerrarPanelesLiquidadores OK"); 
}

this.onPublishedConfirmarModalSelDocs = function(me){
	me.comentarios = {};
	me.comentarios.comentarios = [];

	var liquidadoresSeleccionados = this.context.options.liquidadoresSeleccionados.get("value");
	me.documentosLiquidador.soloRecibidos = false;
	liquidadoresSeleccionados.add(me); 

	
	this.context.options.liquidadoresSeleccionados.set("value", liquidadoresSeleccionados);
	
	this.iniciarComboLiquidadores();
	this.cerrarPanelesLiquidadores(); 
	
	this.ui.publishEvent("SAVE_CONTEXT");
	
}

this.onPublishedNuevaNotaLiquidador = function(me){

	this.context.binding.get("value").get("notas").add(me); 
	
}

this.onViewEvent = function(){
	view.onLoadTablaVacia();
}

this.onChangeEvent = function(){
	view.onLoadTablaVacia();
}


this.onResult_Liquidadores = function(result){
	console.log(result, 'result')
}

this.onLoadTablaVacia = function(){
	var msg = this.ui.get("Output_Text1");
	if(this.context.options.liquidadoresSeleccionados.get("value").length() == 0){
		msg.setVisible(true);
	}
	else{
	      msg.setVisible(false, true);
	}

}


this.onClick_Designar = function(event){
	var combo = this.ui.get('Single_Select1');
	var seleccion = combo.getSelectedItem();
      desafectado = false;
	
	if (seleccion && seleccion.name) {
		var duplicado = this.validar(seleccion);		
		if (!duplicado) {    	  
	          this.invocarModalDocs(seleccion);	
		  } else {
		  	if (desafectado) {  		  	

			 }
		   }	      
	} else {	    
	    b.alert.error("Seleccione un liquidador"); 
    	}
}

this.validar = function(seleccion){
	var liquidadoresSeleccionados = this.context.options.liquidadoresSeleccionados.get("value");
	var duplicado = false;
	var liquidadoresSeleccionadosNew = [];
	
	var encontrado = false; 

	for (var i = 0; i < liquidadoresSeleccionados.length(); i++){
		var liquidador = liquidadoresSeleccionados.get(i);	
		if (liquidador.codigo==seleccion.value){
		      duplicado = true;
		      encontrado = true; 
                  if (liquidador.estado=='Designado'){
                      console.log("duplicado y designado");                     
			    b.alert.error("El liquidador ya está designado"); 
			} else {	
				desafectado = true;
				console.log(" var desafectado " + desafectado);
			      console.log("duplicado y desafectado");
			      this.context.binding.get("value").set("triggerConfirmacion", (new Date()).getTime()+"_true");
			      this.context.binding.get("value").set("mensajeConfirmacion", "¿Confirma designar nuevamente el liquidador "+seleccion.name+"?")
			      this.context.binding.get("value").set("liquidadorItemSeleccionadoDesignar", liquidador);

			} 		
		} else {
		   console.log("no duplicado");
		}		
	}
	return (duplicado);
}

//CORRESPONDE AL BOTON CONFIRMAR DEL MODAL DEL DESIGNAR LIQ DESAFECTADO
this.aceptarConfirmar = function(){
	try{
		b.f.c.showLoading(view);
		this.context.binding.get("value").set("triggerConfirmacion", (new Date()).getTime()+"_false");
		
		var combo = this.ui.get('Single_Select1');
		var seleccion = combo.getSelectedItem();
		
		// confirmar del modal
		var liquidadoresSeleccionadosNew = [];
		
		var liquidador = this.context.binding.get("value").get("liquidadorItemSeleccionadoDesignar");
		liquidador.estado = 'Designado';
		liquidador.visibilidadSession = "DEFAULT";
		liquidador.datosEstructurados =  {};
		liquidador.datosEstructurados.reservas = [];
		
		var liquidadoresSeleccionados = this.context.options.liquidadoresSeleccionados.get("value");
		for (var i = 0; i < liquidadoresSeleccionados.length(); i++){
			var liquidadorItem = liquidadoresSeleccionados.get(i);
	
			if (liquidadorItem.codigo==seleccion.value){
				liquidadoresSeleccionadosNew.push(liquidador);
			}
			else{
				liquidadoresSeleccionadosNew.push(liquidadorItem);
			}
		}	
		this.context.options.liquidadoresSeleccionados.set("value", liquidadoresSeleccionadosNew);	
		this.context.binding.get("value").get("asignarLiquidador").set("observaciones", liquidador.liquidador);			      
		//GRABAR NOTA Y ENVIAR MAIL
		var params = {
			idSiniestro: this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro"),
			idInstancia: this.context.options.contextoInstancia.get("value").get("numeroInstancia"),
			asegurado: this.context.options.contextoInstancia.get("value").get("asegurado"),
			liquidadorItemSeleccionadoDesignar: this.context.binding.get("value").get("liquidadorItemSeleccionadoDesignar"),
			variablesPlantilla: this.context.binding.get("value").get("variablesPlantilla").items,
			reclamacion: this.context.binding.get("value").get("reclamacion")
		}
		var request = JSON.stringify(params);
		
		console.log ("Informacion Liquidadores - aceptarConfirmar - params: "); 
		console.log(params); 
		
		var servicio = this.ui.get("Service_Call1");
		servicio.execute(request);
		
		//ADD NEW COMENTARIO
		var now = new Date();
		var nuevoComentario = {};
		nuevoComentario.comentario = "";
		nuevoComentario.fechaCreacion = now
		nuevoComentario.fechaUltimaActualizacion = now;
		nuevoComentario.grabadoEnPDF = false;
		nuevoComentario.usuario = this.context.bpm.system.user_loginName;
		nuevoComentario.nombreCompleto = this.context.bpm.system.user_fullName;
		nuevoComentario.tipoComunicacion = {};
		nuevoComentario.tipoComunicacion.name = "Asignado a Liquidador";
		nuevoComentario.tipoComunicacion.value = "TC-002";
		nuevoComentario.origen = "BPM";
		nuevoComentario.metadatos = [];
		
		
		
		var paramsEvent = {};
		paramsEvent.codigoLiquidador = liquidador.codigo;
		paramsEvent.nuevoComentario = nuevoComentario;
		paramsEvent.nombreLiquidador = liquidador.liquidador;
		this.ui.publishEvent("EV_NUEVO_COMENTARIO", paramsEvent);
		
		
		view.onLoadTablaVacia();
	}
	catch(e){
		b.alert.error("ERROR: "+e);
		console.error(e)
		
	}
}

//CORRESPONDE AL BOTON CANCELAR DEL MODAL DEL DESIGNAR LIQ DESAFECTADO
this.cancelarConfirmar = function(){
	b.alert.success("Se canceló la designación"); 
}

this.onResultAsignarLiquidador = function(result){
      console.log("NOTAS1: " + this.context.binding.get("value").get("notas"));
	if(!this.context.binding.get("value").get("notas")){
		this.context.binding.get("value").set("notas", []);
	}	
	this.context.binding.get("value").get("notas").add(result);
	console.log("NOTAS2: " + this.context.binding.get("value").get("notas"));
	//b.alert.success("Nota guardada y correo enviado correctamente.");
	b.alert.success("El Liquidador seleccionado fue designado nuevamente. Actualizando los detalles del liquidador.");
	
	this.iniciarComboLiquidadores();
	this.cerrarPanelesLiquidadores();

	this.ui.publishEvent("SAVE_CONTEXT");
}


this.onErrortAsignarLiquidador = function(error){
	
	b.alert.error("Error al guardar nota y enviar correo");
	console.log("ERROR:",error) 
	//this.context.binding.get("value").set("amparar", false);
	//var amparar = this.ui.get("amparar_Contenedor");
	//amparar.setEnabled(true, true);
}

this.onPublishedEventSiniestroAsociado = function(me){
	var data = me.getData();
	console.log("data: "+data);
	if(data && data.idSiniestro){
		this.context.trigger();
		console.log("data.idSiniestro: ",data.idSiniestro);
		var sint = data.idSiniestro;
		if(sint){
			this.context.binding.get("value").get("asignarLiquidador").set("idSiniestro", {});
			sinotSplit = sint.split("-");
			sinSlit11 = sinotSplit[2].split("/");
			console.log("sinotSplit: ",sinotSplit);
			console.log("sinSlit11: ",sinSlit11);
			this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro").set("anio", sinotSplit[0])
			this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro").set("ramo", sinotSplit[1])
			this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro").set("nroSiniestro", sinSlit11[0])
			this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro").set("nroSubsiniestro", sinSlit11[1])
			this.context.binding.get("value").get("reclamacion").set("idSiniestro", this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro"));
			
			
			// AJUSTE 3 oct HH, para no usar reclamacion y propalar los params necesarios en todos los CVs
			this.context.options.contextoInstancia.get("value").set("idSiniestro", {});
			sinotSplit = sint.split("-");
			sinSlit11 = sinotSplit[2].split("/");
			console.log("sinotSplit: ",sinotSplit);
			console.log("sinSlit11: ",sinSlit11);
			this.context.options.contextoInstancia.get("value").get("idSiniestro").set("anio", sinotSplit[0]);
			this.context.options.contextoInstancia.get("value").get("idSiniestro").set("ramo", sinotSplit[1]);
			this.context.options.contextoInstancia.get("value").get("idSiniestro").set("nroSiniestro", sinSlit11[0]);
			this.context.options.contextoInstancia.get("value").get("idSiniestro").set("nroSubsiniestro", sinSlit11[1]);
			this.context.options.contextoInstancia.get("value").set("siniestroAsociado", true);
		}
		
		
		
	}
}

// J 2352 desafectar
this.onLoad_Desafectar = function (me) {
	var index = me.ui.getIndex();
	var uiListDocs = this.ui.get("TableLiqSel");
	var itemSelected = uiListDocs.getRowForView(me).getData();
//	if (itemSelected.estado == "Desafectado") {
	if (itemSelected.estado == "Desafectado" || itemSelected.estado == "Desactivado") {
		me.setEnabled(false);
	}
}


// J 2352 desafectar
this.onClick_Desafectar = function(me){
	var index = me.ui.getIndex();
	var uiListLiqs = this.ui.get("TableLiqSel");
	var itemSelected = uiListLiqs.getRowForView(me).getData();
	console.log("index de liquidador desafectar " +  index + " itemSelected  " + itemSelected);

	this.context.binding.get("value").set("triggerConfirmacionDesafectar", (new Date()).getTime()+"_true")
	this.context.binding.get("value").set("mensajeConfirmacionDesafectar", "¿Confirma desafectar el liquidador "+itemSelected.liquidador+"?")
	this.context.binding.get("value").set("liquidadorItemSeleccionadoDesignar", itemSelected);
	console.log("onClick_Desafectar - liquidador a desafectar " +  this.context.binding.get("value").get("liquidadorItemSeleccionadoDesignar"));
	
}

this.aceptarConfirmarDesafectar = function(){
	try{
		b.f.c.showLoading(view);
		this.context.binding.get("value").set("triggerConfirmacionDesafectar", (new Date()).getTime()+"_false");
		
		// confirmar del modal
		var liquidadoresSeleccionadosNew = [];
		
		var liquidador = this.context.binding.get("value").get("liquidadorItemSeleccionadoDesignar");
		
		console.log("nombre liquidador en confirmar desafectar: " +  liquidador.liquidador);
		console.log("estado liquidador en confirmar desafectar: " +  liquidador.estado);
		console.log("visibilidad liquidador en confirmar desafectar: " +  liquidador.visibilidadSession);
		liquidador.estado = 'Desafectado';
		liquidador.visibilidadSession = "READONLY";
		//liquidador.comentarios = {};
		//liquidador.comentarios.comentarios = [];
		//liquidador.comentarios.comentarios.push(addComen());
		//SET VALOR NUEVO
		var liquidadoresSeleccionados = this.context.options.liquidadoresSeleccionados.get("value");
		for (var i = 0; i < liquidadoresSeleccionados.length(); i++){
			var liquidadorItem = liquidadoresSeleccionados.get(i);
			console.log("liquidadorItem.liquidador:"+ liquidadorItem.liquidador);
			console.log("liquidador.liquidador:"+ liquidador.liquidador);
			//TODO validar codigo
			if (liquidadorItem.liquidador==liquidador.liquidador){
				liquidadoresSeleccionadosNew.push(liquidador);
			}
			else{
				liquidadoresSeleccionadosNew.push(liquidadorItem);
			}
		}	
		this.context.options.liquidadoresSeleccionados.set("value", liquidadoresSeleccionadosNew);	
		//b.alert.warning("El liquidador ya estuvo designado");	 
		//DATOS DE ENTRADA PARA EL SERVICIO
		this.context.binding.get("value").get("asignarLiquidador").set("observaciones", liquidador.liquidador);			      
		//GRABAR NOTA Y ENVIAR MAIL
		var params = {
			idSiniestro: this.context.binding.get("value").get("asignarLiquidador").get("idSiniestro"),
			idInstancia: this.context.options.contextoInstancia.get("value").get("numeroInstancia"),
			liquidadorItemSeleccionadoDesignar: this.context.binding.get("value").get("liquidadorItemSeleccionadoDesignar"),
			variablesPlantilla: this.context.binding.get("value").get("variablesPlantilla").items,
			asegurado: this.context.options.contextoInstancia.get("value").get("asegurado"),
			reclamacion: this.context.binding.get("value").get("reclamacion")
		}
		var request = JSON.stringify(params);
		
		console.log ("Informacion Liquidadores Adderly- aceptarConfirmarDesafectar - params: "); 
		console.log(params); 
		
		var servicio = this.ui.get("Service_Call2");
		servicio.execute(request);
		
		view.onLoadTablaVacia();
	}
	catch(e){
		b.alert.error("ERROR: "+e);
		console.error(e)
		
	}
	
}

this.onResultDesafectarLiquidador = function(result){
      console.log("NOTAS1: " + this.context.binding.get("value").get("notas"));
	if(!this.context.binding.get("value").get("notas")){
		this.context.binding.get("value").set("notas", []);
	}	
	this.context.binding.get("value").get("notas").add(result);
	console.log("NOTAS2: " + this.context.binding.get("value").get("notas"));
	//b.alert.success("Nota guardada y correo enviado correctamente.");
	b.alert.success("El liquidador ha sido desafectado. Actualizando los detalles del liquidador.");
	
	//ADD NEW COMENTARIO
	var now = new Date();
	var nuevoComentario = {};
	nuevoComentario.comentario = "";
	nuevoComentario.fechaCreacion = now
	nuevoComentario.fechaUltimaActualizacion = now;
	nuevoComentario.grabadoEnPDF = false;
	nuevoComentario.usuario = this.context.bpm.system.user_loginName;
	nuevoComentario.nombreCompleto = this.context.bpm.system.user_fullName;
	nuevoComentario.tipoComunicacion = {};
	nuevoComentario.tipoComunicacion.name = "Desafectado";
	nuevoComentario.tipoComunicacion.value = "TC-006";
	nuevoComentario.origen = "BPM";
	nuevoComentario.metadatos = [];
		
	var paramsEvent = {};
	paramsEvent.codigoLiquidador = this.context.binding.get("value").get("liquidadorItemSeleccionadoDesignar").get("codigo");
	paramsEvent.nuevoComentario = nuevoComentario;
	this.ui.publishEvent("EV_NUEVO_COMENTARIO", paramsEvent);
	
	this.ui.publishEvent("SAVE_CONTEXT");
	console.log("SAVE_CONTEXT");
}

this.onErrortDesafectarLiquidador = function(error){
	
	b.alert.error("Error al guardar nota y enviar correo");
	console.log("ERROR:",error) 
	//this.context.binding.get("value").set("amparar", false);
	//var amparar = this.ui.get("amparar_Contenedor");
	//amparar.setEnabled(true, true);
}

// LIMPIAR SELECCION LIQUIDADORES
this.iniciarComboLiquidadores = function(){
	var combo = this.ui.get('Single_Select1');
	combo.setSelectedItem({});
}
