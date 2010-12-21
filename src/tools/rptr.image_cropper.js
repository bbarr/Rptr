(function() {
	
	var util = {
		
		get_absolute_x : function(el) {
			
			var x = el.offsetLeft,
				parent;
			
			while (parent = x.offsetParent) {
				x += parent.offsetLeft;
			}

			return x;
		},
		
		get_absolute_y : function(el) {
			
			var y = el.offsetTop,
				parent;
			
			while (parent = y.offsetParent) {
				y += parent.offsetTop;
			}
			
			return y;
		}
	};
	
	var ImageCropper = function(image) {
		
		this.image = image;
		
		this.container = this.image.parentNode;
		this.container.style.position = 'relative';
		
		this.x = util.get_absolute_x(this.container);
		this.y = util.get_absolute_y(this.container);
		
		this.measurement = new Measurement(image, this);
		this.container.appendChild(this.measurement.backdrop);
		this.container.appendChild(this.measurement.el);
		this.container.appendChild(this.measurement.resizer);
	
		var _this = this;
		rptr.subscribe([this.image, this.measurement.backdrop, this.measurement.el, this.measurement.resizer], 'mousedown', function(e) {
			e.preventDefault();
			_this.measurement.start(e);
		});
		
		rptr.subscribe([this.image, this.measurement.backdrop, this.measurement.el, this.measurement.resizer], 'mousemove', function(e) {
			e.preventDefault();
			_this.measurement.adjust(e);
		});
		
		rptr.subscribe([this.image, this.measurement.backdrop, this.measurement.el, this.measurement.resizer], 'mouseup', function(e) {
			e.preventDefault();
			_this.measurement.stop(e);
		});
		
		console.log(this);
	}
	
	ImageCropper.prototype = {
		crop : function() {
			
		}
	}
	
	var Measurement = function(image, cropper) {
		
		this.cropper = cropper;
		
		this.el = rptr.build('div', {
			style : {
				'background-image' : 'url(' + image.src + ')',
				position: 'absolute'
			},
			'class' : 'hide'
		});
		
		this.backdrop = rptr.build('div', {
			style : {
				top : 0,
				right : 0,
				bottom : 0,
				left : 0,
				position : 'absolute',
				background : '#000',
				opacity : '.3'
			},
			'class' : 'hide'
		});
		
		this.resizer = rptr.build('span', {
			style : {
				position : 'absolute',
				width : '10px',
				height : '10px',
				background : 'red'
			},
			'class' : 'hide'
		});
		
		this.active = false;
		this.resizing = false;
		this.dragging = false;
		
		this.relative_x = 0;
		this.relative_y = 0;
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}
	
	Measurement.prototype = {
		
		/** PUBLIC METHODS, ATTACHED TO EVENTS */
		
		/**
		 *  This is called on mousedown.. decides what new state should be initiated
		 *
		 *  @param {Object} e - click event
		 **/
		start : function(e) {
			
			this.relative_x = e.x - this.cropper.x;
			this.relative_y = e.y - this.cropper.y;
			
			if (!this.active) {
				this._update_position();
				this._show();
				this.active = true;
				this.resizing = true;
			}
			else {
				if (this.relative_x >= this.x && this.relative_x <= (this.x + this.width) && this.relative_y >= this.y && this.relative_y <= (this.y + this.height)) {
					
					this.drag_offset_x = this.relative_x - this.x;
					this.drag_offset_y = this.relative_y - this.y;
					
					if (e.target.tagName === 'SPAN') {
						this.resizing = true;
					}
					else {
						this.dragging = true;	
					}
				}
				else {
					this.clear();
					this.start(e);
				}
			}
			
		},
		
		/**
		 *  This is called on mouseup.. freezes the measurement wherever it is
		 *
		 *  @param {Object} e - click event
		 */
		stop : function(e) {
			this.resizing = this.dragging = false;
			if (this.width === 0 || this.height === 0) this.clear();
		},
		
		/**
		 *  This is called on mousemove.. calls the correct type of adjustment
		 */
		adjust : function(e) {
			
			if (!this.active) return;
			
			this.relative_x = e.x - this.cropper.x;
			this.relative_y = e.y - this.cropper.y;

			if (this.resizing) {
				this._resize(e);
			}
			else if (this.dragging) {
				this._drag(e);
			}
		},
		
		/**
		 *  This cancels the current measurement entirely.. returns to initial state
		 */
		clear : function() {
			this._hide();
			this.active = false;
			this.resizing = false;
			this.dragging = false;
			this._update_position(0, 0);
			this._update_dimensions(0, 0);
		},
		
		/** PRIVATE METHODS, USED INTERNALLY */
		
		/**
		 *  This resizes measurement
		 */
		_resize : function(e) {
			
			if (this.relative_x < this.x || this.relative_y < this.y) return;
			
			this._update_dimensions();
		},
		
		/**
		 *  This drags measurement
		 */
		_drag : function(e) {
			
			this.relative_x = e.x - this.drag_offset_x;
			this.relative_y = e.y - this.drag_offset_y;
			
			if (this.relative_x < this.cropper.x || this.relative_y < this.cropper.x) return;
			
			if ((this.relative_x + this.width) > (this.cropper.image.scrollWidth + this.cropper.x)) return;

			this._update_position();
		},
		
		/**
		 * This shows the measurement and its backdrop
		 */
		_show : function() {
			rptr.remove_class('hide', this.el);
			rptr.remove_class('hide', this.backdrop);
			rptr.remove_class('hide', this.resizer);
		},
		
		/**
		 * This hides the measurement and its backdrop
		 */
		_hide : function() {
			rptr.add_class('hide', this.el);
			rptr.add_class('hide', this.backdrop);
			rptr.add_class('hide', this.resizer);
		},
		
		_update_position : function(x, y) {
			
			this.x = x || this.relative_x;
			this.y = y || this.relative_y;
			
			this.el.style.top = this.y + 'px';
			this.el.style.left = this.x + 'px';
			
			this.el.style.backgroundPosition = '-' + this.x + 'px -' + this.y + 'px';
			
			this.resizer.style.top = (this.y + this.height - 10) + 'px';
			this.resizer.style.left = (this.x + this.width - 10) + 'px';
		},
		
		_update_dimensions : function(x, y) {
			
			this.width = (x || this.relative_x) - this.x;
			this.height = (y || this.relative_y) - this.y;
			
			this.el.style.width = this.width + 'px';
			this.el.style.height = this.height + 'px';
			
			this.resizer.style.top = (this.y + this.height - 10) + 'px';
			this.resizer.style.left = (this.x + this.width - 10) + 'px';
		}
	}
	
	// attach to rptr.tools
	rptr.tool('ImageCropper', ImageCropper);
})();