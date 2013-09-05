/*
	Tribox - checkbox with 3 states: unset, off, on
	
	pass "allowEmptyState:false" to make it a normal 2 state checkbox
*/

ModelEditors.checkbox = ModelEditors.Base.extend({

	editorTagName: 'span',
	
	editorClassName: 'checkbox',
	
	events: {
		'click span.checkbox' : 'onClick'
	},
	
	allowEmptyState: false,
	
	initialize: function(opts){
	
		this.options = _.extend({
			inline: false,
			allowEmptyState: this.allowEmptyState,	// can a user make it the null/empty state
		},opts);
		
		this.init(); // init base
		
		this.value = this.val() === null ? 'null' : this.val();
		
		this.$input = $('<'+this.editorTagName+' class="checkbox"></'+this.editorTagName+'>')
			.attr('type', 'checkbox')
			.addClass(this.state())
			.appendTo(this.$inner)
		
		if(this.options.inline)
			this.$el.addClass('inline-checkbox');
		
		this.$el.addClass(this.state());
		
		this.render();
	},
	
	render: function(){	
		return this;
	},
	
	state: function(){
		switch(this.value){
			case '1': return 'on'; break;
			case '0': return 'off'; break;
			
			case '':
			case this.options.emptyValue:
			case 'null':
			default:
				return 'null'; break;
		}
	},
	
	val: function(){ 
		var val = this._val()
		return  val === null ? 'null' : val;
	},
	
	newVal: function(){
		return this.value;
	},
	
	nextVal: function(){
		
		var val = this.value, newVal;
		
		if(val === '' || val === 'null' || val === this.options.emptyVal) 
			newVal = '1';
		else if(val === '1')
			newVal = '0';
		else if(this.options.allowEmptyState)
			newVal = this.options.emptyVal;
		else
			newVal = '1';
		
		return newVal;
	},
	
	onClick: function(){
	
		if( this.isDisabled ) return
		
		clearTimeout(this.saveTimeout);
		
		// remove current state class
		this.$el.add(this.$input).removeClass( this.state() );
		
		// update value
		this.value = this.nextVal();
		
		// add new state class
		this.$el.add(this.$input).addClass( this.state() );
		
		
		// delay the save function by 500ms to see if the user clicks the input again
		this.saveTimeout = setTimeout(_.bind(this.updateVal,this),300);
		
	}

});


ModelEditors.tribox = ModelEditors.checkbox.extend({
	allowEmptyState: true
})