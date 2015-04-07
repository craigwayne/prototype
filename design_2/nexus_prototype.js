window.onbeforeunload = function(){return "All your work will be erased!";}

var resizer;
var workspace;
var editor;
var resize_start;
var editor_width;
var preview;
var code_boxes;
var preview_doc;
//resize events
document.addEventListener("DOMContentLoaded",function(){

	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
	preview = document.querySelector(".preview");
	preview_doc = preview.contentDocument || preview.contentWindow.document;
	workspace = document.querySelector(".main");
	resizer = document.querySelector(".resizer");
	editor 	= document.querySelector(".editor");

	var code_area_html = document.querySelector(".code_area.html");
	var code_area_css = document.querySelector(".code_area.css");
	var code_area_js = document.querySelector(".code_area.js");

	code_area_html.addEventListener("keydown",catch_tab_key,false);
	code_area_css.addEventListener("keydown",catch_tab_key,false);
	code_area_js.addEventListener("keydown",catch_tab_key,false);

	var export_email = document.querySelector("#export_email");
	var export_url   = document.querySelector("#export_url");
	export_url.addEventListener("click",generate_share_url,false);


	document.querySelector(".menu input[type=file]").onchange = upload_files;

	resizer.addEventListener("mousedown",function(event){
		editor.dataset.resizing = true;
		resize_start = event.clientX;
		editor_width = window.getComputedStyle(editor).width;
	},false);

	resizer.addEventListener("contextmenu",function(){editor.dataset.resizing=false;},false);

	//dont need this, just check if the src element is the resizer
	document.addEventListener("mouseup",function(){editor.dataset.resizing = false;},false);

	document.addEventListener("mousemove",function(event){
		//NOTE: the new_width is a percentage of the container not in pixels (px)
		if(editor.dataset.resizing=="true"){
			var workspace_width = parseInt(window.getComputedStyle(workspace).width);

			var resizer_width = parseInt(window.getComputedStyle(resizer).width);

			var difference = event.clientX-resize_start;

			var new_width = ((parseInt(editor_width)+difference)/workspace_width)*100;

			editor.style.width	= new_width + "%";

			preview.style.width	= "calc(100% - "+editor.style.width+")";
		}
	},false);

	code_boxes = document.querySelectorAll(".code_box");

	for(var i=0; i<code_boxes.length; i++){
		code_boxes[i].querySelector(".code_area").addEventListener("keyup",show_preview,false);
		code_boxes[i].querySelector(".code_area").addEventListener("scroll",function(){this.style.backgroundPositionY = (0-this.scrollTop)+"px";},false);
		code_boxes[i].querySelector("label input[type=checkbox]").addEventListener("change",resize_code_boxes);
	}


	document.forms[0].addEventListener("reset",reset,false);
	get_functionality();

},false);

function resize_code_boxes(){
	var showing_code_boxes = new Array();
	for(var i=0; i<code_boxes.length; i++)
	{
		if(!code_boxes[i].querySelector("label input[type=checkbox]").checked)
		{
			code_boxes[i].dataset.showing = false;
			code_boxes[i].style.height = "";
		}
		else
		{
			code_boxes[i].dataset.showing = true;
			showing_code_boxes.push(code_boxes[i]);
		}
	}
	var not_showing = code_boxes.length - showing_code_boxes.length;
	for(var i=0; i<showing_code_boxes.length; i++)
	{
		showing_code_boxes[i].style.height = "calc((100% - 25px*"+not_showing+")/"+showing_code_boxes.length+")";
	}
}

function get_html_code(){return document.querySelector(".code_area.html").value;}

function get_js_code(){return document.querySelector(".code_area.js").value;}

function get_css_code(){return document.querySelector(".code_area.css").value;}

function get_preview_code(){
	var html = '<html>\n';
	html += "<head>\n"
	html += "\t<title>"+get_filename()+"</title>\n";

	if(get_css_code() != ""){
		html += "\n<style>\n\n"+get_css_code()+"\n\n</style>\n";
	}

	if(get_js_code() != ""){

		html += "\n\t<script>\n\n"+get_js_code()+"\n\n</script>\n";
	}

	html += "</head>\n";
	html += "<body>\n\n";
	html += ""+get_html_code();
	html += "\n\n</body>\n";
	html += "</html>"
	return html;
}


function show_preview(){
	preview_doc.open();
	preview_doc.write(get_preview_code());
	preview_doc.close();
	workspace.dataset.loading = false;
}


function editor_width_min(){
	document.querySelector('.editor').style.width='0';
	preview.style.width	= "calc(100% - "+editor.style.width+")";
}

function editor_width_max(){
	document.querySelector('.editor').style.width='100%';
	preview.style.width	= "calc(100% - "+editor.style.width+")";
}

function catch_save_functions(){
	document.addEventListener("keydown", function(e){
		if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)){
			e.preventDefault();
			save_code_as();
			document.querySelector(".menu a[download]").click();
		}
	}, false);
}

function save_code_as(){
	var data = 'data:application/xml;charset=utf-8,' + encodeURIComponent(get_preview_code());
	document.querySelector(".menu a[download]").download = get_filename();
	document.querySelector(".menu a[download]").href = data;
}

function get_filename(){
	var filename = document.querySelector("#filename").value;
	return filename;
}

function upload_files(){
	var files = this.files;
	window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
		for (var i = 0, file; file = files[i]; ++i) {
			document.querySelector("#download_button").download = get_filename();
			(function(f){
				//var current_date = new Date();
				fs.root.getFile("uploaded.html", {create: true, exclusive: false}, function(fileEntry){
					fileEntry.createWriter(function(fileWriter){
						fileWriter.write(f);
						fs.root.getFile("uploaded.html", {}, function(fileEntry) {
							fileEntry.file(function(file){
								var reader = new FileReader();
								this.result = "";
								reader.onloadend = function(e){
									reset();
									document.querySelector(".code_area.html").value = this.result;
									document.querySelector(".menu input[type=file]").value = null;
									show_preview();
									hide_menu();
								};

								reader.readAsText(file);
							}, errorHandler);
						}, errorHandler);
					}, errorHandler);
				}, errorHandler);
			})(file);
		}
	}, errorHandler);
}

function errorHandler(e){
	console.error(e);
}

function get_functionality(){

	var upload_button = document.querySelector(".menu input[type=file]");
	var codepen_export_button = document.querySelector("#export_codepen");
	if(!document.domain){
		codepen_export_button.addEventListener("click",local_functionality_notice,false);
		upload_button.type = "button";
		upload_button.addEventListener("click",local_functionality_notice,false);
	}
	else{
		codepen_export_button.addEventListener("click",export_to_codepen,false);
	}

}

function catch_query_strings(){
	if(get_query_variable("html")){document.querySelector(".code_area.html").value = get_query_variable("html");}
	if(get_query_variable("js")){document.querySelector(".code_area.js").value = get_query_variable("js");}
	if(get_query_variable("css")){document.querySelector(".code_area.css").value = get_query_variable("css");}
	history.pushState(null,null,document.location.origin+document.location.pathname);
	show_preview();
}

function local_functionality_notice(){alert("Only available online","test");}


function reset(){
	for(var i=0; i<document.querySelectorAll(".code_area").length; i++){
		document.querySelectorAll(".code_area")[i].value = '';
	}
	document.forms[0].reset();
	show_preview();
}

function show_menu(){
	$('.main .menu').toggleClass('active');
	$('header .menu_toggle').toggleClass('fa-bars fa-times');
	document.querySelector('.workspace').setAttribute("onclick","hide_menu();");
}

function hide_menu(){
	$("header .menu_toggle").toggleClass('fa-times fa-bars');
	$(".main .menu").removeClass("active");
}

function catch_tab_key(ev){
		var keyCode = ev.keyCode || ev.which;

		if (keyCode == 9) {
			ev.preventDefault();
			var start = this.selectionStart;
			var end = this.selectionEnd;
			var val = this.value;
			var selected = val.substring(start, end);
			var re, count;

			if(ev.shiftKey) {
				//re = /^\t/gm;
				re = /^/gm;
				count = -(selected.match(re).length);
				this.value = val.substring(0, start) + selected.replace(re, '') + val.substring(end);
				// todo: add support for shift-tabbing without a selection
			} else {
				re = /^/gm;
				count = selected.match(re).length;
				this.value = val.substring(0, start) + selected.replace(re, '\t') + val.substring(end);
			}

			if(start === end) {
				this.selectionStart = end + count;
			} else {
				this.selectionStart = start;
			}

			this.selectionEnd = end + count;
		}
}

function export_to_codepen(){
	var form = document.createElement("form");
	form.style.display="none";
	form.target = "_blank";
	form.method = "POST";
	form.action = "http://codepen.io/pen/define";

	var data = form.appendChild(document.createElement("input"));
	data.type = "hidden";
	data.name = "data";

	//set the name as the same name as the download OR! nexus prototype export
	var data_obj = {
		"title":get_filename(),
		"html":get_html_code(),
		"css":get_css_code(),
		"js":get_js_code()
	}
	data.value = JSON.stringify(data_obj).replace(/"/g, "&quot;").replace(/'/g,"&apos;");

	form.submit();
}

function generate_share_url(){
	prompt(document.location.href + "?html="+encodeURIComponent(get_html_code())+ "&css=" +encodeURIComponent(get_css_code()) + "&js=" + encodeURIComponent(get_js_code()));

}

catch_save_functions();

//ace editor integration
/*
document.addEventListener("DOMContentLoaded",function(){
var code_area_html = ace.edit("code_area_html");
code_area_html.setTheme("ace/theme/monokai");
code_area_html.getSession().setMode("ace/mode/html");

var code_area_css = ace.edit("code_area_css");
code_area_css.setTheme("ace/theme/monokai");
code_area_css.getSession().setMode("ace/mode/css");


var code_area_js = ace.edit("code_area_js");
code_area_js.setTheme("ace/theme/monokai");
code_area_js.getSession().setMode("ace/mode/javascript");
},false);
*/
