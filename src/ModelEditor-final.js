/*
	Model Editor
	
	Easily edit your backbone models with ModelEditor. Supports the following inputs:
	
		• Input
		• Date Input (input with date picker; requires jQuery UI)
		• Textarea
		• RTE (textarea with rich text editor - requries Redactor.js)
		• Checkbox
		• Select
		• Multi Select
		
	
	Example use:
		this.editor = new ModelEditor({model:this.model, el:this.el}); // inputs are automatically appended to "el"
		this.editor.input('Input title', 'mode_key');
		
	then when you want to save the changes, call:
		this.editor.save();
	
	If you want the model to save automatically whenver an input changes, add "autoSave" option
		this.editor = new ModelEditor({model:this.model, el:this.el, autoSave:true});
	
	
	@author Kevin Jantzer
	@since 2012-11-09
	@url https://github.com/kjantzer/backbonejs-model-editor-view
*/var ModelEditor=Backbone.View.extend({initialize:function(e){if(!e||!e.model){console.error("ModelEditor requires a “model” to be given.");return}this.options=_.extend({modelType:"Backbone.Model",autoSave:!1,saveToDB:!this.model.isNew(),patchSave:!1,defaultOpts:{}},e);this.editmodel=this.createEditModel();this.reset();this.defaultOpts("reset");this.setModel(this.model);this.editmodel.on("edited",this.rememberChanges,this);this.options.defaultOpts.btns&&(this.options.autoSave=!0);this.autoSave(this.options.autoSave)},setModel:function(e){this.stopListening(this.model);this.model=e;this.listenTo(this.model,"change",this.cleanReset);this.listenTo(this.model,"reset",this.cleanup);this.listenTo(this.model,"sync",this.onSync);this.reset()},createEditModel:function(){var e=this.options.modelType;e==="auto"&&this.model.collection?e=this.model.collection.model:_.getObjectByName?e=_.getObjectByName(e):e=Backbone.Model;return new e(this.model.toJSON())},autoSave:function(e){this.editmodel.off("change",this.save,this);e!==!1&&this.editmodel.on("change",this.save,this)},rememberChanges:function(e,t,n){var r=this.model._unsavedChanges||{};n?r[e]=t:this.options.autoSave&&delete r[e];this.model._unsavedChanges=_.size(r)>0?r:null},hasUnsavedChanges:function(){return _.size(this.data())>0},render:function(){this.trigger("render")},cleanReset:function(){this.reset()},reset:function(e){this.editmodel.clear({silent:!0});this.editmodel.set(e||this.model.toJSON(),{silent:!0});this.editmodel.unsavedChanges=this.model._unsavedChanges||{}},cleanup:function(){Backbone.View.prototype.cleanup.apply(this,arguments);this.clearSubviews()},defaultOpts:function(e){e==="reset"?this._defaultOpts=_.extend({},this.options.defaultOpts,{renderTo:this.$el}):this._defaultOpts=_.extend({},this._defaultOpts||{},e||{});return this},data:function(){return this.options.patchSave?this.model.changedAttributes(this.model._unsavedChanges):this.editmodel.toJSON()},save:function(e,t){var n=this.save.bind(this,e,t);t=t||{};var r=t.error;t.error=function(e,t){r&&r();this._onError.call(this,e,t,n)}.bind(this);this.options.patchSave&&(t.patch=!0);if(this.options.saveToDB||e===!0){this.model.save(this.data(),t);this.model._unsavedChanges=null}else this.model.set(this.data(),t);this.options.onSave&&this.options.onSave(this.model)},_onError:function(e,t,n){t.retry={title:"Retry Save?",fn:n}},onSync:function(e){this.editmodel.trigger("changed")},insert:function(e,t,n){if(!ModelEditors[e]){console.error("ModelEditor: there is no editor called “"+e+"”. Available editors:",ModelEditors);return}var r=new ModelEditors[e](_.extend({key:t,model:this.editmodel,renderTo:this.$el},this._defaultOpts,n));this.subview(t)&&console.warn("Editor for “"+t+"” already exists.");this.subview(t,r);return r}}),ModelEditors={};ModelEditors.Base=Backbone.View.extend({tagName:"span",className:"model-editor",editorClassName:"",isDisabled:!1,append:function(e){this.$inner.append(e)},html:function(e){this.$inner.html(e)},init:function(){this.options=_.extend({disabled:!1,theme:"default","float":"left",clear:!0,label:"auto",labelInline:!1,labelStyle:"",labelIcon:!1,key:null,valueType:"string",emptyVal:null,renderTo:null,selectOnClick:!1,pl:null,ph:null,watchChanges:!1,plPrefix:null,plFieldVal:null,css:null},this.options);this.options.renderTo instanceof ModelEditors.Base&&(this.options.renderTo=this.options.renderTo.$inner);this.$el.appendTo(this.options.renderTo).addClass(this.editorClassName).addClass("theme-"+this.options.theme).addClass("key-"+this.options.key).attr("data-val",this.val());this.setupLabel();this.options.float&&(this.options.float==="left"||this.options.float==="right")&&this.$el.addClass("float-"+this.options.float);this.options.clear&&this.$el.addClass("clear");this.options.disabled&&_.defer(this.disable.bind(this));this.$inner=$('<span class="inner"></span>').appendTo(this.$el);if(this.options.pl){var e=this.options.pl;e==="auto"&&this.options.plPrefix&&(e=this.options.plPrefix+"::"+this.options.key);if(e!=="auto"){this.subview("plv",ProofingLight(e,{fieldVal:this.plFieldVal.bind(this)}));this.$inner.append(this.subview("plv").el)}}if(this.options.ph){this.subview("phv",ProofingHistory(this.options.ph));this.$inner.append(this.subview("phv").el)}this.options.css&&this.$el.css(this.options.css);this.listenTo(this.model,"changed",this.onChanged)},plFieldVal:function(){return this.options.plFieldVal?this.options.plFieldVal():this.val()},testForCleanup:function(){this.el.parentElement||this.cleanup()},cleanup:function(){Backbone.View.prototype.cleanup.apply(this,arguments);this.stopListening()},onChanged:function(e){var t=this.model.changed[this.options.key];if(t===undefined||this.options.watchChanges!==!0)return;delete this.model.changed[this.options.key];if(!this.options.pl&&!this.subview("plv"))return console.warn("!! To watch changes ("+this.options.key+"), you need to specifiy a key for proofing the proofing light");(this.subview("plv").model.get("status")==1||this.subview("plv").model.get("status")==-2)&&this.subview("plv").reset()},_disable:function(){this.$el.addClass("disabled");this.isDisabled=!0;return this},_enable:function(){this.$el.removeClass("disabled");this.isDisabled=!1;return this},disable:function(){return this._disable()},enable:function(){return this._enable()},hide:function(){this.$el.hide()},show:function(){this.$el.show()},parseVal:function(e){switch(this.options.valueType){case"string":return e;case"array":return e||[];case"csv":return _.splitAndTrim(e)}},parseSaveVal:function(e){switch(this.options.valueType){case"string":return this.cleanSaveVal(e);case"array":return e;case"csv":return(e||[]).join(",")}},cleanSaveVal:function(e){e=_.cleanWebkitStyles(e);e=_.smartQuotes(e);return e},_val:function(){return this.parseVal(this.model.get(this.options.key)||null)},_newVal:function(){return this.$input.val()||this.options.emptyVal},val:function(){return this._val()},newVal:function(){return this._newVal()},saveVal:function(){return this.parseSaveVal(this.newVal())},valChanged:function(){var e=this.val(),t=this.newVal();return this.options.valueType=="csv"||this.options.valueType=="array"?_.difference(e,t).length>0||e.length!=t.length:e!==t},updateVal:function(){this.model.trigger("edited",this.options.key,this.saveVal(),this.valChanged());if(this.isDisabled||!this.valChanged())return;this.model.set(this.options.key,this.saveVal());this.options.onSave&&this.options.onSave(this.options.key,this.saveVal());this.$el.attr("data-val",this.saveVal());this.editorTagName&&this.editorTagName=="textarea"&&this.$input.val(this.saveVal())},setWidth:function(){if(!this.options.w)return;this.$inner.width(this.options.w)},setupLabel:function(){var e=this.options.label;if(e===!1||e===undefined)return;e==="auto"&&(e=this.keyToText());this.$label=$("<label><div><span>"+e+"</span></div></label>").appendTo(this.$el);this.options.labelDivider&&this.$label.find("> div:first-child").addClass("divider dark");this.options.helpText&&this.$label.append('<p class="help-text">'+this.options.helpText+"</p>");this.options.labelStyle&&this.$el.addClass("label-style-"+this.options.labelStyle);this.options.labelIcon&&this.$label.find("> div:first-child").addClass("icon-"+this.options.labelIcon);if(this.options.labelInline){this.$el.addClass("inline-label");_.isNumber(this.options.labelInline)&&this.$label.width(this.options.labelInline)}},keyToText:function(){var e=this.options.key;e=e.replace(/_|-/g," ");e=e.replace(/ id$/," ID");e=e.replace(/isbn/," ISBN");e=e.replace(/drm/," DRM");e=e.replace(/dmas/," DMAS");e=e.replace(/^msg$/,"Message");e=_.titleize(e);return e}});ModelEditors.empty=ModelEditors.Base.extend({editorClassName:"empty",initialize:function(){this.init();this.setWidth();this.options.view&&(this.options.view instanceof Backbone.View?this.append(this.options.view.el):this.append(this.options.view));this.render()},render:function(){this.options.view&&this.options.view instanceof Backbone.View&&this.options.view.render();this.options.selectOnClick&&this.$inner.on("click",this.selectOnClick.bind(this))},selectOnClick:function(){var e=this.$inner[0];if(document.selection){var t=document.body.createTextRange();t.moveToElementText(e);t.select()}else if(window.getSelection){var t=document.createRange();t.selectNode(e);window.getSelection().addRange(t)}}});ModelEditors.input=ModelEditors.Base.extend({editorTagName:"input",editorClassName:"input",editorAttributes:{type:"text","class":"form-control"},events:{"focus input":"onFocus","blur input":"onBlur","keyup input":"onKeyUp","keydown input":"onKeyDown","keypress input":"onKeyPress","click .button.save":"saveBtnAction","click .button.cancel":"cancelBtnAction","click .markdown-preview-btn":"toggleMarkdownPreview"},keyEvents:{27:"cancelBtnAction",13:"saveBtnAction"},initialize:function(e){this.options=_.extend({placeholder:"auto",w:200,h:"auto",btns:!1,mention:!1,updateAfterDelay:!1,markdownPreview:!1},this.options,e);this.init();this.$input=$("<"+this.editorTagName+"></"+this.editorTagName+">").val(this.val()).attr(this.editorAttributes).appendTo(this.$inner);this.origVal=this.val();this.setPlaceholder();this.setupMarkdownPreview();this.setVal();this.setWidth();this.setHeight();this.setupBtns();this.setupMention();this.setupUnsavedVal();this.render();_.defer(this.doAutoResize.bind(this));this.delegateEvents()},hasUnsavedVal:function(){return!1},unsavedVal:function(){return this.model.unsavedChanges[this.options.key]},setupUnsavedVal:function(){if(this.hasUnsavedVal()){this.$input.val(this.unsavedVal());this.edit(!0)}},focus:function(){this.$input.focus()},onFocus:function(){this.edit()},onBlur:function(){this.setVal();if(!this.options.btns){this.edit(!1);this.updateVal()}else this.valChanged()||this.edit(!1)},onKeyUp:function(e){this.updateAfterDelay();if(!this.keyEvents)return;var t=this.keyEvents[e.which];t&&this[t]&&this[t].call(this,e);this.doAutoResize()},onKeyDown:function(e){e.which==8&&this.updateAfterDelay()},onKeyPress:function(e){this.updateAfterDelay()},updateAfterDelay:function(){if(!this.options.updateAfterDelay)return;clearTimeout(this.__updateAfterDelayTimeout);this.__updateAfterDelayTimeout=setTimeout(this.onBlur.bind(this),this.options.updateAfterDelay)},doAutoResize:function(){if((this.options.autoresize||this.options.h==="auto")&&this.autoResize){this.autoResize();return!0}},setVal:function(){var e=this.val();this.$input[0].setAttribute("value",e);e?this.$el.addClass("has-value"):this.$el.removeClass("has-value")},saveBtnAction:function(){if(this.isDisabled)return;this.updateVal();this.origVal=this.newVal();this.edit(!1);this.onBlur()},cancelBtnAction:function(e){this.$input.val(this.origVal);this.edit(!1);this.onBlur();e&&e.stopPropagation()},setWidth:function(){if(!this.options.w)return;this.$inner.width(this.options.w);this.$input.width(this.options.w)},setHeight:function(){if(!this.options.h||this.editorTagName!=="textarea")return;this.$input.height(this.options.h);this.$preview&&this.$preview.height(this.options.h)},setPlaceholder:function(){var e=this.options.placeholder;if(!e)return;e==="auto"&&(e=this.keyToText());this.$input.attr("placeholder",e)},setupBtns:function(){if(!this.options.btns)return;this.$el.addClass("has-btns");this.$inner.append('<div class="btns">							<a class="button flat hover-green save icon-only icon-ok"></a>							<a class="button flat hover-red cancel icon-only icon-cancel"></a>						</div>')},setupMention:function(){if(!this.options.mention)return;if(!$.fn.mention){console.error("ModelEditor: `mention` option cannot be used as the `mention` plugin was not found.\nhttps://github.com/jakiestfu/Mention.js");return}if(!$.fn.typeahead){console.error("ModelEditor: `mention` option cannot be used as the `typeahead` plugin was not found.\nhttps://github.com/jakiestfu/Mention.js/blob/master/bootstrap-typeahead.js");return}this.$input.mention(this.options.mention)},setupMarkdownPreview:function(){if(!this.options.markdownPreview||this.editorTagName!="textarea")return;this.$preview=$('<div class="markdown-preview standard-text"></div>').appendTo(this.$inner);this.$inner.prepend('<a class="markdown-preview-btn" title="Toggle markdown preview"></a>')},edit:function(e){if(this.isDisabled)return;e===!1?this.$el.removeClass("editing"):this.$el.addClass("editing")},disable:function(){this.$input.attr("disabled",!0);return this._disable()},enable:function(){this.$input.attr("disabled",!1);return this._enable()},toggleMarkdownPreview:function(e){var t=this.newVal()||"Nothing to preview";this.$preview.html(marked(t));e.srcElement.classList.toggle("active")}});ModelEditors.date=ModelEditors.input.extend({events:{"focus input":"onFocus","keyup input":"onKeyUp","click .button.save":"saveBtnAction","click .button.cancel":"cancelBtnAction"},editorClassName:"input date",val:function(){var e=this._val();e&&e!=="-"&&(e=(new XDate(e)).toString("MM/dd/yyyy"));return e},newVal:function(){var e=this._newVal();e&&e!=="-"&&(e=(new XDate(e)).toString("MM/dd/yyyy"));return e},saveVal:function(){var e=this.newVal();if(e){if(!/^[0-1]*[0-9]\/[0-3]*[0-9]\/[0-9]{4}$/.test(e)){e=this.origVal;this.$input.val(e)}e=(new XDate(e)).toString("yyyy-MM-dd")}return e||null},render:function(){this.$input.datepicker({constrainInput:this.options.constrainInput===!1?!1:!0,dateFormat:"m/d/yy",beforeShow:_.bind(function(e,t){this.$el.addClass("datepickerOpen")},this),onClose:_.bind(function(){this.$el.removeClass("datepickerOpen");this.onBlur()},this)});var e=this.$input.data("datepicker").dpDiv[0];e.removeEventListener("click",this.stopPropagation);e.addEventListener("click",this.stopPropagation,!1)},stopPropagation:function(e){e.stopPropagation();e.cancelBubble=!0;return!1}});ModelEditors.email=ModelEditors.input.extend({editorClassName:"input email",editorAttributes:{type:"email","class":"form-control"}});ModelEditors.password=ModelEditors.input.extend({editorClassName:"input password",editorAttributes:{type:"email","class":"form-control"}});ModelEditors.textarea=ModelEditors.input.extend({editorTagName:"textarea",editorClassName:"textarea",editorAttributes:{"class":"form-control"},events:{"focus textarea":"onFocus","blur textarea":"onBlur","keyup textarea":"onKeyUp","keydown textarea":"onKeyDown","keypress textarea":"onKeyPress","click .button.save":"saveBtnAction","click .button.cancel":"cancelBtnAction","click .markdown-preview-btn":"toggleMarkdownPreview"},keyEvents:{27:"cancelBtnAction"},autoResize:function(){var e=this.$input[0];e.style.height="0";e.style.height=e.scrollHeight+"px";e.style.overflow="hidden"},onKeyDown:function(e){e.which==8&&this.updateAfterDelay();this.doAutoResize()},render:function(){_.defer(_.bind(this.doAutoResize,this))}});ModelEditors.rte=ModelEditors.textarea.extend({editorClassName:"textarea rte",events:{"blur .redactor_editor":"onBlur","focus .redactor_editor":"onFocus","focus textarea":"onFocus","keyup .redactor_editor":"onKeyUp","click .button.save":"saveBtnAction","click .button.cancel":"cancelBtnAction"},render:function(){function u(e,t,n){o.redactor.bufferSet();o.redactor.insertHtml(e);o.redactor.sync()}var e=this.options,t=["fullscreen"],n=["formatting","specialCharacters","bold","italic","fullscreen"],r=["a","p","blockquote","b","i","strong","em","h1","h2","ul","ol","li"],i=["p","blockquote"],s=!1;e.allowBR===!0&&r.push("br");switch(e.toolbar){case"nano":t=!1;n=["bold","italic"];r=["p","b","i","strong","em"];break;case"micro":t=!1;n=["specialCharacters","bold","italic"];r=["p","b","i","strong","em"];break;case"micro-br":t=!1;n=["specialCharacters","bold","italic"];r=["p","b","i","strong","em","br"];s=!0;break;case"regular":n=["formatting","specialCharacters","bold","italic","unorderedlist","orderedlist","link","alignleft","aligncenter"];break;case"mini":default:n=["formatting","specialCharacters","bold","italic","unorderedlist","orderedlist","link"]}User.can("view-html-in-rte")&&n.push("html");e.autoresize===undefined&&e.h==="auto"&&(e.autoresize=!0);var o=this;this.$input.redactor({plugins:t,paragraphy:!1,boldTag:"b",italicTag:"i",linebreaks:s,cleanSpaces:!0,buttons:n,allowedTags:r,formattingTags:i,autoresize:e.autoresize===undefined?!0:e.autoresize,buttonsCustom:{specialCharacters:{title:"Special Characters",dropdown:{"“":{title:"“ Quote Left",callback:u},"”":{title:"” Quote Right",callback:u},"‘":{title:"‘ Single Quote Left",callback:u},"’":{title:"’ Single Quote Right",callback:u},"—":{title:"— Em-Dash",callback:u},"–":{title:"— En-Dash",callback:u},"…":{title:"… Ellipsis",callback:u}}}},pasteBeforeCallback:this.onPaste.bind(this)});this.redactor=this.$input.redactor("getObject")},onPaste:function(e){return _.smartQuotes(e)},saveBtnAction:function(){this.updateVal();this.origVal=this.newVal();this.$input.val(this.origVal);this.redactor.set(this.origVal||"");this.edit(!1);this.$el.find(".redactor_editor").blur()},cancelBtnAction:function(){this.$input.val(this.origVal);this.redactor.set(this.origVal||"");this.edit(!1);this.$el.find(".redactor_editor").blur()},destroyEditor:function(){this.$input&&this.$input.destroyEditor&&this.$input.destroyEditor()},cleanup:function(){this.destroyEditor();this.cleanupSubviews();this.stopListening()}});ModelEditors.checkbox=ModelEditors.Base.extend({editorTagName:"span",editorClassName:"checkbox",events:{"click span.checkbox":"onClick"},allowEmptyState:!1,initialize:function(e){this.options=_.extend({inline:!1,valType:"bool",allowEmptyState:this.allowEmptyState},e);this.init();this.value=this.val();this.$input=$("<"+this.editorTagName+' class="checkbox"></'+this.editorTagName+">").attr("type","checkbox").addClass(this.state()).appendTo(this.$inner);this.options.inline&&this.$el.addClass("inline-checkbox");this.$el.addClass(this.state());this.render()},render:function(){return this},state:function(){switch(this.value){case"1":return"on";case"0":return"off";case"":case this.options.emptyValue:case"null":default:return"null"}},val:function(){var e=this._val();return this.options.valType==="timestamp"?e&&e.length>1?"1":"0":e===null?"null":e},newVal:function(){return this.options.valType==="timestamp"?this.value=="1"?_.timestamp():null:this.value},nextVal:function(){var e=this.value,t;e===""||e==="null"||e===this.options.emptyVal?t="1":e==="1"?t="0":this.options.allowEmptyState?t=this.options.emptyVal:t="1";return t},onClick:function(){if(this.isDisabled)return;clearTimeout(this.saveTimeout);this.$el.add(this.$input).removeClass(this.state());this.value=this.nextVal();this.$el.add(this.$input).addClass(this.state());this.$el.attr("data-val",this.saveVal());this.saveTimeout=setTimeout(_.bind(this.updateVal,this),300)}});ModelEditors.tribox=ModelEditors.checkbox.extend({allowEmptyState:!0});ModelEditors.select=ModelEditors.Base.extend({editorClassName:"select",editorAttributes:{"class":"form-control"},events:{"change select":"updateVal"},defaultOpts:{w:200,values:null},use:"value",initialize:function(e){this.options=_.extend({},this.defaultOpts,e);this.options.values&&(this.values=this.options.values);this.init();this.value=this.val()===null?"null":this.val();this.$input=this.createInput();this.addOptions();this.setWidth();this.setHeight();this.onUpdateVal();this.listenTo(this.model,"change:state",this.onUpdateVal);this.render()},createInput:function(){return $("<select></select>").appendTo(this.$inner).attr(this.editorAttributes)},addOptions:function(){if(!this.values){console.error("ModelEditor: you need to add a “values“ attribute");return}var e=_.isFunction(this.values)?this.values():this.values;_.each(e,_.bind(this.addOption,this))},addOption:function(e,t){var n=$("<option></option>");_.isObject(e)?n.val(e.val).html(e.label):n.val(this.use==="index"?t:this.optionVal(e)).html(e);this.val()==n.val()&&n.attr("selected",!0);n.appendTo(this.$input)},optionVal:function(e){return e==="-"?"":this.use==="lowercase"?e.toLowerCase():this.use==="uppercase"?e.toUpperCase():e},onUpdateVal:function(){this.$input.attr("value",this.val())},setWidth:function(){if(!this.options.w)return;this.$inner.width(this.options.w);this.$input.width(this.options.w)},setHeight:function(){},disable:function(){this._disable();this.$input.attr("disabled",!0)},enable:function(){this._enable();this.$input.attr("disabled",!1)},focus:function(){this.$input.focus()}});ModelEditors.multiselect=ModelEditors.select.extend({editorClassName:"multiselect",editorAttributes:{"class":"multiselect"},events:{"click li":"onOptionSelect",mouseleave:"onMouseLeave","a.select-all":"selectAll","a.select-none":"deselectAll"},defaultOpts:{w:200,values:null,valueType:"csv",saveDelay:2e3,infoBar:!0,dynamicHeight:!0},createInput:function(){var e=$('<div class="multiselect wrap"></div>').appendTo(this.$inner);if(this.options.infoBar===!0){e.append('<div class="bar">							<span class="info"></span>							<a class="select-none">None</a>							<a class="select-all">All</a>						</div>');this.$(".bar a.select-all").click(this.onSelectAll.bind(this));this.$(".bar a.select-none").click(this.onDeselectAll.bind(this))}var t=$("<ul></ul>").appendTo(e).attr(this.editorAttributes);return t},newVal:function(){return this.selectedVals},setInfoLabel:function(){var e=this.selectedVals.length+" Selected";this.$(".bar .info").html(e)},addOptions:function(){if(!this.values){console.error("ModelEditor: you need to add a “values“ attribute");return}this.selectedVals=[];var e=_.isFunction(this.values)?this.values():this.values;_.each(e,_.bind(this.addOption,this));this.setInfoLabel()},addOption:function(e,t){var n=$("<li></li>");if(_.isObject(e)){if(e.val==="-"||e.val===""||e.val==="0")return;n.attr("data-val",e.val).html(e.label)}else n.attr("data-val",this.use==="index"?t:this.optionVal(e)).html(e);if(_.contains(this.val(),n.attr("data-val"))){n.addClass("selected");this.selectedVals=this.selectedVals||[];this.selectedVals.push(n.attr("data-val"))}n.appendTo(this.$input)},onOptionSelect:function(e){clearTimeout(this.saveTimeout);this.saveTimeout=null;var t=e.currentTarget,n=t.dataset.val,r=_.indexOf(this.selectedVals,n);if(r>-1)if(_.metaKey()&&this.selectedVals.length>1){this.deselectAll();this.select(n)}else this.deselect(n);else if(!_.metaKey())this.select(n);else{this.deselectAll();this.select(n)}this.setInfoLabel();this.saveTimeout=setTimeout(this.doSave.bind(this),this.options.saveDelay)},onSelectAll:function(){this.selectAll();this.setInfoLabel();this.saveTimeout=setTimeout(this.doSave.bind(this),this.options.saveDelay)},onDeselectAll:function(){this.deselectAll();this.setInfoLabel();this.saveTimeout=setTimeout(this.doSave.bind(this),this.options.saveDelay)},onMouseLeave:function(){this.saveTimeout&&this.doSave()},doSave:function(){clearTimeout(this.saveTimeout);this.saveTimeout=null;this.updateVal();this.setInfoLabel()},select:function(e){this._select(null,this.$input.find('[data-val="'+e+'"]')[0])},deselect:function(e){this._deselect(null,this.$input.find('[data-val="'+e+'"]')[0])},selectAll:function(){this.$input.find("li").each(this._select.bind(this))},deselectAll:function(){this.$input.find("li").each(this._deselect.bind(this))},_select:function(e,t){t.classList.add("selected");_.indexOf(this.selectedVals,t.dataset.val)==-1&&this.selectedVals.push(t.dataset.val)},_deselect:function(e,t){t.classList.remove("selected");this.selectedVals.splice(_.indexOf(this.selectedVals,t.dataset.val),1)},setWidth:function(){if(!this.options.w)return;this.$inner.width(this.options.w)},setHeight:function(){this.options.h&&this.$input.css(this.options.dynamicHeight?"maxHeight":"height",this.options.h)}});ModelEditors.selectMonth=ModelEditors.select.extend({values:function(){return lookup.selects.monthsOfYear.asSelect()}});ModelEditors.selectUser=ModelEditors.select.extend({values:function(){return Users.map(function(e){return{val:e.id,label:e.name()}})}});ModelEditors.selectPartner=ModelEditors.select.extend({values:function(){return[{label:"-",val:null}].concat(Partners.map(function(e){return{val:e.id,label:e.get("name")}}))}});ModelEditors.selectPartnerDeal=ModelEditors.select.extend({values:function(){return[{label:"-",val:null}].concat(Deals.toSelectID(function(e){return e.label()}))}});ModelEditors.selectGender=ModelEditors.select.extend({values:[{label:"-",val:""},{label:"Male",val:"M"},{label:"Female",val:"F"}]});ModelEditors.selectYesNo=ModelEditors.select.extend({values:[{label:"-",val:""},{label:"Yes",val:"1"},{label:"No",val:"0"}]});ModelEditors.selectBookEdition=ModelEditors.select.extend({values:function(){return lookup.selects.bookBookEdition.asSelect()}});ModelEditors.selectBookLanguage=ModelEditors.select.extend({values:["English","French","German","Jamaican","Marathi","Spanish","Italian","Arabic","Chinese","Japanese","Russian","Greek","Portuguese","Dutch","Turkish","Polish","Cantonese"]});ModelEditors.bookState=ModelEditors.select.extend({values:["-","On Sale","In Process","Re-request","Re-release","Cancelled"]});ModelEditors.acquisitionState=ModelEditors.select.extend({values:function(){return lookup.selects.dealAcquisitionState.asSelect()}});ModelEditors.selectProductReleaseType=ModelEditors.select.extend({values:function(){return ProductReleaseTypes.map(function(e){return{val:e.id,label:e.get("name")}})}});ModelEditors.selectBookChannel=ModelEditors.select.extend({values:function(){return lookup.collections.channels.map(function(e){return{val:e.id,label:e.get("name")}})}});ModelEditors.selectBookAllProduct=ModelEditors.select.extend({values:function(){return lookup.collections.products.map(function(e){return{val:e.id,label:e.get("label")}})}});ModelEditors.selectBookArchivedProduct=ModelEditors.select.extend({values:function(){return _.map(lookup.collections.products.archived(),function(e){return{val:e.id,label:e.get("label")}})}});ModelEditors.selectBookActiveProduct=ModelEditors.select.extend({values:function(){return _.map(lookup.collections.products.active(),function(e){return{val:e.id,label:e.get("label")}})}});ModelEditors.selectTargetAudience=ModelEditors.select.extend({values:["Adult","Young Adult (12-17)","Children (10-12)","Children (6-9)","Children (3-5)"]});ModelEditors.selectMovieTieIn=ModelEditors.select.extend({values:function(){return lookup.selects.marketingMovieTieIn.asSelect()}});ModelEditors.selectContractStatus=ModelEditors.select.extend({values:function(){return lookup.selects.contractContractStatus.asSelect()}});ModelEditors.selectContractState=ModelEditors.select.extend({values:function(){return lookup.selects.contractContractState.asSelect()}});ModelEditors.selectContractDealTypeID=ModelEditors.select.extend({values:function(){return lookup.selects.contractDealTypeID.asSelect()}});ModelEditors.selectPurchasedBy=ModelEditors.select.extend({values:function(){var e=_.map(_.sortBy(lookup.collections.purchasers.models,function(e){return e.get("name")}),function(e){return{label:e.get("name"),val:e.get("user_id")}});return[{label:"-"}].concat(e)}});ModelEditors.selectContractCopyBy=ModelEditors.select.extend({values:function(){return lookup.selects.contractCopyBy.asSelect()}});ModelEditors.selectContractStateJurisdiction=ModelEditors.select.extend({values:function(){return lookup.selects.contractStateJurisdiction.asSelect()}});ModelEditors.selectContractTerritoryType=ModelEditors.select.extend({values:function(){return lookup.selects.contractTerritoryType.asSelect()}});ModelEditors.selectContractTerritoryLanguage=ModelEditors.select.extend({values:function(){return lookup.selects.contractTerritoryLanguage.asSelect()}});ModelEditors.selectContractWhoPreparesContractID=ModelEditors.select.extend({values:function(){return lookup.selects.contractWhoPreparesContractID.asSelect()}});ModelEditors.selectMastersSourcedFrom=ModelEditors.select.extend({values:function(){return lookup.selects.contractMastersSourcedFrom.asSelect()}});ModelEditors.selectProducer=ModelEditors.select.extend({values:["-","BSA","RI","UK"]});ModelEditors.selectContractTermBeginsOn=ModelEditors.select.extend({values:function(){return lookup.selects.contractTermBeginsOn.asSelect()}});ModelEditors.selectContractTermLengthType=ModelEditors.select.extend({values:function(){return lookup.selects.contractTermLengthType.asSelect()}});ModelEditors.selectContractDealTermType=ModelEditors.select.extend({values:function(){return lookup.selects.contractDealTermType.asSelect()}});ModelEditors.selectContractRoyaltyPaymentTerm=ModelEditors.select.extend({values:function(){return lookup.selects.contractRoyaltyPaymentTerm.asSelect()}});ModelEditors.selectContractRoyaltyReportingPeriod=ModelEditors.select.extend({values:function(){return lookup.selects.contractRoyaltyReportingPeriod.asSelect()}});ModelEditors.selectContractRoyaltyTypeOrProduct=ModelEditors.select.extend({values:function(){return lookup.selects.contractRoyaltyTypeOrProduct.asSelect()}});ModelEditors.selectContractFeeDueOn=ModelEditors.select.extend({values:function(){return lookup.selects.contractFeeDueOn.asSelect()}});ModelEditors.selectContractRoyaltyPaymentBasis=ModelEditors.select.extend({values:function(){return lookup.selects.contractRoyaltyPaymentBasis.asSelect()}});ModelEditors.selectContractFeeType=ModelEditors.select.extend({values:function(){return lookup.selects.contractFeeType.asSelect()}});ModelEditors.selectContractRoyaltyMarket=ModelEditors.select.extend({values:function(){return lookup.selects.contractRoyaltyMarket.asSelect()}});ModelEditors.selectContractRoyaltyModifier=ModelEditors.select.extend({values:function(){return lookup.selects.contractRoyaltyModifier.asSelect()}});ModelEditors.selectPresetDates=ModelEditors.select.extend({values:function(){return lookup.selects.presetDates.asSelect()}});ModelEditors.contractContactTags=ModelEditors.select.extend({values:function(){return lookup.selects.contractContactTags.asSelect()}});ModelEditors.selectBookCategory=ModelEditors.select.extend({values:function(){return lookup.selects.bookCategory.asSelect()}});ModelEditors.selectRoyaltyCalculationSystem=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"Acumen",val:"Acumen"},{label:"Magento",val:"Magento"}]});ModelEditors.selectImprintPartner=ModelEditors.select.extend({values:function(){return Partners.toSelectImprints()}});ModelEditors.selectImageType=ModelEditors.select.extend({values:[{label:"JPEG",val:"jpeg"},{label:"PNG",val:"png"}]});ModelEditors.selectImageDownloaderDataType=ModelEditors.select.extend({values:[{label:"ISBN",val:"isbn_13"},{label:"Book ID",val:"book_id"}]});ModelEditors.selectAutoRenewOptions=ModelEditors.select.extend({values:[{label:"No auto renewal",val:0},{label:"No auto renewal, BSA has first option to renew",val:3},{label:"Auto renew with term guarantee",val:1},{label:"Auto renew with no term guarantee",val:2}]});ModelEditors.selectAutoRenewIncrement=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"6 months",val:"6 months"},{label:"1 year",val:"1 year"},{label:"2 years",val:"2 years"}]});ModelEditors.selectRenewalFirstOptionIncrement=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"30 days",val:"30"},{label:"60 days",val:"60"},{label:"90 days",val:"90"}]});ModelEditors.selectContractAssignability=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"Approval Not Required",val:1},{label:"​Approval Not Required for Ordinary Course of Business",val:2},{label:"Approval Not Required for Ordinary Course of Business (Sales/Mergers allowed)",val:3},{label:"Approval Required (Sales/Mergers allowed)",val:4},{label:"Approval Required",val:5}]});ModelEditors.selectProductionPaymentType=ModelEditors.select.extend({values:[{label:"Contact (company)",val:1},{label:"​Person",val:2}]});ModelEditors.selectProductionPaymentAssortedCostFee=ModelEditors.select.extend({values:[{label:"Manuscript Fees",val:"0"},{label:"​Studio Costs",val:"​1"}]});ModelEditors.selectContractRemainderDuration=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"6 months",val:"6 months"},{label:"​12 months",val:"12 months"},{label:"​18 months",val
:"18 months"},{label:"​Not specified",val:"Not specified"},{label:"Termination",val:"Termination"}]});ModelEditors.selectContractRemainderFinancialObligation=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"10% of all money recieved after cost",val:"10% of all money recieved after cost"},{label:"10% of all money recieved",val:"10% of all money recieved"},{label:"Other",val:"Other"}]});ModelEditors.selectRecordingProducer=ModelEditors.select.extend({values:[{label:"-",val:null},{label:"BSA",val:"BSA"},{label:"RI",val:"RI"}]});ModelEditors.selectDealTerritoryChoice=ModelEditors.select.extend({use:"lowercase",values:["-","Inherit","Assign"]});