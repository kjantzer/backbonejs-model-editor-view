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
*/

var ModelEditor = Backbone.View.extend({
	
	initialize: function(opts){
		
		if(!opts || !opts.model){
			console.error('ModelEditor requires a “model” to be given.');
			return;
		}
		
		this.options = _.extend({
			modelType: 'Backbone.Model', 	// use "auto" to make "editmodel" the same type as the given model
			autoSave: false,				// auto save real model when editor model changes?
			saveToDB: !this.model.isNew(),	// SAVE to db, or just SET data
			patchSave: false,				// save with "PATCH" rather than PUT
			defaultOpts: {}					// default ops for each editor // see base
		},opts)
		
		// create a clone of the model as "edit model" - this is where we store our pending changes
		this.editmodel = this.createEditModel();
		this.reset();
		
		// set default opts
		this.defaultOpts('reset');
		
		// reset the ModelEditor
		this.setModel(this.model);
		
		// disabling for now, this causes issues with the RTE; it was only added as a cool feature, but not required
		this.editmodel.on('edited', this.rememberChanges, this);
		
		// if btns, set auto save to true since model won't save unless save btn is clicked
		if(this.options.defaultOpts.btns)
			this.options.autoSave = true;
		
		// if auto save is activated, then save the model whenever the temporary "editmodel" changes
		this.autoSave( this.options.autoSave )
		
	},

	setModel: function(model){
		this.stopListening(this.model);
		this.model = model;
		//this.listenTo(this.model, 'all',function(){console.log(arguments)});
		this.listenTo(this.model, 'change', this.cleanReset);
		this.listenTo(this.model, 'reset', this.cleanup);
		this.listenTo(this.model, 'sync', this.onSync);
		this.reset();
	},
	
	createEditModel: function(){
		var modelType = this.options.modelType;
		
		if( modelType === 'auto' && this.model.collection )
			modelType = this.model.collection.model;
		else if(_.getObjectByName)
			modelType = _.getObjectByName(modelType);
		else
			modelType = Backbone.Model;
		
		return new modelType(this.model.toJSON());
	},
	
	autoSave: function(doAutoSave){
	
		this.editmodel.off('change', this.save, this);
	
		if( doAutoSave !== false )
			this.editmodel.on('change', this.save, this);
		
	},
	
	setEditorAttr: function(key, val){
		this.editmodel.set(key, val);
		this.rememberChanges(key, val, true);
	},
	
	rememberChanges: function(key, val, isChanged){
		
		var unsavedChanges = this.model._unsavedChanges || {};
		
		if( isChanged )
			unsavedChanges[key] = val;
		
		else if( this.options.autoSave )
			delete unsavedChanges[key];
			
		this.model._unsavedChanges = _.size(unsavedChanges) > 0 ? unsavedChanges : null;
	},

	hasUnsavedChanges: function(){
		return _.size( this.data() ) > 0
	},
	
	render: function(){
		this.trigger('render');
		return this;
	},
	
	cleanReset: function(){
		this.reset();
		return this;
	},
	
	reset: function(resetData){
		this.editmodel.clear({silent:true})
		this.editmodel.set(resetData||this.model.toJSON(), {silent:true});
		this.editmodel.unsavedChanges = this.model._unsavedChanges || {};
		
		// reset currentAttributes which usually only happens on model creation
		// https://cdn.rawgit.com/jashkenas/backbone/0.9.9/docs/backbone.html#section-28
		// we are doing this so `watchChanges` works properly.
		this.editmodel._currentAttributes = _.clone(this.editmodel.attributes);
		
		return this;
	},
	
	cleanup: function(){
		Backbone.View.prototype.cleanup.apply(this, arguments);
		this.clearSubviews();
		return this;
	},
	
	defaultOpts: function(opts){
		if( opts === 'reset' )
			this._defaultOpts = _.extend({},this.options.defaultOpts, {renderTo:this.$el});
		else
			this._defaultOpts = _.extend({},this._defaultOpts||{}, opts || {});
			
		return this;
	},
	
/*
	Data - return queued up edit model data
*/
	data: function(){
		//return this.options.patchSave ? this.editmodel.changedAttributes() : this.editmodel.toJSON();
		return this.options.patchSave
				? this.model.changedAttributes(this.model._unsavedChanges)
				: this.editmodel.toJSON();
		//return this.editmodel.toJSON();
		//return this.editmodel.changedAttributes(); // I guess we should always just return the changed data, not the whole thing; affected creating bug issue
	},
	
/*
	Save - saves the real model
*/
	save: function(doSave, opts){

		var retry = this.save.bind(this, doSave, opts);

		opts = opts || {};

		var errorFn = opts.error;
		opts.error = function(model, xhr){
			if( errorFn ) errorFn()
			this._onError.call(this, model, xhr, retry)
		}.bind(this);

		if( this.options.patchSave )
			opts.patch = true;

		if(this.options.saveToDB || doSave===true){
			this.model.save(this.data(), opts);
			this.model._unsavedChanges = null;
		
		}else{
			this.model.set(this.data(), opts);
		}

		if( this.options.onSave )
			this.options.onSave(this.model);
	},

	_onError: function(model, xhr, retry){
		xhr.retry = {title: 'Retry Save?', fn: retry};
	},
	
	onSync: function(model){
		this.editmodel.trigger('changed');
	},
	
	insert: function(type, key, opts){
		
		if( !ModelEditors[type] ){
			console.error('ModelEditor: there is no editor called “'+type+'”. Available editors:', ModelEditors);
			return;
		}
		
		var view = new ModelEditors[type](_.extend({
			key:key,
			model: this.editmodel,
			renderTo: this.$el
		}, this._defaultOpts, opts));
		
		if( this.subview(key) ) console.warn('Editor for “'+key+'” already exists.');

		this.subview(key, view);

		return view;
	}
	
});



/*
	Model Editors: Inputs, Textareas, Checkbox, etc
	
	each editor is saved as it's own file. CodeKit app automatically
	compiles them all together along with this file and saves it as
	"ModelEditor-final.js".
	
	Documentation:
	http://incident57.com/codekit/help.php#help-imports
	
	Don't know what CodeKit is? Well you should. It'll make your Web development
	life so much easier. Check it out: http://incident57.com/codekit/
	
	Unfortantley, this is a Mac app only. If you are windows user, get a Mac ;)
	Just kidding. But after you edit a Model Editor file you will need to copy the contents
	and replace the old code in ModelEditor-final.js
	
*/
var ModelEditors = {};
// @codekit-append 'Base.js'
// @codekit-append 'Input.js'
// @codekit-append 'RTE.js'
// @codekit-append 'Checkbox.js'
// @codekit-append 'Select.js'



