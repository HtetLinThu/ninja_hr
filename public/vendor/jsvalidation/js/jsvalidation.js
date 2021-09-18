/*!
 * jQuery Validation Plugin v1.19.3
 *
 * https://jqueryvalidation.org/
 *
 * Copyright (c) 2021 Jörn Zaefferer
 * Released under the MIT license
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

$.extend( $.fn, {

	// https://jqueryvalidation.org/validate/
	validate: function( options ) {

		// If nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			if ( options && options.debug && window.console ) {
				console.warn( "Nothing selected, can't validate, returning nothing." );
			}
			return;
		}

		// Check if a validator for this form was already created
		var validator = $.data( this[ 0 ], "validator" );
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr( "novalidate", "novalidate" );

		validator = new $.validator( options, this[ 0 ] );
		$.data( this[ 0 ], "validator", validator );

		if ( validator.settings.onsubmit ) {

			this.on( "click.validate", ":submit", function( event ) {

				// Track the used submit button to properly handle scripted
				// submits later.
				validator.submitButton = event.currentTarget;

				// Allow suppressing validation by adding a cancel class to the submit button
				if ( $( this ).hasClass( "cancel" ) ) {
					validator.cancelSubmit = true;
				}

				// Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
				if ( $( this ).attr( "formnovalidate" ) !== undefined ) {
					validator.cancelSubmit = true;
				}
			} );

			// Validate the form on submit
			this.on( "submit.validate", function( event ) {
				if ( validator.settings.debug ) {

					// Prevent form submit to be able to see console output
					event.preventDefault();
				}

				function handle() {
					var hidden, result;

					// Insert a hidden input as a replacement for the missing submit button
					// The hidden input is inserted in two cases:
					//   - A user defined a `submitHandler`
					//   - There was a pending request due to `remote` method and `stopRequest()`
					//     was called to submit the form in case it's valid
					if ( validator.submitButton && ( validator.settings.submitHandler || validator.formSubmitted ) ) {
						hidden = $( "<input type='hidden'/>" )
							.attr( "name", validator.submitButton.name )
							.val( $( validator.submitButton ).val() )
							.appendTo( validator.currentForm );
					}

					if ( validator.settings.submitHandler && !validator.settings.debug ) {
						result = validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if ( hidden ) {

							// And clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						if ( result !== undefined ) {
							return result;
						}
						return false;
					}
					return true;
				}

				// Prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			} );
		}

		return validator;
	},

	// https://jqueryvalidation.org/valid/
	valid: function() {
		var valid, validator, errorList;

		if ( $( this[ 0 ] ).is( "form" ) ) {
			valid = this.validate().form();
		} else {
			errorList = [];
			valid = true;
			validator = $( this[ 0 ].form ).validate();
			this.each( function() {
				valid = validator.element( this ) && valid;
				if ( !valid ) {
					errorList = errorList.concat( validator.errorList );
				}
			} );
			validator.errorList = errorList;
		}
		return valid;
	},

	// https://jqueryvalidation.org/rules/
	rules: function( command, argument ) {
		var element = this[ 0 ],
			isContentEditable = typeof this.attr( "contenteditable" ) !== "undefined" && this.attr( "contenteditable" ) !== "false",
			settings, staticRules, existingRules, data, param, filtered;

		// If nothing is selected, return empty object; can't chain anyway
		if ( element == null ) {
			return;
		}

		if ( !element.form && isContentEditable ) {
			element.form = this.closest( "form" )[ 0 ];
			element.name = this.attr( "name" );
		}

		if ( element.form == null ) {
			return;
		}

		if ( command ) {
			settings = $.data( element.form, "validator" ).settings;
			staticRules = settings.rules;
			existingRules = $.validator.staticRules( element );
			switch ( command ) {
			case "add":
				$.extend( existingRules, $.validator.normalizeRule( argument ) );

				// Remove messages from rules, but allow them to be set separately
				delete existingRules.messages;
				staticRules[ element.name ] = existingRules;
				if ( argument.messages ) {
					settings.messages[ element.name ] = $.extend( settings.messages[ element.name ], argument.messages );
				}
				break;
			case "remove":
				if ( !argument ) {
					delete staticRules[ element.name ];
					return existingRules;
				}
				filtered = {};
				$.each( argument.split( /\s/ ), function( index, method ) {
					filtered[ method ] = existingRules[ method ];
					delete existingRules[ method ];
				} );
				return filtered;
			}
		}

		data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.classRules( element ),
			$.validator.attributeRules( element ),
			$.validator.dataRules( element ),
			$.validator.staticRules( element )
		), element );

		// Make sure required is at front
		if ( data.required ) {
			param = data.required;
			delete data.required;
			data = $.extend( { required: param }, data );
		}

		// Make sure remote is at back
		if ( data.remote ) {
			param = data.remote;
			delete data.remote;
			data = $.extend( data, { remote: param } );
		}

		return data;
	}
} );

// JQuery trim is deprecated, provide a trim method based on String.prototype.trim
var trim = function( str ) {

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim#Polyfill
	return str.replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "" );
};

// Custom selectors
$.extend( $.expr.pseudos || $.expr[ ":" ], {		// '|| $.expr[ ":" ]' here enables backwards compatibility to jQuery 1.7. Can be removed when dropping jQ 1.7.x support

	// https://jqueryvalidation.org/blank-selector/
	blank: function( a ) {
		return !trim( "" + $( a ).val() );
	},

	// https://jqueryvalidation.org/filled-selector/
	filled: function( a ) {
		var val = $( a ).val();
		return val !== null && !!trim( "" + val );
	},

	// https://jqueryvalidation.org/unchecked-selector/
	unchecked: function( a ) {
		return !$( a ).prop( "checked" );
	}
} );

// Constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

// https://jqueryvalidation.org/jQuery.validator.format/
$.validator.format = function( source, params ) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray( arguments );
			args.unshift( source );
			return $.validator.format.apply( this, args );
		};
	}
	if ( params === undefined ) {
		return source;
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray( arguments ).slice( 1 );
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each( params, function( i, n ) {
		source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
			return n;
		} );
	} );
	return source;
};

$.extend( $.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		pendingClass: "pending",
		validClass: "valid",
		errorElement: "label",
		focusCleanup: false,
		focusInvalid: true,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function( element ) {
			this.lastActive = element;

			// Hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.hideThese( this.errorsFor( element ) );
			}
		},
		onfocusout: function( element ) {
			if ( !this.checkable( element ) && ( element.name in this.submitted || !this.optional( element ) ) ) {
				this.element( element );
			}
		},
		onkeyup: function( element, event ) {

			// Avoid revalidate the field when pressing one of the following keys
			// Shift       => 16
			// Ctrl        => 17
			// Alt         => 18
			// Caps lock   => 20
			// End         => 35
			// Home        => 36
			// Left arrow  => 37
			// Up arrow    => 38
			// Right arrow => 39
			// Down arrow  => 40
			// Insert      => 45
			// Num lock    => 144
			// AltGr key   => 225
			var excludedKeys = [
				16, 17, 18, 20, 35, 36, 37,
				38, 39, 40, 45, 144, 225
			];

			if ( event.which === 9 && this.elementValue( element ) === "" || $.inArray( event.keyCode, excludedKeys ) !== -1 ) {
				return;
			} else if ( element.name in this.submitted || element.name in this.invalid ) {
				this.element( element );
			}
		},
		onclick: function( element ) {

			// Click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element( element );

			// Or option elements, check parent select in that case
			} else if ( element.parentNode.name in this.submitted ) {
				this.element( element.parentNode );
			}
		},
		highlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
			} else {
				$( element ).addClass( errorClass ).removeClass( validClass );
			}
		},
		unhighlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
			} else {
				$( element ).removeClass( errorClass ).addClass( validClass );
			}
		}
	},

	// https://jqueryvalidation.org/jQuery.validator.setDefaults/
	setDefaults: function( settings ) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format( "Please enter no more than {0} characters." ),
		minlength: $.validator.format( "Please enter at least {0} characters." ),
		rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
		range: $.validator.format( "Please enter a value between {0} and {1}." ),
		max: $.validator.format( "Please enter a value less than or equal to {0}." ),
		min: $.validator.format( "Please enter a value greater than or equal to {0}." ),
		step: $.validator.format( "Please enter a multiple of {0}." )
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $( this.settings.errorLabelContainer );
			this.errorContext = this.labelContainer.length && this.labelContainer || $( this.currentForm );
			this.containers = $( this.settings.errorContainer ).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var currentForm = this.currentForm,
				groups = ( this.groups = {} ),
				rules;
			$.each( this.settings.groups, function( key, value ) {
				if ( typeof value === "string" ) {
					value = value.split( /\s/ );
				}
				$.each( value, function( index, name ) {
					groups[ name ] = key;
				} );
			} );
			rules = this.settings.rules;
			$.each( rules, function( key, value ) {
				rules[ key ] = $.validator.normalizeRule( value );
			} );

			function delegate( event ) {
				var isContentEditable = typeof $( this ).attr( "contenteditable" ) !== "undefined" && $( this ).attr( "contenteditable" ) !== "false";

				// Set form expando on contenteditable
				if ( !this.form && isContentEditable ) {
					this.form = $( this ).closest( "form" )[ 0 ];
					this.name = $( this ).attr( "name" );
				}

				// Ignore the element if it belongs to another form. This will happen mainly
				// when setting the `form` attribute of an input to the id of another form.
				if ( currentForm !== this.form ) {
					return;
				}

				var validator = $.data( this.form, "validator" ),
					eventType = "on" + event.type.replace( /^validate/, "" ),
					settings = validator.settings;
				if ( settings[ eventType ] && !$( this ).is( settings.ignore ) ) {
					settings[ eventType ].call( validator, this, event );
				}
			}

			$( this.currentForm )
				.on( "focusin.validate focusout.validate keyup.validate",
					":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
					"[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
					"[type='radio'], [type='checkbox'], [contenteditable], [type='button']", delegate )

				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on( "click.validate", "select, option, [type='radio'], [type='checkbox']", delegate );

			if ( this.settings.invalidHandler ) {
				$( this.currentForm ).on( "invalid-form.validate", this.settings.invalidHandler );
			}
		},

		// https://jqueryvalidation.org/Validator.form/
		form: function() {
			this.checkForm();
			$.extend( this.submitted, this.errorMap );
			this.invalid = $.extend( {}, this.errorMap );
			if ( !this.valid() ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = ( this.currentElements = this.elements() ); elements[ i ]; i++ ) {
				this.check( elements[ i ] );
			}
			return this.valid();
		},

		// https://jqueryvalidation.org/Validator.element/
		element: function( element ) {
			var cleanElement = this.clean( element ),
				checkElement = this.validationTargetFor( cleanElement ),
				v = this,
				result = true,
				rs, group;

			if ( checkElement === undefined ) {
				delete this.invalid[ cleanElement.name ];
			} else {
				this.prepareElement( checkElement );
				this.currentElements = $( checkElement );

				// If this element is grouped, then validate all group elements already
				// containing a value
				group = this.groups[ checkElement.name ];
				if ( group ) {
					$.each( this.groups, function( name, testgroup ) {
						if ( testgroup === group && name !== checkElement.name ) {
							cleanElement = v.validationTargetFor( v.clean( v.findByName( name ) ) );
							if ( cleanElement && cleanElement.name in v.invalid ) {
								v.currentElements.push( cleanElement );
								result = v.check( cleanElement ) && result;
							}
						}
					} );
				}

				rs = this.check( checkElement ) !== false;
				result = result && rs;
				if ( rs ) {
					this.invalid[ checkElement.name ] = false;
				} else {
					this.invalid[ checkElement.name ] = true;
				}

				if ( !this.numberOfInvalids() ) {

					// Hide error containers on last error
					this.toHide = this.toHide.add( this.containers );
				}
				this.showErrors();

				// Add aria-invalid status for screen readers
				$( element ).attr( "aria-invalid", !rs );
			}

			return result;
		},

		// https://jqueryvalidation.org/Validator.showErrors/
		showErrors: function( errors ) {
			if ( errors ) {
				var validator = this;

				// Add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = $.map( this.errorMap, function( message, name ) {
					return {
						message: message,
						element: validator.findByName( name )[ 0 ]
					};
				} );

				// Remove items from success list
				this.successList = $.grep( this.successList, function( element ) {
					return !( element.name in errors );
				} );
			}
			if ( this.settings.showErrors ) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// https://jqueryvalidation.org/Validator.resetForm/
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$( this.currentForm ).resetForm();
			}
			this.invalid = {};
			this.submitted = {};
			this.prepareForm();
			this.hideErrors();
			var elements = this.elements()
				.removeData( "previousValue" )
				.removeAttr( "aria-invalid" );

			this.resetElements( elements );
		},

		resetElements: function( elements ) {
			var i;

			if ( this.settings.unhighlight ) {
				for ( i = 0; elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ],
						this.settings.errorClass, "" );
					this.findByName( elements[ i ].name ).removeClass( this.settings.validClass );
				}
			} else {
				elements
					.removeClass( this.settings.errorClass )
					.removeClass( this.settings.validClass );
			}
		},

		numberOfInvalids: function() {
			return this.objectLength( this.invalid );
		},

		objectLength: function( obj ) {
			/* jshint unused: false */
			var count = 0,
				i;
			for ( i in obj ) {

				// This check allows counting elements with empty error
				// message as invalid elements
				if ( obj[ i ] !== undefined && obj[ i ] !== null && obj[ i ] !== false ) {
					count++;
				}
			}
			return count;
		},

		hideErrors: function() {
			this.hideThese( this.toHide );
		},

		hideThese: function( errors ) {
			errors.not( this.containers ).text( "" );
			this.addWrapper( errors ).hide();
		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if ( this.settings.focusInvalid ) {
				try {
					$( this.findLastActive() || this.errorList.length && this.errorList[ 0 ].element || [] )
					.filter( ":visible" )
					.trigger( "focus" )

					// Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger( "focusin" );
				} catch ( e ) {

					// Ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep( this.errorList, function( n ) {
				return n.element.name === lastActive.name;
			} ).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// Select all valid inputs inside the form (no submit or reset buttons)
			return $( this.currentForm )
			.find( "input, select, textarea, [contenteditable]" )
			.not( ":submit, :reset, :image, :disabled" )
			.not( this.settings.ignore )
			.filter( function() {
				var name = this.name || $( this ).attr( "name" ); // For contenteditable
				var isContentEditable = typeof $( this ).attr( "contenteditable" ) !== "undefined" && $( this ).attr( "contenteditable" ) !== "false";

				if ( !name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this );
				}

				// Set form expando on contenteditable
				if ( isContentEditable ) {
					this.form = $( this ).closest( "form" )[ 0 ];
					this.name = name;
				}

				// Ignore elements that belong to other/nested forms
				if ( this.form !== validator.currentForm ) {
					return false;
				}

				// Select only the first element for each name, and only those with rules specified
				if ( name in rulesCache || !validator.objectLength( $( this ).rules() ) ) {
					return false;
				}

				rulesCache[ name ] = true;
				return true;
			} );
		},

		clean: function( selector ) {
			return $( selector )[ 0 ];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.split( " " ).join( "." );
			return $( this.settings.errorElement + "." + errorClass, this.errorContext );
		},

		resetInternals: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $( [] );
			this.toHide = $( [] );
		},

		reset: function() {
			this.resetInternals();
			this.currentElements = $( [] );
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor( element );
		},

		elementValue: function( element ) {
			var $element = $( element ),
				type = element.type,
				isContentEditable = typeof $element.attr( "contenteditable" ) !== "undefined" && $element.attr( "contenteditable" ) !== "false",
				val, idx;

			if ( type === "radio" || type === "checkbox" ) {
				return this.findByName( element.name ).filter( ":checked" ).val();
			} else if ( type === "number" && typeof element.validity !== "undefined" ) {
				return element.validity.badInput ? "NaN" : $element.val();
			}

			if ( isContentEditable ) {
				val = $element.text();
			} else {
				val = $element.val();
			}

			if ( type === "file" ) {

				// Modern browser (chrome & safari)
				if ( val.substr( 0, 12 ) === "C:\\fakepath\\" ) {
					return val.substr( 12 );
				}

				// Legacy browsers
				// Unix-based path
				idx = val.lastIndexOf( "/" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Windows-based path
				idx = val.lastIndexOf( "\\" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Just the file name
				return val;
			}

			if ( typeof val === "string" ) {
				return val.replace( /\r/g, "" );
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $( element ).rules(),
				rulesCount = $.map( rules, function( n, i ) {
					return i;
				} ).length,
				dependencyMismatch = false,
				val = this.elementValue( element ),
				result, method, rule, normalizer;

			// Prioritize the local normalizer defined for this element over the global one
			// if the former exists, otherwise user the global one in case it exists.
			if ( typeof rules.normalizer === "function" ) {
				normalizer = rules.normalizer;
			} else if (	typeof this.settings.normalizer === "function" ) {
				normalizer = this.settings.normalizer;
			}

			// If normalizer is defined, then call it to retreive the changed value instead
			// of using the real one.
			// Note that `this` in the normalizer is `element`.
			if ( normalizer ) {
				val = normalizer.call( element, val );

				// Delete the normalizer from rules to avoid treating it as a pre-defined method.
				delete rules.normalizer;
			}

			for ( method in rules ) {
				rule = { method: method, parameters: rules[ method ] };
				try {
					result = $.validator.methods[ method ].call( this, val, element, rule.parameters );

					// If a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" && rulesCount === 1 ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor( element ) );
						return;
					}

					if ( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch ( e ) {
					if ( this.settings.debug && window.console ) {
						console.log( "Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
					}
					if ( e instanceof TypeError ) {
						e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
					}

					throw e;
				}
			}
			if ( dependencyMismatch ) {
				return;
			}
			if ( this.objectLength( rules ) ) {
				this.successList.push( element );
			}
			return true;
		},

		// Return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		// return the generic message if present and no method specific message is present
		customDataMessage: function( element, method ) {
			return $( element ).data( "msg" + method.charAt( 0 ).toUpperCase() +
				method.substring( 1 ).toLowerCase() ) || $( element ).data( "msg" );
		},

		// Return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[ name ];
			return m && ( m.constructor === String ? m : m[ method ] );
		},

		// Return the first defined argument, allowing empty strings
		findDefined: function() {
			for ( var i = 0; i < arguments.length; i++ ) {
				if ( arguments[ i ] !== undefined ) {
					return arguments[ i ];
				}
			}
			return undefined;
		},

		// The second parameter 'rule' used to be a string, and extended to an object literal
		// of the following form:
		// rule = {
		//     method: "method name",
		//     parameters: "the given method parameters"
		// }
		//
		// The old behavior still supported, kept to maintain backward compatibility with
		// old code, and will be removed in the next major release.
		defaultMessage: function( element, rule ) {
			if ( typeof rule === "string" ) {
				rule = { method: rule };
			}

			var message = this.findDefined(
					this.customMessage( element.name, rule.method ),
					this.customDataMessage( element, rule.method ),

					// 'title' is never undefined, so handle empty string as undefined
					!this.settings.ignoreTitle && element.title || undefined,
					$.validator.messages[ rule.method ],
					"<strong>Warning: No message defined for " + element.name + "</strong>"
				),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call( this, rule.parameters, element );
			} else if ( theregex.test( message ) ) {
				message = $.validator.format( message.replace( theregex, "{$1}" ), rule.parameters );
			}

			return message;
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule );

			this.errorList.push( {
				message: message,
				element: element,
				method: rule.method
			} );

			this.errorMap[ element.name ] = message;
			this.submitted[ element.name ] = message;
		},

		addWrapper: function( toToggle ) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements, error;
			for ( i = 0; this.errorList[ i ]; i++ ) {
				error = this.errorList[ i ];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}
			if ( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if ( this.settings.success ) {
				for ( i = 0; this.successList[ i ]; i++ ) {
					this.showLabel( this.successList[ i ] );
				}
			}
			if ( this.settings.unhighlight ) {
				for ( i = 0, elements = this.validElements(); elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not( this.invalidElements() );
		},

		invalidElements: function() {
			return $( this.errorList ).map( function() {
				return this.element;
			} );
		},

		showLabel: function( element, message ) {
			var place, group, errorID, v,
				error = this.errorsFor( element ),
				elementID = this.idOrName( element ),
				describedBy = $( element ).attr( "aria-describedby" );

			if ( error.length ) {

				// Refresh error/success class
				error.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// Replace message on existing label
				error.html( message );
			} else {

				// Create error element
				error = $( "<" + this.settings.errorElement + ">" )
					.attr( "id", elementID + "-error" )
					.addClass( this.settings.errorClass )
					.html( message || "" );

				// Maintain reference to the element to be placed into the DOM
				place = error;
				if ( this.settings.wrapper ) {

					// Make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					place = error.hide().show().wrap( "<" + this.settings.wrapper + "/>" ).parent();
				}
				if ( this.labelContainer.length ) {
					this.labelContainer.append( place );
				} else if ( this.settings.errorPlacement ) {
					this.settings.errorPlacement.call( this, place, $( element ) );
				} else {
					place.insertAfter( element );
				}

				// Link error back to the element
				if ( error.is( "label" ) ) {

					// If the error is a label, then associate using 'for'
					error.attr( "for", elementID );

					// If the element is not a child of an associated label, then it's necessary
					// to explicitly apply aria-describedby
				} else if ( error.parents( "label[for='" + this.escapeCssMeta( elementID ) + "']" ).length === 0 ) {
					errorID = error.attr( "id" );

					// Respect existing non-error aria-describedby
					if ( !describedBy ) {
						describedBy = errorID;
					} else if ( !describedBy.match( new RegExp( "\\b" + this.escapeCssMeta( errorID ) + "\\b" ) ) ) {

						// Add to end of list if not already present
						describedBy += " " + errorID;
					}
					$( element ).attr( "aria-describedby", describedBy );

					// If this element is grouped, then assign to all elements in the same group
					group = this.groups[ element.name ];
					if ( group ) {
						v = this;
						$.each( v.groups, function( name, testgroup ) {
							if ( testgroup === group ) {
								$( "[name='" + v.escapeCssMeta( name ) + "']", v.currentForm )
									.attr( "aria-describedby", error.attr( "id" ) );
							}
						} );
					}
				}
			}
			if ( !message && this.settings.success ) {
				error.text( "" );
				if ( typeof this.settings.success === "string" ) {
					error.addClass( this.settings.success );
				} else {
					this.settings.success( error, element );
				}
			}
			this.toShow = this.toShow.add( error );
		},

		errorsFor: function( element ) {
			var name = this.escapeCssMeta( this.idOrName( element ) ),
				describer = $( element ).attr( "aria-describedby" ),
				selector = "label[for='" + name + "'], label[for='" + name + "'] *";

			// 'aria-describedby' should directly reference the error element
			if ( describer ) {
				selector = selector + ", #" + this.escapeCssMeta( describer )
					.replace( /\s+/g, ", #" );
			}

			return this
				.errors()
				.filter( selector );
		},

		// See https://api.jquery.com/category/selectors/, for CSS
		// meta-characters that should be escaped in order to be used with JQuery
		// as a literal part of a name/id or any selector.
		escapeCssMeta: function( string ) {
			return string.replace( /([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1" );
		},

		idOrName: function( element ) {
			return this.groups[ element.name ] || ( this.checkable( element ) ? element.name : element.id || element.name );
		},

		validationTargetFor: function( element ) {

			// If radio/checkbox, validate first element in group instead
			if ( this.checkable( element ) ) {
				element = this.findByName( element.name );
			}

			// Always apply ignore filter
			return $( element ).not( this.settings.ignore )[ 0 ];
		},

		checkable: function( element ) {
			return ( /radio|checkbox/i ).test( element.type );
		},

		findByName: function( name ) {
			return $( this.currentForm ).find( "[name='" + this.escapeCssMeta( name ) + "']" );
		},

		getLength: function( value, element ) {
			switch ( element.nodeName.toLowerCase() ) {
			case "select":
				return $( "option:selected", element ).length;
			case "input":
				if ( this.checkable( element ) ) {
					return this.findByName( element.name ).filter( ":checked" ).length;
				}
			}
			return value.length;
		},

		depend: function( param, element ) {
			return this.dependTypes[ typeof param ] ? this.dependTypes[ typeof param ]( param, element ) : true;
		},

		dependTypes: {
			"boolean": function( param ) {
				return param;
			},
			"string": function( param, element ) {
				return !!$( param, element.form ).length;
			},
			"function": function( param, element ) {
				return param( element );
			}
		},

		optional: function( element ) {
			var val = this.elementValue( element );
			return !$.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
		},

		startRequest: function( element ) {
			if ( !this.pending[ element.name ] ) {
				this.pendingRequest++;
				$( element ).addClass( this.settings.pendingClass );
				this.pending[ element.name ] = true;
			}
		},

		stopRequest: function( element, valid ) {
			this.pendingRequest--;

			// Sometimes synchronization fails, make sure pendingRequest is never < 0
			if ( this.pendingRequest < 0 ) {
				this.pendingRequest = 0;
			}
			delete this.pending[ element.name ];
			$( element ).removeClass( this.settings.pendingClass );
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
				$( this.currentForm ).submit();

				// Remove the hidden input that was used as a replacement for the
				// missing submit button. The hidden input is added by `handle()`
				// to ensure that the value of the used submit button is passed on
				// for scripted submits triggered by this method
				if ( this.submitButton ) {
					$( "input:hidden[name='" + this.submitButton.name + "']", this.currentForm ).remove();
				}

				this.formSubmitted = false;
			} else if ( !valid && this.pendingRequest === 0 && this.formSubmitted ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
				this.formSubmitted = false;
			}
		},

		previousValue: function( element, method ) {
			method = typeof method === "string" && method || "remote";

			return $.data( element, "previousValue" ) || $.data( element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, { method: method } )
			} );
		},

		// Cleans up all forms and elements, removes validator-specific events
		destroy: function() {
			this.resetForm();

			$( this.currentForm )
				.off( ".validate" )
				.removeData( "validator" )
				.find( ".validate-equalTo-blur" )
					.off( ".validate-equalTo" )
					.removeClass( "validate-equalTo-blur" )
				.find( ".validate-lessThan-blur" )
					.off( ".validate-lessThan" )
					.removeClass( "validate-lessThan-blur" )
				.find( ".validate-lessThanEqual-blur" )
					.off( ".validate-lessThanEqual" )
					.removeClass( "validate-lessThanEqual-blur" )
				.find( ".validate-greaterThanEqual-blur" )
					.off( ".validate-greaterThanEqual" )
					.removeClass( "validate-greaterThanEqual-blur" )
				.find( ".validate-greaterThan-blur" )
					.off( ".validate-greaterThan" )
					.removeClass( "validate-greaterThan-blur" );
		}

	},

	classRuleSettings: {
		required: { required: true },
		email: { email: true },
		url: { url: true },
		date: { date: true },
		dateISO: { dateISO: true },
		number: { number: true },
		digits: { digits: true },
		creditcard: { creditcard: true }
	},

	addClassRules: function( className, rules ) {
		if ( className.constructor === String ) {
			this.classRuleSettings[ className ] = rules;
		} else {
			$.extend( this.classRuleSettings, className );
		}
	},

	classRules: function( element ) {
		var rules = {},
			classes = $( element ).attr( "class" );

		if ( classes ) {
			$.each( classes.split( " " ), function() {
				if ( this in $.validator.classRuleSettings ) {
					$.extend( rules, $.validator.classRuleSettings[ this ] );
				}
			} );
		}
		return rules;
	},

	normalizeAttributeRule: function( rules, type, method, value ) {

		// Convert the value to a number for number inputs, and for text for backwards compability
		// allows type="date" and others to be compared as strings
		if ( /min|max|step/.test( method ) && ( type === null || /number|range|text/.test( type ) ) ) {
			value = Number( value );

			// Support Opera Mini, which returns NaN for undefined minlength
			if ( isNaN( value ) ) {
				value = undefined;
			}
		}

		if ( value || value === 0 ) {
			rules[ method ] = value;
		} else if ( type === method && type !== "range" ) {

			// Exception: the jquery validate 'range' method
			// does not test for the html5 'range' type
			rules[ method ] = true;
		}
	},

	attributeRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {

			// Support for <input required> in both html5 and older browsers
			if ( method === "required" ) {
				value = element.getAttribute( method );

				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if ( value === "" ) {
					value = true;
				}

				// Force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr( method );
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}

		// 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
		if ( rules.maxlength && /-1|2147483647|524288/.test( rules.maxlength ) ) {
			delete rules.maxlength;
		}

		return rules;
	},

	dataRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {
			value = $element.data( "rule" + method.charAt( 0 ).toUpperCase() + method.substring( 1 ).toLowerCase() );

			// Cast empty attributes like `data-rule-required` to `true`
			if ( value === "" ) {
				value = true;
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}
		return rules;
	},

	staticRules: function( element ) {
		var rules = {},
			validator = $.data( element.form, "validator" );

		if ( validator.settings.rules ) {
			rules = $.validator.normalizeRule( validator.settings.rules[ element.name ] ) || {};
		}
		return rules;
	},

	normalizeRules: function( rules, element ) {

		// Handle dependency check
		$.each( rules, function( prop, val ) {

			// Ignore rule when param is explicitly false, eg. required:false
			if ( val === false ) {
				delete rules[ prop ];
				return;
			}
			if ( val.param || val.depends ) {
				var keepRule = true;
				switch ( typeof val.depends ) {
				case "string":
					keepRule = !!$( val.depends, element.form ).length;
					break;
				case "function":
					keepRule = val.depends.call( element, element );
					break;
				}
				if ( keepRule ) {
					rules[ prop ] = val.param !== undefined ? val.param : true;
				} else {
					$.data( element.form, "validator" ).resetElements( $( element ) );
					delete rules[ prop ];
				}
			}
		} );

		// Evaluate parameters
		$.each( rules, function( rule, parameter ) {
			rules[ rule ] = typeof parameter === "function" && rule !== "normalizer" ? parameter( element ) : parameter;
		} );

		// Clean number parameters
		$.each( [ "minlength", "maxlength" ], function() {
			if ( rules[ this ] ) {
				rules[ this ] = Number( rules[ this ] );
			}
		} );
		$.each( [ "rangelength", "range" ], function() {
			var parts;
			if ( rules[ this ] ) {
				if ( Array.isArray( rules[ this ] ) ) {
					rules[ this ] = [ Number( rules[ this ][ 0 ] ), Number( rules[ this ][ 1 ] ) ];
				} else if ( typeof rules[ this ] === "string" ) {
					parts = rules[ this ].replace( /[\[\]]/g, "" ).split( /[\s,]+/ );
					rules[ this ] = [ Number( parts[ 0 ] ), Number( parts[ 1 ] ) ];
				}
			}
		} );

		if ( $.validator.autoCreateRanges ) {

			// Auto-create ranges
			if ( rules.min != null && rules.max != null ) {
				rules.range = [ rules.min, rules.max ];
				delete rules.min;
				delete rules.max;
			}
			if ( rules.minlength != null && rules.maxlength != null ) {
				rules.rangelength = [ rules.minlength, rules.maxlength ];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each( data.split( /\s/ ), function() {
				transformed[ this ] = true;
			} );
			data = transformed;
		}
		return data;
	},

	// https://jqueryvalidation.org/jQuery.validator.addMethod/
	addMethod: function( name, method, message ) {
		$.validator.methods[ name ] = method;
		$.validator.messages[ name ] = message !== undefined ? message : $.validator.messages[ name ];
		if ( method.length < 3 ) {
			$.validator.addClassRules( name, $.validator.normalizeRule( name ) );
		}
	},

	// https://jqueryvalidation.org/jQuery.validator.methods/
	methods: {

		// https://jqueryvalidation.org/required-method/
		required: function( value, element, param ) {

			// Check if dependency is met
			if ( !this.depend( param, element ) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {

				// Could be an array for select-multiple or a string, both are fine this way
				var val = $( element ).val();
				return val && val.length > 0;
			}
			if ( this.checkable( element ) ) {
				return this.getLength( value, element ) > 0;
			}
			return value !== undefined && value !== null && value.length > 0;
		},

		// https://jqueryvalidation.org/email-method/
		email: function( value, element ) {

			// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
			// Retrieved 2014-01-14
			// If you have a problem with this implementation, report a bug against the above spec
			// Or use custom methods to implement your own email validation
			return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
		},

		// https://jqueryvalidation.org/url-method/
		url: function( value, element ) {

			// Copyright (c) 2010-2013 Diego Perini, MIT licensed
			// https://gist.github.com/dperini/729294
			// see also https://mathiasbynens.be/demo/url-regex
			// modified to allow protocol-relative URLs
			return this.optional( element ) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
		},

		// https://jqueryvalidation.org/date-method/
		date: ( function() {
			var called = false;

			return function( value, element ) {
				if ( !called ) {
					called = true;
					if ( this.settings.debug && window.console ) {
						console.warn(
							"The `date` method is deprecated and will be removed in version '2.0.0'.\n" +
							"Please don't use it, since it relies on the Date constructor, which\n" +
							"behaves very differently across browsers and locales. Use `dateISO`\n" +
							"instead or one of the locale specific methods in `localizations/`\n" +
							"and `additional-methods.js`."
						);
					}
				}

				return this.optional( element ) || !/Invalid|NaN/.test( new Date( value ).toString() );
			};
		}() ),

		// https://jqueryvalidation.org/dateISO-method/
		dateISO: function( value, element ) {
			return this.optional( element ) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
		},

		// https://jqueryvalidation.org/number-method/
		number: function( value, element ) {
			return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
		},

		// https://jqueryvalidation.org/digits-method/
		digits: function( value, element ) {
			return this.optional( element ) || /^\d+$/.test( value );
		},

		// https://jqueryvalidation.org/minlength-method/
		minlength: function( value, element, param ) {
			var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length >= param;
		},

		// https://jqueryvalidation.org/maxlength-method/
		maxlength: function( value, element, param ) {
			var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length <= param;
		},

		// https://jqueryvalidation.org/rangelength-method/
		rangelength: function( value, element, param ) {
			var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || ( length >= param[ 0 ] && length <= param[ 1 ] );
		},

		// https://jqueryvalidation.org/min-method/
		min: function( value, element, param ) {
			return this.optional( element ) || value >= param;
		},

		// https://jqueryvalidation.org/max-method/
		max: function( value, element, param ) {
			return this.optional( element ) || value <= param;
		},

		// https://jqueryvalidation.org/range-method/
		range: function( value, element, param ) {
			return this.optional( element ) || ( value >= param[ 0 ] && value <= param[ 1 ] );
		},

		// https://jqueryvalidation.org/step-method/
		step: function( value, element, param ) {
			var type = $( element ).attr( "type" ),
				errorMessage = "Step attribute on input type " + type + " is not supported.",
				supportedTypes = [ "text", "number", "range" ],
				re = new RegExp( "\\b" + type + "\\b" ),
				notSupported = type && !re.test( supportedTypes.join() ),
				decimalPlaces = function( num ) {
					var match = ( "" + num ).match( /(?:\.(\d+))?$/ );
					if ( !match ) {
						return 0;
					}

					// Number of digits right of decimal point.
					return match[ 1 ] ? match[ 1 ].length : 0;
				},
				toInt = function( num ) {
					return Math.round( num * Math.pow( 10, decimals ) );
				},
				valid = true,
				decimals;

			// Works only for text, number and range input types
			// TODO find a way to support input types date, datetime, datetime-local, month, time and week
			if ( notSupported ) {
				throw new Error( errorMessage );
			}

			decimals = decimalPlaces( param );

			// Value can't have too many decimals
			if ( decimalPlaces( value ) > decimals || toInt( value ) % toInt( param ) !== 0 ) {
				valid = false;
			}

			return this.optional( element ) || valid;
		},

		// https://jqueryvalidation.org/equalTo-method/
		equalTo: function( value, element, param ) {

			// Bind to the blur event of the target in order to revalidate whenever the target field is updated
			var target = $( param );
			if ( this.settings.onfocusout && target.not( ".validate-equalTo-blur" ).length ) {
				target.addClass( "validate-equalTo-blur" ).on( "blur.validate-equalTo", function() {
					$( element ).valid();
				} );
			}
			return value === target.val();
		},

		// https://jqueryvalidation.org/remote-method/
		remote: function( value, element, param, method ) {
			if ( this.optional( element ) ) {
				return "dependency-mismatch";
			}

			method = typeof method === "string" && method || "remote";

			var previous = this.previousValue( element, method ),
				validator, data, optionDataString;

			if ( !this.settings.messages[ element.name ] ) {
				this.settings.messages[ element.name ] = {};
			}
			previous.originalMessage = previous.originalMessage || this.settings.messages[ element.name ][ method ];
			this.settings.messages[ element.name ][ method ] = previous.message;

			param = typeof param === "string" && { url: param } || param;
			optionDataString = $.param( $.extend( { data: value }, param.data ) );
			if ( previous.old === optionDataString ) {
				return previous.valid;
			}

			previous.old = optionDataString;
			validator = this;
			this.startRequest( element );
			data = {};
			data[ element.name ] = value;
			$.ajax( $.extend( true, {
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				context: validator.currentForm,
				success: function( response ) {
					var valid = response === true || response === "true",
						errors, message, submitted;

					validator.settings.messages[ element.name ][ method ] = previous.originalMessage;
					if ( valid ) {
						submitted = validator.formSubmitted;
						validator.resetInternals();
						validator.toHide = validator.errorsFor( element );
						validator.formSubmitted = submitted;
						validator.successList.push( element );
						validator.invalid[ element.name ] = false;
						validator.showErrors();
					} else {
						errors = {};
						message = response || validator.defaultMessage( element, { method: method, parameters: value } );
						errors[ element.name ] = previous.message = message;
						validator.invalid[ element.name ] = true;
						validator.showErrors( errors );
					}
					previous.valid = valid;
					validator.stopRequest( element, valid );
				}
			}, param ) );
			return "pending";
		}
	}

} );

// Ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

var pendingRequests = {},
	ajax;

// Use a prefilter if available (1.5+)
if ( $.ajaxPrefilter ) {
	$.ajaxPrefilter( function( settings, _, xhr ) {
		var port = settings.port;
		if ( settings.mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = xhr;
		}
	} );
} else {

	// Proxy ajax
	ajax = $.ajax;
	$.ajax = function( settings ) {
		var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
			port = ( "port" in settings ? settings : $.ajaxSettings ).port;
		if ( mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = ajax.apply( this, arguments );
			return pendingRequests[ port ];
		}
		return ajax.apply( this, arguments );
	};
}
return $;
}));
/*!
 * @copyright Copyright &copy; Kartik Visweswaran, Krajee.com, 2014 - 2020
 * @version 1.3.6
 *
 * Date formatter utility library that allows formatting date/time variables or Date objects using PHP DateTime format.
 * This library is a standalone javascript library and does not depend on other libraries or plugins like jQuery. The
 * library also adds support for Universal Module Definition (UMD).
 * 
 * @see http://php.net/manual/en/function.date.php
 *
 * For more JQuery plugins visit http://plugins.krajee.com
 * For more Yii related demos visit http://demos.krajee.com
 */
(function (root, factory) {
    // noinspection JSUnresolvedVariable
    if (typeof define === 'function' && define.amd) { // AMD
        // noinspection JSUnresolvedFunction
        define([], factory);
    } else {
        // noinspection JSUnresolvedVariable
        if (typeof module === 'object' && module.exports) { // Node
            // noinspection JSUnresolvedVariable
            module.exports = factory();
        } else { // Browser globals
            root.DateFormatter = factory();
        }
    }
}(typeof self !== 'undefined' ? self : this, function () {
    var DateFormatter, $h;
    /**
     * Global helper object
     */
    $h = {
        DAY: 1000 * 60 * 60 * 24,
        HOUR: 3600,
        defaults: {
            dateSettings: {
                days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                months: [
                    'January', 'February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December'
                ],
                monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                meridiem: ['AM', 'PM'],
                ordinal: function (number) {
                    var n = number % 10, suffixes = {1: 'st', 2: 'nd', 3: 'rd'};
                    return Math.floor(number % 100 / 10) === 1 || !suffixes[n] ? 'th' : suffixes[n];
                }
            },
            separators: /[ \-+\/.:@]/g,
            validParts: /[dDjlNSwzWFmMntLoYyaABgGhHisueTIOPZcrU]/g,
            intParts: /[djwNzmnyYhHgGis]/g,
            tzParts: /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            tzClip: /[^-+\dA-Z]/g
        },
        getInt: function (str, radix) {
            return parseInt(str, (radix ? radix : 10));
        },
        compare: function (str1, str2) {
            return typeof (str1) === 'string' && typeof (str2) === 'string' && str1.toLowerCase() === str2.toLowerCase();
        },
        lpad: function (value, length, chr) {
            var val = value.toString();
            chr = chr || '0';
            return val.length < length ? $h.lpad(chr + val, length) : val;
        },
        merge: function (out) {
            var i, obj;
            out = out || {};
            for (i = 1; i < arguments.length; i++) {
                obj = arguments[i];
                if (!obj) {
                    continue;
                }
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'object') {
                            $h.merge(out[key], obj[key]);
                        } else {
                            out[key] = obj[key];
                        }
                    }
                }
            }
            return out;
        },
        getIndex: function (val, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].toLowerCase() === val.toLowerCase()) {
                    return i;
                }
            }
            return -1;
        }
    };

    /**
     * Date Formatter Library Constructor
     * @param options
     * @constructor
     */
    DateFormatter = function (options) {
        var self = this, config = $h.merge($h.defaults, options);
        self.dateSettings = config.dateSettings;
        self.separators = config.separators;
        self.validParts = config.validParts;
        self.intParts = config.intParts;
        self.tzParts = config.tzParts;
        self.tzClip = config.tzClip;
    };

    /**
     * DateFormatter Library Prototype
     */
    DateFormatter.prototype = {
        constructor: DateFormatter,
        getMonth: function (val) {
            var self = this, i;
            i = $h.getIndex(val, self.dateSettings.monthsShort) + 1;
            if (i === 0) {
                i = $h.getIndex(val, self.dateSettings.months) + 1;
            }
            return i;
        },
        parseDate: function (vDate, vFormat) {
            var self = this, vFormatParts, vDateParts, i, vDateFlag = false, vTimeFlag = false, vDatePart, iDatePart,
                vSettings = self.dateSettings, vMonth, vMeriIndex, vMeriOffset, len, mer,
                out = {date: null, year: null, month: null, day: null, hour: 0, min: 0, sec: 0};
            if (!vDate) {
                return null;
            }
            if (vDate instanceof Date) {
                return vDate;
            }
            if (vFormat === 'U') {
                i = $h.getInt(vDate);
                return i ? new Date(i * 1000) : vDate;
            }
            switch (typeof vDate) {
                case 'number':
                    return new Date(vDate);
                case 'string':
                    break;
                default:
                    return null;
            }
            vFormatParts = vFormat.match(self.validParts);
            if (!vFormatParts || vFormatParts.length === 0) {
                throw new Error('Invalid date format definition.');
            }
            for (i = vFormatParts.length - 1; i >= 0; i--) {
                if (vFormatParts[i] === 'S') {
                    vFormatParts.splice(i, 1);
                }
            }
            vDateParts = vDate.replace(self.separators, '\0').split('\0');
            for (i = 0; i < vDateParts.length; i++) {
                vDatePart = vDateParts[i];
                iDatePart = $h.getInt(vDatePart);
                switch (vFormatParts[i]) {
                    case 'y':
                    case 'Y':
                        if (iDatePart) {
                            len = vDatePart.length;
                            out.year = len === 2 ? $h.getInt((iDatePart < 70 ? '20' : '19') + vDatePart) : iDatePart;
                        } else {
                            return null;
                        }
                        vDateFlag = true;
                        break;
                    case 'm':
                    case 'n':
                    case 'M':
                    case 'F':
                        if (isNaN(iDatePart)) {
                            vMonth = self.getMonth(vDatePart);
                            if (vMonth > 0) {
                                out.month = vMonth;
                            } else {
                                return null;
                            }
                        } else {
                            if (iDatePart >= 1 && iDatePart <= 12) {
                                out.month = iDatePart;
                            } else {
                                return null;
                            }
                        }
                        vDateFlag = true;
                        break;
                    case 'd':
                    case 'j':
                        if (iDatePart >= 1 && iDatePart <= 31) {
                            out.day = iDatePart;
                        } else {
                            return null;
                        }
                        vDateFlag = true;
                        break;
                    case 'g':
                    case 'h':
                        vMeriIndex = (vFormatParts.indexOf('a') > -1) ? vFormatParts.indexOf('a') :
                            ((vFormatParts.indexOf('A') > -1) ? vFormatParts.indexOf('A') : -1);
                        mer = vDateParts[vMeriIndex];
                        if (vMeriIndex !== -1) {
                            vMeriOffset = $h.compare(mer, vSettings.meridiem[0]) ? 0 :
                                ($h.compare(mer, vSettings.meridiem[1]) ? 12 : -1);
                            if (iDatePart >= 1 && iDatePart <= 12 && vMeriOffset !== -1) {
                                out.hour = iDatePart % 12 === 0 ? vMeriOffset : iDatePart + vMeriOffset;
                            } else {
                                if (iDatePart >= 0 && iDatePart <= 23) {
                                    out.hour = iDatePart;
                                }
                            }
                        } else {
                            if (iDatePart >= 0 && iDatePart <= 23) {
                                out.hour = iDatePart;
                            } else {
                                return null;
                            }
                        }
                        vTimeFlag = true;
                        break;
                    case 'G':
                    case 'H':
                        if (iDatePart >= 0 && iDatePart <= 23) {
                            out.hour = iDatePart;
                        } else {
                            return null;
                        }
                        vTimeFlag = true;
                        break;
                    case 'i':
                        if (iDatePart >= 0 && iDatePart <= 59) {
                            out.min = iDatePart;
                        } else {
                            return null;
                        }
                        vTimeFlag = true;
                        break;
                    case 's':
                        if (iDatePart >= 0 && iDatePart <= 59) {
                            out.sec = iDatePart;
                        } else {
                            return null;
                        }
                        vTimeFlag = true;
                        break;
                }
            }
            if (vDateFlag === true) {
                var varY = out.year || 0, varM = out.month ? out.month - 1 : 0, varD = out.day || 1;
                out.date = new Date(varY, varM, varD, out.hour, out.min, out.sec, 0);
            } else {
                if (vTimeFlag !== true) {
                    return null;
                }
                out.date = new Date(0, 0, 0, out.hour, out.min, out.sec, 0);
            }
            return out.date;
        },
        guessDate: function (vDateStr, vFormat) {
            if (typeof vDateStr !== 'string') {
                return vDateStr;
            }
            var self = this, vParts = vDateStr.replace(self.separators, '\0').split('\0'), vPattern = /^[djmn]/g, len,
                vFormatParts = vFormat.match(self.validParts), vDate = new Date(), vDigit = 0, vYear, i, n, iPart, iSec;

            if (!vPattern.test(vFormatParts[0])) {
                return vDateStr;
            }

            for (i = 0; i < vParts.length; i++) {
                vDigit = 2;
                iPart = vParts[i];
                iSec = $h.getInt(iPart.substr(0, 2));
                if (isNaN(iSec)) {
                    return null;
                }
                switch (i) {
                    case 0:
                        if (vFormatParts[0] === 'm' || vFormatParts[0] === 'n') {
                            vDate.setMonth(iSec - 1);
                        } else {
                            vDate.setDate(iSec);
                        }
                        break;
                    case 1:
                        if (vFormatParts[0] === 'm' || vFormatParts[0] === 'n') {
                            vDate.setDate(iSec);
                        } else {
                            vDate.setMonth(iSec - 1);
                        }
                        break;
                    case 2:
                        vYear = vDate.getFullYear();
                        len = iPart.length;
                        vDigit = len < 4 ? len : 4;
                        vYear = $h.getInt(len < 4 ? vYear.toString().substr(0, 4 - len) + iPart : iPart.substr(0, 4));
                        if (!vYear) {
                            return null;
                        }
                        vDate.setFullYear(vYear);
                        break;
                    case 3:
                        vDate.setHours(iSec);
                        break;
                    case 4:
                        vDate.setMinutes(iSec);
                        break;
                    case 5:
                        vDate.setSeconds(iSec);
                        break;
                }
                n = iPart.substr(vDigit);
                if (n.length > 0) {
                    vParts.splice(i + 1, 0, n);
                }
            }
            return vDate;
        },
        parseFormat: function (vChar, vDate) {
            var self = this, vSettings = self.dateSettings, fmt, backslash = /\\?(.?)/gi, doFormat = function (t, s) {
                return fmt[t] ? fmt[t]() : s;
            };
            fmt = {
                /////////
                // DAY //
                /////////
                /**
                 * Day of month with leading 0: `01..31`
                 * @return {string}
                 */
                d: function () {
                    return $h.lpad(fmt.j(), 2);
                },
                /**
                 * Shorthand day name: `Mon...Sun`
                 * @return {string}
                 */
                D: function () {
                    return vSettings.daysShort[fmt.w()];
                },
                /**
                 * Day of month: `1..31`
                 * @return {number}
                 */
                j: function () {
                    return vDate.getDate();
                },
                /**
                 * Full day name: `Monday...Sunday`
                 * @return {string}
                 */
                l: function () {
                    return vSettings.days[fmt.w()];
                },
                /**
                 * ISO-8601 day of week: `1[Mon]..7[Sun]`
                 * @return {number}
                 */
                N: function () {
                    return fmt.w() || 7;
                },
                /**
                 * Day of week: `0[Sun]..6[Sat]`
                 * @return {number}
                 */
                w: function () {
                    return vDate.getDay();
                },
                /**
                 * Day of year: `0..365`
                 * @return {number}
                 */
                z: function () {
                    var a = new Date(fmt.Y(), fmt.n() - 1, fmt.j()), b = new Date(fmt.Y(), 0, 1);
                    return Math.round((a - b) / $h.DAY);
                },

                //////////
                // WEEK //
                //////////
                /**
                 * ISO-8601 week number
                 * @return {number}
                 */
                W: function () {
                    var a = new Date(fmt.Y(), fmt.n() - 1, fmt.j() - fmt.N() + 3), b = new Date(a.getFullYear(), 0, 4);
                    return $h.lpad(1 + Math.round((a - b) / $h.DAY / 7), 2);
                },

                ///////////
                // MONTH //
                ///////////
                /**
                 * Full month name: `January...December`
                 * @return {string}
                 */
                F: function () {
                    return vSettings.months[vDate.getMonth()];
                },
                /**
                 * Month w/leading 0: `01..12`
                 * @return {string}
                 */
                m: function () {
                    return $h.lpad(fmt.n(), 2);
                },
                /**
                 * Shorthand month name; `Jan...Dec`
                 * @return {string}
                 */
                M: function () {
                    return vSettings.monthsShort[vDate.getMonth()];
                },
                /**
                 * Month: `1...12`
                 * @return {number}
                 */
                n: function () {
                    return vDate.getMonth() + 1;
                },
                /**
                 * Days in month: `28...31`
                 * @return {number}
                 */
                t: function () {
                    return (new Date(fmt.Y(), fmt.n(), 0)).getDate();
                },

                //////////
                // YEAR //
                //////////
                /**
                 * Is leap year? `0 or 1`
                 * @return {number}
                 */
                L: function () {
                    var Y = fmt.Y();
                    return (Y % 4 === 0 && Y % 100 !== 0 || Y % 400 === 0) ? 1 : 0;
                },
                /**
                 * ISO-8601 year
                 * @return {number}
                 */
                o: function () {
                    var n = fmt.n(), W = fmt.W(), Y = fmt.Y();
                    return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
                },
                /**
                 * Full year: `e.g. 1980...2010`
                 * @return {number}
                 */
                Y: function () {
                    return vDate.getFullYear();
                },
                /**
                 * Last two digits of year: `00...99`
                 * @return {string}
                 */
                y: function () {
                    return fmt.Y().toString().slice(-2);
                },

                //////////
                // TIME //
                //////////
                /**
                 * Meridian lower: `am or pm`
                 * @return {string}
                 */
                a: function () {
                    return fmt.A().toLowerCase();
                },
                /**
                 * Meridian upper: `AM or PM`
                 * @return {string}
                 */
                A: function () {
                    var n = fmt.G() < 12 ? 0 : 1;
                    return vSettings.meridiem[n];
                },
                /**
                 * Swatch Internet time: `000..999`
                 * @return {string}
                 */
                B: function () {
                    var H = vDate.getUTCHours() * $h.HOUR, i = vDate.getUTCMinutes() * 60, s = vDate.getUTCSeconds();
                    return $h.lpad(Math.floor((H + i + s + $h.HOUR) / 86.4) % 1000, 3);
                },
                /**
                 * 12-Hours: `1..12`
                 * @return {number}
                 */
                g: function () {
                    return fmt.G() % 12 || 12;
                },
                /**
                 * 24-Hours: `0..23`
                 * @return {number}
                 */
                G: function () {
                    return vDate.getHours();
                },
                /**
                 * 12-Hours with leading 0: `01..12`
                 * @return {string}
                 */
                h: function () {
                    return $h.lpad(fmt.g(), 2);
                },
                /**
                 * 24-Hours w/leading 0: `00..23`
                 * @return {string}
                 */
                H: function () {
                    return $h.lpad(fmt.G(), 2);
                },
                /**
                 * Minutes w/leading 0: `00..59`
                 * @return {string}
                 */
                i: function () {
                    return $h.lpad(vDate.getMinutes(), 2);
                },
                /**
                 * Seconds w/leading 0: `00..59`
                 * @return {string}
                 */
                s: function () {
                    return $h.lpad(vDate.getSeconds(), 2);
                },
                /**
                 * Microseconds: `000000-999000`
                 * @return {string}
                 */
                u: function () {
                    return $h.lpad(vDate.getMilliseconds() * 1000, 6);
                },

                //////////////
                // TIMEZONE //
                //////////////
                /**
                 * Timezone identifier: `e.g. Atlantic/Azores, ...`
                 * @return {string}
                 */
                e: function () {
                    var str = /\((.*)\)/.exec(String(vDate))[1];
                    return str || 'Coordinated Universal Time';
                },
                /**
                 * DST observed? `0 or 1`
                 * @return {number}
                 */
                I: function () {
                    var a = new Date(fmt.Y(), 0), c = Date.UTC(fmt.Y(), 0),
                        b = new Date(fmt.Y(), 6), d = Date.UTC(fmt.Y(), 6);
                    return ((a - c) !== (b - d)) ? 1 : 0;
                },
                /**
                 * Difference to GMT in hour format: `e.g. +0200`
                 * @return {string}
                 */
                O: function () {
                    var tzo = vDate.getTimezoneOffset(), a = Math.abs(tzo);
                    return (tzo > 0 ? '-' : '+') + $h.lpad(Math.floor(a / 60) * 100 + a % 60, 4);
                },
                /**
                 * Difference to GMT with colon: `e.g. +02:00`
                 * @return {string}
                 */
                P: function () {
                    var O = fmt.O();
                    return (O.substr(0, 3) + ':' + O.substr(3, 2));
                },
                /**
                 * Timezone abbreviation: `e.g. EST, MDT, ...`
                 * @return {string}
                 */
                T: function () {
                    var str = (String(vDate).match(self.tzParts) || ['']).pop().replace(self.tzClip, '');
                    return str || 'UTC';
                },
                /**
                 * Timezone offset in seconds: `-43200...50400`
                 * @return {number}
                 */
                Z: function () {
                    return -vDate.getTimezoneOffset() * 60;
                },

                ////////////////////
                // FULL DATE TIME //
                ////////////////////
                /**
                 * ISO-8601 date
                 * @return {string}
                 */
                c: function () {
                    return 'Y-m-d\\TH:i:sP'.replace(backslash, doFormat);
                },
                /**
                 * RFC 2822 date
                 * @return {string}
                 */
                r: function () {
                    return 'D, d M Y H:i:s O'.replace(backslash, doFormat);
                },
                /**
                 * Seconds since UNIX epoch
                 * @return {number}
                 */
                U: function () {
                    return vDate.getTime() / 1000 || 0;
                }
            };
            return doFormat(vChar, vChar);
        },
        formatDate: function (vDate, vFormat) {
            var self = this, i, n, len, str, vChar, vDateStr = '', BACKSLASH = '\\';
            if (typeof vDate === 'string') {
                vDate = self.parseDate(vDate, vFormat);
                if (!vDate) {
                    return null;
                }
            }
            if (vDate instanceof Date) {
                len = vFormat.length;
                for (i = 0; i < len; i++) {
                    vChar = vFormat.charAt(i);
                    if (vChar === 'S' || vChar === BACKSLASH) {
                        continue;
                    }
                    if (i > 0 && vFormat.charAt(i - 1) === BACKSLASH) {
                        vDateStr += vChar;
                        continue;
                    }
                    str = self.parseFormat(vChar, vDate);
                    if (i !== (len - 1) && self.intParts.test(vChar) && vFormat.charAt(i + 1) === 'S') {
                        n = $h.getInt(str) || 0;
                        str += self.dateSettings.ordinal(n);
                    }
                    vDateStr += str;
                }
                return vDateStr;
            }
            return '';
        }
    };
    return DateFormatter;
}));
/*!
 * Laravel Javascript Validation
 *
 * https://github.com/proengsoft/laravel-jsvalidation
 *
 * Copyright (c) 2017 Proengsoft
 * Released under the MIT license
 */

var laravelValidation;
laravelValidation = {

    implicitRules: ['Required','Confirmed'],

    /**
     * Initialize laravel validations.
     */
    init: function () {

        // jquery-validation requires the field under validation to be present. We're adding a dummy hidden
        // field so that any errors are not visible.
        var constructor = $.fn.validate;
        $.fn.validate = function( options ) {
            var name = 'proengsoft_jsvalidation'; // must match the name defined in JsValidatorFactory.newFormRequestValidator
            var $elm = $(this).find('input[name="' + name + '"]');
            if ($elm.length === 0) {
                $('<input>').attr({type: 'hidden', name: name}).appendTo(this);
            }

            return constructor.apply(this, [options]);
        };

        // Disable class rules and attribute rules
        $.validator.classRuleSettings = {};
        $.validator.attributeRules = function () {};

        $.validator.dataRules = this.arrayRules;
        $.validator.prototype.arrayRulesCache = {};

        // Register validations methods
        this.setupValidations();
    },

    arrayRules: function(element) {

        var rules = {},
            validator = $.data( element.form, "validator"),
            cache = validator.arrayRulesCache;

        // Is not an Array
        if (element.name.indexOf('[') === -1) {
            return rules;
        }

        if (! (element.name in cache)) {
            cache[element.name] = {};
        }

        $.each(validator.settings.rules, function(name, tmpRules) {
            if (name in cache[element.name]) {
                rules = laravelValidation.helpers.mergeRules(rules, cache[element.name][name]);
            } else {
                cache[element.name][name] = {};

                var nameRegExp = laravelValidation.helpers.regexFromWildcard(name);
                if (element.name.match(nameRegExp)) {
                    var newRules = $.validator.normalizeRule(tmpRules) || {};
                    cache[element.name][name] = newRules;

                    rules = laravelValidation.helpers.mergeRules(rules, newRules);
                }
            }
        });

        return rules;
    },

    setupValidations: function () {

        /**
         * Get CSRF token.
         *
         * @param params
         * @returns {string}
         */
        var getCsrfToken = function (params) {
            return params[0][1][1];
        };

        /**
         * Whether to validate all attributes.
         *
         * @param params
         * @returns {boolean}
         */
        var isValidateAll = function (params) {
            return params[0][1][2];
        };

        /**
         * Determine whether the rule is implicit.
         *
         * @param params
         * @returns {boolean}
         */
        var isImplicit = function (params) {
            var implicit = false;
            $.each(params, function (i, parameters) {
                implicit = implicit || parameters[3];
            });

            return implicit;
        };

        /**
         * Get form method from a validator instance.
         *
         * @param validator
         * @returns {string}
         */
        var formMethod = function (validator) {
            var formMethod = $(validator.currentForm).attr('method');
            if ($(validator.currentForm).find('input[name="_method"]').length) {
                formMethod = $(validator.currentForm).find('input[name="_method"]').val();
            }

            return formMethod;
        };

        /**
         * Get AJAX parameters for remote requests.
         *
         * @param validator
         * @param element
         * @param params
         * @param data
         * @returns {object}
         */
        var ajaxOpts = function (validator, element, params, data) {
            return {
                mode: 'abort',
                port: 'validate' + element.name,
                dataType: 'json',
                data: data,
                context: validator.currentForm,
                url: $(validator.currentForm).attr('action'),
                type: formMethod(validator),
                beforeSend: function (xhr) {
                    var token = getCsrfToken(params);
                    if (formMethod(validator) !== 'get' && token) {
                        return xhr.setRequestHeader('X-XSRF-TOKEN', token);
                    }
                },
            };
        };

        /**
         * Validate a set of local JS based rules against an element.
         *
         * @param validator
         * @param values
         * @param element
         * @param rules
         * @returns {boolean}
         */
        var validateLocalRules = function (validator, values, element, rules) {
            var validated = true,
                previous = validator.previousValue(element);

            $.each(rules, function (i, param) {
                var implicit = param[3] || laravelValidation.implicitRules.indexOf(param[0]) !== -1;
                var rule = param[0];
                var message = param[2];

                if (! implicit && validator.optional(element)) {
                    validated = "dependency-mismatch";
                    return false;
                }

                if (laravelValidation.methods[rule] !== undefined) {
                    $.each(values, function(index, value) {
                        validated = laravelValidation.methods[rule].call(validator, value, element, param[1], function(valid) {
                            validator.settings.messages[element.name].laravelValidationRemote = previous.originalMessage;
                            if (valid) {
                                var submitted = validator.formSubmitted;
                                validator.prepareElement(element);
                                validator.formSubmitted = submitted;
                                validator.successList.push(element);
                                delete validator.invalid[element.name];
                                validator.showErrors();
                            } else {
                                var errors = {};
                                errors[ element.name ]
                                    = previous.message
                                    = typeof message === "function" ? message( value ) : message;
                                validator.invalid[element.name] = true;
                                validator.showErrors(errors);
                            }
                            validator.showErrors(validator.errorMap);
                            previous.valid = valid;
                        });

                        // Break loop.
                        if (validated === false) {
                            return false;
                        }
                    });
                } else {
                    validated = false;
                }

                if (validated !== true) {
                    if (!validator.settings.messages[element.name] ) {
                        validator.settings.messages[element.name] = {};
                    }

                    validator.settings.messages[element.name].laravelValidation= message;

                    return false;
                }

            });

            return validated;
        };

        /**
         * Create JQueryValidation check to validate Laravel rules.
         */

        $.validator.addMethod("laravelValidation", function (value, element, params) {
            var rules = [],
                arrayRules = [];
            $.each(params, function (i, param) {
                // put Implicit rules in front
                var isArrayRule = param[4].indexOf('[') !== -1;
                if (param[3] || laravelValidation.implicitRules.indexOf(param[0]) !== -1) {
                    isArrayRule ? arrayRules.unshift(param) : rules.unshift(param);
                } else {
                    isArrayRule ? arrayRules.push(param) : rules.push(param);
                }
            });

            // Validate normal rules.
            var localRulesResult = validateLocalRules(this, [value], element, rules);

            // Validate items of the array using array rules.
            var arrayValue = ! Array.isArray(value) ? [value] : value;
            var arrayRulesResult = validateLocalRules(this, arrayValue, element, arrayRules);

            return localRulesResult && arrayRulesResult;
        }, '');


        /**
         * Create JQueryValidation check to validate Remote Laravel rules.
         */
        $.validator.addMethod("laravelValidationRemote", function (value, element, params) {

            if (! isImplicit(params) && this.optional( element )) {
                return "dependency-mismatch";
            }

            var previous = this.previousValue( element ),
                validator, data;

            if (! this.settings.messages[ element.name ]) {
                this.settings.messages[ element.name ] = {};
            }
            previous.originalMessage = this.settings.messages[ element.name ].laravelValidationRemote;
            this.settings.messages[ element.name ].laravelValidationRemote = previous.message;

            if (laravelValidation.helpers.arrayEquals(previous.old, value) || previous.old === value) {
                return previous.valid;
            }

            previous.old = value;
            validator = this;
            this.startRequest( element );

            data = $(validator.currentForm).serializeArray();
            data.push({'name': '_jsvalidation', 'value': element.name});
            data.push({'name': '_jsvalidation_validate_all', 'value': isValidateAll(params)});

            $.ajax( ajaxOpts(validator, element, params, data) )
                .always(function( response, textStatus ) {
                    var errors, message, submitted, valid;

                    if (textStatus === 'error') {
                        valid = false;
                        response = laravelValidation.helpers.parseErrorResponse(response);
                    } else if (textStatus === 'success') {
                        valid = response === true || response === "true";
                    } else {
                        return;
                    }

                    validator.settings.messages[ element.name ].laravelValidationRemote = previous.originalMessage;

                    if ( valid ) {
                        submitted = validator.formSubmitted;
                        validator.prepareElement( element );
                        validator.formSubmitted = submitted;
                        validator.successList.push( element );
                        delete validator.invalid[ element.name ];
                        validator.showErrors();
                    } else {
                        errors = {};
                        message = response || validator.defaultMessage( element, "remote" );
                        errors[ element.name ]
                            = previous.message
                            = typeof message === "function" ? message( value ) : message[0];
                        validator.invalid[ element.name ] = true;
                        validator.showErrors( errors );
                    }
                    validator.showErrors(validator.errorMap);
                    previous.valid = valid;
                    validator.stopRequest( element, valid );
                }
            );
            return "pending";
        }, '');

        /**
         * Create JQueryValidation check to form requests.
         */
        $.validator.addMethod("laravelValidationFormRequest", function (value, element, params) {

            var validator = this,
                previous = validator.previousValue(element);

            var data = $(validator.currentForm).serializeArray();
            data.push({name: '__proengsoft_form_request', value: 1}); // must match FormRequest.JS_VALIDATION_FIELD

            // Skip AJAX if the value remains the same as a prior request.
            if (JSON.stringify(previous.old) === JSON.stringify(data)) {
                if (! previous.valid) {
                    validator.showErrors(previous.errors || {});
                }

                return previous.valid;
            }

            previous.old = data;
            this.startRequest( element );

            $.ajax(ajaxOpts(validator, element, params, data))
                .always(function( response, textStatus ) {
                    var errors = {},
                        valid = textStatus === 'success' && (response === true || response === 'true');

                    if (valid) {
                        validator.resetInternals();
                        validator.toHide = validator.errorsFor( element );
                    } else {
                        $.each( response, function( fieldName, errorMessages ) {
                            var errorElement = laravelValidation.helpers.findByName(validator, fieldName)[0];
                            if (errorElement) {
                                errors[errorElement.name] = laravelValidation.helpers.encode(errorMessages[0] || '');
                            }
                        });

                        // Failed to find the error fields so mark the form as valid otherwise user
                        // will be left in limbo with no visible error messages.
                        if ($.isEmptyObject(errors)) {
                            valid = true;
                        }
                    }

                    previous.valid = valid;
                    previous.errors = errors;
                    validator.showErrors(errors);
                    validator.stopRequest(element, valid);
                });

            return 'pending';
        }, '');
    }
};

$(function() {
    laravelValidation.init();
});

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./resources/assets/js/helpers.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/locutus/php/array/array_diff.js":
/*!******************************************************!*\
  !*** ./node_modules/locutus/php/array/array_diff.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function array_diff(arr1) {
  // eslint-disable-line camelcase
  //  discuss at: https://locutus.io/php/array_diff/
  // original by: Kevin van Zonneveld (https://kvz.io)
  // improved by: Sanjoy Roy
  //  revised by: Brett Zamir (https://brett-zamir.me)
  //   example 1: array_diff(['Kevin', 'van', 'Zonneveld'], ['van', 'Zonneveld'])
  //   returns 1: {0:'Kevin'}

  var retArr = {};
  var argl = arguments.length;
  var k1 = '';
  var i = 1;
  var k = '';
  var arr = {};

  arr1keys: for (k1 in arr1) {
    // eslint-disable-line no-labels
    for (i = 1; i < argl; i++) {
      arr = arguments[i];
      for (k in arr) {
        if (arr[k] === arr1[k1]) {
          // If it reaches here, it was found in at least one array, so try next value
          continue arr1keys; // eslint-disable-line no-labels
        }
      }
      retArr[k1] = arr1[k1];
    }
  }

  return retArr;
};
//# sourceMappingURL=array_diff.js.map

/***/ }),

/***/ "./node_modules/locutus/php/datetime/strtotime.js":
/*!********************************************************!*\
  !*** ./node_modules/locutus/php/datetime/strtotime.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var reSpace = '[ \\t]+';
var reSpaceOpt = '[ \\t]*';
var reMeridian = '(?:([ap])\\.?m\\.?([\\t ]|$))';
var reHour24 = '(2[0-4]|[01]?[0-9])';
var reHour24lz = '([01][0-9]|2[0-4])';
var reHour12 = '(0?[1-9]|1[0-2])';
var reMinute = '([0-5]?[0-9])';
var reMinutelz = '([0-5][0-9])';
var reSecond = '(60|[0-5]?[0-9])';
var reSecondlz = '(60|[0-5][0-9])';
var reFrac = '(?:\\.([0-9]+))';

var reDayfull = 'sunday|monday|tuesday|wednesday|thursday|friday|saturday';
var reDayabbr = 'sun|mon|tue|wed|thu|fri|sat';
var reDaytext = reDayfull + '|' + reDayabbr + '|weekdays?';

var reReltextnumber = 'first|second|third|fourth|fifth|sixth|seventh|eighth?|ninth|tenth|eleventh|twelfth';
var reReltexttext = 'next|last|previous|this';
var reReltextunit = '(?:second|sec|minute|min|hour|day|fortnight|forthnight|month|year)s?|weeks|' + reDaytext;

var reYear = '([0-9]{1,4})';
var reYear2 = '([0-9]{2})';
var reYear4 = '([0-9]{4})';
var reYear4withSign = '([+-]?[0-9]{4})';
var reMonth = '(1[0-2]|0?[0-9])';
var reMonthlz = '(0[0-9]|1[0-2])';
var reDay = '(?:(3[01]|[0-2]?[0-9])(?:st|nd|rd|th)?)';
var reDaylz = '(0[0-9]|[1-2][0-9]|3[01])';

var reMonthFull = 'january|february|march|april|may|june|july|august|september|october|november|december';
var reMonthAbbr = 'jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec';
var reMonthroman = 'i[vx]|vi{0,3}|xi{0,2}|i{1,3}';
var reMonthText = '(' + reMonthFull + '|' + reMonthAbbr + '|' + reMonthroman + ')';

var reTzCorrection = '((?:GMT)?([+-])' + reHour24 + ':?' + reMinute + '?)';
var reTzAbbr = '\\(?([a-zA-Z]{1,6})\\)?';
var reDayOfYear = '(00[1-9]|0[1-9][0-9]|[12][0-9][0-9]|3[0-5][0-9]|36[0-6])';
var reWeekOfYear = '(0[1-9]|[1-4][0-9]|5[0-3])';

var reDateNoYear = reMonthText + '[ .\\t-]*' + reDay + '[,.stndrh\\t ]*';

function processMeridian(hour, meridian) {
  meridian = meridian && meridian.toLowerCase();

  switch (meridian) {
    case 'a':
      hour += hour === 12 ? -12 : 0;
      break;
    case 'p':
      hour += hour !== 12 ? 12 : 0;
      break;
  }

  return hour;
}

function processYear(yearStr) {
  var year = +yearStr;

  if (yearStr.length < 4 && year < 100) {
    year += year < 70 ? 2000 : 1900;
  }

  return year;
}

function lookupMonth(monthStr) {
  return {
    jan: 0,
    january: 0,
    i: 0,
    feb: 1,
    february: 1,
    ii: 1,
    mar: 2,
    march: 2,
    iii: 2,
    apr: 3,
    april: 3,
    iv: 3,
    may: 4,
    v: 4,
    jun: 5,
    june: 5,
    vi: 5,
    jul: 6,
    july: 6,
    vii: 6,
    aug: 7,
    august: 7,
    viii: 7,
    sep: 8,
    sept: 8,
    september: 8,
    ix: 8,
    oct: 9,
    october: 9,
    x: 9,
    nov: 10,
    november: 10,
    xi: 10,
    dec: 11,
    december: 11,
    xii: 11
  }[monthStr.toLowerCase()];
}

function lookupWeekday(dayStr) {
  var desiredSundayNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  var dayNumbers = {
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
    sun: 0,
    sunday: 0
  };

  return dayNumbers[dayStr.toLowerCase()] || desiredSundayNumber;
}

function lookupRelative(relText) {
  var relativeNumbers = {
    last: -1,
    previous: -1,
    this: 0,
    first: 1,
    next: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eight: 8,
    eighth: 8,
    ninth: 9,
    tenth: 10,
    eleventh: 11,
    twelfth: 12
  };

  var relativeBehavior = {
    this: 1
  };

  var relTextLower = relText.toLowerCase();

  return {
    amount: relativeNumbers[relTextLower],
    behavior: relativeBehavior[relTextLower] || 0
  };
}

function processTzCorrection(tzOffset, oldValue) {
  var reTzCorrectionLoose = /(?:GMT)?([+-])(\d+)(:?)(\d{0,2})/i;
  tzOffset = tzOffset && tzOffset.match(reTzCorrectionLoose);

  if (!tzOffset) {
    return oldValue;
  }

  var sign = tzOffset[1] === '-' ? -1 : 1;
  var hours = +tzOffset[2];
  var minutes = +tzOffset[4];

  if (!tzOffset[4] && !tzOffset[3]) {
    minutes = Math.floor(hours % 100);
    hours = Math.floor(hours / 100);
  }

  // timezone offset in seconds
  return sign * (hours * 60 + minutes) * 60;
}

// tz abbrevation : tz offset in seconds
var tzAbbrOffsets = {
  acdt: 37800,
  acst: 34200,
  addt: -7200,
  adt: -10800,
  aedt: 39600,
  aest: 36000,
  ahdt: -32400,
  ahst: -36000,
  akdt: -28800,
  akst: -32400,
  amt: -13840,
  apt: -10800,
  ast: -14400,
  awdt: 32400,
  awst: 28800,
  awt: -10800,
  bdst: 7200,
  bdt: -36000,
  bmt: -14309,
  bst: 3600,
  cast: 34200,
  cat: 7200,
  cddt: -14400,
  cdt: -18000,
  cemt: 10800,
  cest: 7200,
  cet: 3600,
  cmt: -15408,
  cpt: -18000,
  cst: -21600,
  cwt: -18000,
  chst: 36000,
  dmt: -1521,
  eat: 10800,
  eddt: -10800,
  edt: -14400,
  eest: 10800,
  eet: 7200,
  emt: -26248,
  ept: -14400,
  est: -18000,
  ewt: -14400,
  ffmt: -14660,
  fmt: -4056,
  gdt: 39600,
  gmt: 0,
  gst: 36000,
  hdt: -34200,
  hkst: 32400,
  hkt: 28800,
  hmt: -19776,
  hpt: -34200,
  hst: -36000,
  hwt: -34200,
  iddt: 14400,
  idt: 10800,
  imt: 25025,
  ist: 7200,
  jdt: 36000,
  jmt: 8440,
  jst: 32400,
  kdt: 36000,
  kmt: 5736,
  kst: 30600,
  lst: 9394,
  mddt: -18000,
  mdst: 16279,
  mdt: -21600,
  mest: 7200,
  met: 3600,
  mmt: 9017,
  mpt: -21600,
  msd: 14400,
  msk: 10800,
  mst: -25200,
  mwt: -21600,
  nddt: -5400,
  ndt: -9052,
  npt: -9000,
  nst: -12600,
  nwt: -9000,
  nzdt: 46800,
  nzmt: 41400,
  nzst: 43200,
  pddt: -21600,
  pdt: -25200,
  pkst: 21600,
  pkt: 18000,
  plmt: 25590,
  pmt: -13236,
  ppmt: -17340,
  ppt: -25200,
  pst: -28800,
  pwt: -25200,
  qmt: -18840,
  rmt: 5794,
  sast: 7200,
  sdmt: -16800,
  sjmt: -20173,
  smt: -13884,
  sst: -39600,
  tbmt: 10751,
  tmt: 12344,
  uct: 0,
  utc: 0,
  wast: 7200,
  wat: 3600,
  wemt: 7200,
  west: 3600,
  wet: 0,
  wib: 25200,
  wita: 28800,
  wit: 32400,
  wmt: 5040,
  yddt: -25200,
  ydt: -28800,
  ypt: -28800,
  yst: -32400,
  ywt: -28800,
  a: 3600,
  b: 7200,
  c: 10800,
  d: 14400,
  e: 18000,
  f: 21600,
  g: 25200,
  h: 28800,
  i: 32400,
  k: 36000,
  l: 39600,
  m: 43200,
  n: -3600,
  o: -7200,
  p: -10800,
  q: -14400,
  r: -18000,
  s: -21600,
  t: -25200,
  u: -28800,
  v: -32400,
  w: -36000,
  x: -39600,
  y: -43200,
  z: 0
};

var formats = {
  yesterday: {
    regex: /^yesterday/i,
    name: 'yesterday',
    callback: function callback() {
      this.rd -= 1;
      return this.resetTime();
    }
  },

  now: {
    regex: /^now/i,
    name: 'now'
    // do nothing
  },

  noon: {
    regex: /^noon/i,
    name: 'noon',
    callback: function callback() {
      return this.resetTime() && this.time(12, 0, 0, 0);
    }
  },

  midnightOrToday: {
    regex: /^(midnight|today)/i,
    name: 'midnight | today',
    callback: function callback() {
      return this.resetTime();
    }
  },

  tomorrow: {
    regex: /^tomorrow/i,
    name: 'tomorrow',
    callback: function callback() {
      this.rd += 1;
      return this.resetTime();
    }
  },

  timestamp: {
    regex: /^@(-?\d+)/i,
    name: 'timestamp',
    callback: function callback(match, timestamp) {
      this.rs += +timestamp;
      this.y = 1970;
      this.m = 0;
      this.d = 1;
      this.dates = 0;

      return this.resetTime() && this.zone(0);
    }
  },

  firstOrLastDay: {
    regex: /^(first|last) day of/i,
    name: 'firstdayof | lastdayof',
    callback: function callback(match, day) {
      if (day.toLowerCase() === 'first') {
        this.firstOrLastDayOfMonth = 1;
      } else {
        this.firstOrLastDayOfMonth = -1;
      }
    }
  },

  backOrFrontOf: {
    regex: RegExp('^(back|front) of ' + reHour24 + reSpaceOpt + reMeridian + '?', 'i'),
    name: 'backof | frontof',
    callback: function callback(match, side, hours, meridian) {
      var back = side.toLowerCase() === 'back';
      var hour = +hours;
      var minute = 15;

      if (!back) {
        hour -= 1;
        minute = 45;
      }

      hour = processMeridian(hour, meridian);

      return this.resetTime() && this.time(hour, minute, 0, 0);
    }
  },

  weekdayOf: {
    regex: RegExp('^(' + reReltextnumber + '|' + reReltexttext + ')' + reSpace + '(' + reDayfull + '|' + reDayabbr + ')' + reSpace + 'of', 'i'),
    name: 'weekdayof'
    // todo
  },

  mssqltime: {
    regex: RegExp('^' + reHour12 + ':' + reMinutelz + ':' + reSecondlz + '[:.]([0-9]+)' + reMeridian, 'i'),
    name: 'mssqltime',
    callback: function callback(match, hour, minute, second, frac, meridian) {
      return this.time(processMeridian(+hour, meridian), +minute, +second, +frac.substr(0, 3));
    }
  },

  timeLong12: {
    regex: RegExp('^' + reHour12 + '[:.]' + reMinute + '[:.]' + reSecondlz + reSpaceOpt + reMeridian, 'i'),
    name: 'timelong12',
    callback: function callback(match, hour, minute, second, meridian) {
      return this.time(processMeridian(+hour, meridian), +minute, +second, 0);
    }
  },

  timeShort12: {
    regex: RegExp('^' + reHour12 + '[:.]' + reMinutelz + reSpaceOpt + reMeridian, 'i'),
    name: 'timeshort12',
    callback: function callback(match, hour, minute, meridian) {
      return this.time(processMeridian(+hour, meridian), +minute, 0, 0);
    }
  },

  timeTiny12: {
    regex: RegExp('^' + reHour12 + reSpaceOpt + reMeridian, 'i'),
    name: 'timetiny12',
    callback: function callback(match, hour, meridian) {
      return this.time(processMeridian(+hour, meridian), 0, 0, 0);
    }
  },

  soap: {
    regex: RegExp('^' + reYear4 + '-' + reMonthlz + '-' + reDaylz + 'T' + reHour24lz + ':' + reMinutelz + ':' + reSecondlz + reFrac + reTzCorrection + '?', 'i'),
    name: 'soap',
    callback: function callback(match, year, month, day, hour, minute, second, frac, tzCorrection) {
      return this.ymd(+year, month - 1, +day) && this.time(+hour, +minute, +second, +frac.substr(0, 3)) && this.zone(processTzCorrection(tzCorrection));
    }
  },

  wddx: {
    regex: RegExp('^' + reYear4 + '-' + reMonth + '-' + reDay + 'T' + reHour24 + ':' + reMinute + ':' + reSecond),
    name: 'wddx',
    callback: function callback(match, year, month, day, hour, minute, second) {
      return this.ymd(+year, month - 1, +day) && this.time(+hour, +minute, +second, 0);
    }
  },

  exif: {
    regex: RegExp('^' + reYear4 + ':' + reMonthlz + ':' + reDaylz + ' ' + reHour24lz + ':' + reMinutelz + ':' + reSecondlz, 'i'),
    name: 'exif',
    callback: function callback(match, year, month, day, hour, minute, second) {
      return this.ymd(+year, month - 1, +day) && this.time(+hour, +minute, +second, 0);
    }
  },

  xmlRpc: {
    regex: RegExp('^' + reYear4 + reMonthlz + reDaylz + 'T' + reHour24 + ':' + reMinutelz + ':' + reSecondlz),
    name: 'xmlrpc',
    callback: function callback(match, year, month, day, hour, minute, second) {
      return this.ymd(+year, month - 1, +day) && this.time(+hour, +minute, +second, 0);
    }
  },

  xmlRpcNoColon: {
    regex: RegExp('^' + reYear4 + reMonthlz + reDaylz + '[Tt]' + reHour24 + reMinutelz + reSecondlz),
    name: 'xmlrpcnocolon',
    callback: function callback(match, year, month, day, hour, minute, second) {
      return this.ymd(+year, month - 1, +day) && this.time(+hour, +minute, +second, 0);
    }
  },

  clf: {
    regex: RegExp('^' + reDay + '/(' + reMonthAbbr + ')/' + reYear4 + ':' + reHour24lz + ':' + reMinutelz + ':' + reSecondlz + reSpace + reTzCorrection, 'i'),
    name: 'clf',
    callback: function callback(match, day, month, year, hour, minute, second, tzCorrection) {
      return this.ymd(+year, lookupMonth(month), +day) && this.time(+hour, +minute, +second, 0) && this.zone(processTzCorrection(tzCorrection));
    }
  },

  iso8601long: {
    regex: RegExp('^t?' + reHour24 + '[:.]' + reMinute + '[:.]' + reSecond + reFrac, 'i'),
    name: 'iso8601long',
    callback: function callback(match, hour, minute, second, frac) {
      return this.time(+hour, +minute, +second, +frac.substr(0, 3));
    }
  },

  dateTextual: {
    regex: RegExp('^' + reMonthText + '[ .\\t-]*' + reDay + '[,.stndrh\\t ]+' + reYear, 'i'),
    name: 'datetextual',
    callback: function callback(match, month, day, year) {
      return this.ymd(processYear(year), lookupMonth(month), +day);
    }
  },

  pointedDate4: {
    regex: RegExp('^' + reDay + '[.\\t-]' + reMonth + '[.-]' + reYear4),
    name: 'pointeddate4',
    callback: function callback(match, day, month, year) {
      return this.ymd(+year, month - 1, +day);
    }
  },

  pointedDate2: {
    regex: RegExp('^' + reDay + '[.\\t]' + reMonth + '\\.' + reYear2),
    name: 'pointeddate2',
    callback: function callback(match, day, month, year) {
      return this.ymd(processYear(year), month - 1, +day);
    }
  },

  timeLong24: {
    regex: RegExp('^t?' + reHour24 + '[:.]' + reMinute + '[:.]' + reSecond),
    name: 'timelong24',
    callback: function callback(match, hour, minute, second) {
      return this.time(+hour, +minute, +second, 0);
    }
  },

  dateNoColon: {
    regex: RegExp('^' + reYear4 + reMonthlz + reDaylz),
    name: 'datenocolon',
    callback: function callback(match, year, month, day) {
      return this.ymd(+year, month - 1, +day);
    }
  },

  pgydotd: {
    regex: RegExp('^' + reYear4 + '\\.?' + reDayOfYear),
    name: 'pgydotd',
    callback: function callback(match, year, day) {
      return this.ymd(+year, 0, +day);
    }
  },

  timeShort24: {
    regex: RegExp('^t?' + reHour24 + '[:.]' + reMinute, 'i'),
    name: 'timeshort24',
    callback: function callback(match, hour, minute) {
      return this.time(+hour, +minute, 0, 0);
    }
  },

  iso8601noColon: {
    regex: RegExp('^t?' + reHour24lz + reMinutelz + reSecondlz, 'i'),
    name: 'iso8601nocolon',
    callback: function callback(match, hour, minute, second) {
      return this.time(+hour, +minute, +second, 0);
    }
  },

  iso8601dateSlash: {
    // eventhough the trailing slash is optional in PHP
    // here it's mandatory and inputs without the slash
    // are handled by dateslash
    regex: RegExp('^' + reYear4 + '/' + reMonthlz + '/' + reDaylz + '/'),
    name: 'iso8601dateslash',
    callback: function callback(match, year, month, day) {
      return this.ymd(+year, month - 1, +day);
    }
  },

  dateSlash: {
    regex: RegExp('^' + reYear4 + '/' + reMonth + '/' + reDay),
    name: 'dateslash',
    callback: function callback(match, year, month, day) {
      return this.ymd(+year, month - 1, +day);
    }
  },

  american: {
    regex: RegExp('^' + reMonth + '/' + reDay + '/' + reYear),
    name: 'american',
    callback: function callback(match, month, day, year) {
      return this.ymd(processYear(year), month - 1, +day);
    }
  },

  americanShort: {
    regex: RegExp('^' + reMonth + '/' + reDay),
    name: 'americanshort',
    callback: function callback(match, month, day) {
      return this.ymd(this.y, month - 1, +day);
    }
  },

  gnuDateShortOrIso8601date2: {
    // iso8601date2 is complete subset of gnudateshort
    regex: RegExp('^' + reYear + '-' + reMonth + '-' + reDay),
    name: 'gnudateshort | iso8601date2',
    callback: function callback(match, year, month, day) {
      return this.ymd(processYear(year), month - 1, +day);
    }
  },

  iso8601date4: {
    regex: RegExp('^' + reYear4withSign + '-' + reMonthlz + '-' + reDaylz),
    name: 'iso8601date4',
    callback: function callback(match, year, month, day) {
      return this.ymd(+year, month - 1, +day);
    }
  },

  gnuNoColon: {
    regex: RegExp('^t?' + reHour24lz + reMinutelz, 'i'),
    name: 'gnunocolon',
    callback: function callback(match, hour, minute) {
      // this rule is a special case
      // if time was already set once by any preceding rule, it sets the captured value as year
      switch (this.times) {
        case 0:
          return this.time(+hour, +minute, 0, this.f);
        case 1:
          this.y = hour * 100 + +minute;
          this.times++;

          return true;
        default:
          return false;
      }
    }
  },

  gnuDateShorter: {
    regex: RegExp('^' + reYear4 + '-' + reMonth),
    name: 'gnudateshorter',
    callback: function callback(match, year, month) {
      return this.ymd(+year, month - 1, 1);
    }
  },

  pgTextReverse: {
    // note: allowed years are from 32-9999
    // years below 32 should be treated as days in datefull
    regex: RegExp('^' + '(\\d{3,4}|[4-9]\\d|3[2-9])-(' + reMonthAbbr + ')-' + reDaylz, 'i'),
    name: 'pgtextreverse',
    callback: function callback(match, year, month, day) {
      return this.ymd(processYear(year), lookupMonth(month), +day);
    }
  },

  dateFull: {
    regex: RegExp('^' + reDay + '[ \\t.-]*' + reMonthText + '[ \\t.-]*' + reYear, 'i'),
    name: 'datefull',
    callback: function callback(match, day, month, year) {
      return this.ymd(processYear(year), lookupMonth(month), +day);
    }
  },

  dateNoDay: {
    regex: RegExp('^' + reMonthText + '[ .\\t-]*' + reYear4, 'i'),
    name: 'datenoday',
    callback: function callback(match, month, year) {
      return this.ymd(+year, lookupMonth(month), 1);
    }
  },

  dateNoDayRev: {
    regex: RegExp('^' + reYear4 + '[ .\\t-]*' + reMonthText, 'i'),
    name: 'datenodayrev',
    callback: function callback(match, year, month) {
      return this.ymd(+year, lookupMonth(month), 1);
    }
  },

  pgTextShort: {
    regex: RegExp('^(' + reMonthAbbr + ')-' + reDaylz + '-' + reYear, 'i'),
    name: 'pgtextshort',
    callback: function callback(match, month, day, year) {
      return this.ymd(processYear(year), lookupMonth(month), +day);
    }
  },

  dateNoYear: {
    regex: RegExp('^' + reDateNoYear, 'i'),
    name: 'datenoyear',
    callback: function callback(match, month, day) {
      return this.ymd(this.y, lookupMonth(month), +day);
    }
  },

  dateNoYearRev: {
    regex: RegExp('^' + reDay + '[ .\\t-]*' + reMonthText, 'i'),
    name: 'datenoyearrev',
    callback: function callback(match, day, month) {
      return this.ymd(this.y, lookupMonth(month), +day);
    }
  },

  isoWeekDay: {
    regex: RegExp('^' + reYear4 + '-?W' + reWeekOfYear + '(?:-?([0-7]))?'),
    name: 'isoweekday | isoweek',
    callback: function callback(match, year, week, day) {
      day = day ? +day : 1;

      if (!this.ymd(+year, 0, 1)) {
        return false;
      }

      // get day of week for Jan 1st
      var dayOfWeek = new Date(this.y, this.m, this.d).getDay();

      // and use the day to figure out the offset for day 1 of week 1
      dayOfWeek = 0 - (dayOfWeek > 4 ? dayOfWeek - 7 : dayOfWeek);

      this.rd += dayOfWeek + (week - 1) * 7 + day;
    }
  },

  relativeText: {
    regex: RegExp('^(' + reReltextnumber + '|' + reReltexttext + ')' + reSpace + '(' + reReltextunit + ')', 'i'),
    name: 'relativetext',
    callback: function callback(match, relValue, relUnit) {
      // todo: implement handling of 'this time-unit'
      // eslint-disable-next-line no-unused-vars
      var _lookupRelative = lookupRelative(relValue),
          amount = _lookupRelative.amount,
          behavior = _lookupRelative.behavior;

      switch (relUnit.toLowerCase()) {
        case 'sec':
        case 'secs':
        case 'second':
        case 'seconds':
          this.rs += amount;
          break;
        case 'min':
        case 'mins':
        case 'minute':
        case 'minutes':
          this.ri += amount;
          break;
        case 'hour':
        case 'hours':
          this.rh += amount;
          break;
        case 'day':
        case 'days':
          this.rd += amount;
          break;
        case 'fortnight':
        case 'fortnights':
        case 'forthnight':
        case 'forthnights':
          this.rd += amount * 14;
          break;
        case 'week':
        case 'weeks':
          this.rd += amount * 7;
          break;
        case 'month':
        case 'months':
          this.rm += amount;
          break;
        case 'year':
        case 'years':
          this.ry += amount;
          break;
        case 'mon':case 'monday':
        case 'tue':case 'tuesday':
        case 'wed':case 'wednesday':
        case 'thu':case 'thursday':
        case 'fri':case 'friday':
        case 'sat':case 'saturday':
        case 'sun':case 'sunday':
          this.resetTime();
          this.weekday = lookupWeekday(relUnit, 7);
          this.weekdayBehavior = 1;
          this.rd += (amount > 0 ? amount - 1 : amount) * 7;
          break;
        case 'weekday':
        case 'weekdays':
          // todo
          break;
      }
    }
  },

  relative: {
    regex: RegExp('^([+-]*)[ \\t]*(\\d+)' + reSpaceOpt + '(' + reReltextunit + '|week)', 'i'),
    name: 'relative',
    callback: function callback(match, signs, relValue, relUnit) {
      var minuses = signs.replace(/[^-]/g, '').length;

      var amount = +relValue * Math.pow(-1, minuses);

      switch (relUnit.toLowerCase()) {
        case 'sec':
        case 'secs':
        case 'second':
        case 'seconds':
          this.rs += amount;
          break;
        case 'min':
        case 'mins':
        case 'minute':
        case 'minutes':
          this.ri += amount;
          break;
        case 'hour':
        case 'hours':
          this.rh += amount;
          break;
        case 'day':
        case 'days':
          this.rd += amount;
          break;
        case 'fortnight':
        case 'fortnights':
        case 'forthnight':
        case 'forthnights':
          this.rd += amount * 14;
          break;
        case 'week':
        case 'weeks':
          this.rd += amount * 7;
          break;
        case 'month':
        case 'months':
          this.rm += amount;
          break;
        case 'year':
        case 'years':
          this.ry += amount;
          break;
        case 'mon':case 'monday':
        case 'tue':case 'tuesday':
        case 'wed':case 'wednesday':
        case 'thu':case 'thursday':
        case 'fri':case 'friday':
        case 'sat':case 'saturday':
        case 'sun':case 'sunday':
          this.resetTime();
          this.weekday = lookupWeekday(relUnit, 7);
          this.weekdayBehavior = 1;
          this.rd += (amount > 0 ? amount - 1 : amount) * 7;
          break;
        case 'weekday':
        case 'weekdays':
          // todo
          break;
      }
    }
  },

  dayText: {
    regex: RegExp('^(' + reDaytext + ')', 'i'),
    name: 'daytext',
    callback: function callback(match, dayText) {
      this.resetTime();
      this.weekday = lookupWeekday(dayText, 0);

      if (this.weekdayBehavior !== 2) {
        this.weekdayBehavior = 1;
      }
    }
  },

  relativeTextWeek: {
    regex: RegExp('^(' + reReltexttext + ')' + reSpace + 'week', 'i'),
    name: 'relativetextweek',
    callback: function callback(match, relText) {
      this.weekdayBehavior = 2;

      switch (relText.toLowerCase()) {
        case 'this':
          this.rd += 0;
          break;
        case 'next':
          this.rd += 7;
          break;
        case 'last':
        case 'previous':
          this.rd -= 7;
          break;
      }

      if (isNaN(this.weekday)) {
        this.weekday = 1;
      }
    }
  },

  monthFullOrMonthAbbr: {
    regex: RegExp('^(' + reMonthFull + '|' + reMonthAbbr + ')', 'i'),
    name: 'monthfull | monthabbr',
    callback: function callback(match, month) {
      return this.ymd(this.y, lookupMonth(month), this.d);
    }
  },

  tzCorrection: {
    regex: RegExp('^' + reTzCorrection, 'i'),
    name: 'tzcorrection',
    callback: function callback(tzCorrection) {
      return this.zone(processTzCorrection(tzCorrection));
    }
  },

  tzAbbr: {
    regex: RegExp('^' + reTzAbbr),
    name: 'tzabbr',
    callback: function callback(match, abbr) {
      var offset = tzAbbrOffsets[abbr.toLowerCase()];

      if (isNaN(offset)) {
        return false;
      }

      return this.zone(offset);
    }
  },

  ago: {
    regex: /^ago/i,
    name: 'ago',
    callback: function callback() {
      this.ry = -this.ry;
      this.rm = -this.rm;
      this.rd = -this.rd;
      this.rh = -this.rh;
      this.ri = -this.ri;
      this.rs = -this.rs;
      this.rf = -this.rf;
    }
  },

  year4: {
    regex: RegExp('^' + reYear4),
    name: 'year4',
    callback: function callback(match, year) {
      this.y = +year;
      return true;
    }
  },

  whitespace: {
    regex: /^[ .,\t]+/,
    name: 'whitespace'
    // do nothing
  },

  dateShortWithTimeLong: {
    regex: RegExp('^' + reDateNoYear + 't?' + reHour24 + '[:.]' + reMinute + '[:.]' + reSecond, 'i'),
    name: 'dateshortwithtimelong',
    callback: function callback(match, month, day, hour, minute, second) {
      return this.ymd(this.y, lookupMonth(month), +day) && this.time(+hour, +minute, +second, 0);
    }
  },

  dateShortWithTimeLong12: {
    regex: RegExp('^' + reDateNoYear + reHour12 + '[:.]' + reMinute + '[:.]' + reSecondlz + reSpaceOpt + reMeridian, 'i'),
    name: 'dateshortwithtimelong12',
    callback: function callback(match, month, day, hour, minute, second, meridian) {
      return this.ymd(this.y, lookupMonth(month), +day) && this.time(processMeridian(+hour, meridian), +minute, +second, 0);
    }
  },

  dateShortWithTimeShort: {
    regex: RegExp('^' + reDateNoYear + 't?' + reHour24 + '[:.]' + reMinute, 'i'),
    name: 'dateshortwithtimeshort',
    callback: function callback(match, month, day, hour, minute) {
      return this.ymd(this.y, lookupMonth(month), +day) && this.time(+hour, +minute, 0, 0);
    }
  },

  dateShortWithTimeShort12: {
    regex: RegExp('^' + reDateNoYear + reHour12 + '[:.]' + reMinutelz + reSpaceOpt + reMeridian, 'i'),
    name: 'dateshortwithtimeshort12',
    callback: function callback(match, month, day, hour, minute, meridian) {
      return this.ymd(this.y, lookupMonth(month), +day) && this.time(processMeridian(+hour, meridian), +minute, 0, 0);
    }
  }
};

var resultProto = {
  // date
  y: NaN,
  m: NaN,
  d: NaN,
  // time
  h: NaN,
  i: NaN,
  s: NaN,
  f: NaN,

  // relative shifts
  ry: 0,
  rm: 0,
  rd: 0,
  rh: 0,
  ri: 0,
  rs: 0,
  rf: 0,

  // weekday related shifts
  weekday: NaN,
  weekdayBehavior: 0,

  // first or last day of month
  // 0 none, 1 first, -1 last
  firstOrLastDayOfMonth: 0,

  // timezone correction in minutes
  z: NaN,

  // counters
  dates: 0,
  times: 0,
  zones: 0,

  // helper functions
  ymd: function ymd(y, m, d) {
    if (this.dates > 0) {
      return false;
    }

    this.dates++;
    this.y = y;
    this.m = m;
    this.d = d;
    return true;
  },
  time: function time(h, i, s, f) {
    if (this.times > 0) {
      return false;
    }

    this.times++;
    this.h = h;
    this.i = i;
    this.s = s;
    this.f = f;

    return true;
  },
  resetTime: function resetTime() {
    this.h = 0;
    this.i = 0;
    this.s = 0;
    this.f = 0;
    this.times = 0;

    return true;
  },
  zone: function zone(minutes) {
    if (this.zones <= 1) {
      this.zones++;
      this.z = minutes;
      return true;
    }

    return false;
  },
  toDate: function toDate(relativeTo) {
    if (this.dates && !this.times) {
      this.h = this.i = this.s = this.f = 0;
    }

    // fill holes
    if (isNaN(this.y)) {
      this.y = relativeTo.getFullYear();
    }

    if (isNaN(this.m)) {
      this.m = relativeTo.getMonth();
    }

    if (isNaN(this.d)) {
      this.d = relativeTo.getDate();
    }

    if (isNaN(this.h)) {
      this.h = relativeTo.getHours();
    }

    if (isNaN(this.i)) {
      this.i = relativeTo.getMinutes();
    }

    if (isNaN(this.s)) {
      this.s = relativeTo.getSeconds();
    }

    if (isNaN(this.f)) {
      this.f = relativeTo.getMilliseconds();
    }

    // adjust special early
    switch (this.firstOrLastDayOfMonth) {
      case 1:
        this.d = 1;
        break;
      case -1:
        this.d = 0;
        this.m += 1;
        break;
    }

    if (!isNaN(this.weekday)) {
      var date = new Date(relativeTo.getTime());
      date.setFullYear(this.y, this.m, this.d);
      date.setHours(this.h, this.i, this.s, this.f);

      var dow = date.getDay();

      if (this.weekdayBehavior === 2) {
        // To make "this week" work, where the current day of week is a "sunday"
        if (dow === 0 && this.weekday !== 0) {
          this.weekday = -6;
        }

        // To make "sunday this week" work, where the current day of week is not a "sunday"
        if (this.weekday === 0 && dow !== 0) {
          this.weekday = 7;
        }

        this.d -= dow;
        this.d += this.weekday;
      } else {
        var diff = this.weekday - dow;

        // some PHP magic
        if (this.rd < 0 && diff < 0 || this.rd >= 0 && diff <= -this.weekdayBehavior) {
          diff += 7;
        }

        if (this.weekday >= 0) {
          this.d += diff;
        } else {
          this.d -= 7 - (Math.abs(this.weekday) - dow);
        }

        this.weekday = NaN;
      }
    }

    // adjust relative
    this.y += this.ry;
    this.m += this.rm;
    this.d += this.rd;

    this.h += this.rh;
    this.i += this.ri;
    this.s += this.rs;
    this.f += this.rf;

    this.ry = this.rm = this.rd = 0;
    this.rh = this.ri = this.rs = this.rf = 0;

    var result = new Date(relativeTo.getTime());
    // since Date constructor treats years <= 99 as 1900+
    // it can't be used, thus this weird way
    result.setFullYear(this.y, this.m, this.d);
    result.setHours(this.h, this.i, this.s, this.f);

    // note: this is done twice in PHP
    // early when processing special relatives
    // and late
    // todo: check if the logic can be reduced
    // to just one time action
    switch (this.firstOrLastDayOfMonth) {
      case 1:
        result.setDate(1);
        break;
      case -1:
        result.setMonth(result.getMonth() + 1, 0);
        break;
    }

    // adjust timezone
    if (!isNaN(this.z) && result.getTimezoneOffset() !== this.z) {
      result.setUTCFullYear(result.getFullYear(), result.getMonth(), result.getDate());

      result.setUTCHours(result.getHours(), result.getMinutes(), result.getSeconds() - this.z, result.getMilliseconds());
    }

    return result;
  }
};

module.exports = function strtotime(str, now) {
  //       discuss at: https://locutus.io/php/strtotime/
  //      original by: Caio Ariede (https://caioariede.com)
  //      improved by: Kevin van Zonneveld (https://kvz.io)
  //      improved by: Caio Ariede (https://caioariede.com)
  //      improved by: A. Matías Quezada (https://amatiasq.com)
  //      improved by: preuter
  //      improved by: Brett Zamir (https://brett-zamir.me)
  //      improved by: Mirko Faber
  //         input by: David
  //      bugfixed by: Wagner B. Soares
  //      bugfixed by: Artur Tchernychev
  //      bugfixed by: Stephan Bösch-Plepelits (https://github.com/plepe)
  // reimplemented by: Rafał Kukawski
  //           note 1: Examples all have a fixed timestamp to prevent
  //           note 1: tests to fail because of variable time(zones)
  //        example 1: strtotime('+1 day', 1129633200)
  //        returns 1: 1129719600
  //        example 2: strtotime('+1 week 2 days 4 hours 2 seconds', 1129633200)
  //        returns 2: 1130425202
  //        example 3: strtotime('last month', 1129633200)
  //        returns 3: 1127041200
  //        example 4: strtotime('2009-05-04 08:30:00+00')
  //        returns 4: 1241425800
  //        example 5: strtotime('2009-05-04 08:30:00+02:00')
  //        returns 5: 1241418600
  //        example 6: strtotime('2009-05-04 08:30:00 YWT')
  //        returns 6: 1241454600

  if (now == null) {
    now = Math.floor(Date.now() / 1000);
  }

  // the rule order is important
  // if multiple rules match, the longest match wins
  // if multiple rules match the same string, the first match wins
  var rules = [formats.yesterday, formats.now, formats.noon, formats.midnightOrToday, formats.tomorrow, formats.timestamp, formats.firstOrLastDay, formats.backOrFrontOf,
  // formats.weekdayOf, // not yet implemented
  formats.timeTiny12, formats.timeShort12, formats.timeLong12, formats.mssqltime, formats.timeShort24, formats.timeLong24, formats.iso8601long, formats.gnuNoColon, formats.iso8601noColon, formats.americanShort, formats.american, formats.iso8601date4, formats.iso8601dateSlash, formats.dateSlash, formats.gnuDateShortOrIso8601date2, formats.gnuDateShorter, formats.dateFull, formats.pointedDate4, formats.pointedDate2, formats.dateNoDay, formats.dateNoDayRev, formats.dateTextual, formats.dateNoYear, formats.dateNoYearRev, formats.dateNoColon, formats.xmlRpc, formats.xmlRpcNoColon, formats.soap, formats.wddx, formats.exif, formats.pgydotd, formats.isoWeekDay, formats.pgTextShort, formats.pgTextReverse, formats.clf, formats.year4, formats.ago, formats.dayText, formats.relativeTextWeek, formats.relativeText, formats.monthFullOrMonthAbbr, formats.tzCorrection, formats.tzAbbr, formats.dateShortWithTimeShort12, formats.dateShortWithTimeLong12, formats.dateShortWithTimeShort, formats.dateShortWithTimeLong, formats.relative, formats.whitespace];

  var result = Object.create(resultProto);

  while (str.length) {
    var longestMatch = null;
    var finalRule = null;

    for (var i = 0, l = rules.length; i < l; i++) {
      var format = rules[i];

      var match = str.match(format.regex);

      if (match) {
        if (!longestMatch || match[0].length > longestMatch[0].length) {
          longestMatch = match;
          finalRule = format;
        }
      }
    }

    if (!finalRule || finalRule.callback && finalRule.callback.apply(result, longestMatch) === false) {
      return false;
    }

    str = str.substr(longestMatch[0].length);
    finalRule = null;
    longestMatch = null;
  }

  return Math.floor(result.toDate(new Date(now * 1000)) / 1000);
};
//# sourceMappingURL=strtotime.js.map

/***/ }),

/***/ "./node_modules/locutus/php/info/ini_get.js":
/*!**************************************************!*\
  !*** ./node_modules/locutus/php/info/ini_get.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

module.exports = function ini_get(varname) {
  // eslint-disable-line camelcase
  //  discuss at: https://locutus.io/php/ini_get/
  // original by: Brett Zamir (https://brett-zamir.me)
  //      note 1: The ini values must be set by ini_set or manually within an ini file
  //   example 1: ini_set('date.timezone', 'Asia/Hong_Kong')
  //   example 1: ini_get('date.timezone')
  //   returns 1: 'Asia/Hong_Kong'

  var $global = typeof window !== 'undefined' ? window : global;
  $global.$locutus = $global.$locutus || {};
  var $locutus = $global.$locutus;
  $locutus.php = $locutus.php || {};
  $locutus.php.ini = $locutus.php.ini || {};

  if ($locutus.php.ini[varname] && $locutus.php.ini[varname].local_value !== undefined) {
    if ($locutus.php.ini[varname].local_value === null) {
      return '';
    }
    return $locutus.php.ini[varname].local_value;
  }

  return '';
};
//# sourceMappingURL=ini_get.js.map
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../webpack-stream/node_modules/webpack/buildin/global.js */ "./node_modules/webpack-stream/node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/locutus/php/strings/strlen.js":
/*!****************************************************!*\
  !*** ./node_modules/locutus/php/strings/strlen.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function strlen(string) {
  //  discuss at: https://locutus.io/php/strlen/
  // original by: Kevin van Zonneveld (https://kvz.io)
  // improved by: Sakimori
  // improved by: Kevin van Zonneveld (https://kvz.io)
  //    input by: Kirk Strobeck
  // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
  //  revised by: Brett Zamir (https://brett-zamir.me)
  //      note 1: May look like overkill, but in order to be truly faithful to handling all Unicode
  //      note 1: characters and to this function in PHP which does not count the number of bytes
  //      note 1: but counts the number of characters, something like this is really necessary.
  //   example 1: strlen('Kevin van Zonneveld')
  //   returns 1: 19
  //   example 2: ini_set('unicode.semantics', 'on')
  //   example 2: strlen('A\ud87e\udc04Z')
  //   returns 2: 3

  var str = string + '';

  var iniVal = ( true ? __webpack_require__(/*! ../info/ini_get */ "./node_modules/locutus/php/info/ini_get.js")('unicode.semantics') : undefined) || 'off';
  if (iniVal === 'off') {
    return str.length;
  }

  var i = 0;
  var lgth = 0;

  var getWholeChar = function getWholeChar(str, i) {
    var code = str.charCodeAt(i);
    var next = '';
    var prev = '';
    if (code >= 0xD800 && code <= 0xDBFF) {
      // High surrogate (could change last hex to 0xDB7F to
      // treat high private surrogates as single characters)
      if (str.length <= i + 1) {
        throw new Error('High surrogate without following low surrogate');
      }
      next = str.charCodeAt(i + 1);
      if (next < 0xDC00 || next > 0xDFFF) {
        throw new Error('High surrogate without following low surrogate');
      }
      return str.charAt(i) + str.charAt(i + 1);
    } else if (code >= 0xDC00 && code <= 0xDFFF) {
      // Low surrogate
      if (i === 0) {
        throw new Error('Low surrogate without preceding high surrogate');
      }
      prev = str.charCodeAt(i - 1);
      if (prev < 0xD800 || prev > 0xDBFF) {
        // (could change last hex to 0xDB7F to treat high private surrogates
        // as single characters)
        throw new Error('Low surrogate without preceding high surrogate');
      }
      // We can pass over low surrogates now as the second
      // component in a pair which we have already processed
      return false;
    }
    return str.charAt(i);
  };

  for (i = 0, lgth = 0; i < str.length; i++) {
    if (getWholeChar(str, i) === false) {
      continue;
    }
    // Adapt this line at the top of any loop, passing in the whole string and
    // the current iteration and returning a variable to represent the individual character;
    // purpose is to treat the first part of a surrogate pair as the whole character and then
    // ignore the second part
    lgth++;
  }

  return lgth;
};
//# sourceMappingURL=strlen.js.map

/***/ }),

/***/ "./node_modules/locutus/php/var/is_numeric.js":
/*!****************************************************!*\
  !*** ./node_modules/locutus/php/var/is_numeric.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function is_numeric(mixedVar) {
  // eslint-disable-line camelcase
  //  discuss at: https://locutus.io/php/is_numeric/
  // original by: Kevin van Zonneveld (https://kvz.io)
  // improved by: David
  // improved by: taith
  // bugfixed by: Tim de Koning
  // bugfixed by: WebDevHobo (https://webdevhobo.blogspot.com/)
  // bugfixed by: Brett Zamir (https://brett-zamir.me)
  // bugfixed by: Denis Chenu (https://shnoulle.net)
  //   example 1: is_numeric(186.31)
  //   returns 1: true
  //   example 2: is_numeric('Kevin van Zonneveld')
  //   returns 2: false
  //   example 3: is_numeric(' +186.31e2')
  //   returns 3: true
  //   example 4: is_numeric('')
  //   returns 4: false
  //   example 5: is_numeric([])
  //   returns 5: false
  //   example 6: is_numeric('1 ')
  //   returns 6: false

  var whitespace = [' ', '\n', '\r', '\t', '\f', '\x0b', '\xa0', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200A', '\u200B', '\u2028', '\u2029', '\u3000'].join('');

  // @todo: Break this up using many single conditions with early returns
  return (typeof mixedVar === 'number' || typeof mixedVar === 'string' && whitespace.indexOf(mixedVar.slice(-1)) === -1) && mixedVar !== '' && !isNaN(mixedVar);
};
//# sourceMappingURL=is_numeric.js.map

/***/ }),

/***/ "./node_modules/webpack-stream/node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./resources/assets/js/helpers.js":
/*!****************************************!*\
  !*** ./resources/assets/js/helpers.js ***!
  \****************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var locutus_php_strings_strlen__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! locutus/php/strings/strlen */ "./node_modules/locutus/php/strings/strlen.js");
/* harmony import */ var locutus_php_strings_strlen__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(locutus_php_strings_strlen__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var locutus_php_array_array_diff__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! locutus/php/array/array_diff */ "./node_modules/locutus/php/array/array_diff.js");
/* harmony import */ var locutus_php_array_array_diff__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(locutus_php_array_array_diff__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var locutus_php_datetime_strtotime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! locutus/php/datetime/strtotime */ "./node_modules/locutus/php/datetime/strtotime.js");
/* harmony import */ var locutus_php_datetime_strtotime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(locutus_php_datetime_strtotime__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var locutus_php_var_is_numeric__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! locutus/php/var/is_numeric */ "./node_modules/locutus/php/var/is_numeric.js");
/* harmony import */ var locutus_php_var_is_numeric__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(locutus_php_var_is_numeric__WEBPACK_IMPORTED_MODULE_3__);
/*!
 * Laravel Javascript Validation
 *
 * https://github.com/proengsoft/laravel-jsvalidation
 *
 * Helper functions used by validators
 *
 * Copyright (c) 2017 Proengsoft
 * Released under the MIT license
 */




$.extend(true, laravelValidation, {
  helpers: {
    /**
     * Numeric rules
     */
    numericRules: ['Integer', 'Numeric'],

    /**
     * Gets the file information from file input.
     *
     * @param fieldObj
     * @param index
     * @returns {{file: *, extension: string, size: number}}
     */
    fileinfo: function (fieldObj, index) {
      var FileName = fieldObj.value;
      index = typeof index !== 'undefined' ? index : 0;

      if (fieldObj.files !== null) {
        if (typeof fieldObj.files[index] !== 'undefined') {
          return {
            file: FileName,
            extension: FileName.substr(FileName.lastIndexOf('.') + 1),
            size: fieldObj.files[index].size / 1024,
            type: fieldObj.files[index].type
          };
        }
      }

      return false;
    },

    /**
     * Gets the selectors for th specified field names.
     *
     * @param names
     * @returns {string}
     */
    selector: function (names) {
      var selector = [];

      if (!this.isArray(names)) {
        names = [names];
      }

      for (var i = 0; i < names.length; i++) {
        selector.push("[name='" + names[i] + "']");
      }

      return selector.join();
    },

    /**
     * Check if element has numeric rules.
     *
     * @param element
     * @returns {boolean}
     */
    hasNumericRules: function (element) {
      return this.hasRules(element, this.numericRules);
    },

    /**
     * Check if element has passed rules.
     *
     * @param element
     * @param rules
     * @returns {boolean}
     */
    hasRules: function (element, rules) {
      var found = false;

      if (typeof rules === 'string') {
        rules = [rules];
      }

      var validator = $.data(element.form, "validator");
      var listRules = [];
      var cache = validator.arrayRulesCache;

      if (element.name in cache) {
        $.each(cache[element.name], function (index, arrayRule) {
          listRules.push(arrayRule);
        });
      }

      if (element.name in validator.settings.rules) {
        listRules.push(validator.settings.rules[element.name]);
      }

      $.each(listRules, function (index, objRules) {
        if ('laravelValidation' in objRules) {
          var _rules = objRules.laravelValidation;

          for (var i = 0; i < _rules.length; i++) {
            if ($.inArray(_rules[i][0], rules) !== -1) {
              found = true;
              return false;
            }
          }
        }
      });
      return found;
    },

    /**
     * Return the string length using PHP function.
     * http://php.net/manual/en/function.strlen.php
     * http://phpjs.org/functions/strlen/
     *
     * @param string
     */
    strlen: function (string) {
      return locutus_php_strings_strlen__WEBPACK_IMPORTED_MODULE_0___default()(string);
    },

    /**
     * Get the size of the object depending of his type.
     *
     * @param obj
     * @param element
     * @param value
     * @returns int
     */
    getSize: function getSize(obj, element, value) {
      if (this.hasNumericRules(element) && this.is_numeric(value)) {
        return parseFloat(value);
      } else if (this.isArray(value)) {
        return parseFloat(value.length);
      } else if (element.type === 'file') {
        return parseFloat(Math.floor(this.fileinfo(element).size));
      }

      return parseFloat(this.strlen(value));
    },

    /**
     * Return specified rule from element.
     *
     * @param rule
     * @param element
     * @returns object
     */
    getLaravelValidation: function (rule, element) {
      var found = undefined;
      $.each($.validator.staticRules(element), function (key, rules) {
        if (key === "laravelValidation") {
          $.each(rules, function (i, value) {
            if (value[0] === rule) {
              found = value;
            }
          });
        }
      });
      return found;
    },

    /**
     * Return he timestamp of value passed using format or default format in element.
     *
     * @param value
     * @param format
     * @returns {boolean|int}
     */
    parseTime: function (value, format) {
      var timeValue = false;
      var fmt = new DateFormatter();

      if (typeof format === 'object') {
        var dateRule = this.getLaravelValidation('DateFormat', format);

        if (dateRule !== undefined) {
          format = dateRule[1][0];
        } else {
          format = null;
        }
      }

      if (format == null) {
        timeValue = this.strtotime(value);
      } else {
        timeValue = fmt.parseDate(value, format);

        if (timeValue) {
          timeValue = Math.round(timeValue.getTime() / 1000);
        }
      }

      return timeValue;
    },

    /**
     * Compare a given date against another using an operator.
     *
     * @param validator
     * @param value
     * @param element
     * @param params
     * @param operator
     * @return {boolean}
     */
    compareDates: function (validator, value, element, params, operator) {
      var timeCompare = this.parseTime(params);

      if (!timeCompare) {
        var target = this.dependentElement(validator, element, params);

        if (target === undefined) {
          return false;
        }

        timeCompare = this.parseTime(validator.elementValue(target), target);
      }

      var timeValue = this.parseTime(value, element);

      if (timeValue === false) {
        return false;
      }

      switch (operator) {
        case '<':
          return timeValue < timeCompare;

        case '<=':
          return timeValue <= timeCompare;

        case '==':
        case '===':
          return timeValue === timeCompare;

        case '>':
          return timeValue > timeCompare;

        case '>=':
          return timeValue >= timeCompare;

        default:
          throw new Error('Unsupported operator.');
      }
    },

    /**
     * This method allows you to intelligently guess the date by closely matching the specific format.
     *
     * @param value
     * @param format
     * @returns {Date}
     */
    guessDate: function (value, format) {
      var fmt = new DateFormatter();
      return fmt.guessDate(value, format);
    },

    /**
     * Returns Unix timestamp based on PHP function strototime.
     * http://php.net/manual/es/function.strtotime.php
     * http://phpjs.org/functions/strtotime/
     *
     * @param text
     * @param now
     * @returns {*}
     */
    strtotime: function (text, now) {
      return locutus_php_datetime_strtotime__WEBPACK_IMPORTED_MODULE_2___default()(text, now);
    },

    /**
     * Returns if value is numeric.
     * http://php.net/manual/es/var.is_numeric.php
     * http://phpjs.org/functions/is_numeric/
     *
     * @param mixed_var
     * @returns {*}
     */
    is_numeric: function (mixed_var) {
      return locutus_php_var_is_numeric__WEBPACK_IMPORTED_MODULE_3___default()(mixed_var);
    },

    /**
     * Check whether the argument is of type Array.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray#Polyfill
     *
     * @param arg
     * @returns {boolean}
     */
    isArray: function (arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    },

    /**
     * Returns Array diff based on PHP function array_diff.
     * http://php.net/manual/es/function.array_diff.php
     * http://phpjs.org/functions/array_diff/
     *
     * @param arr1
     * @param arr2
     * @returns {*}
     */
    arrayDiff: function (arr1, arr2) {
      return locutus_php_array_array_diff__WEBPACK_IMPORTED_MODULE_1___default()(arr1, arr2);
    },

    /**
     * Check whether two arrays are equal to one another.
     *
     * @param arr1
     * @param arr2
     * @returns {*}
     */
    arrayEquals: function (arr1, arr2) {
      if (!this.isArray(arr1) || !this.isArray(arr2)) {
        return false;
      }

      if (arr1.length !== arr2.length) {
        return false;
      }

      return $.isEmptyObject(this.arrayDiff(arr1, arr2));
    },

    /**
     * Makes element dependant from other.
     *
     * @param validator
     * @param element
     * @param name
     * @returns {*}
     */
    dependentElement: function (validator, element, name) {
      var el = validator.findByName(name);

      if (el[0] !== undefined && validator.settings.onfocusout) {
        var event = 'blur';

        if (el[0].tagName === 'SELECT' || el[0].tagName === 'OPTION' || el[0].type === 'checkbox' || el[0].type === 'radio') {
          event = 'click';
        }

        var ruleName = '.validate-laravelValidation';
        el.off(ruleName).off(event + ruleName + '-' + element.name).on(event + ruleName + '-' + element.name, function () {
          $(element).valid();
        });
      }

      return el[0];
    },

    /**
     * Parses error Ajax response and gets the message.
     *
     * @param response
     * @returns {string[]}
     */
    parseErrorResponse: function (response) {
      var newResponse = ['Whoops, looks like something went wrong.'];

      if ('responseText' in response) {
        var errorMsg = response.responseText.match(/<h1\s*>(.*)<\/h1\s*>/i);

        if (this.isArray(errorMsg)) {
          newResponse = [errorMsg[1]];
        }
      }

      return newResponse;
    },

    /**
     * Escape string to use as Regular Expression.
     *
     * @param str
     * @returns string
     */
    escapeRegExp: function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    /**
     * Generate RegExp from wildcard attributes.
     *
     * @param name
     * @returns {RegExp}
     */
    regexFromWildcard: function (name) {
      var nameParts = name.split("[*]");

      if (nameParts.length === 1) {
        nameParts.push('');
      }

      var regexpParts = nameParts.map(function (currentValue, index) {
        if (index % 2 === 0) {
          currentValue = currentValue + '[';
        } else {
          currentValue = ']' + currentValue;
        }

        return laravelValidation.helpers.escapeRegExp(currentValue);
      });
      return new RegExp('^' + regexpParts.join('[^\\]]*') + '$');
    },

    /**
     * Merge additional laravel validation rules into the current rule set.
     *
     * @param {object} rules
     * @param {object} newRules
     * @returns {object}
     */
    mergeRules: function (rules, newRules) {
      var rulesList = {
        'laravelValidation': newRules.laravelValidation || [],
        'laravelValidationRemote': newRules.laravelValidationRemote || []
      };

      for (var key in rulesList) {
        if (rulesList[key].length === 0) {
          continue;
        }

        if (typeof rules[key] === "undefined") {
          rules[key] = [];
        }

        rules[key] = rules[key].concat(rulesList[key]);
      }

      return rules;
    },

    /**
     * HTML entity encode a string.
     *
     * @param string
     * @returns {string}
     */
    encode: function (string) {
      return $('<div/>').text(string).html();
    },

    /**
     * Lookup name in an array.
     *
     * @param validator
     * @param {string} name Name in dot notation format.
     * @returns {*}
     */
    findByArrayName: function (validator, name) {
      var sqName = name.replace(/\.([^\.]+)/g, '[$1]'),
          lookups = [// Convert dot to square brackets. e.g. foo.bar.0 becomes foo[bar][0]
      sqName, // Append [] to the name e.g. foo becomes foo[] or foo.bar.0 becomes foo[bar][0][]
      sqName + '[]', // Remove key from last array e.g. foo[bar][0] becomes foo[bar][]
      sqName.replace(/(.*)\[(.*)\]$/g, '$1[]')];

      for (var i = 0; i < lookups.length; i++) {
        var elem = validator.findByName(lookups[i]);

        if (elem.length > 0) {
          return elem;
        }
      }

      return $(null);
    },

    /**
     * Attempt to find an element in the DOM matching the given name.
     * Example names include:
     *    - domain.0 which matches domain[]
     *    - customfield.3 which matches customfield[3]
     *
     * @param validator
     * @param {string} name
     * @returns {*}
     */
    findByName: function (validator, name) {
      // Exact match.
      var elem = validator.findByName(name);

      if (elem.length > 0) {
        return elem;
      } // Find name in data, using dot notation.


      var delim = '.',
          parts = name.split(delim);

      for (var i = parts.length; i > 0; i--) {
        var reconstructed = [];

        for (var c = 0; c < i; c++) {
          reconstructed.push(parts[c]);
        }

        elem = this.findByArrayName(validator, reconstructed.join(delim));

        if (elem.length > 0) {
          return elem;
        }
      }

      return $(null);
    },

    /**
     * If it's an array element, get all values.
     *
     * @param validator
     * @param element
     * @returns {*|string}
     */
    allElementValues: function (validator, element) {
      if (element.name.indexOf('[') !== -1 && element.name.indexOf(']') !== -1) {
        return validator.findByName(element.name).map(function (i, e) {
          return validator.elementValue(e);
        }).get();
      }

      return validator.elementValue(element);
    }
  }
});

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvY3V0dXMvcGhwL2FycmF5L2FycmF5X2RpZmYuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvY3V0dXMvcGhwL2RhdGV0aW1lL3N0cnRvdGltZS5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbG9jdXR1cy9waHAvaW5mby9pbmlfZ2V0LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9sb2N1dHVzL3BocC9zdHJpbmdzL3N0cmxlbi5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbG9jdXR1cy9waHAvdmFyL2lzX251bWVyaWMuanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9idWlsZGluL2dsb2JhbC5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2hlbHBlcnMuanMiXSwibmFtZXMiOlsiJCIsImV4dGVuZCIsImxhcmF2ZWxWYWxpZGF0aW9uIiwiaGVscGVycyIsIm51bWVyaWNSdWxlcyIsImZpbGVpbmZvIiwiZmllbGRPYmoiLCJpbmRleCIsIkZpbGVOYW1lIiwidmFsdWUiLCJmaWxlcyIsImZpbGUiLCJleHRlbnNpb24iLCJzdWJzdHIiLCJsYXN0SW5kZXhPZiIsInNpemUiLCJ0eXBlIiwic2VsZWN0b3IiLCJuYW1lcyIsImlzQXJyYXkiLCJpIiwibGVuZ3RoIiwicHVzaCIsImpvaW4iLCJoYXNOdW1lcmljUnVsZXMiLCJlbGVtZW50IiwiaGFzUnVsZXMiLCJydWxlcyIsImZvdW5kIiwidmFsaWRhdG9yIiwiZGF0YSIsImZvcm0iLCJsaXN0UnVsZXMiLCJjYWNoZSIsImFycmF5UnVsZXNDYWNoZSIsIm5hbWUiLCJlYWNoIiwiYXJyYXlSdWxlIiwic2V0dGluZ3MiLCJvYmpSdWxlcyIsIl9ydWxlcyIsImluQXJyYXkiLCJzdHJsZW4iLCJzdHJpbmciLCJnZXRTaXplIiwib2JqIiwiaXNfbnVtZXJpYyIsInBhcnNlRmxvYXQiLCJNYXRoIiwiZmxvb3IiLCJnZXRMYXJhdmVsVmFsaWRhdGlvbiIsInJ1bGUiLCJ1bmRlZmluZWQiLCJzdGF0aWNSdWxlcyIsImtleSIsInBhcnNlVGltZSIsImZvcm1hdCIsInRpbWVWYWx1ZSIsImZtdCIsIkRhdGVGb3JtYXR0ZXIiLCJkYXRlUnVsZSIsInN0cnRvdGltZSIsInBhcnNlRGF0ZSIsInJvdW5kIiwiZ2V0VGltZSIsImNvbXBhcmVEYXRlcyIsInBhcmFtcyIsIm9wZXJhdG9yIiwidGltZUNvbXBhcmUiLCJ0YXJnZXQiLCJkZXBlbmRlbnRFbGVtZW50IiwiZWxlbWVudFZhbHVlIiwiRXJyb3IiLCJndWVzc0RhdGUiLCJ0ZXh0Iiwibm93IiwibWl4ZWRfdmFyIiwiYXJnIiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwiYXJyYXlEaWZmIiwiYXJyMSIsImFycjIiLCJhcnJheV9kaWZmIiwiYXJyYXlFcXVhbHMiLCJpc0VtcHR5T2JqZWN0IiwiZWwiLCJmaW5kQnlOYW1lIiwib25mb2N1c291dCIsImV2ZW50IiwidGFnTmFtZSIsInJ1bGVOYW1lIiwib2ZmIiwib24iLCJ2YWxpZCIsInBhcnNlRXJyb3JSZXNwb25zZSIsInJlc3BvbnNlIiwibmV3UmVzcG9uc2UiLCJlcnJvck1zZyIsInJlc3BvbnNlVGV4dCIsIm1hdGNoIiwiZXNjYXBlUmVnRXhwIiwic3RyIiwicmVwbGFjZSIsInJlZ2V4RnJvbVdpbGRjYXJkIiwibmFtZVBhcnRzIiwic3BsaXQiLCJyZWdleHBQYXJ0cyIsIm1hcCIsImN1cnJlbnRWYWx1ZSIsIlJlZ0V4cCIsIm1lcmdlUnVsZXMiLCJuZXdSdWxlcyIsInJ1bGVzTGlzdCIsImxhcmF2ZWxWYWxpZGF0aW9uUmVtb3RlIiwiY29uY2F0IiwiZW5jb2RlIiwiaHRtbCIsImZpbmRCeUFycmF5TmFtZSIsInNxTmFtZSIsImxvb2t1cHMiLCJlbGVtIiwiZGVsaW0iLCJwYXJ0cyIsInJlY29uc3RydWN0ZWQiLCJjIiwiYWxsRWxlbWVudFZhbHVlcyIsImluZGV4T2YiLCJlIiwiZ2V0Il0sIm1hcHBpbmdzIjoiO1FBQUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7OztRQUdBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwwQ0FBMEMsZ0NBQWdDO1FBQzFFO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0Esd0RBQXdELGtCQUFrQjtRQUMxRTtRQUNBLGlEQUFpRCxjQUFjO1FBQy9EOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQSx5Q0FBeUMsaUNBQWlDO1FBQzFFLGdIQUFnSCxtQkFBbUIsRUFBRTtRQUNySTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDJCQUEyQiwwQkFBMEIsRUFBRTtRQUN2RCxpQ0FBaUMsZUFBZTtRQUNoRDtRQUNBO1FBQ0E7O1FBRUE7UUFDQSxzREFBc0QsK0RBQStEOztRQUVySDtRQUNBOzs7UUFHQTtRQUNBOzs7Ozs7Ozs7Ozs7O0FDbEZhOztBQUViO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1COztBQUVuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGVBQWUsVUFBVTtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxzQzs7Ozs7Ozs7Ozs7O0FDbENhOztBQUViO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIsSUFBSTtBQUN6QixzQkFBc0IsRUFBRTtBQUN4QixzQkFBc0IsRUFBRTtBQUN4QixtQ0FBbUMsRUFBRTtBQUNyQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNkJBQTZCLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSTtBQUNoRDs7QUFFQTtBQUNBLDhCQUE4QixJQUFJO0FBQ2xDO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esd0RBQXdELElBQUk7QUFDNUQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QixJQUFJO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEscUNBQXFDLE9BQU87QUFDNUM7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxxQzs7Ozs7Ozs7Ozs7O0FDOXZDQSw4Q0FBYTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxtQzs7Ozs7Ozs7Ozs7OztBQzFCYTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFJLEdBQUcsS0FBS0gsZUFBTCxDQUFxQjNGLFNBQXJCLEVBQWdDaUcsYUFBYSxDQUFDdkcsSUFBZCxDQUFtQnFHLEtBQW5CLENBQWhDLENBQVA7O0FBQ0EsWUFBSUQsSUFBSSxDQUFDdEcsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCLGlCQUFPc0csSUFBUDtBQUNIO0FBQ0o7O0FBRUQsYUFBTzNILENBQUMsQ0FBQyxJQUFELENBQVI7QUFDSCxLQXBmSTs7QUFzZkw7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDUWdJLG9CQUFnQixFQUFFLFVBQVVuRyxTQUFWLEVBQXFCSixPQUFyQixFQUE4QjtBQUM1QyxVQUFJQSxPQUFPLENBQUNVLElBQVIsQ0FBYThGLE9BQWIsQ0FBcUIsR0FBckIsTUFBOEIsQ0FBQyxDQUEvQixJQUFvQ3hHLE9BQU8sQ0FBQ1UsSUFBUixDQUFhOEYsT0FBYixDQUFxQixHQUFyQixNQUE4QixDQUFDLENBQXZFLEVBQTBFO0FBQ3RFLGVBQU9wRyxTQUFTLENBQUM0RCxVQUFWLENBQXFCaEUsT0FBTyxDQUFDVSxJQUE3QixFQUFtQzJFLEdBQW5DLENBQXVDLFVBQVUxRixDQUFWLEVBQWE4RyxDQUFiLEVBQWdCO0FBQzFELGlCQUFPckcsU0FBUyxDQUFDMEMsWUFBVixDQUF1QjJELENBQXZCLENBQVA7QUFDSCxTQUZNLEVBRUpDLEdBRkksRUFBUDtBQUdIOztBQUVELGFBQU90RyxTQUFTLENBQUMwQyxZQUFWLENBQXVCOUMsT0FBdkIsQ0FBUDtBQUNIO0FBcmdCSTtBQUZxQixDQUFsQyxFIiwiZmlsZSI6ImhlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3Jlc291cmNlcy9hc3NldHMvanMvaGVscGVycy5qc1wiKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhcnJheV9kaWZmKGFycjEpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgLy8gIGRpc2N1c3MgYXQ6IGh0dHBzOi8vbG9jdXR1cy5pby9waHAvYXJyYXlfZGlmZi9cbiAgLy8gb3JpZ2luYWwgYnk6IEtldmluIHZhbiBab25uZXZlbGQgKGh0dHBzOi8va3Z6LmlvKVxuICAvLyBpbXByb3ZlZCBieTogU2Fuam95IFJveVxuICAvLyAgcmV2aXNlZCBieTogQnJldHQgWmFtaXIgKGh0dHBzOi8vYnJldHQtemFtaXIubWUpXG4gIC8vICAgZXhhbXBsZSAxOiBhcnJheV9kaWZmKFsnS2V2aW4nLCAndmFuJywgJ1pvbm5ldmVsZCddLCBbJ3ZhbicsICdab25uZXZlbGQnXSlcbiAgLy8gICByZXR1cm5zIDE6IHswOidLZXZpbid9XG5cbiAgdmFyIHJldEFyciA9IHt9O1xuICB2YXIgYXJnbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHZhciBrMSA9ICcnO1xuICB2YXIgaSA9IDE7XG4gIHZhciBrID0gJyc7XG4gIHZhciBhcnIgPSB7fTtcblxuICBhcnIxa2V5czogZm9yIChrMSBpbiBhcnIxKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sYWJlbHNcbiAgICBmb3IgKGkgPSAxOyBpIDwgYXJnbDsgaSsrKSB7XG4gICAgICBhcnIgPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKGsgaW4gYXJyKSB7XG4gICAgICAgIGlmIChhcnJba10gPT09IGFycjFbazFdKSB7XG4gICAgICAgICAgLy8gSWYgaXQgcmVhY2hlcyBoZXJlLCBpdCB3YXMgZm91bmQgaW4gYXQgbGVhc3Qgb25lIGFycmF5LCBzbyB0cnkgbmV4dCB2YWx1ZVxuICAgICAgICAgIGNvbnRpbnVlIGFycjFrZXlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxhYmVsc1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXRBcnJbazFdID0gYXJyMVtrMV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldEFycjtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcnJheV9kaWZmLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlU3BhY2UgPSAnWyBcXFxcdF0rJztcbnZhciByZVNwYWNlT3B0ID0gJ1sgXFxcXHRdKic7XG52YXIgcmVNZXJpZGlhbiA9ICcoPzooW2FwXSlcXFxcLj9tXFxcXC4/KFtcXFxcdCBdfCQpKSc7XG52YXIgcmVIb3VyMjQgPSAnKDJbMC00XXxbMDFdP1swLTldKSc7XG52YXIgcmVIb3VyMjRseiA9ICcoWzAxXVswLTldfDJbMC00XSknO1xudmFyIHJlSG91cjEyID0gJygwP1sxLTldfDFbMC0yXSknO1xudmFyIHJlTWludXRlID0gJyhbMC01XT9bMC05XSknO1xudmFyIHJlTWludXRlbHogPSAnKFswLTVdWzAtOV0pJztcbnZhciByZVNlY29uZCA9ICcoNjB8WzAtNV0/WzAtOV0pJztcbnZhciByZVNlY29uZGx6ID0gJyg2MHxbMC01XVswLTldKSc7XG52YXIgcmVGcmFjID0gJyg/OlxcXFwuKFswLTldKykpJztcblxudmFyIHJlRGF5ZnVsbCA9ICdzdW5kYXl8bW9uZGF5fHR1ZXNkYXl8d2VkbmVzZGF5fHRodXJzZGF5fGZyaWRheXxzYXR1cmRheSc7XG52YXIgcmVEYXlhYmJyID0gJ3N1bnxtb258dHVlfHdlZHx0aHV8ZnJpfHNhdCc7XG52YXIgcmVEYXl0ZXh0ID0gcmVEYXlmdWxsICsgJ3wnICsgcmVEYXlhYmJyICsgJ3x3ZWVrZGF5cz8nO1xuXG52YXIgcmVSZWx0ZXh0bnVtYmVyID0gJ2ZpcnN0fHNlY29uZHx0aGlyZHxmb3VydGh8ZmlmdGh8c2l4dGh8c2V2ZW50aHxlaWdodGg/fG5pbnRofHRlbnRofGVsZXZlbnRofHR3ZWxmdGgnO1xudmFyIHJlUmVsdGV4dHRleHQgPSAnbmV4dHxsYXN0fHByZXZpb3VzfHRoaXMnO1xudmFyIHJlUmVsdGV4dHVuaXQgPSAnKD86c2Vjb25kfHNlY3xtaW51dGV8bWlufGhvdXJ8ZGF5fGZvcnRuaWdodHxmb3J0aG5pZ2h0fG1vbnRofHllYXIpcz98d2Vla3N8JyArIHJlRGF5dGV4dDtcblxudmFyIHJlWWVhciA9ICcoWzAtOV17MSw0fSknO1xudmFyIHJlWWVhcjIgPSAnKFswLTldezJ9KSc7XG52YXIgcmVZZWFyNCA9ICcoWzAtOV17NH0pJztcbnZhciByZVllYXI0d2l0aFNpZ24gPSAnKFsrLV0/WzAtOV17NH0pJztcbnZhciByZU1vbnRoID0gJygxWzAtMl18MD9bMC05XSknO1xudmFyIHJlTW9udGhseiA9ICcoMFswLTldfDFbMC0yXSknO1xudmFyIHJlRGF5ID0gJyg/OigzWzAxXXxbMC0yXT9bMC05XSkoPzpzdHxuZHxyZHx0aCk/KSc7XG52YXIgcmVEYXlseiA9ICcoMFswLTldfFsxLTJdWzAtOV18M1swMV0pJztcblxudmFyIHJlTW9udGhGdWxsID0gJ2phbnVhcnl8ZmVicnVhcnl8bWFyY2h8YXByaWx8bWF5fGp1bmV8anVseXxhdWd1c3R8c2VwdGVtYmVyfG9jdG9iZXJ8bm92ZW1iZXJ8ZGVjZW1iZXInO1xudmFyIHJlTW9udGhBYmJyID0gJ2phbnxmZWJ8bWFyfGFwcnxtYXl8anVufGp1bHxhdWd8c2VwdD98b2N0fG5vdnxkZWMnO1xudmFyIHJlTW9udGhyb21hbiA9ICdpW3Z4XXx2aXswLDN9fHhpezAsMn18aXsxLDN9JztcbnZhciByZU1vbnRoVGV4dCA9ICcoJyArIHJlTW9udGhGdWxsICsgJ3wnICsgcmVNb250aEFiYnIgKyAnfCcgKyByZU1vbnRocm9tYW4gKyAnKSc7XG5cbnZhciByZVR6Q29ycmVjdGlvbiA9ICcoKD86R01UKT8oWystXSknICsgcmVIb3VyMjQgKyAnOj8nICsgcmVNaW51dGUgKyAnPyknO1xudmFyIHJlVHpBYmJyID0gJ1xcXFwoPyhbYS16QS1aXXsxLDZ9KVxcXFwpPyc7XG52YXIgcmVEYXlPZlllYXIgPSAnKDAwWzEtOV18MFsxLTldWzAtOV18WzEyXVswLTldWzAtOV18M1swLTVdWzAtOV18MzZbMC02XSknO1xudmFyIHJlV2Vla09mWWVhciA9ICcoMFsxLTldfFsxLTRdWzAtOV18NVswLTNdKSc7XG5cbnZhciByZURhdGVOb1llYXIgPSByZU1vbnRoVGV4dCArICdbIC5cXFxcdC1dKicgKyByZURheSArICdbLC5zdG5kcmhcXFxcdCBdKic7XG5cbmZ1bmN0aW9uIHByb2Nlc3NNZXJpZGlhbihob3VyLCBtZXJpZGlhbikge1xuICBtZXJpZGlhbiA9IG1lcmlkaWFuICYmIG1lcmlkaWFuLnRvTG93ZXJDYXNlKCk7XG5cbiAgc3dpdGNoIChtZXJpZGlhbikge1xuICAgIGNhc2UgJ2EnOlxuICAgICAgaG91ciArPSBob3VyID09PSAxMiA/IC0xMiA6IDA7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdwJzpcbiAgICAgIGhvdXIgKz0gaG91ciAhPT0gMTIgPyAxMiA6IDA7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHJldHVybiBob3VyO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzWWVhcih5ZWFyU3RyKSB7XG4gIHZhciB5ZWFyID0gK3llYXJTdHI7XG5cbiAgaWYgKHllYXJTdHIubGVuZ3RoIDwgNCAmJiB5ZWFyIDwgMTAwKSB7XG4gICAgeWVhciArPSB5ZWFyIDwgNzAgPyAyMDAwIDogMTkwMDtcbiAgfVxuXG4gIHJldHVybiB5ZWFyO1xufVxuXG5mdW5jdGlvbiBsb29rdXBNb250aChtb250aFN0cikge1xuICByZXR1cm4ge1xuICAgIGphbjogMCxcbiAgICBqYW51YXJ5OiAwLFxuICAgIGk6IDAsXG4gICAgZmViOiAxLFxuICAgIGZlYnJ1YXJ5OiAxLFxuICAgIGlpOiAxLFxuICAgIG1hcjogMixcbiAgICBtYXJjaDogMixcbiAgICBpaWk6IDIsXG4gICAgYXByOiAzLFxuICAgIGFwcmlsOiAzLFxuICAgIGl2OiAzLFxuICAgIG1heTogNCxcbiAgICB2OiA0LFxuICAgIGp1bjogNSxcbiAgICBqdW5lOiA1LFxuICAgIHZpOiA1LFxuICAgIGp1bDogNixcbiAgICBqdWx5OiA2LFxuICAgIHZpaTogNixcbiAgICBhdWc6IDcsXG4gICAgYXVndXN0OiA3LFxuICAgIHZpaWk6IDcsXG4gICAgc2VwOiA4LFxuICAgIHNlcHQ6IDgsXG4gICAgc2VwdGVtYmVyOiA4LFxuICAgIGl4OiA4LFxuICAgIG9jdDogOSxcbiAgICBvY3RvYmVyOiA5LFxuICAgIHg6IDksXG4gICAgbm92OiAxMCxcbiAgICBub3ZlbWJlcjogMTAsXG4gICAgeGk6IDEwLFxuICAgIGRlYzogMTEsXG4gICAgZGVjZW1iZXI6IDExLFxuICAgIHhpaTogMTFcbiAgfVttb250aFN0ci50b0xvd2VyQ2FzZSgpXTtcbn1cblxuZnVuY3Rpb24gbG9va3VwV2Vla2RheShkYXlTdHIpIHtcbiAgdmFyIGRlc2lyZWRTdW5kYXlOdW1iZXIgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IDA7XG5cbiAgdmFyIGRheU51bWJlcnMgPSB7XG4gICAgbW9uOiAxLFxuICAgIG1vbmRheTogMSxcbiAgICB0dWU6IDIsXG4gICAgdHVlc2RheTogMixcbiAgICB3ZWQ6IDMsXG4gICAgd2VkbmVzZGF5OiAzLFxuICAgIHRodTogNCxcbiAgICB0aHVyc2RheTogNCxcbiAgICBmcmk6IDUsXG4gICAgZnJpZGF5OiA1LFxuICAgIHNhdDogNixcbiAgICBzYXR1cmRheTogNixcbiAgICBzdW46IDAsXG4gICAgc3VuZGF5OiAwXG4gIH07XG5cbiAgcmV0dXJuIGRheU51bWJlcnNbZGF5U3RyLnRvTG93ZXJDYXNlKCldIHx8IGRlc2lyZWRTdW5kYXlOdW1iZXI7XG59XG5cbmZ1bmN0aW9uIGxvb2t1cFJlbGF0aXZlKHJlbFRleHQpIHtcbiAgdmFyIHJlbGF0aXZlTnVtYmVycyA9IHtcbiAgICBsYXN0OiAtMSxcbiAgICBwcmV2aW91czogLTEsXG4gICAgdGhpczogMCxcbiAgICBmaXJzdDogMSxcbiAgICBuZXh0OiAxLFxuICAgIHNlY29uZDogMixcbiAgICB0aGlyZDogMyxcbiAgICBmb3VydGg6IDQsXG4gICAgZmlmdGg6IDUsXG4gICAgc2l4dGg6IDYsXG4gICAgc2V2ZW50aDogNyxcbiAgICBlaWdodDogOCxcbiAgICBlaWdodGg6IDgsXG4gICAgbmludGg6IDksXG4gICAgdGVudGg6IDEwLFxuICAgIGVsZXZlbnRoOiAxMSxcbiAgICB0d2VsZnRoOiAxMlxuICB9O1xuXG4gIHZhciByZWxhdGl2ZUJlaGF2aW9yID0ge1xuICAgIHRoaXM6IDFcbiAgfTtcblxuICB2YXIgcmVsVGV4dExvd2VyID0gcmVsVGV4dC50b0xvd2VyQ2FzZSgpO1xuXG4gIHJldHVybiB7XG4gICAgYW1vdW50OiByZWxhdGl2ZU51bWJlcnNbcmVsVGV4dExvd2VyXSxcbiAgICBiZWhhdmlvcjogcmVsYXRpdmVCZWhhdmlvcltyZWxUZXh0TG93ZXJdIHx8IDBcbiAgfTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc1R6Q29ycmVjdGlvbih0ek9mZnNldCwgb2xkVmFsdWUpIHtcbiAgdmFyIHJlVHpDb3JyZWN0aW9uTG9vc2UgPSAvKD86R01UKT8oWystXSkoXFxkKykoOj8pKFxcZHswLDJ9KS9pO1xuICB0ek9mZnNldCA9IHR6T2Zmc2V0ICYmIHR6T2Zmc2V0Lm1hdGNoKHJlVHpDb3JyZWN0aW9uTG9vc2UpO1xuXG4gIGlmICghdHpPZmZzZXQpIHtcbiAgICByZXR1cm4gb2xkVmFsdWU7XG4gIH1cblxuICB2YXIgc2lnbiA9IHR6T2Zmc2V0WzFdID09PSAnLScgPyAtMSA6IDE7XG4gIHZhciBob3VycyA9ICt0ek9mZnNldFsyXTtcbiAgdmFyIG1pbnV0ZXMgPSArdHpPZmZzZXRbNF07XG5cbiAgaWYgKCF0ek9mZnNldFs0XSAmJiAhdHpPZmZzZXRbM10pIHtcbiAgICBtaW51dGVzID0gTWF0aC5mbG9vcihob3VycyAlIDEwMCk7XG4gICAgaG91cnMgPSBNYXRoLmZsb29yKGhvdXJzIC8gMTAwKTtcbiAgfVxuXG4gIC8vIHRpbWV6b25lIG9mZnNldCBpbiBzZWNvbmRzXG4gIHJldHVybiBzaWduICogKGhvdXJzICogNjAgKyBtaW51dGVzKSAqIDYwO1xufVxuXG4vLyB0eiBhYmJyZXZhdGlvbiA6IHR6IG9mZnNldCBpbiBzZWNvbmRzXG52YXIgdHpBYmJyT2Zmc2V0cyA9IHtcbiAgYWNkdDogMzc4MDAsXG4gIGFjc3Q6IDM0MjAwLFxuICBhZGR0OiAtNzIwMCxcbiAgYWR0OiAtMTA4MDAsXG4gIGFlZHQ6IDM5NjAwLFxuICBhZXN0OiAzNjAwMCxcbiAgYWhkdDogLTMyNDAwLFxuICBhaHN0OiAtMzYwMDAsXG4gIGFrZHQ6IC0yODgwMCxcbiAgYWtzdDogLTMyNDAwLFxuICBhbXQ6IC0xMzg0MCxcbiAgYXB0OiAtMTA4MDAsXG4gIGFzdDogLTE0NDAwLFxuICBhd2R0OiAzMjQwMCxcbiAgYXdzdDogMjg4MDAsXG4gIGF3dDogLTEwODAwLFxuICBiZHN0OiA3MjAwLFxuICBiZHQ6IC0zNjAwMCxcbiAgYm10OiAtMTQzMDksXG4gIGJzdDogMzYwMCxcbiAgY2FzdDogMzQyMDAsXG4gIGNhdDogNzIwMCxcbiAgY2RkdDogLTE0NDAwLFxuICBjZHQ6IC0xODAwMCxcbiAgY2VtdDogMTA4MDAsXG4gIGNlc3Q6IDcyMDAsXG4gIGNldDogMzYwMCxcbiAgY210OiAtMTU0MDgsXG4gIGNwdDogLTE4MDAwLFxuICBjc3Q6IC0yMTYwMCxcbiAgY3d0OiAtMTgwMDAsXG4gIGNoc3Q6IDM2MDAwLFxuICBkbXQ6IC0xNTIxLFxuICBlYXQ6IDEwODAwLFxuICBlZGR0OiAtMTA4MDAsXG4gIGVkdDogLTE0NDAwLFxuICBlZXN0OiAxMDgwMCxcbiAgZWV0OiA3MjAwLFxuICBlbXQ6IC0yNjI0OCxcbiAgZXB0OiAtMTQ0MDAsXG4gIGVzdDogLTE4MDAwLFxuICBld3Q6IC0xNDQwMCxcbiAgZmZtdDogLTE0NjYwLFxuICBmbXQ6IC00MDU2LFxuICBnZHQ6IDM5NjAwLFxuICBnbXQ6IDAsXG4gIGdzdDogMzYwMDAsXG4gIGhkdDogLTM0MjAwLFxuICBoa3N0OiAzMjQwMCxcbiAgaGt0OiAyODgwMCxcbiAgaG10OiAtMTk3NzYsXG4gIGhwdDogLTM0MjAwLFxuICBoc3Q6IC0zNjAwMCxcbiAgaHd0OiAtMzQyMDAsXG4gIGlkZHQ6IDE0NDAwLFxuICBpZHQ6IDEwODAwLFxuICBpbXQ6IDI1MDI1LFxuICBpc3Q6IDcyMDAsXG4gIGpkdDogMzYwMDAsXG4gIGptdDogODQ0MCxcbiAganN0OiAzMjQwMCxcbiAga2R0OiAzNjAwMCxcbiAga210OiA1NzM2LFxuICBrc3Q6IDMwNjAwLFxuICBsc3Q6IDkzOTQsXG4gIG1kZHQ6IC0xODAwMCxcbiAgbWRzdDogMTYyNzksXG4gIG1kdDogLTIxNjAwLFxuICBtZXN0OiA3MjAwLFxuICBtZXQ6IDM2MDAsXG4gIG1tdDogOTAxNyxcbiAgbXB0OiAtMjE2MDAsXG4gIG1zZDogMTQ0MDAsXG4gIG1zazogMTA4MDAsXG4gIG1zdDogLTI1MjAwLFxuICBtd3Q6IC0yMTYwMCxcbiAgbmRkdDogLTU0MDAsXG4gIG5kdDogLTkwNTIsXG4gIG5wdDogLTkwMDAsXG4gIG5zdDogLTEyNjAwLFxuICBud3Q6IC05MDAwLFxuICBuemR0OiA0NjgwMCxcbiAgbnptdDogNDE0MDAsXG4gIG56c3Q6IDQzMjAwLFxuICBwZGR0OiAtMjE2MDAsXG4gIHBkdDogLTI1MjAwLFxuICBwa3N0OiAyMTYwMCxcbiAgcGt0OiAxODAwMCxcbiAgcGxtdDogMjU1OTAsXG4gIHBtdDogLTEzMjM2LFxuICBwcG10OiAtMTczNDAsXG4gIHBwdDogLTI1MjAwLFxuICBwc3Q6IC0yODgwMCxcbiAgcHd0OiAtMjUyMDAsXG4gIHFtdDogLTE4ODQwLFxuICBybXQ6IDU3OTQsXG4gIHNhc3Q6IDcyMDAsXG4gIHNkbXQ6IC0xNjgwMCxcbiAgc2ptdDogLTIwMTczLFxuICBzbXQ6IC0xMzg4NCxcbiAgc3N0OiAtMzk2MDAsXG4gIHRibXQ6IDEwNzUxLFxuICB0bXQ6IDEyMzQ0LFxuICB1Y3Q6IDAsXG4gIHV0YzogMCxcbiAgd2FzdDogNzIwMCxcbiAgd2F0OiAzNjAwLFxuICB3ZW10OiA3MjAwLFxuICB3ZXN0OiAzNjAwLFxuICB3ZXQ6IDAsXG4gIHdpYjogMjUyMDAsXG4gIHdpdGE6IDI4ODAwLFxuICB3aXQ6IDMyNDAwLFxuICB3bXQ6IDUwNDAsXG4gIHlkZHQ6IC0yNTIwMCxcbiAgeWR0OiAtMjg4MDAsXG4gIHlwdDogLTI4ODAwLFxuICB5c3Q6IC0zMjQwMCxcbiAgeXd0OiAtMjg4MDAsXG4gIGE6IDM2MDAsXG4gIGI6IDcyMDAsXG4gIGM6IDEwODAwLFxuICBkOiAxNDQwMCxcbiAgZTogMTgwMDAsXG4gIGY6IDIxNjAwLFxuICBnOiAyNTIwMCxcbiAgaDogMjg4MDAsXG4gIGk6IDMyNDAwLFxuICBrOiAzNjAwMCxcbiAgbDogMzk2MDAsXG4gIG06IDQzMjAwLFxuICBuOiAtMzYwMCxcbiAgbzogLTcyMDAsXG4gIHA6IC0xMDgwMCxcbiAgcTogLTE0NDAwLFxuICByOiAtMTgwMDAsXG4gIHM6IC0yMTYwMCxcbiAgdDogLTI1MjAwLFxuICB1OiAtMjg4MDAsXG4gIHY6IC0zMjQwMCxcbiAgdzogLTM2MDAwLFxuICB4OiAtMzk2MDAsXG4gIHk6IC00MzIwMCxcbiAgejogMFxufTtcblxudmFyIGZvcm1hdHMgPSB7XG4gIHllc3RlcmRheToge1xuICAgIHJlZ2V4OiAvXnllc3RlcmRheS9pLFxuICAgIG5hbWU6ICd5ZXN0ZXJkYXknLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgIHRoaXMucmQgLT0gMTtcbiAgICAgIHJldHVybiB0aGlzLnJlc2V0VGltZSgpO1xuICAgIH1cbiAgfSxcblxuICBub3c6IHtcbiAgICByZWdleDogL15ub3cvaSxcbiAgICBuYW1lOiAnbm93J1xuICAgIC8vIGRvIG5vdGhpbmdcbiAgfSxcblxuICBub29uOiB7XG4gICAgcmVnZXg6IC9ebm9vbi9pLFxuICAgIG5hbWU6ICdub29uJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2soKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXNldFRpbWUoKSAmJiB0aGlzLnRpbWUoMTIsIDAsIDAsIDApO1xuICAgIH1cbiAgfSxcblxuICBtaWRuaWdodE9yVG9kYXk6IHtcbiAgICByZWdleDogL14obWlkbmlnaHR8dG9kYXkpL2ksXG4gICAgbmFtZTogJ21pZG5pZ2h0IHwgdG9kYXknLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc2V0VGltZSgpO1xuICAgIH1cbiAgfSxcblxuICB0b21vcnJvdzoge1xuICAgIHJlZ2V4OiAvXnRvbW9ycm93L2ksXG4gICAgbmFtZTogJ3RvbW9ycm93JyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2soKSB7XG4gICAgICB0aGlzLnJkICs9IDE7XG4gICAgICByZXR1cm4gdGhpcy5yZXNldFRpbWUoKTtcbiAgICB9XG4gIH0sXG5cbiAgdGltZXN0YW1wOiB7XG4gICAgcmVnZXg6IC9eQCgtP1xcZCspL2ksXG4gICAgbmFtZTogJ3RpbWVzdGFtcCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB0aW1lc3RhbXApIHtcbiAgICAgIHRoaXMucnMgKz0gK3RpbWVzdGFtcDtcbiAgICAgIHRoaXMueSA9IDE5NzA7XG4gICAgICB0aGlzLm0gPSAwO1xuICAgICAgdGhpcy5kID0gMTtcbiAgICAgIHRoaXMuZGF0ZXMgPSAwO1xuXG4gICAgICByZXR1cm4gdGhpcy5yZXNldFRpbWUoKSAmJiB0aGlzLnpvbmUoMCk7XG4gICAgfVxuICB9LFxuXG4gIGZpcnN0T3JMYXN0RGF5OiB7XG4gICAgcmVnZXg6IC9eKGZpcnN0fGxhc3QpIGRheSBvZi9pLFxuICAgIG5hbWU6ICdmaXJzdGRheW9mIHwgbGFzdGRheW9mJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIGRheSkge1xuICAgICAgaWYgKGRheS50b0xvd2VyQ2FzZSgpID09PSAnZmlyc3QnKSB7XG4gICAgICAgIHRoaXMuZmlyc3RPckxhc3REYXlPZk1vbnRoID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmlyc3RPckxhc3REYXlPZk1vbnRoID0gLTE7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGJhY2tPckZyb250T2Y6IHtcbiAgICByZWdleDogUmVnRXhwKCdeKGJhY2t8ZnJvbnQpIG9mICcgKyByZUhvdXIyNCArIHJlU3BhY2VPcHQgKyByZU1lcmlkaWFuICsgJz8nLCAnaScpLFxuICAgIG5hbWU6ICdiYWNrb2YgfCBmcm9udG9mJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHNpZGUsIGhvdXJzLCBtZXJpZGlhbikge1xuICAgICAgdmFyIGJhY2sgPSBzaWRlLnRvTG93ZXJDYXNlKCkgPT09ICdiYWNrJztcbiAgICAgIHZhciBob3VyID0gK2hvdXJzO1xuICAgICAgdmFyIG1pbnV0ZSA9IDE1O1xuXG4gICAgICBpZiAoIWJhY2spIHtcbiAgICAgICAgaG91ciAtPSAxO1xuICAgICAgICBtaW51dGUgPSA0NTtcbiAgICAgIH1cblxuICAgICAgaG91ciA9IHByb2Nlc3NNZXJpZGlhbihob3VyLCBtZXJpZGlhbik7XG5cbiAgICAgIHJldHVybiB0aGlzLnJlc2V0VGltZSgpICYmIHRoaXMudGltZShob3VyLCBtaW51dGUsIDAsIDApO1xuICAgIH1cbiAgfSxcblxuICB3ZWVrZGF5T2Y6IHtcbiAgICByZWdleDogUmVnRXhwKCdeKCcgKyByZVJlbHRleHRudW1iZXIgKyAnfCcgKyByZVJlbHRleHR0ZXh0ICsgJyknICsgcmVTcGFjZSArICcoJyArIHJlRGF5ZnVsbCArICd8JyArIHJlRGF5YWJiciArICcpJyArIHJlU3BhY2UgKyAnb2YnLCAnaScpLFxuICAgIG5hbWU6ICd3ZWVrZGF5b2YnXG4gICAgLy8gdG9kb1xuICB9LFxuXG4gIG1zc3FsdGltZToge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVIb3VyMTIgKyAnOicgKyByZU1pbnV0ZWx6ICsgJzonICsgcmVTZWNvbmRseiArICdbOi5dKFswLTldKyknICsgcmVNZXJpZGlhbiwgJ2knKSxcbiAgICBuYW1lOiAnbXNzcWx0aW1lJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBmcmFjLCBtZXJpZGlhbikge1xuICAgICAgcmV0dXJuIHRoaXMudGltZShwcm9jZXNzTWVyaWRpYW4oK2hvdXIsIG1lcmlkaWFuKSwgK21pbnV0ZSwgK3NlY29uZCwgK2ZyYWMuc3Vic3RyKDAsIDMpKTtcbiAgICB9XG4gIH0sXG5cbiAgdGltZUxvbmcxMjoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVIb3VyMTIgKyAnWzouXScgKyByZU1pbnV0ZSArICdbOi5dJyArIHJlU2Vjb25kbHogKyByZVNwYWNlT3B0ICsgcmVNZXJpZGlhbiwgJ2knKSxcbiAgICBuYW1lOiAndGltZWxvbmcxMicsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBob3VyLCBtaW51dGUsIHNlY29uZCwgbWVyaWRpYW4pIHtcbiAgICAgIHJldHVybiB0aGlzLnRpbWUocHJvY2Vzc01lcmlkaWFuKCtob3VyLCBtZXJpZGlhbiksICttaW51dGUsICtzZWNvbmQsIDApO1xuICAgIH1cbiAgfSxcblxuICB0aW1lU2hvcnQxMjoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVIb3VyMTIgKyAnWzouXScgKyByZU1pbnV0ZWx6ICsgcmVTcGFjZU9wdCArIHJlTWVyaWRpYW4sICdpJyksXG4gICAgbmFtZTogJ3RpbWVzaG9ydDEyJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIGhvdXIsIG1pbnV0ZSwgbWVyaWRpYW4pIHtcbiAgICAgIHJldHVybiB0aGlzLnRpbWUocHJvY2Vzc01lcmlkaWFuKCtob3VyLCBtZXJpZGlhbiksICttaW51dGUsIDAsIDApO1xuICAgIH1cbiAgfSxcblxuICB0aW1lVGlueTEyOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZUhvdXIxMiArIHJlU3BhY2VPcHQgKyByZU1lcmlkaWFuLCAnaScpLFxuICAgIG5hbWU6ICd0aW1ldGlueTEyJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIGhvdXIsIG1lcmlkaWFuKSB7XG4gICAgICByZXR1cm4gdGhpcy50aW1lKHByb2Nlc3NNZXJpZGlhbigraG91ciwgbWVyaWRpYW4pLCAwLCAwLCAwKTtcbiAgICB9XG4gIH0sXG5cbiAgc29hcDoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVZZWFyNCArICctJyArIHJlTW9udGhseiArICctJyArIHJlRGF5bHogKyAnVCcgKyByZUhvdXIyNGx6ICsgJzonICsgcmVNaW51dGVseiArICc6JyArIHJlU2Vjb25kbHogKyByZUZyYWMgKyByZVR6Q29ycmVjdGlvbiArICc/JywgJ2knKSxcbiAgICBuYW1lOiAnc29hcCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgZnJhYywgdHpDb3JyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQoK3llYXIsIG1vbnRoIC0gMSwgK2RheSkgJiYgdGhpcy50aW1lKCtob3VyLCArbWludXRlLCArc2Vjb25kLCArZnJhYy5zdWJzdHIoMCwgMykpICYmIHRoaXMuem9uZShwcm9jZXNzVHpDb3JyZWN0aW9uKHR6Q29ycmVjdGlvbikpO1xuICAgIH1cbiAgfSxcblxuICB3ZGR4OiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZVllYXI0ICsgJy0nICsgcmVNb250aCArICctJyArIHJlRGF5ICsgJ1QnICsgcmVIb3VyMjQgKyAnOicgKyByZU1pbnV0ZSArICc6JyArIHJlU2Vjb25kKSxcbiAgICBuYW1lOiAnd2RkeCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKCt5ZWFyLCBtb250aCAtIDEsICtkYXkpICYmIHRoaXMudGltZSgraG91ciwgK21pbnV0ZSwgK3NlY29uZCwgMCk7XG4gICAgfVxuICB9LFxuXG4gIGV4aWY6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlWWVhcjQgKyAnOicgKyByZU1vbnRobHogKyAnOicgKyByZURheWx6ICsgJyAnICsgcmVIb3VyMjRseiArICc6JyArIHJlTWludXRlbHogKyAnOicgKyByZVNlY29uZGx6LCAnaScpLFxuICAgIG5hbWU6ICdleGlmJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQoK3llYXIsIG1vbnRoIC0gMSwgK2RheSkgJiYgdGhpcy50aW1lKCtob3VyLCArbWludXRlLCArc2Vjb25kLCAwKTtcbiAgICB9XG4gIH0sXG5cbiAgeG1sUnBjOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZVllYXI0ICsgcmVNb250aGx6ICsgcmVEYXlseiArICdUJyArIHJlSG91cjI0ICsgJzonICsgcmVNaW51dGVseiArICc6JyArIHJlU2Vjb25kbHopLFxuICAgIG5hbWU6ICd4bWxycGMnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCgreWVhciwgbW9udGggLSAxLCArZGF5KSAmJiB0aGlzLnRpbWUoK2hvdXIsICttaW51dGUsICtzZWNvbmQsIDApO1xuICAgIH1cbiAgfSxcblxuICB4bWxScGNOb0NvbG9uOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZVllYXI0ICsgcmVNb250aGx6ICsgcmVEYXlseiArICdbVHRdJyArIHJlSG91cjI0ICsgcmVNaW51dGVseiArIHJlU2Vjb25kbHopLFxuICAgIG5hbWU6ICd4bWxycGNub2NvbG9uJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQoK3llYXIsIG1vbnRoIC0gMSwgK2RheSkgJiYgdGhpcy50aW1lKCtob3VyLCArbWludXRlLCArc2Vjb25kLCAwKTtcbiAgICB9XG4gIH0sXG5cbiAgY2xmOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZURheSArICcvKCcgKyByZU1vbnRoQWJiciArICcpLycgKyByZVllYXI0ICsgJzonICsgcmVIb3VyMjRseiArICc6JyArIHJlTWludXRlbHogKyAnOicgKyByZVNlY29uZGx6ICsgcmVTcGFjZSArIHJlVHpDb3JyZWN0aW9uLCAnaScpLFxuICAgIG5hbWU6ICdjbGYnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgZGF5LCBtb250aCwgeWVhciwgaG91ciwgbWludXRlLCBzZWNvbmQsIHR6Q29ycmVjdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKCt5ZWFyLCBsb29rdXBNb250aChtb250aCksICtkYXkpICYmIHRoaXMudGltZSgraG91ciwgK21pbnV0ZSwgK3NlY29uZCwgMCkgJiYgdGhpcy56b25lKHByb2Nlc3NUekNvcnJlY3Rpb24odHpDb3JyZWN0aW9uKSk7XG4gICAgfVxuICB9LFxuXG4gIGlzbzg2MDFsb25nOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXnQ/JyArIHJlSG91cjI0ICsgJ1s6Ll0nICsgcmVNaW51dGUgKyAnWzouXScgKyByZVNlY29uZCArIHJlRnJhYywgJ2knKSxcbiAgICBuYW1lOiAnaXNvODYwMWxvbmcnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgaG91ciwgbWludXRlLCBzZWNvbmQsIGZyYWMpIHtcbiAgICAgIHJldHVybiB0aGlzLnRpbWUoK2hvdXIsICttaW51dGUsICtzZWNvbmQsICtmcmFjLnN1YnN0cigwLCAzKSk7XG4gICAgfVxuICB9LFxuXG4gIGRhdGVUZXh0dWFsOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZU1vbnRoVGV4dCArICdbIC5cXFxcdC1dKicgKyByZURheSArICdbLC5zdG5kcmhcXFxcdCBdKycgKyByZVllYXIsICdpJyksXG4gICAgbmFtZTogJ2RhdGV0ZXh0dWFsJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIG1vbnRoLCBkYXksIHllYXIpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZChwcm9jZXNzWWVhcih5ZWFyKSwgbG9va3VwTW9udGgobW9udGgpLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgcG9pbnRlZERhdGU0OiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZURheSArICdbLlxcXFx0LV0nICsgcmVNb250aCArICdbLi1dJyArIHJlWWVhcjQpLFxuICAgIG5hbWU6ICdwb2ludGVkZGF0ZTQnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgZGF5LCBtb250aCwgeWVhcikge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKCt5ZWFyLCBtb250aCAtIDEsICtkYXkpO1xuICAgIH1cbiAgfSxcblxuICBwb2ludGVkRGF0ZTI6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlRGF5ICsgJ1suXFxcXHRdJyArIHJlTW9udGggKyAnXFxcXC4nICsgcmVZZWFyMiksXG4gICAgbmFtZTogJ3BvaW50ZWRkYXRlMicsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBkYXksIG1vbnRoLCB5ZWFyKSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQocHJvY2Vzc1llYXIoeWVhciksIG1vbnRoIC0gMSwgK2RheSk7XG4gICAgfVxuICB9LFxuXG4gIHRpbWVMb25nMjQ6IHtcbiAgICByZWdleDogUmVnRXhwKCdedD8nICsgcmVIb3VyMjQgKyAnWzouXScgKyByZU1pbnV0ZSArICdbOi5dJyArIHJlU2Vjb25kKSxcbiAgICBuYW1lOiAndGltZWxvbmcyNCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xuICAgICAgcmV0dXJuIHRoaXMudGltZSgraG91ciwgK21pbnV0ZSwgK3NlY29uZCwgMCk7XG4gICAgfVxuICB9LFxuXG4gIGRhdGVOb0NvbG9uOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZVllYXI0ICsgcmVNb250aGx6ICsgcmVEYXlseiksXG4gICAgbmFtZTogJ2RhdGVub2NvbG9uJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCgreWVhciwgbW9udGggLSAxLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgcGd5ZG90ZDoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVZZWFyNCArICdcXFxcLj8nICsgcmVEYXlPZlllYXIpLFxuICAgIG5hbWU6ICdwZ3lkb3RkJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIGRheSkge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKCt5ZWFyLCAwLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgdGltZVNob3J0MjQ6IHtcbiAgICByZWdleDogUmVnRXhwKCdedD8nICsgcmVIb3VyMjQgKyAnWzouXScgKyByZU1pbnV0ZSwgJ2knKSxcbiAgICBuYW1lOiAndGltZXNob3J0MjQnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgaG91ciwgbWludXRlKSB7XG4gICAgICByZXR1cm4gdGhpcy50aW1lKCtob3VyLCArbWludXRlLCAwLCAwKTtcbiAgICB9XG4gIH0sXG5cbiAgaXNvODYwMW5vQ29sb246IHtcbiAgICByZWdleDogUmVnRXhwKCdedD8nICsgcmVIb3VyMjRseiArIHJlTWludXRlbHogKyByZVNlY29uZGx6LCAnaScpLFxuICAgIG5hbWU6ICdpc284NjAxbm9jb2xvbicsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xuICAgICAgcmV0dXJuIHRoaXMudGltZSgraG91ciwgK21pbnV0ZSwgK3NlY29uZCwgMCk7XG4gICAgfVxuICB9LFxuXG4gIGlzbzg2MDFkYXRlU2xhc2g6IHtcbiAgICAvLyBldmVudGhvdWdoIHRoZSB0cmFpbGluZyBzbGFzaCBpcyBvcHRpb25hbCBpbiBQSFBcbiAgICAvLyBoZXJlIGl0J3MgbWFuZGF0b3J5IGFuZCBpbnB1dHMgd2l0aG91dCB0aGUgc2xhc2hcbiAgICAvLyBhcmUgaGFuZGxlZCBieSBkYXRlc2xhc2hcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlWWVhcjQgKyAnLycgKyByZU1vbnRobHogKyAnLycgKyByZURheWx6ICsgJy8nKSxcbiAgICBuYW1lOiAnaXNvODYwMWRhdGVzbGFzaCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyLCBtb250aCwgZGF5KSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQoK3llYXIsIG1vbnRoIC0gMSwgK2RheSk7XG4gICAgfVxuICB9LFxuXG4gIGRhdGVTbGFzaDoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVZZWFyNCArICcvJyArIHJlTW9udGggKyAnLycgKyByZURheSksXG4gICAgbmFtZTogJ2RhdGVzbGFzaCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyLCBtb250aCwgZGF5KSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQoK3llYXIsIG1vbnRoIC0gMSwgK2RheSk7XG4gICAgfVxuICB9LFxuXG4gIGFtZXJpY2FuOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZU1vbnRoICsgJy8nICsgcmVEYXkgKyAnLycgKyByZVllYXIpLFxuICAgIG5hbWU6ICdhbWVyaWNhbicsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBtb250aCwgZGF5LCB5ZWFyKSB7XG4gICAgICByZXR1cm4gdGhpcy55bWQocHJvY2Vzc1llYXIoeWVhciksIG1vbnRoIC0gMSwgK2RheSk7XG4gICAgfVxuICB9LFxuXG4gIGFtZXJpY2FuU2hvcnQ6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlTW9udGggKyAnLycgKyByZURheSksXG4gICAgbmFtZTogJ2FtZXJpY2Fuc2hvcnQnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgbW9udGgsIGRheSkge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKHRoaXMueSwgbW9udGggLSAxLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgZ251RGF0ZVNob3J0T3JJc284NjAxZGF0ZTI6IHtcbiAgICAvLyBpc284NjAxZGF0ZTIgaXMgY29tcGxldGUgc3Vic2V0IG9mIGdudWRhdGVzaG9ydFxuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVZZWFyICsgJy0nICsgcmVNb250aCArICctJyArIHJlRGF5KSxcbiAgICBuYW1lOiAnZ251ZGF0ZXNob3J0IHwgaXNvODYwMWRhdGUyJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZChwcm9jZXNzWWVhcih5ZWFyKSwgbW9udGggLSAxLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgaXNvODYwMWRhdGU0OiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZVllYXI0d2l0aFNpZ24gKyAnLScgKyByZU1vbnRobHogKyAnLScgKyByZURheWx6KSxcbiAgICBuYW1lOiAnaXNvODYwMWRhdGU0JyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCgreWVhciwgbW9udGggLSAxLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgZ251Tm9Db2xvbjoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ150PycgKyByZUhvdXIyNGx6ICsgcmVNaW51dGVseiwgJ2knKSxcbiAgICBuYW1lOiAnZ251bm9jb2xvbicsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBob3VyLCBtaW51dGUpIHtcbiAgICAgIC8vIHRoaXMgcnVsZSBpcyBhIHNwZWNpYWwgY2FzZVxuICAgICAgLy8gaWYgdGltZSB3YXMgYWxyZWFkeSBzZXQgb25jZSBieSBhbnkgcHJlY2VkaW5nIHJ1bGUsIGl0IHNldHMgdGhlIGNhcHR1cmVkIHZhbHVlIGFzIHllYXJcbiAgICAgIHN3aXRjaCAodGhpcy50aW1lcykge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgcmV0dXJuIHRoaXMudGltZSgraG91ciwgK21pbnV0ZSwgMCwgdGhpcy5mKTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHRoaXMueSA9IGhvdXIgKiAxMDAgKyArbWludXRlO1xuICAgICAgICAgIHRoaXMudGltZXMrKztcblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgZ251RGF0ZVNob3J0ZXI6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlWWVhcjQgKyAnLScgKyByZU1vbnRoKSxcbiAgICBuYW1lOiAnZ251ZGF0ZXNob3J0ZXInLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgeWVhciwgbW9udGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCgreWVhciwgbW9udGggLSAxLCAxKTtcbiAgICB9XG4gIH0sXG5cbiAgcGdUZXh0UmV2ZXJzZToge1xuICAgIC8vIG5vdGU6IGFsbG93ZWQgeWVhcnMgYXJlIGZyb20gMzItOTk5OVxuICAgIC8vIHllYXJzIGJlbG93IDMyIHNob3VsZCBiZSB0cmVhdGVkIGFzIGRheXMgaW4gZGF0ZWZ1bGxcbiAgICByZWdleDogUmVnRXhwKCdeJyArICcoXFxcXGR7Myw0fXxbNC05XVxcXFxkfDNbMi05XSktKCcgKyByZU1vbnRoQWJiciArICcpLScgKyByZURheWx6LCAnaScpLFxuICAgIG5hbWU6ICdwZ3RleHRyZXZlcnNlJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZChwcm9jZXNzWWVhcih5ZWFyKSwgbG9va3VwTW9udGgobW9udGgpLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgZGF0ZUZ1bGw6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlRGF5ICsgJ1sgXFxcXHQuLV0qJyArIHJlTW9udGhUZXh0ICsgJ1sgXFxcXHQuLV0qJyArIHJlWWVhciwgJ2knKSxcbiAgICBuYW1lOiAnZGF0ZWZ1bGwnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgZGF5LCBtb250aCwgeWVhcikge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKHByb2Nlc3NZZWFyKHllYXIpLCBsb29rdXBNb250aChtb250aCksICtkYXkpO1xuICAgIH1cbiAgfSxcblxuICBkYXRlTm9EYXk6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlTW9udGhUZXh0ICsgJ1sgLlxcXFx0LV0qJyArIHJlWWVhcjQsICdpJyksXG4gICAgbmFtZTogJ2RhdGVub2RheScsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBtb250aCwgeWVhcikge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKCt5ZWFyLCBsb29rdXBNb250aChtb250aCksIDEpO1xuICAgIH1cbiAgfSxcblxuICBkYXRlTm9EYXlSZXY6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlWWVhcjQgKyAnWyAuXFxcXHQtXSonICsgcmVNb250aFRleHQsICdpJyksXG4gICAgbmFtZTogJ2RhdGVub2RheXJldicsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyLCBtb250aCkge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKCt5ZWFyLCBsb29rdXBNb250aChtb250aCksIDEpO1xuICAgIH1cbiAgfSxcblxuICBwZ1RleHRTaG9ydDoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14oJyArIHJlTW9udGhBYmJyICsgJyktJyArIHJlRGF5bHogKyAnLScgKyByZVllYXIsICdpJyksXG4gICAgbmFtZTogJ3BndGV4dHNob3J0JyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIG1vbnRoLCBkYXksIHllYXIpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZChwcm9jZXNzWWVhcih5ZWFyKSwgbG9va3VwTW9udGgobW9udGgpLCArZGF5KTtcbiAgICB9XG4gIH0sXG5cbiAgZGF0ZU5vWWVhcjoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVEYXRlTm9ZZWFyLCAnaScpLFxuICAgIG5hbWU6ICdkYXRlbm95ZWFyJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIG1vbnRoLCBkYXkpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCh0aGlzLnksIGxvb2t1cE1vbnRoKG1vbnRoKSwgK2RheSk7XG4gICAgfVxuICB9LFxuXG4gIGRhdGVOb1llYXJSZXY6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlRGF5ICsgJ1sgLlxcXFx0LV0qJyArIHJlTW9udGhUZXh0LCAnaScpLFxuICAgIG5hbWU6ICdkYXRlbm95ZWFycmV2JyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIGRheSwgbW9udGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCh0aGlzLnksIGxvb2t1cE1vbnRoKG1vbnRoKSwgK2RheSk7XG4gICAgfVxuICB9LFxuXG4gIGlzb1dlZWtEYXk6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlWWVhcjQgKyAnLT9XJyArIHJlV2Vla09mWWVhciArICcoPzotPyhbMC03XSkpPycpLFxuICAgIG5hbWU6ICdpc293ZWVrZGF5IHwgaXNvd2VlaycsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyLCB3ZWVrLCBkYXkpIHtcbiAgICAgIGRheSA9IGRheSA/ICtkYXkgOiAxO1xuXG4gICAgICBpZiAoIXRoaXMueW1kKCt5ZWFyLCAwLCAxKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIGdldCBkYXkgb2Ygd2VlayBmb3IgSmFuIDFzdFxuICAgICAgdmFyIGRheU9mV2VlayA9IG5ldyBEYXRlKHRoaXMueSwgdGhpcy5tLCB0aGlzLmQpLmdldERheSgpO1xuXG4gICAgICAvLyBhbmQgdXNlIHRoZSBkYXkgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IGZvciBkYXkgMSBvZiB3ZWVrIDFcbiAgICAgIGRheU9mV2VlayA9IDAgLSAoZGF5T2ZXZWVrID4gNCA/IGRheU9mV2VlayAtIDcgOiBkYXlPZldlZWspO1xuXG4gICAgICB0aGlzLnJkICs9IGRheU9mV2VlayArICh3ZWVrIC0gMSkgKiA3ICsgZGF5O1xuICAgIH1cbiAgfSxcblxuICByZWxhdGl2ZVRleHQ6IHtcbiAgICByZWdleDogUmVnRXhwKCdeKCcgKyByZVJlbHRleHRudW1iZXIgKyAnfCcgKyByZVJlbHRleHR0ZXh0ICsgJyknICsgcmVTcGFjZSArICcoJyArIHJlUmVsdGV4dHVuaXQgKyAnKScsICdpJyksXG4gICAgbmFtZTogJ3JlbGF0aXZldGV4dCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCByZWxWYWx1ZSwgcmVsVW5pdCkge1xuICAgICAgLy8gdG9kbzogaW1wbGVtZW50IGhhbmRsaW5nIG9mICd0aGlzIHRpbWUtdW5pdCdcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgdmFyIF9sb29rdXBSZWxhdGl2ZSA9IGxvb2t1cFJlbGF0aXZlKHJlbFZhbHVlKSxcbiAgICAgICAgICBhbW91bnQgPSBfbG9va3VwUmVsYXRpdmUuYW1vdW50LFxuICAgICAgICAgIGJlaGF2aW9yID0gX2xvb2t1cFJlbGF0aXZlLmJlaGF2aW9yO1xuXG4gICAgICBzd2l0Y2ggKHJlbFVuaXQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlICdzZWMnOlxuICAgICAgICBjYXNlICdzZWNzJzpcbiAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgICAgICAgdGhpcy5ycyArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pbic6XG4gICAgICAgIGNhc2UgJ21pbnMnOlxuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICBjYXNlICdtaW51dGVzJzpcbiAgICAgICAgICB0aGlzLnJpICs9IGFtb3VudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgIGNhc2UgJ2hvdXJzJzpcbiAgICAgICAgICB0aGlzLnJoICs9IGFtb3VudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgY2FzZSAnZGF5cyc6XG4gICAgICAgICAgdGhpcy5yZCArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ZvcnRuaWdodCc6XG4gICAgICAgIGNhc2UgJ2ZvcnRuaWdodHMnOlxuICAgICAgICBjYXNlICdmb3J0aG5pZ2h0JzpcbiAgICAgICAgY2FzZSAnZm9ydGhuaWdodHMnOlxuICAgICAgICAgIHRoaXMucmQgKz0gYW1vdW50ICogMTQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBjYXNlICd3ZWVrcyc6XG4gICAgICAgICAgdGhpcy5yZCArPSBhbW91bnQgKiA3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgIGNhc2UgJ21vbnRocyc6XG4gICAgICAgICAgdGhpcy5ybSArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICBjYXNlICd5ZWFycyc6XG4gICAgICAgICAgdGhpcy5yeSArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vbic6Y2FzZSAnbW9uZGF5JzpcbiAgICAgICAgY2FzZSAndHVlJzpjYXNlICd0dWVzZGF5JzpcbiAgICAgICAgY2FzZSAnd2VkJzpjYXNlICd3ZWRuZXNkYXknOlxuICAgICAgICBjYXNlICd0aHUnOmNhc2UgJ3RodXJzZGF5JzpcbiAgICAgICAgY2FzZSAnZnJpJzpjYXNlICdmcmlkYXknOlxuICAgICAgICBjYXNlICdzYXQnOmNhc2UgJ3NhdHVyZGF5JzpcbiAgICAgICAgY2FzZSAnc3VuJzpjYXNlICdzdW5kYXknOlxuICAgICAgICAgIHRoaXMucmVzZXRUaW1lKCk7XG4gICAgICAgICAgdGhpcy53ZWVrZGF5ID0gbG9va3VwV2Vla2RheShyZWxVbml0LCA3KTtcbiAgICAgICAgICB0aGlzLndlZWtkYXlCZWhhdmlvciA9IDE7XG4gICAgICAgICAgdGhpcy5yZCArPSAoYW1vdW50ID4gMCA/IGFtb3VudCAtIDEgOiBhbW91bnQpICogNztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd2Vla2RheSc6XG4gICAgICAgIGNhc2UgJ3dlZWtkYXlzJzpcbiAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJlbGF0aXZlOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXihbKy1dKilbIFxcXFx0XSooXFxcXGQrKScgKyByZVNwYWNlT3B0ICsgJygnICsgcmVSZWx0ZXh0dW5pdCArICd8d2VlayknLCAnaScpLFxuICAgIG5hbWU6ICdyZWxhdGl2ZScsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBzaWducywgcmVsVmFsdWUsIHJlbFVuaXQpIHtcbiAgICAgIHZhciBtaW51c2VzID0gc2lnbnMucmVwbGFjZSgvW14tXS9nLCAnJykubGVuZ3RoO1xuXG4gICAgICB2YXIgYW1vdW50ID0gK3JlbFZhbHVlICogTWF0aC5wb3coLTEsIG1pbnVzZXMpO1xuXG4gICAgICBzd2l0Y2ggKHJlbFVuaXQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlICdzZWMnOlxuICAgICAgICBjYXNlICdzZWNzJzpcbiAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgICAgICAgdGhpcy5ycyArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pbic6XG4gICAgICAgIGNhc2UgJ21pbnMnOlxuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICBjYXNlICdtaW51dGVzJzpcbiAgICAgICAgICB0aGlzLnJpICs9IGFtb3VudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgIGNhc2UgJ2hvdXJzJzpcbiAgICAgICAgICB0aGlzLnJoICs9IGFtb3VudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgY2FzZSAnZGF5cyc6XG4gICAgICAgICAgdGhpcy5yZCArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ZvcnRuaWdodCc6XG4gICAgICAgIGNhc2UgJ2ZvcnRuaWdodHMnOlxuICAgICAgICBjYXNlICdmb3J0aG5pZ2h0JzpcbiAgICAgICAgY2FzZSAnZm9ydGhuaWdodHMnOlxuICAgICAgICAgIHRoaXMucmQgKz0gYW1vdW50ICogMTQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBjYXNlICd3ZWVrcyc6XG4gICAgICAgICAgdGhpcy5yZCArPSBhbW91bnQgKiA3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgIGNhc2UgJ21vbnRocyc6XG4gICAgICAgICAgdGhpcy5ybSArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICBjYXNlICd5ZWFycyc6XG4gICAgICAgICAgdGhpcy5yeSArPSBhbW91bnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vbic6Y2FzZSAnbW9uZGF5JzpcbiAgICAgICAgY2FzZSAndHVlJzpjYXNlICd0dWVzZGF5JzpcbiAgICAgICAgY2FzZSAnd2VkJzpjYXNlICd3ZWRuZXNkYXknOlxuICAgICAgICBjYXNlICd0aHUnOmNhc2UgJ3RodXJzZGF5JzpcbiAgICAgICAgY2FzZSAnZnJpJzpjYXNlICdmcmlkYXknOlxuICAgICAgICBjYXNlICdzYXQnOmNhc2UgJ3NhdHVyZGF5JzpcbiAgICAgICAgY2FzZSAnc3VuJzpjYXNlICdzdW5kYXknOlxuICAgICAgICAgIHRoaXMucmVzZXRUaW1lKCk7XG4gICAgICAgICAgdGhpcy53ZWVrZGF5ID0gbG9va3VwV2Vla2RheShyZWxVbml0LCA3KTtcbiAgICAgICAgICB0aGlzLndlZWtkYXlCZWhhdmlvciA9IDE7XG4gICAgICAgICAgdGhpcy5yZCArPSAoYW1vdW50ID4gMCA/IGFtb3VudCAtIDEgOiBhbW91bnQpICogNztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd2Vla2RheSc6XG4gICAgICAgIGNhc2UgJ3dlZWtkYXlzJzpcbiAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGRheVRleHQ6IHtcbiAgICByZWdleDogUmVnRXhwKCdeKCcgKyByZURheXRleHQgKyAnKScsICdpJyksXG4gICAgbmFtZTogJ2RheXRleHQnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgZGF5VGV4dCkge1xuICAgICAgdGhpcy5yZXNldFRpbWUoKTtcbiAgICAgIHRoaXMud2Vla2RheSA9IGxvb2t1cFdlZWtkYXkoZGF5VGV4dCwgMCk7XG5cbiAgICAgIGlmICh0aGlzLndlZWtkYXlCZWhhdmlvciAhPT0gMikge1xuICAgICAgICB0aGlzLndlZWtkYXlCZWhhdmlvciA9IDE7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJlbGF0aXZlVGV4dFdlZWs6IHtcbiAgICByZWdleDogUmVnRXhwKCdeKCcgKyByZVJlbHRleHR0ZXh0ICsgJyknICsgcmVTcGFjZSArICd3ZWVrJywgJ2knKSxcbiAgICBuYW1lOiAncmVsYXRpdmV0ZXh0d2VlaycsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCByZWxUZXh0KSB7XG4gICAgICB0aGlzLndlZWtkYXlCZWhhdmlvciA9IDI7XG5cbiAgICAgIHN3aXRjaCAocmVsVGV4dC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgJ3RoaXMnOlxuICAgICAgICAgIHRoaXMucmQgKz0gMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbmV4dCc6XG4gICAgICAgICAgdGhpcy5yZCArPSA3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsYXN0JzpcbiAgICAgICAgY2FzZSAncHJldmlvdXMnOlxuICAgICAgICAgIHRoaXMucmQgLT0gNztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKGlzTmFOKHRoaXMud2Vla2RheSkpIHtcbiAgICAgICAgdGhpcy53ZWVrZGF5ID0gMTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgbW9udGhGdWxsT3JNb250aEFiYnI6IHtcbiAgICByZWdleDogUmVnRXhwKCdeKCcgKyByZU1vbnRoRnVsbCArICd8JyArIHJlTW9udGhBYmJyICsgJyknLCAnaScpLFxuICAgIG5hbWU6ICdtb250aGZ1bGwgfCBtb250aGFiYnInLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgbW9udGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCh0aGlzLnksIGxvb2t1cE1vbnRoKG1vbnRoKSwgdGhpcy5kKTtcbiAgICB9XG4gIH0sXG5cbiAgdHpDb3JyZWN0aW9uOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZVR6Q29ycmVjdGlvbiwgJ2knKSxcbiAgICBuYW1lOiAndHpjb3JyZWN0aW9uJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sodHpDb3JyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy56b25lKHByb2Nlc3NUekNvcnJlY3Rpb24odHpDb3JyZWN0aW9uKSk7XG4gICAgfVxuICB9LFxuXG4gIHR6QWJicjoge1xuICAgIHJlZ2V4OiBSZWdFeHAoJ14nICsgcmVUekFiYnIpLFxuICAgIG5hbWU6ICd0emFiYnInLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgYWJicikge1xuICAgICAgdmFyIG9mZnNldCA9IHR6QWJick9mZnNldHNbYWJici50b0xvd2VyQ2FzZSgpXTtcblxuICAgICAgaWYgKGlzTmFOKG9mZnNldCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy56b25lKG9mZnNldCk7XG4gICAgfVxuICB9LFxuXG4gIGFnbzoge1xuICAgIHJlZ2V4OiAvXmFnby9pLFxuICAgIG5hbWU6ICdhZ28nLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgIHRoaXMucnkgPSAtdGhpcy5yeTtcbiAgICAgIHRoaXMucm0gPSAtdGhpcy5ybTtcbiAgICAgIHRoaXMucmQgPSAtdGhpcy5yZDtcbiAgICAgIHRoaXMucmggPSAtdGhpcy5yaDtcbiAgICAgIHRoaXMucmkgPSAtdGhpcy5yaTtcbiAgICAgIHRoaXMucnMgPSAtdGhpcy5ycztcbiAgICAgIHRoaXMucmYgPSAtdGhpcy5yZjtcbiAgICB9XG4gIH0sXG5cbiAgeWVhcjQ6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlWWVhcjQpLFxuICAgIG5hbWU6ICd5ZWFyNCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCB5ZWFyKSB7XG4gICAgICB0aGlzLnkgPSAreWVhcjtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICB3aGl0ZXNwYWNlOiB7XG4gICAgcmVnZXg6IC9eWyAuLFxcdF0rLyxcbiAgICBuYW1lOiAnd2hpdGVzcGFjZSdcbiAgICAvLyBkbyBub3RoaW5nXG4gIH0sXG5cbiAgZGF0ZVNob3J0V2l0aFRpbWVMb25nOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZURhdGVOb1llYXIgKyAndD8nICsgcmVIb3VyMjQgKyAnWzouXScgKyByZU1pbnV0ZSArICdbOi5dJyArIHJlU2Vjb25kLCAnaScpLFxuICAgIG5hbWU6ICdkYXRlc2hvcnR3aXRodGltZWxvbmcnLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbiBjYWxsYmFjayhtYXRjaCwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCh0aGlzLnksIGxvb2t1cE1vbnRoKG1vbnRoKSwgK2RheSkgJiYgdGhpcy50aW1lKCtob3VyLCArbWludXRlLCArc2Vjb25kLCAwKTtcbiAgICB9XG4gIH0sXG5cbiAgZGF0ZVNob3J0V2l0aFRpbWVMb25nMTI6IHtcbiAgICByZWdleDogUmVnRXhwKCdeJyArIHJlRGF0ZU5vWWVhciArIHJlSG91cjEyICsgJ1s6Ll0nICsgcmVNaW51dGUgKyAnWzouXScgKyByZVNlY29uZGx6ICsgcmVTcGFjZU9wdCArIHJlTWVyaWRpYW4sICdpJyksXG4gICAgbmFtZTogJ2RhdGVzaG9ydHdpdGh0aW1lbG9uZzEyJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtZXJpZGlhbikge1xuICAgICAgcmV0dXJuIHRoaXMueW1kKHRoaXMueSwgbG9va3VwTW9udGgobW9udGgpLCArZGF5KSAmJiB0aGlzLnRpbWUocHJvY2Vzc01lcmlkaWFuKCtob3VyLCBtZXJpZGlhbiksICttaW51dGUsICtzZWNvbmQsIDApO1xuICAgIH1cbiAgfSxcblxuICBkYXRlU2hvcnRXaXRoVGltZVNob3J0OiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZURhdGVOb1llYXIgKyAndD8nICsgcmVIb3VyMjQgKyAnWzouXScgKyByZU1pbnV0ZSwgJ2knKSxcbiAgICBuYW1lOiAnZGF0ZXNob3J0d2l0aHRpbWVzaG9ydCcsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uIGNhbGxiYWNrKG1hdGNoLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCh0aGlzLnksIGxvb2t1cE1vbnRoKG1vbnRoKSwgK2RheSkgJiYgdGhpcy50aW1lKCtob3VyLCArbWludXRlLCAwLCAwKTtcbiAgICB9XG4gIH0sXG5cbiAgZGF0ZVNob3J0V2l0aFRpbWVTaG9ydDEyOiB7XG4gICAgcmVnZXg6IFJlZ0V4cCgnXicgKyByZURhdGVOb1llYXIgKyByZUhvdXIxMiArICdbOi5dJyArIHJlTWludXRlbHogKyByZVNwYWNlT3B0ICsgcmVNZXJpZGlhbiwgJ2knKSxcbiAgICBuYW1lOiAnZGF0ZXNob3J0d2l0aHRpbWVzaG9ydDEyJyxcbiAgICBjYWxsYmFjazogZnVuY3Rpb24gY2FsbGJhY2sobWF0Y2gsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgbWVyaWRpYW4pIHtcbiAgICAgIHJldHVybiB0aGlzLnltZCh0aGlzLnksIGxvb2t1cE1vbnRoKG1vbnRoKSwgK2RheSkgJiYgdGhpcy50aW1lKHByb2Nlc3NNZXJpZGlhbigraG91ciwgbWVyaWRpYW4pLCArbWludXRlLCAwLCAwKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciByZXN1bHRQcm90byA9IHtcbiAgLy8gZGF0ZVxuICB5OiBOYU4sXG4gIG06IE5hTixcbiAgZDogTmFOLFxuICAvLyB0aW1lXG4gIGg6IE5hTixcbiAgaTogTmFOLFxuICBzOiBOYU4sXG4gIGY6IE5hTixcblxuICAvLyByZWxhdGl2ZSBzaGlmdHNcbiAgcnk6IDAsXG4gIHJtOiAwLFxuICByZDogMCxcbiAgcmg6IDAsXG4gIHJpOiAwLFxuICByczogMCxcbiAgcmY6IDAsXG5cbiAgLy8gd2Vla2RheSByZWxhdGVkIHNoaWZ0c1xuICB3ZWVrZGF5OiBOYU4sXG4gIHdlZWtkYXlCZWhhdmlvcjogMCxcblxuICAvLyBmaXJzdCBvciBsYXN0IGRheSBvZiBtb250aFxuICAvLyAwIG5vbmUsIDEgZmlyc3QsIC0xIGxhc3RcbiAgZmlyc3RPckxhc3REYXlPZk1vbnRoOiAwLFxuXG4gIC8vIHRpbWV6b25lIGNvcnJlY3Rpb24gaW4gbWludXRlc1xuICB6OiBOYU4sXG5cbiAgLy8gY291bnRlcnNcbiAgZGF0ZXM6IDAsXG4gIHRpbWVzOiAwLFxuICB6b25lczogMCxcblxuICAvLyBoZWxwZXIgZnVuY3Rpb25zXG4gIHltZDogZnVuY3Rpb24geW1kKHksIG0sIGQpIHtcbiAgICBpZiAodGhpcy5kYXRlcyA+IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLmRhdGVzKys7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLm0gPSBtO1xuICAgIHRoaXMuZCA9IGQ7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIHRpbWU6IGZ1bmN0aW9uIHRpbWUoaCwgaSwgcywgZikge1xuICAgIGlmICh0aGlzLnRpbWVzID4gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMudGltZXMrKztcbiAgICB0aGlzLmggPSBoO1xuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5zID0gcztcbiAgICB0aGlzLmYgPSBmO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIHJlc2V0VGltZTogZnVuY3Rpb24gcmVzZXRUaW1lKCkge1xuICAgIHRoaXMuaCA9IDA7XG4gICAgdGhpcy5pID0gMDtcbiAgICB0aGlzLnMgPSAwO1xuICAgIHRoaXMuZiA9IDA7XG4gICAgdGhpcy50aW1lcyA9IDA7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgem9uZTogZnVuY3Rpb24gem9uZShtaW51dGVzKSB7XG4gICAgaWYgKHRoaXMuem9uZXMgPD0gMSkge1xuICAgICAgdGhpcy56b25lcysrO1xuICAgICAgdGhpcy56ID0gbWludXRlcztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgdG9EYXRlOiBmdW5jdGlvbiB0b0RhdGUocmVsYXRpdmVUbykge1xuICAgIGlmICh0aGlzLmRhdGVzICYmICF0aGlzLnRpbWVzKSB7XG4gICAgICB0aGlzLmggPSB0aGlzLmkgPSB0aGlzLnMgPSB0aGlzLmYgPSAwO1xuICAgIH1cblxuICAgIC8vIGZpbGwgaG9sZXNcbiAgICBpZiAoaXNOYU4odGhpcy55KSkge1xuICAgICAgdGhpcy55ID0gcmVsYXRpdmVUby5nZXRGdWxsWWVhcigpO1xuICAgIH1cblxuICAgIGlmIChpc05hTih0aGlzLm0pKSB7XG4gICAgICB0aGlzLm0gPSByZWxhdGl2ZVRvLmdldE1vbnRoKCk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmFOKHRoaXMuZCkpIHtcbiAgICAgIHRoaXMuZCA9IHJlbGF0aXZlVG8uZ2V0RGF0ZSgpO1xuICAgIH1cblxuICAgIGlmIChpc05hTih0aGlzLmgpKSB7XG4gICAgICB0aGlzLmggPSByZWxhdGl2ZVRvLmdldEhvdXJzKCk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmFOKHRoaXMuaSkpIHtcbiAgICAgIHRoaXMuaSA9IHJlbGF0aXZlVG8uZ2V0TWludXRlcygpO1xuICAgIH1cblxuICAgIGlmIChpc05hTih0aGlzLnMpKSB7XG4gICAgICB0aGlzLnMgPSByZWxhdGl2ZVRvLmdldFNlY29uZHMoKTtcbiAgICB9XG5cbiAgICBpZiAoaXNOYU4odGhpcy5mKSkge1xuICAgICAgdGhpcy5mID0gcmVsYXRpdmVUby5nZXRNaWxsaXNlY29uZHMoKTtcbiAgICB9XG5cbiAgICAvLyBhZGp1c3Qgc3BlY2lhbCBlYXJseVxuICAgIHN3aXRjaCAodGhpcy5maXJzdE9yTGFzdERheU9mTW9udGgpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgdGhpcy5kID0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIC0xOlxuICAgICAgICB0aGlzLmQgPSAwO1xuICAgICAgICB0aGlzLm0gKz0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCFpc05hTih0aGlzLndlZWtkYXkpKSB7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHJlbGF0aXZlVG8uZ2V0VGltZSgpKTtcbiAgICAgIGRhdGUuc2V0RnVsbFllYXIodGhpcy55LCB0aGlzLm0sIHRoaXMuZCk7XG4gICAgICBkYXRlLnNldEhvdXJzKHRoaXMuaCwgdGhpcy5pLCB0aGlzLnMsIHRoaXMuZik7XG5cbiAgICAgIHZhciBkb3cgPSBkYXRlLmdldERheSgpO1xuXG4gICAgICBpZiAodGhpcy53ZWVrZGF5QmVoYXZpb3IgPT09IDIpIHtcbiAgICAgICAgLy8gVG8gbWFrZSBcInRoaXMgd2Vla1wiIHdvcmssIHdoZXJlIHRoZSBjdXJyZW50IGRheSBvZiB3ZWVrIGlzIGEgXCJzdW5kYXlcIlxuICAgICAgICBpZiAoZG93ID09PSAwICYmIHRoaXMud2Vla2RheSAhPT0gMCkge1xuICAgICAgICAgIHRoaXMud2Vla2RheSA9IC02O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVG8gbWFrZSBcInN1bmRheSB0aGlzIHdlZWtcIiB3b3JrLCB3aGVyZSB0aGUgY3VycmVudCBkYXkgb2Ygd2VlayBpcyBub3QgYSBcInN1bmRheVwiXG4gICAgICAgIGlmICh0aGlzLndlZWtkYXkgPT09IDAgJiYgZG93ICE9PSAwKSB7XG4gICAgICAgICAgdGhpcy53ZWVrZGF5ID0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZCAtPSBkb3c7XG4gICAgICAgIHRoaXMuZCArPSB0aGlzLndlZWtkYXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGlmZiA9IHRoaXMud2Vla2RheSAtIGRvdztcblxuICAgICAgICAvLyBzb21lIFBIUCBtYWdpY1xuICAgICAgICBpZiAodGhpcy5yZCA8IDAgJiYgZGlmZiA8IDAgfHwgdGhpcy5yZCA+PSAwICYmIGRpZmYgPD0gLXRoaXMud2Vla2RheUJlaGF2aW9yKSB7XG4gICAgICAgICAgZGlmZiArPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMud2Vla2RheSA+PSAwKSB7XG4gICAgICAgICAgdGhpcy5kICs9IGRpZmY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kIC09IDcgLSAoTWF0aC5hYnModGhpcy53ZWVrZGF5KSAtIGRvdyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLndlZWtkYXkgPSBOYU47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYWRqdXN0IHJlbGF0aXZlXG4gICAgdGhpcy55ICs9IHRoaXMucnk7XG4gICAgdGhpcy5tICs9IHRoaXMucm07XG4gICAgdGhpcy5kICs9IHRoaXMucmQ7XG5cbiAgICB0aGlzLmggKz0gdGhpcy5yaDtcbiAgICB0aGlzLmkgKz0gdGhpcy5yaTtcbiAgICB0aGlzLnMgKz0gdGhpcy5ycztcbiAgICB0aGlzLmYgKz0gdGhpcy5yZjtcblxuICAgIHRoaXMucnkgPSB0aGlzLnJtID0gdGhpcy5yZCA9IDA7XG4gICAgdGhpcy5yaCA9IHRoaXMucmkgPSB0aGlzLnJzID0gdGhpcy5yZiA9IDA7XG5cbiAgICB2YXIgcmVzdWx0ID0gbmV3IERhdGUocmVsYXRpdmVUby5nZXRUaW1lKCkpO1xuICAgIC8vIHNpbmNlIERhdGUgY29uc3RydWN0b3IgdHJlYXRzIHllYXJzIDw9IDk5IGFzIDE5MDArXG4gICAgLy8gaXQgY2FuJ3QgYmUgdXNlZCwgdGh1cyB0aGlzIHdlaXJkIHdheVxuICAgIHJlc3VsdC5zZXRGdWxsWWVhcih0aGlzLnksIHRoaXMubSwgdGhpcy5kKTtcbiAgICByZXN1bHQuc2V0SG91cnModGhpcy5oLCB0aGlzLmksIHRoaXMucywgdGhpcy5mKTtcblxuICAgIC8vIG5vdGU6IHRoaXMgaXMgZG9uZSB0d2ljZSBpbiBQSFBcbiAgICAvLyBlYXJseSB3aGVuIHByb2Nlc3Npbmcgc3BlY2lhbCByZWxhdGl2ZXNcbiAgICAvLyBhbmQgbGF0ZVxuICAgIC8vIHRvZG86IGNoZWNrIGlmIHRoZSBsb2dpYyBjYW4gYmUgcmVkdWNlZFxuICAgIC8vIHRvIGp1c3Qgb25lIHRpbWUgYWN0aW9uXG4gICAgc3dpdGNoICh0aGlzLmZpcnN0T3JMYXN0RGF5T2ZNb250aCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICByZXN1bHQuc2V0RGF0ZSgxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIC0xOlxuICAgICAgICByZXN1bHQuc2V0TW9udGgocmVzdWx0LmdldE1vbnRoKCkgKyAxLCAwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gYWRqdXN0IHRpbWV6b25lXG4gICAgaWYgKCFpc05hTih0aGlzLnopICYmIHJlc3VsdC5nZXRUaW1lem9uZU9mZnNldCgpICE9PSB0aGlzLnopIHtcbiAgICAgIHJlc3VsdC5zZXRVVENGdWxsWWVhcihyZXN1bHQuZ2V0RnVsbFllYXIoKSwgcmVzdWx0LmdldE1vbnRoKCksIHJlc3VsdC5nZXREYXRlKCkpO1xuXG4gICAgICByZXN1bHQuc2V0VVRDSG91cnMocmVzdWx0LmdldEhvdXJzKCksIHJlc3VsdC5nZXRNaW51dGVzKCksIHJlc3VsdC5nZXRTZWNvbmRzKCkgLSB0aGlzLnosIHJlc3VsdC5nZXRNaWxsaXNlY29uZHMoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJ0b3RpbWUoc3RyLCBub3cpIHtcbiAgLy8gICAgICAgZGlzY3VzcyBhdDogaHR0cHM6Ly9sb2N1dHVzLmlvL3BocC9zdHJ0b3RpbWUvXG4gIC8vICAgICAgb3JpZ2luYWwgYnk6IENhaW8gQXJpZWRlIChodHRwczovL2NhaW9hcmllZGUuY29tKVxuICAvLyAgICAgIGltcHJvdmVkIGJ5OiBLZXZpbiB2YW4gWm9ubmV2ZWxkIChodHRwczovL2t2ei5pbylcbiAgLy8gICAgICBpbXByb3ZlZCBieTogQ2FpbyBBcmllZGUgKGh0dHBzOi8vY2Fpb2FyaWVkZS5jb20pXG4gIC8vICAgICAgaW1wcm92ZWQgYnk6IEEuIE1hdMOtYXMgUXVlemFkYSAoaHR0cHM6Ly9hbWF0aWFzcS5jb20pXG4gIC8vICAgICAgaW1wcm92ZWQgYnk6IHByZXV0ZXJcbiAgLy8gICAgICBpbXByb3ZlZCBieTogQnJldHQgWmFtaXIgKGh0dHBzOi8vYnJldHQtemFtaXIubWUpXG4gIC8vICAgICAgaW1wcm92ZWQgYnk6IE1pcmtvIEZhYmVyXG4gIC8vICAgICAgICAgaW5wdXQgYnk6IERhdmlkXG4gIC8vICAgICAgYnVnZml4ZWQgYnk6IFdhZ25lciBCLiBTb2FyZXNcbiAgLy8gICAgICBidWdmaXhlZCBieTogQXJ0dXIgVGNoZXJueWNoZXZcbiAgLy8gICAgICBidWdmaXhlZCBieTogU3RlcGhhbiBCw7ZzY2gtUGxlcGVsaXRzIChodHRwczovL2dpdGh1Yi5jb20vcGxlcGUpXG4gIC8vIHJlaW1wbGVtZW50ZWQgYnk6IFJhZmHFgiBLdWthd3NraVxuICAvLyAgICAgICAgICAgbm90ZSAxOiBFeGFtcGxlcyBhbGwgaGF2ZSBhIGZpeGVkIHRpbWVzdGFtcCB0byBwcmV2ZW50XG4gIC8vICAgICAgICAgICBub3RlIDE6IHRlc3RzIHRvIGZhaWwgYmVjYXVzZSBvZiB2YXJpYWJsZSB0aW1lKHpvbmVzKVxuICAvLyAgICAgICAgZXhhbXBsZSAxOiBzdHJ0b3RpbWUoJysxIGRheScsIDExMjk2MzMyMDApXG4gIC8vICAgICAgICByZXR1cm5zIDE6IDExMjk3MTk2MDBcbiAgLy8gICAgICAgIGV4YW1wbGUgMjogc3RydG90aW1lKCcrMSB3ZWVrIDIgZGF5cyA0IGhvdXJzIDIgc2Vjb25kcycsIDExMjk2MzMyMDApXG4gIC8vICAgICAgICByZXR1cm5zIDI6IDExMzA0MjUyMDJcbiAgLy8gICAgICAgIGV4YW1wbGUgMzogc3RydG90aW1lKCdsYXN0IG1vbnRoJywgMTEyOTYzMzIwMClcbiAgLy8gICAgICAgIHJldHVybnMgMzogMTEyNzA0MTIwMFxuICAvLyAgICAgICAgZXhhbXBsZSA0OiBzdHJ0b3RpbWUoJzIwMDktMDUtMDQgMDg6MzA6MDArMDAnKVxuICAvLyAgICAgICAgcmV0dXJucyA0OiAxMjQxNDI1ODAwXG4gIC8vICAgICAgICBleGFtcGxlIDU6IHN0cnRvdGltZSgnMjAwOS0wNS0wNCAwODozMDowMCswMjowMCcpXG4gIC8vICAgICAgICByZXR1cm5zIDU6IDEyNDE0MTg2MDBcbiAgLy8gICAgICAgIGV4YW1wbGUgNjogc3RydG90aW1lKCcyMDA5LTA1LTA0IDA4OjMwOjAwIFlXVCcpXG4gIC8vICAgICAgICByZXR1cm5zIDY6IDEyNDE0NTQ2MDBcblxuICBpZiAobm93ID09IG51bGwpIHtcbiAgICBub3cgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgfVxuXG4gIC8vIHRoZSBydWxlIG9yZGVyIGlzIGltcG9ydGFudFxuICAvLyBpZiBtdWx0aXBsZSBydWxlcyBtYXRjaCwgdGhlIGxvbmdlc3QgbWF0Y2ggd2luc1xuICAvLyBpZiBtdWx0aXBsZSBydWxlcyBtYXRjaCB0aGUgc2FtZSBzdHJpbmcsIHRoZSBmaXJzdCBtYXRjaCB3aW5zXG4gIHZhciBydWxlcyA9IFtmb3JtYXRzLnllc3RlcmRheSwgZm9ybWF0cy5ub3csIGZvcm1hdHMubm9vbiwgZm9ybWF0cy5taWRuaWdodE9yVG9kYXksIGZvcm1hdHMudG9tb3Jyb3csIGZvcm1hdHMudGltZXN0YW1wLCBmb3JtYXRzLmZpcnN0T3JMYXN0RGF5LCBmb3JtYXRzLmJhY2tPckZyb250T2YsXG4gIC8vIGZvcm1hdHMud2Vla2RheU9mLCAvLyBub3QgeWV0IGltcGxlbWVudGVkXG4gIGZvcm1hdHMudGltZVRpbnkxMiwgZm9ybWF0cy50aW1lU2hvcnQxMiwgZm9ybWF0cy50aW1lTG9uZzEyLCBmb3JtYXRzLm1zc3FsdGltZSwgZm9ybWF0cy50aW1lU2hvcnQyNCwgZm9ybWF0cy50aW1lTG9uZzI0LCBmb3JtYXRzLmlzbzg2MDFsb25nLCBmb3JtYXRzLmdudU5vQ29sb24sIGZvcm1hdHMuaXNvODYwMW5vQ29sb24sIGZvcm1hdHMuYW1lcmljYW5TaG9ydCwgZm9ybWF0cy5hbWVyaWNhbiwgZm9ybWF0cy5pc284NjAxZGF0ZTQsIGZvcm1hdHMuaXNvODYwMWRhdGVTbGFzaCwgZm9ybWF0cy5kYXRlU2xhc2gsIGZvcm1hdHMuZ251RGF0ZVNob3J0T3JJc284NjAxZGF0ZTIsIGZvcm1hdHMuZ251RGF0ZVNob3J0ZXIsIGZvcm1hdHMuZGF0ZUZ1bGwsIGZvcm1hdHMucG9pbnRlZERhdGU0LCBmb3JtYXRzLnBvaW50ZWREYXRlMiwgZm9ybWF0cy5kYXRlTm9EYXksIGZvcm1hdHMuZGF0ZU5vRGF5UmV2LCBmb3JtYXRzLmRhdGVUZXh0dWFsLCBmb3JtYXRzLmRhdGVOb1llYXIsIGZvcm1hdHMuZGF0ZU5vWWVhclJldiwgZm9ybWF0cy5kYXRlTm9Db2xvbiwgZm9ybWF0cy54bWxScGMsIGZvcm1hdHMueG1sUnBjTm9Db2xvbiwgZm9ybWF0cy5zb2FwLCBmb3JtYXRzLndkZHgsIGZvcm1hdHMuZXhpZiwgZm9ybWF0cy5wZ3lkb3RkLCBmb3JtYXRzLmlzb1dlZWtEYXksIGZvcm1hdHMucGdUZXh0U2hvcnQsIGZvcm1hdHMucGdUZXh0UmV2ZXJzZSwgZm9ybWF0cy5jbGYsIGZvcm1hdHMueWVhcjQsIGZvcm1hdHMuYWdvLCBmb3JtYXRzLmRheVRleHQsIGZvcm1hdHMucmVsYXRpdmVUZXh0V2VlaywgZm9ybWF0cy5yZWxhdGl2ZVRleHQsIGZvcm1hdHMubW9udGhGdWxsT3JNb250aEFiYnIsIGZvcm1hdHMudHpDb3JyZWN0aW9uLCBmb3JtYXRzLnR6QWJiciwgZm9ybWF0cy5kYXRlU2hvcnRXaXRoVGltZVNob3J0MTIsIGZvcm1hdHMuZGF0ZVNob3J0V2l0aFRpbWVMb25nMTIsIGZvcm1hdHMuZGF0ZVNob3J0V2l0aFRpbWVTaG9ydCwgZm9ybWF0cy5kYXRlU2hvcnRXaXRoVGltZUxvbmcsIGZvcm1hdHMucmVsYXRpdmUsIGZvcm1hdHMud2hpdGVzcGFjZV07XG5cbiAgdmFyIHJlc3VsdCA9IE9iamVjdC5jcmVhdGUocmVzdWx0UHJvdG8pO1xuXG4gIHdoaWxlIChzdHIubGVuZ3RoKSB7XG4gICAgdmFyIGxvbmdlc3RNYXRjaCA9IG51bGw7XG4gICAgdmFyIGZpbmFsUnVsZSA9IG51bGw7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGZvcm1hdCA9IHJ1bGVzW2ldO1xuXG4gICAgICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2goZm9ybWF0LnJlZ2V4KTtcblxuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGlmICghbG9uZ2VzdE1hdGNoIHx8IG1hdGNoWzBdLmxlbmd0aCA+IGxvbmdlc3RNYXRjaFswXS5sZW5ndGgpIHtcbiAgICAgICAgICBsb25nZXN0TWF0Y2ggPSBtYXRjaDtcbiAgICAgICAgICBmaW5hbFJ1bGUgPSBmb3JtYXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWZpbmFsUnVsZSB8fCBmaW5hbFJ1bGUuY2FsbGJhY2sgJiYgZmluYWxSdWxlLmNhbGxiYWNrLmFwcGx5KHJlc3VsdCwgbG9uZ2VzdE1hdGNoKSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdHIgPSBzdHIuc3Vic3RyKGxvbmdlc3RNYXRjaFswXS5sZW5ndGgpO1xuICAgIGZpbmFsUnVsZSA9IG51bGw7XG4gICAgbG9uZ2VzdE1hdGNoID0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBNYXRoLmZsb29yKHJlc3VsdC50b0RhdGUobmV3IERhdGUobm93ICogMTAwMCkpIC8gMTAwMCk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RydG90aW1lLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmlfZ2V0KHZhcm5hbWUpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgLy8gIGRpc2N1c3MgYXQ6IGh0dHBzOi8vbG9jdXR1cy5pby9waHAvaW5pX2dldC9cbiAgLy8gb3JpZ2luYWwgYnk6IEJyZXR0IFphbWlyIChodHRwczovL2JyZXR0LXphbWlyLm1lKVxuICAvLyAgICAgIG5vdGUgMTogVGhlIGluaSB2YWx1ZXMgbXVzdCBiZSBzZXQgYnkgaW5pX3NldCBvciBtYW51YWxseSB3aXRoaW4gYW4gaW5pIGZpbGVcbiAgLy8gICBleGFtcGxlIDE6IGluaV9zZXQoJ2RhdGUudGltZXpvbmUnLCAnQXNpYS9Ib25nX0tvbmcnKVxuICAvLyAgIGV4YW1wbGUgMTogaW5pX2dldCgnZGF0ZS50aW1lem9uZScpXG4gIC8vICAgcmV0dXJucyAxOiAnQXNpYS9Ib25nX0tvbmcnXG5cbiAgdmFyICRnbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbDtcbiAgJGdsb2JhbC4kbG9jdXR1cyA9ICRnbG9iYWwuJGxvY3V0dXMgfHwge307XG4gIHZhciAkbG9jdXR1cyA9ICRnbG9iYWwuJGxvY3V0dXM7XG4gICRsb2N1dHVzLnBocCA9ICRsb2N1dHVzLnBocCB8fCB7fTtcbiAgJGxvY3V0dXMucGhwLmluaSA9ICRsb2N1dHVzLnBocC5pbmkgfHwge307XG5cbiAgaWYgKCRsb2N1dHVzLnBocC5pbmlbdmFybmFtZV0gJiYgJGxvY3V0dXMucGhwLmluaVt2YXJuYW1lXS5sb2NhbF92YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCRsb2N1dHVzLnBocC5pbmlbdmFybmFtZV0ubG9jYWxfdmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgcmV0dXJuICRsb2N1dHVzLnBocC5pbmlbdmFybmFtZV0ubG9jYWxfdmFsdWU7XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5pX2dldC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RybGVuKHN0cmluZykge1xuICAvLyAgZGlzY3VzcyBhdDogaHR0cHM6Ly9sb2N1dHVzLmlvL3BocC9zdHJsZW4vXG4gIC8vIG9yaWdpbmFsIGJ5OiBLZXZpbiB2YW4gWm9ubmV2ZWxkIChodHRwczovL2t2ei5pbylcbiAgLy8gaW1wcm92ZWQgYnk6IFNha2ltb3JpXG4gIC8vIGltcHJvdmVkIGJ5OiBLZXZpbiB2YW4gWm9ubmV2ZWxkIChodHRwczovL2t2ei5pbylcbiAgLy8gICAgaW5wdXQgYnk6IEtpcmsgU3Ryb2JlY2tcbiAgLy8gYnVnZml4ZWQgYnk6IE9ubm8gTWFyc21hbiAoaHR0cHM6Ly90d2l0dGVyLmNvbS9vbm5vbWFyc21hbilcbiAgLy8gIHJldmlzZWQgYnk6IEJyZXR0IFphbWlyIChodHRwczovL2JyZXR0LXphbWlyLm1lKVxuICAvLyAgICAgIG5vdGUgMTogTWF5IGxvb2sgbGlrZSBvdmVya2lsbCwgYnV0IGluIG9yZGVyIHRvIGJlIHRydWx5IGZhaXRoZnVsIHRvIGhhbmRsaW5nIGFsbCBVbmljb2RlXG4gIC8vICAgICAgbm90ZSAxOiBjaGFyYWN0ZXJzIGFuZCB0byB0aGlzIGZ1bmN0aW9uIGluIFBIUCB3aGljaCBkb2VzIG5vdCBjb3VudCB0aGUgbnVtYmVyIG9mIGJ5dGVzXG4gIC8vICAgICAgbm90ZSAxOiBidXQgY291bnRzIHRoZSBudW1iZXIgb2YgY2hhcmFjdGVycywgc29tZXRoaW5nIGxpa2UgdGhpcyBpcyByZWFsbHkgbmVjZXNzYXJ5LlxuICAvLyAgIGV4YW1wbGUgMTogc3RybGVuKCdLZXZpbiB2YW4gWm9ubmV2ZWxkJylcbiAgLy8gICByZXR1cm5zIDE6IDE5XG4gIC8vICAgZXhhbXBsZSAyOiBpbmlfc2V0KCd1bmljb2RlLnNlbWFudGljcycsICdvbicpXG4gIC8vICAgZXhhbXBsZSAyOiBzdHJsZW4oJ0FcXHVkODdlXFx1ZGMwNFonKVxuICAvLyAgIHJldHVybnMgMjogM1xuXG4gIHZhciBzdHIgPSBzdHJpbmcgKyAnJztcblxuICB2YXIgaW5pVmFsID0gKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJyA/IHJlcXVpcmUoJy4uL2luZm8vaW5pX2dldCcpKCd1bmljb2RlLnNlbWFudGljcycpIDogdW5kZWZpbmVkKSB8fCAnb2ZmJztcbiAgaWYgKGluaVZhbCA9PT0gJ29mZicpIHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aDtcbiAgfVxuXG4gIHZhciBpID0gMDtcbiAgdmFyIGxndGggPSAwO1xuXG4gIHZhciBnZXRXaG9sZUNoYXIgPSBmdW5jdGlvbiBnZXRXaG9sZUNoYXIoc3RyLCBpKSB7XG4gICAgdmFyIGNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICB2YXIgbmV4dCA9ICcnO1xuICAgIHZhciBwcmV2ID0gJyc7XG4gICAgaWYgKGNvZGUgPj0gMHhEODAwICYmIGNvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAvLyBIaWdoIHN1cnJvZ2F0ZSAoY291bGQgY2hhbmdlIGxhc3QgaGV4IHRvIDB4REI3RiB0b1xuICAgICAgLy8gdHJlYXQgaGlnaCBwcml2YXRlIHN1cnJvZ2F0ZXMgYXMgc2luZ2xlIGNoYXJhY3RlcnMpXG4gICAgICBpZiAoc3RyLmxlbmd0aCA8PSBpICsgMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hpZ2ggc3Vycm9nYXRlIHdpdGhvdXQgZm9sbG93aW5nIGxvdyBzdXJyb2dhdGUnKTtcbiAgICAgIH1cbiAgICAgIG5leHQgPSBzdHIuY2hhckNvZGVBdChpICsgMSk7XG4gICAgICBpZiAobmV4dCA8IDB4REMwMCB8fCBuZXh0ID4gMHhERkZGKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSGlnaCBzdXJyb2dhdGUgd2l0aG91dCBmb2xsb3dpbmcgbG93IHN1cnJvZ2F0ZScpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoaSkgKyBzdHIuY2hhckF0KGkgKyAxKTtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPj0gMHhEQzAwICYmIGNvZGUgPD0gMHhERkZGKSB7XG4gICAgICAvLyBMb3cgc3Vycm9nYXRlXG4gICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xvdyBzdXJyb2dhdGUgd2l0aG91dCBwcmVjZWRpbmcgaGlnaCBzdXJyb2dhdGUnKTtcbiAgICAgIH1cbiAgICAgIHByZXYgPSBzdHIuY2hhckNvZGVBdChpIC0gMSk7XG4gICAgICBpZiAocHJldiA8IDB4RDgwMCB8fCBwcmV2ID4gMHhEQkZGKSB7XG4gICAgICAgIC8vIChjb3VsZCBjaGFuZ2UgbGFzdCBoZXggdG8gMHhEQjdGIHRvIHRyZWF0IGhpZ2ggcHJpdmF0ZSBzdXJyb2dhdGVzXG4gICAgICAgIC8vIGFzIHNpbmdsZSBjaGFyYWN0ZXJzKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xvdyBzdXJyb2dhdGUgd2l0aG91dCBwcmVjZWRpbmcgaGlnaCBzdXJyb2dhdGUnKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGNhbiBwYXNzIG92ZXIgbG93IHN1cnJvZ2F0ZXMgbm93IGFzIHRoZSBzZWNvbmRcbiAgICAgIC8vIGNvbXBvbmVudCBpbiBhIHBhaXIgd2hpY2ggd2UgaGF2ZSBhbHJlYWR5IHByb2Nlc3NlZFxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3RyLmNoYXJBdChpKTtcbiAgfTtcblxuICBmb3IgKGkgPSAwLCBsZ3RoID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChnZXRXaG9sZUNoYXIoc3RyLCBpKSA9PT0gZmFsc2UpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBBZGFwdCB0aGlzIGxpbmUgYXQgdGhlIHRvcCBvZiBhbnkgbG9vcCwgcGFzc2luZyBpbiB0aGUgd2hvbGUgc3RyaW5nIGFuZFxuICAgIC8vIHRoZSBjdXJyZW50IGl0ZXJhdGlvbiBhbmQgcmV0dXJuaW5nIGEgdmFyaWFibGUgdG8gcmVwcmVzZW50IHRoZSBpbmRpdmlkdWFsIGNoYXJhY3RlcjtcbiAgICAvLyBwdXJwb3NlIGlzIHRvIHRyZWF0IHRoZSBmaXJzdCBwYXJ0IG9mIGEgc3Vycm9nYXRlIHBhaXIgYXMgdGhlIHdob2xlIGNoYXJhY3RlciBhbmQgdGhlblxuICAgIC8vIGlnbm9yZSB0aGUgc2Vjb25kIHBhcnRcbiAgICBsZ3RoKys7XG4gIH1cblxuICByZXR1cm4gbGd0aDtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdHJsZW4uanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzX251bWVyaWMobWl4ZWRWYXIpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgLy8gIGRpc2N1c3MgYXQ6IGh0dHBzOi8vbG9jdXR1cy5pby9waHAvaXNfbnVtZXJpYy9cbiAgLy8gb3JpZ2luYWwgYnk6IEtldmluIHZhbiBab25uZXZlbGQgKGh0dHBzOi8va3Z6LmlvKVxuICAvLyBpbXByb3ZlZCBieTogRGF2aWRcbiAgLy8gaW1wcm92ZWQgYnk6IHRhaXRoXG4gIC8vIGJ1Z2ZpeGVkIGJ5OiBUaW0gZGUgS29uaW5nXG4gIC8vIGJ1Z2ZpeGVkIGJ5OiBXZWJEZXZIb2JvIChodHRwczovL3dlYmRldmhvYm8uYmxvZ3Nwb3QuY29tLylcbiAgLy8gYnVnZml4ZWQgYnk6IEJyZXR0IFphbWlyIChodHRwczovL2JyZXR0LXphbWlyLm1lKVxuICAvLyBidWdmaXhlZCBieTogRGVuaXMgQ2hlbnUgKGh0dHBzOi8vc2hub3VsbGUubmV0KVxuICAvLyAgIGV4YW1wbGUgMTogaXNfbnVtZXJpYygxODYuMzEpXG4gIC8vICAgcmV0dXJucyAxOiB0cnVlXG4gIC8vICAgZXhhbXBsZSAyOiBpc19udW1lcmljKCdLZXZpbiB2YW4gWm9ubmV2ZWxkJylcbiAgLy8gICByZXR1cm5zIDI6IGZhbHNlXG4gIC8vICAgZXhhbXBsZSAzOiBpc19udW1lcmljKCcgKzE4Ni4zMWUyJylcbiAgLy8gICByZXR1cm5zIDM6IHRydWVcbiAgLy8gICBleGFtcGxlIDQ6IGlzX251bWVyaWMoJycpXG4gIC8vICAgcmV0dXJucyA0OiBmYWxzZVxuICAvLyAgIGV4YW1wbGUgNTogaXNfbnVtZXJpYyhbXSlcbiAgLy8gICByZXR1cm5zIDU6IGZhbHNlXG4gIC8vICAgZXhhbXBsZSA2OiBpc19udW1lcmljKCcxICcpXG4gIC8vICAgcmV0dXJucyA2OiBmYWxzZVxuXG4gIHZhciB3aGl0ZXNwYWNlID0gWycgJywgJ1xcbicsICdcXHInLCAnXFx0JywgJ1xcZicsICdcXHgwYicsICdcXHhhMCcsICdcXHUyMDAwJywgJ1xcdTIwMDEnLCAnXFx1MjAwMicsICdcXHUyMDAzJywgJ1xcdTIwMDQnLCAnXFx1MjAwNScsICdcXHUyMDA2JywgJ1xcdTIwMDcnLCAnXFx1MjAwOCcsICdcXHUyMDA5JywgJ1xcdTIwMEEnLCAnXFx1MjAwQicsICdcXHUyMDI4JywgJ1xcdTIwMjknLCAnXFx1MzAwMCddLmpvaW4oJycpO1xuXG4gIC8vIEB0b2RvOiBCcmVhayB0aGlzIHVwIHVzaW5nIG1hbnkgc2luZ2xlIGNvbmRpdGlvbnMgd2l0aCBlYXJseSByZXR1cm5zXG4gIHJldHVybiAodHlwZW9mIG1peGVkVmFyID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgbWl4ZWRWYXIgPT09ICdzdHJpbmcnICYmIHdoaXRlc3BhY2UuaW5kZXhPZihtaXhlZFZhci5zbGljZSgtMSkpID09PSAtMSkgJiYgbWl4ZWRWYXIgIT09ICcnICYmICFpc05hTihtaXhlZFZhcik7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXNfbnVtZXJpYy5qcy5tYXAiLCJ2YXIgZztcblxuLy8gVGhpcyB3b3JrcyBpbiBub24tc3RyaWN0IG1vZGVcbmcgPSAoZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzO1xufSkoKTtcblxudHJ5IHtcblx0Ly8gVGhpcyB3b3JrcyBpZiBldmFsIGlzIGFsbG93ZWQgKHNlZSBDU1ApXG5cdGcgPSBnIHx8IG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCk7XG59IGNhdGNoIChlKSB7XG5cdC8vIFRoaXMgd29ya3MgaWYgdGhlIHdpbmRvdyByZWZlcmVuY2UgaXMgYXZhaWxhYmxlXG5cdGlmICh0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiKSBnID0gd2luZG93O1xufVxuXG4vLyBnIGNhbiBzdGlsbCBiZSB1bmRlZmluZWQsIGJ1dCBub3RoaW5nIHRvIGRvIGFib3V0IGl0Li4uXG4vLyBXZSByZXR1cm4gdW5kZWZpbmVkLCBpbnN0ZWFkIG9mIG5vdGhpbmcgaGVyZSwgc28gaXQnc1xuLy8gZWFzaWVyIHRvIGhhbmRsZSB0aGlzIGNhc2UuIGlmKCFnbG9iYWwpIHsgLi4ufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGc7XG4iLCIvKiFcbiAqIExhcmF2ZWwgSmF2YXNjcmlwdCBWYWxpZGF0aW9uXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL3Byb2VuZ3NvZnQvbGFyYXZlbC1qc3ZhbGlkYXRpb25cbiAqXG4gKiBIZWxwZXIgZnVuY3Rpb25zIHVzZWQgYnkgdmFsaWRhdG9yc1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNyBQcm9lbmdzb2Z0XG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgc3RybGVuIGZyb20gJ2xvY3V0dXMvcGhwL3N0cmluZ3Mvc3RybGVuJztcbmltcG9ydCBhcnJheV9kaWZmIGZyb20gJ2xvY3V0dXMvcGhwL2FycmF5L2FycmF5X2RpZmYnO1xuaW1wb3J0IHN0cnRvdGltZSBmcm9tICdsb2N1dHVzL3BocC9kYXRldGltZS9zdHJ0b3RpbWUnO1xuaW1wb3J0IGlzX251bWVyaWMgZnJvbSAnbG9jdXR1cy9waHAvdmFyL2lzX251bWVyaWMnO1xuXG4kLmV4dGVuZCh0cnVlLCBsYXJhdmVsVmFsaWRhdGlvbiwge1xuXG4gICAgaGVscGVyczoge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOdW1lcmljIHJ1bGVzXG4gICAgICAgICAqL1xuICAgICAgICBudW1lcmljUnVsZXM6IFsnSW50ZWdlcicsICdOdW1lcmljJ10sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgdGhlIGZpbGUgaW5mb3JtYXRpb24gZnJvbSBmaWxlIGlucHV0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gZmllbGRPYmpcbiAgICAgICAgICogQHBhcmFtIGluZGV4XG4gICAgICAgICAqIEByZXR1cm5zIHt7ZmlsZTogKiwgZXh0ZW5zaW9uOiBzdHJpbmcsIHNpemU6IG51bWJlcn19XG4gICAgICAgICAqL1xuICAgICAgICBmaWxlaW5mbzogZnVuY3Rpb24gKGZpZWxkT2JqLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIEZpbGVOYW1lID0gZmllbGRPYmoudmFsdWU7XG4gICAgICAgICAgICBpbmRleCA9IHR5cGVvZiBpbmRleCAhPT0gJ3VuZGVmaW5lZCcgPyBpbmRleCA6IDA7XG4gICAgICAgICAgICBpZiAoIGZpZWxkT2JqLmZpbGVzICE9PSBudWxsICkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZmllbGRPYmouZmlsZXNbaW5kZXhdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogRmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbnNpb246IEZpbGVOYW1lLnN1YnN0cihGaWxlTmFtZS5sYXN0SW5kZXhPZignLicpICsgMSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBmaWVsZE9iai5maWxlc1tpbmRleF0uc2l6ZSAvIDEwMjQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWVsZE9iai5maWxlc1tpbmRleF0udHlwZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBzZWxlY3RvcnMgZm9yIHRoIHNwZWNpZmllZCBmaWVsZCBuYW1lcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIG5hbWVzXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBzZWxlY3RvcjogZnVuY3Rpb24gKG5hbWVzKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSBbXTtcbiAgICAgICAgICAgIGlmICghIHRoaXMuaXNBcnJheShuYW1lcykpICB7XG4gICAgICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLnB1c2goXCJbbmFtZT0nXCIgKyBuYW1lc1tpXSArIFwiJ11cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0b3Iuam9pbigpO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGlmIGVsZW1lbnQgaGFzIG51bWVyaWMgcnVsZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgaGFzTnVtZXJpY1J1bGVzOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzUnVsZXMoZWxlbWVudCwgdGhpcy5udW1lcmljUnVsZXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBpZiBlbGVtZW50IGhhcyBwYXNzZWQgcnVsZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSBydWxlc1xuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGhhc1J1bGVzOiBmdW5jdGlvbiAoZWxlbWVudCwgcnVsZXMpIHtcblxuICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJ1bGVzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJ1bGVzID0gW3J1bGVzXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9ICQuZGF0YShlbGVtZW50LmZvcm0sIFwidmFsaWRhdG9yXCIpO1xuICAgICAgICAgICAgdmFyIGxpc3RSdWxlcyA9IFtdO1xuICAgICAgICAgICAgdmFyIGNhY2hlID0gdmFsaWRhdG9yLmFycmF5UnVsZXNDYWNoZTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50Lm5hbWUgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goY2FjaGVbZWxlbWVudC5uYW1lXSwgZnVuY3Rpb24gKGluZGV4LCBhcnJheVJ1bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdFJ1bGVzLnB1c2goYXJyYXlSdWxlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50Lm5hbWUgaW4gdmFsaWRhdG9yLnNldHRpbmdzLnJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgbGlzdFJ1bGVzLnB1c2godmFsaWRhdG9yLnNldHRpbmdzLnJ1bGVzW2VsZW1lbnQubmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJC5lYWNoKGxpc3RSdWxlcywgZnVuY3Rpb24oaW5kZXgsb2JqUnVsZXMpe1xuICAgICAgICAgICAgICAgIGlmICgnbGFyYXZlbFZhbGlkYXRpb24nIGluIG9ialJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfcnVsZXM9b2JqUnVsZXMubGFyYXZlbFZhbGlkYXRpb247XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX3J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJC5pbkFycmF5KF9ydWxlc1tpXVswXSxydWxlcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgc3RyaW5nIGxlbmd0aCB1c2luZyBQSFAgZnVuY3Rpb24uXG4gICAgICAgICAqIGh0dHA6Ly9waHAubmV0L21hbnVhbC9lbi9mdW5jdGlvbi5zdHJsZW4ucGhwXG4gICAgICAgICAqIGh0dHA6Ly9waHBqcy5vcmcvZnVuY3Rpb25zL3N0cmxlbi9cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgc3RybGVuOiBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RybGVuKHN0cmluZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgb2JqZWN0IGRlcGVuZGluZyBvZiBoaXMgdHlwZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgKiBAcGFyYW0gZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICogQHJldHVybnMgaW50XG4gICAgICAgICAqL1xuICAgICAgICBnZXRTaXplOiBmdW5jdGlvbiBnZXRTaXplKG9iaiwgZWxlbWVudCwgdmFsdWUpIHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaGFzTnVtZXJpY1J1bGVzKGVsZW1lbnQpICYmIHRoaXMuaXNfbnVtZXJpYyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZS5sZW5ndGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnR5cGUgPT09ICdmaWxlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KE1hdGguZmxvb3IodGhpcy5maWxlaW5mbyhlbGVtZW50KS5zaXplKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMuc3RybGVuKHZhbHVlKSk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHNwZWNpZmllZCBydWxlIGZyb20gZWxlbWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHJ1bGVcbiAgICAgICAgICogQHBhcmFtIGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybnMgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBnZXRMYXJhdmVsVmFsaWRhdGlvbjogZnVuY3Rpb24ocnVsZSwgZWxlbWVudCkge1xuXG4gICAgICAgICAgICB2YXIgZm91bmQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAkLmVhY2goJC52YWxpZGF0b3Iuc3RhdGljUnVsZXMoZWxlbWVudCksIGZ1bmN0aW9uKGtleSwgcnVsZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5PT09XCJsYXJhdmVsVmFsaWRhdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChydWxlcywgZnVuY3Rpb24gKGksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVbMF09PT1ydWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQ9dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiBoZSB0aW1lc3RhbXAgb2YgdmFsdWUgcGFzc2VkIHVzaW5nIGZvcm1hdCBvciBkZWZhdWx0IGZvcm1hdCBpbiBlbGVtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICogQHBhcmFtIGZvcm1hdFxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbnxpbnR9XG4gICAgICAgICAqL1xuICAgICAgICBwYXJzZVRpbWU6IGZ1bmN0aW9uICh2YWx1ZSwgZm9ybWF0KSB7XG5cbiAgICAgICAgICAgIHZhciB0aW1lVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBmbXQgPSBuZXcgRGF0ZUZvcm1hdHRlcigpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZVJ1bGUgPSB0aGlzLmdldExhcmF2ZWxWYWxpZGF0aW9uKCdEYXRlRm9ybWF0JywgZm9ybWF0KTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZVJ1bGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBkYXRlUnVsZVsxXVswXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGltZVZhbHVlID0gdGhpcy5zdHJ0b3RpbWUodmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aW1lVmFsdWUgPSBmbXQucGFyc2VEYXRlKHZhbHVlLCBmb3JtYXQpO1xuICAgICAgICAgICAgICAgIGlmICh0aW1lVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZVZhbHVlID0gTWF0aC5yb3VuZCgodGltZVZhbHVlLmdldFRpbWUoKSAvIDEwMDApKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aW1lVmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbXBhcmUgYSBnaXZlbiBkYXRlIGFnYWluc3QgYW5vdGhlciB1c2luZyBhbiBvcGVyYXRvci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHZhbGlkYXRvclxuICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICogQHBhcmFtIGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAgICAgKiBAcGFyYW0gb3BlcmF0b3JcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGNvbXBhcmVEYXRlczogZnVuY3Rpb24gKHZhbGlkYXRvciwgdmFsdWUsIGVsZW1lbnQsIHBhcmFtcywgb3BlcmF0b3IpIHtcblxuICAgICAgICAgICAgdmFyIHRpbWVDb21wYXJlID0gdGhpcy5wYXJzZVRpbWUocGFyYW1zKTtcblxuICAgICAgICAgICAgaWYgKCF0aW1lQ29tcGFyZSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmRlcGVuZGVudEVsZW1lbnQodmFsaWRhdG9yLCBlbGVtZW50LCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRpbWVDb21wYXJlID0gdGhpcy5wYXJzZVRpbWUodmFsaWRhdG9yLmVsZW1lbnRWYWx1ZSh0YXJnZXQpLCB0YXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGltZVZhbHVlID0gdGhpcy5wYXJzZVRpbWUodmFsdWUsIGVsZW1lbnQpO1xuICAgICAgICAgICAgaWYgKHRpbWVWYWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRpbWVWYWx1ZSA8IHRpbWVDb21wYXJlO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnPD0nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGltZVZhbHVlIDw9IHRpbWVDb21wYXJlO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnPT0nOlxuICAgICAgICAgICAgICAgIGNhc2UgJz09PSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aW1lVmFsdWUgPT09IHRpbWVDb21wYXJlO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aW1lVmFsdWUgPiB0aW1lQ29tcGFyZTtcblxuICAgICAgICAgICAgICAgIGNhc2UgJz49JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRpbWVWYWx1ZSA+PSB0aW1lQ29tcGFyZTtcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgb3BlcmF0b3IuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGFsbG93cyB5b3UgdG8gaW50ZWxsaWdlbnRseSBndWVzcyB0aGUgZGF0ZSBieSBjbG9zZWx5IG1hdGNoaW5nIHRoZSBzcGVjaWZpYyBmb3JtYXQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gZm9ybWF0XG4gICAgICAgICAqIEByZXR1cm5zIHtEYXRlfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3Vlc3NEYXRlOiBmdW5jdGlvbiAodmFsdWUsIGZvcm1hdCkge1xuICAgICAgICAgICAgdmFyIGZtdCA9IG5ldyBEYXRlRm9ybWF0dGVyKCk7XG4gICAgICAgICAgICByZXR1cm4gZm10Lmd1ZXNzRGF0ZSh2YWx1ZSwgZm9ybWF0KVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIFVuaXggdGltZXN0YW1wIGJhc2VkIG9uIFBIUCBmdW5jdGlvbiBzdHJvdG90aW1lLlxuICAgICAgICAgKiBodHRwOi8vcGhwLm5ldC9tYW51YWwvZXMvZnVuY3Rpb24uc3RydG90aW1lLnBocFxuICAgICAgICAgKiBodHRwOi8vcGhwanMub3JnL2Z1bmN0aW9ucy9zdHJ0b3RpbWUvXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB0ZXh0XG4gICAgICAgICAqIEBwYXJhbSBub3dcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICBzdHJ0b3RpbWU6IGZ1bmN0aW9uICh0ZXh0LCBub3cpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJ0b3RpbWUodGV4dCwgbm93KVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGlmIHZhbHVlIGlzIG51bWVyaWMuXG4gICAgICAgICAqIGh0dHA6Ly9waHAubmV0L21hbnVhbC9lcy92YXIuaXNfbnVtZXJpYy5waHBcbiAgICAgICAgICogaHR0cDovL3BocGpzLm9yZy9mdW5jdGlvbnMvaXNfbnVtZXJpYy9cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIG1peGVkX3ZhclxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG4gICAgICAgIGlzX251bWVyaWM6IGZ1bmN0aW9uIChtaXhlZF92YXIpIHtcbiAgICAgICAgICAgIHJldHVybiBpc19udW1lcmljKG1peGVkX3ZhcilcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgd2hldGhlciB0aGUgYXJndW1lbnQgaXMgb2YgdHlwZSBBcnJheS5cbiAgICAgICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaXNBcnJheSNQb2x5ZmlsbFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gYXJnXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgaXNBcnJheTogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgQXJyYXkgZGlmZiBiYXNlZCBvbiBQSFAgZnVuY3Rpb24gYXJyYXlfZGlmZi5cbiAgICAgICAgICogaHR0cDovL3BocC5uZXQvbWFudWFsL2VzL2Z1bmN0aW9uLmFycmF5X2RpZmYucGhwXG4gICAgICAgICAqIGh0dHA6Ly9waHBqcy5vcmcvZnVuY3Rpb25zL2FycmF5X2RpZmYvXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBhcnIxXG4gICAgICAgICAqIEBwYXJhbSBhcnIyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgYXJyYXlEaWZmOiBmdW5jdGlvbiAoYXJyMSwgYXJyMikge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5X2RpZmYoYXJyMSwgYXJyMik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIHdoZXRoZXIgdHdvIGFycmF5cyBhcmUgZXF1YWwgdG8gb25lIGFub3RoZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBhcnIxXG4gICAgICAgICAqIEBwYXJhbSBhcnIyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgYXJyYXlFcXVhbHM6IGZ1bmN0aW9uIChhcnIxLCBhcnIyKSB7XG4gICAgICAgICAgICBpZiAoISB0aGlzLmlzQXJyYXkoYXJyMSkgfHwgISB0aGlzLmlzQXJyYXkoYXJyMikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChhcnIxLmxlbmd0aCAhPT0gYXJyMi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiAkLmlzRW1wdHlPYmplY3QodGhpcy5hcnJheURpZmYoYXJyMSwgYXJyMikpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWtlcyBlbGVtZW50IGRlcGVuZGFudCBmcm9tIG90aGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gdmFsaWRhdG9yXG4gICAgICAgICAqIEBwYXJhbSBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZGVwZW5kZW50RWxlbWVudDogZnVuY3Rpb24odmFsaWRhdG9yLCBlbGVtZW50LCBuYW1lKSB7XG5cbiAgICAgICAgICAgIHZhciBlbD12YWxpZGF0b3IuZmluZEJ5TmFtZShuYW1lKTtcblxuICAgICAgICAgICAgaWYgKCBlbFswXSE9PXVuZGVmaW5lZCAgJiYgdmFsaWRhdG9yLnNldHRpbmdzLm9uZm9jdXNvdXQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50ID0gJ2JsdXInO1xuICAgICAgICAgICAgICAgIGlmIChlbFswXS50YWdOYW1lID09PSAnU0VMRUNUJyB8fFxuICAgICAgICAgICAgICAgICAgICBlbFswXS50YWdOYW1lID09PSAnT1BUSU9OJyB8fFxuICAgICAgICAgICAgICAgICAgICBlbFswXS50eXBlID09PSAnY2hlY2tib3gnIHx8XG4gICAgICAgICAgICAgICAgICAgIGVsWzBdLnR5cGUgPT09ICdyYWRpbydcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSAnY2xpY2snO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBydWxlTmFtZSA9ICcudmFsaWRhdGUtbGFyYXZlbFZhbGlkYXRpb24nO1xuICAgICAgICAgICAgICAgIGVsLm9mZiggcnVsZU5hbWUgKVxuICAgICAgICAgICAgICAgICAgICAub2ZmKGV2ZW50ICsgcnVsZU5hbWUgKyAnLScgKyBlbGVtZW50Lm5hbWUpXG4gICAgICAgICAgICAgICAgICAgIC5vbiggZXZlbnQgKyBydWxlTmFtZSArICctJyArIGVsZW1lbnQubmFtZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCBlbGVtZW50ICkudmFsaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBlbFswXTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFyc2VzIGVycm9yIEFqYXggcmVzcG9uc2UgYW5kIGdldHMgdGhlIG1lc3NhZ2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSByZXNwb25zZVxuICAgICAgICAgKiBAcmV0dXJucyB7c3RyaW5nW119XG4gICAgICAgICAqL1xuICAgICAgICBwYXJzZUVycm9yUmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIG5ld1Jlc3BvbnNlID0gWydXaG9vcHMsIGxvb2tzIGxpa2Ugc29tZXRoaW5nIHdlbnQgd3JvbmcuJ107XG4gICAgICAgICAgICBpZiAoJ3Jlc3BvbnNlVGV4dCcgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JNc2cgPSByZXNwb25zZS5yZXNwb25zZVRleHQubWF0Y2goLzxoMVxccyo+KC4qKTxcXC9oMVxccyo+L2kpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQXJyYXkoZXJyb3JNc2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Jlc3BvbnNlID0gW2Vycm9yTXNnWzFdXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3UmVzcG9uc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVzY2FwZSBzdHJpbmcgdG8gdXNlIGFzIFJlZ3VsYXIgRXhwcmVzc2lvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHN0clxuICAgICAgICAgKiBAcmV0dXJucyBzdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIGVzY2FwZVJlZ0V4cDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFwtXFxbXFxdXFwvXFx7XFx9XFwoXFwpXFwqXFwrXFw/XFwuXFxcXFxcXlxcJFxcfF0vZywgXCJcXFxcJCZcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdlbmVyYXRlIFJlZ0V4cCBmcm9tIHdpbGRjYXJkIGF0dHJpYnV0ZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICAgICAqIEByZXR1cm5zIHtSZWdFeHB9XG4gICAgICAgICAqL1xuICAgICAgICByZWdleEZyb21XaWxkY2FyZDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgdmFyIG5hbWVQYXJ0cyA9IG5hbWUuc3BsaXQoXCJbKl1cIik7XG4gICAgICAgICAgICBpZiAobmFtZVBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIG5hbWVQYXJ0cy5wdXNoKCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZWdleHBQYXJ0cyA9IG5hbWVQYXJ0cy5tYXAoZnVuY3Rpb24oY3VycmVudFZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlICsgJ1snO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9ICddJyArY3VycmVudFZhbHVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBsYXJhdmVsVmFsaWRhdGlvbi5oZWxwZXJzLmVzY2FwZVJlZ0V4cChjdXJyZW50VmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKCdeJytyZWdleHBQYXJ0cy5qb2luKCdbXlxcXFxdXSonKSsnJCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNZXJnZSBhZGRpdGlvbmFsIGxhcmF2ZWwgdmFsaWRhdGlvbiBydWxlcyBpbnRvIHRoZSBjdXJyZW50IHJ1bGUgc2V0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcnVsZXNcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IG5ld1J1bGVzXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBtZXJnZVJ1bGVzOiBmdW5jdGlvbiAocnVsZXMsIG5ld1J1bGVzKSB7XG4gICAgICAgICAgICB2YXIgcnVsZXNMaXN0ID0ge1xuICAgICAgICAgICAgICAgICdsYXJhdmVsVmFsaWRhdGlvbic6IG5ld1J1bGVzLmxhcmF2ZWxWYWxpZGF0aW9uIHx8IFtdLFxuICAgICAgICAgICAgICAgICdsYXJhdmVsVmFsaWRhdGlvblJlbW90ZSc6IG5ld1J1bGVzLmxhcmF2ZWxWYWxpZGF0aW9uUmVtb3RlIHx8IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcnVsZXNMaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGVzTGlzdFtrZXldLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJ1bGVzW2tleV0gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVsZXNba2V5XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJ1bGVzW2tleV0gPSBydWxlc1trZXldLmNvbmNhdChydWxlc0xpc3Rba2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBydWxlcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSFRNTCBlbnRpdHkgZW5jb2RlIGEgc3RyaW5nLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBlbmNvZGU6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiAkKCc8ZGl2Lz4nKS50ZXh0KHN0cmluZykuaHRtbCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb29rdXAgbmFtZSBpbiBhbiBhcnJheS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHZhbGlkYXRvclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIGluIGRvdCBub3RhdGlvbiBmb3JtYXQuXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZmluZEJ5QXJyYXlOYW1lOiBmdW5jdGlvbiAodmFsaWRhdG9yLCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgc3FOYW1lID0gbmFtZS5yZXBsYWNlKC9cXC4oW15cXC5dKykvZywgJ1skMV0nKSxcbiAgICAgICAgICAgICAgICBsb29rdXBzID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IGRvdCB0byBzcXVhcmUgYnJhY2tldHMuIGUuZy4gZm9vLmJhci4wIGJlY29tZXMgZm9vW2Jhcl1bMF1cbiAgICAgICAgICAgICAgICAgICAgc3FOYW1lLFxuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgW10gdG8gdGhlIG5hbWUgZS5nLiBmb28gYmVjb21lcyBmb29bXSBvciBmb28uYmFyLjAgYmVjb21lcyBmb29bYmFyXVswXVtdXG4gICAgICAgICAgICAgICAgICAgIHNxTmFtZSArICdbXScsXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBrZXkgZnJvbSBsYXN0IGFycmF5IGUuZy4gZm9vW2Jhcl1bMF0gYmVjb21lcyBmb29bYmFyXVtdXG4gICAgICAgICAgICAgICAgICAgIHNxTmFtZS5yZXBsYWNlKC8oLiopXFxbKC4qKVxcXSQvZywgJyQxW10nKVxuICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9va3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdmFsaWRhdG9yLmZpbmRCeU5hbWUobG9va3Vwc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAkKG51bGwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBdHRlbXB0IHRvIGZpbmQgYW4gZWxlbWVudCBpbiB0aGUgRE9NIG1hdGNoaW5nIHRoZSBnaXZlbiBuYW1lLlxuICAgICAgICAgKiBFeGFtcGxlIG5hbWVzIGluY2x1ZGU6XG4gICAgICAgICAqICAgIC0gZG9tYWluLjAgd2hpY2ggbWF0Y2hlcyBkb21haW5bXVxuICAgICAgICAgKiAgICAtIGN1c3RvbWZpZWxkLjMgd2hpY2ggbWF0Y2hlcyBjdXN0b21maWVsZFszXVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gdmFsaWRhdG9yXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZmluZEJ5TmFtZTogZnVuY3Rpb24gKHZhbGlkYXRvciwgbmFtZSkge1xuICAgICAgICAgICAgLy8gRXhhY3QgbWF0Y2guXG4gICAgICAgICAgICB2YXIgZWxlbSA9IHZhbGlkYXRvci5maW5kQnlOYW1lKG5hbWUpO1xuICAgICAgICAgICAgaWYgKGVsZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaW5kIG5hbWUgaW4gZGF0YSwgdXNpbmcgZG90IG5vdGF0aW9uLlxuICAgICAgICAgICAgdmFyIGRlbGltID0gJy4nLFxuICAgICAgICAgICAgICAgIHBhcnRzICA9IG5hbWUuc3BsaXQoZGVsaW0pO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aDsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIHZhciByZWNvbnN0cnVjdGVkID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCBpOyBjKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb25zdHJ1Y3RlZC5wdXNoKHBhcnRzW2NdKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBlbGVtID0gdGhpcy5maW5kQnlBcnJheU5hbWUodmFsaWRhdG9yLCByZWNvbnN0cnVjdGVkLmpvaW4oZGVsaW0pKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICQobnVsbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGl0J3MgYW4gYXJyYXkgZWxlbWVudCwgZ2V0IGFsbCB2YWx1ZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB2YWxpZGF0b3JcbiAgICAgICAgICogQHBhcmFtIGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybnMgeyp8c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWxsRWxlbWVudFZhbHVlczogZnVuY3Rpb24gKHZhbGlkYXRvciwgZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQubmFtZS5pbmRleE9mKCdbJykgIT09IC0xICYmIGVsZW1lbnQubmFtZS5pbmRleE9mKCddJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5maW5kQnlOYW1lKGVsZW1lbnQubmFtZSkubWFwKGZ1bmN0aW9uIChpLCBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZGF0b3IuZWxlbWVudFZhbHVlKGUpO1xuICAgICAgICAgICAgICAgIH0pLmdldCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmVsZW1lbnRWYWx1ZShlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==
/*!
 * Laravel Javascript Validation
 *
 * https://github.com/proengsoft/laravel-jsvalidation
 *
 * Timezone Helper functions used by validators
 *
 * Copyright (c) 2017 Proengsoft
 * Released under the MIT license
 */

$.extend(true, laravelValidation, {

    helpers: {

        /**
         * Check if the specified timezone is valid.
         *
         * @param value
         * @returns {boolean}
         */
        isTimezone: function (value) {

            var timezones={
                "africa": [
                    "abidjan",
                    "accra",
                    "addis_ababa",
                    "algiers",
                    "asmara",
                    "bamako",
                    "bangui",
                    "banjul",
                    "bissau",
                    "blantyre",
                    "brazzaville",
                    "bujumbura",
                    "cairo",
                    "casablanca",
                    "ceuta",
                    "conakry",
                    "dakar",
                    "dar_es_salaam",
                    "djibouti",
                    "douala",
                    "el_aaiun",
                    "freetown",
                    "gaborone",
                    "harare",
                    "johannesburg",
                    "juba",
                    "kampala",
                    "khartoum",
                    "kigali",
                    "kinshasa",
                    "lagos",
                    "libreville",
                    "lome",
                    "luanda",
                    "lubumbashi",
                    "lusaka",
                    "malabo",
                    "maputo",
                    "maseru",
                    "mbabane",
                    "mogadishu",
                    "monrovia",
                    "nairobi",
                    "ndjamena",
                    "niamey",
                    "nouakchott",
                    "ouagadougou",
                    "porto-novo",
                    "sao_tome",
                    "tripoli",
                    "tunis",
                    "windhoek"
                ],
                "america": [
                    "adak",
                    "anchorage",
                    "anguilla",
                    "antigua",
                    "araguaina",
                    "argentina\/buenos_aires",
                    "argentina\/catamarca",
                    "argentina\/cordoba",
                    "argentina\/jujuy",
                    "argentina\/la_rioja",
                    "argentina\/mendoza",
                    "argentina\/rio_gallegos",
                    "argentina\/salta",
                    "argentina\/san_juan",
                    "argentina\/san_luis",
                    "argentina\/tucuman",
                    "argentina\/ushuaia",
                    "aruba",
                    "asuncion",
                    "atikokan",
                    "bahia",
                    "bahia_banderas",
                    "barbados",
                    "belem",
                    "belize",
                    "blanc-sablon",
                    "boa_vista",
                    "bogota",
                    "boise",
                    "cambridge_bay",
                    "campo_grande",
                    "cancun",
                    "caracas",
                    "cayenne",
                    "cayman",
                    "chicago",
                    "chihuahua",
                    "costa_rica",
                    "creston",
                    "cuiaba",
                    "curacao",
                    "danmarkshavn",
                    "dawson",
                    "dawson_creek",
                    "denver",
                    "detroit",
                    "dominica",
                    "edmonton",
                    "eirunepe",
                    "el_salvador",
                    "fortaleza",
                    "glace_bay",
                    "godthab",
                    "goose_bay",
                    "grand_turk",
                    "grenada",
                    "guadeloupe",
                    "guatemala",
                    "guayaquil",
                    "guyana",
                    "halifax",
                    "havana",
                    "hermosillo",
                    "indiana\/indianapolis",
                    "indiana\/knox",
                    "indiana\/marengo",
                    "indiana\/petersburg",
                    "indiana\/tell_city",
                    "indiana\/vevay",
                    "indiana\/vincennes",
                    "indiana\/winamac",
                    "inuvik",
                    "iqaluit",
                    "jamaica",
                    "juneau",
                    "kentucky\/louisville",
                    "kentucky\/monticello",
                    "kralendijk",
                    "la_paz",
                    "lima",
                    "los_angeles",
                    "lower_princes",
                    "maceio",
                    "managua",
                    "manaus",
                    "marigot",
                    "martinique",
                    "matamoros",
                    "mazatlan",
                    "menominee",
                    "merida",
                    "metlakatla",
                    "mexico_city",
                    "miquelon",
                    "moncton",
                    "monterrey",
                    "montevideo",
                    "montreal",
                    "montserrat",
                    "nassau",
                    "new_york",
                    "nipigon",
                    "nome",
                    "noronha",
                    "north_dakota\/beulah",
                    "north_dakota\/center",
                    "north_dakota\/new_salem",
                    "ojinaga",
                    "panama",
                    "pangnirtung",
                    "paramaribo",
                    "phoenix",
                    "port-au-prince",
                    "port_of_spain",
                    "porto_velho",
                    "puerto_rico",
                    "rainy_river",
                    "rankin_inlet",
                    "recife",
                    "regina",
                    "resolute",
                    "rio_branco",
                    "santa_isabel",
                    "santarem",
                    "santiago",
                    "santo_domingo",
                    "sao_paulo",
                    "scoresbysund",
                    "shiprock",
                    "sitka",
                    "st_barthelemy",
                    "st_johns",
                    "st_kitts",
                    "st_lucia",
                    "st_thomas",
                    "st_vincent",
                    "swift_current",
                    "tegucigalpa",
                    "thule",
                    "thunder_bay",
                    "tijuana",
                    "toronto",
                    "tortola",
                    "vancouver",
                    "whitehorse",
                    "winnipeg",
                    "yakutat",
                    "yellowknife"
                ],
                "antarctica": [
                    "casey",
                    "davis",
                    "dumontdurville",
                    "macquarie",
                    "mawson",
                    "mcmurdo",
                    "palmer",
                    "rothera",
                    "south_pole",
                    "syowa",
                    "vostok"
                ],
                "arctic": [
                    "longyearbyen"
                ],
                "asia": [
                    "aden",
                    "almaty",
                    "amman",
                    "anadyr",
                    "aqtau",
                    "aqtobe",
                    "ashgabat",
                    "baghdad",
                    "bahrain",
                    "baku",
                    "bangkok",
                    "beirut",
                    "bishkek",
                    "brunei",
                    "choibalsan",
                    "chongqing",
                    "colombo",
                    "damascus",
                    "dhaka",
                    "dili",
                    "dubai",
                    "dushanbe",
                    "gaza",
                    "harbin",
                    "hebron",
                    "ho_chi_minh",
                    "hong_kong",
                    "hovd",
                    "irkutsk",
                    "jakarta",
                    "jayapura",
                    "jerusalem",
                    "kabul",
                    "kamchatka",
                    "karachi",
                    "kashgar",
                    "kathmandu",
                    "khandyga",
                    "kolkata",
                    "krasnoyarsk",
                    "kuala_lumpur",
                    "kuching",
                    "kuwait",
                    "macau",
                    "magadan",
                    "makassar",
                    "manila",
                    "muscat",
                    "nicosia",
                    "novokuznetsk",
                    "novosibirsk",
                    "omsk",
                    "oral",
                    "phnom_penh",
                    "pontianak",
                    "pyongyang",
                    "qatar",
                    "qyzylorda",
                    "rangoon",
                    "riyadh",
                    "sakhalin",
                    "samarkand",
                    "seoul",
                    "shanghai",
                    "singapore",
                    "taipei",
                    "tashkent",
                    "tbilisi",
                    "tehran",
                    "thimphu",
                    "tokyo",
                    "ulaanbaatar",
                    "urumqi",
                    "ust-nera",
                    "vientiane",
                    "vladivostok",
                    "yakutsk",
                    "yekaterinburg",
                    "yerevan"
                ],
                "atlantic": [
                    "azores",
                    "bermuda",
                    "canary",
                    "cape_verde",
                    "faroe",
                    "madeira",
                    "reykjavik",
                    "south_georgia",
                    "st_helena",
                    "stanley"
                ],
                "australia": [
                    "adelaide",
                    "brisbane",
                    "broken_hill",
                    "currie",
                    "darwin",
                    "eucla",
                    "hobart",
                    "lindeman",
                    "lord_howe",
                    "melbourne",
                    "perth",
                    "sydney"
                ],
                "europe": [
                    "amsterdam",
                    "andorra",
                    "athens",
                    "belgrade",
                    "berlin",
                    "bratislava",
                    "brussels",
                    "bucharest",
                    "budapest",
                    "busingen",
                    "chisinau",
                    "copenhagen",
                    "dublin",
                    "gibraltar",
                    "guernsey",
                    "helsinki",
                    "isle_of_man",
                    "istanbul",
                    "jersey",
                    "kaliningrad",
                    "kiev",
                    "lisbon",
                    "ljubljana",
                    "london",
                    "luxembourg",
                    "madrid",
                    "malta",
                    "mariehamn",
                    "minsk",
                    "monaco",
                    "moscow",
                    "oslo",
                    "paris",
                    "podgorica",
                    "prague",
                    "riga",
                    "rome",
                    "samara",
                    "san_marino",
                    "sarajevo",
                    "simferopol",
                    "skopje",
                    "sofia",
                    "stockholm",
                    "tallinn",
                    "tirane",
                    "uzhgorod",
                    "vaduz",
                    "vatican",
                    "vienna",
                    "vilnius",
                    "volgograd",
                    "warsaw",
                    "zagreb",
                    "zaporozhye",
                    "zurich"
                ],
                "indian": [
                    "antananarivo",
                    "chagos",
                    "christmas",
                    "cocos",
                    "comoro",
                    "kerguelen",
                    "mahe",
                    "maldives",
                    "mauritius",
                    "mayotte",
                    "reunion"
                ],
                "pacific": [
                    "apia",
                    "auckland",
                    "chatham",
                    "chuuk",
                    "easter",
                    "efate",
                    "enderbury",
                    "fakaofo",
                    "fiji",
                    "funafuti",
                    "galapagos",
                    "gambier",
                    "guadalcanal",
                    "guam",
                    "honolulu",
                    "johnston",
                    "kiritimati",
                    "kosrae",
                    "kwajalein",
                    "majuro",
                    "marquesas",
                    "midway",
                    "nauru",
                    "niue",
                    "norfolk",
                    "noumea",
                    "pago_pago",
                    "palau",
                    "pitcairn",
                    "pohnpei",
                    "port_moresby",
                    "rarotonga",
                    "saipan",
                    "tahiti",
                    "tarawa",
                    "tongatapu",
                    "wake",
                    "wallis"
                ],
                "utc": [
                    ""
                ]
            };

            var tzparts= value.split('/',2);
            var continent=tzparts[0].toLowerCase();
            var city='';
            if (tzparts[1]) {
                city=tzparts[1].toLowerCase();
            }

            return (continent in timezones && ( timezones[continent].length===0 || timezones[continent].indexOf(city)!==-1))
        }
    }
});

/*!
 * Laravel Javascript Validation
 *
 * https://github.com/proengsoft/laravel-jsvalidation
 *
 * Methods that implement Laravel Validations
 *
 * Copyright (c) 2017 Proengsoft
 * Released under the MIT license
 */

$.extend(true, laravelValidation, {

    methods:{

        helpers: laravelValidation.helpers,

        jsRemoteTimer:0,

        /**
         * "Validate" optional attributes.
         * Always returns true, just lets us put sometimes in rules.
         *
         * @return {boolean}
         */
        Sometimes: function() {
            return true;
        },

        /**
         * Bail This is the default behaivour os JSValidation.
         * Always returns true, just lets us put sometimes in rules.
         *
         * @return {boolean}
         */
        Bail: function() {
            return true;
        },

        /**
         * "Indicate" validation should pass if value is null.
         * Always returns true, just lets us put "nullable" in rules.
         *
         * @return {boolean}
         */
        Nullable: function() {
            return true;
        },

        /**
         * Validate the given attribute is filled if it is present.
         */
        Filled: function(value, element) {
            return $.validator.methods.required.call(this, value, element, true);
        },


        /**
         * Validate that a required attribute exists.
         */
        Required: function(value, element) {
            return  $.validator.methods.required.call(this, value, element);
        },

        /**
         * Validate that an attribute exists when any other attribute exists.
         *
         * @return {boolean}
         */
        RequiredWith: function(value, element, params) {
            var validator=this,
                required=false;
            var currentObject=this;

            $.each(params,function(i,param) {
                var target=laravelValidation.helpers.dependentElement(
                    currentObject, element, param
                );
                required=required || (
                    target!==undefined &&
                    $.validator.methods.required.call(
                        validator,
                        currentObject.elementValue(target),
                        target,true
                    ));
            });

            if (required) {
                return  $.validator.methods.required.call(this, value, element, true);
            }
            return true;
        },

        /**
         * Validate that an attribute exists when all other attribute exists.
         *
         * @return {boolean}
         */
        RequiredWithAll: function(value, element, params) {
            var validator=this,
                required=true;
            var currentObject=this;

            $.each(params,function(i,param) {
                var target=laravelValidation.helpers.dependentElement(
                    currentObject, element, param
                );
                required = required && (
                      target!==undefined &&
                      $.validator.methods.required.call(
                          validator,
                          currentObject.elementValue(target),
                          target,true
                      ));
            });

            if (required) {
                return  $.validator.methods.required.call(this, value, element, true);
            }
            return true;
        },

        /**
         * Validate that an attribute exists when any other attribute does not exists.
         *
         * @return {boolean}
         */
        RequiredWithout: function(value, element, params) {
            var validator=this,
                required=false;
            var currentObject=this;

            $.each(params,function(i,param) {
                var target=laravelValidation.helpers.dependentElement(
                    currentObject, element, param
                );
                required = required ||
                    target===undefined||
                    !$.validator.methods.required.call(
                        validator,
                        currentObject.elementValue(target),
                        target,true
                    );
            });

            if (required) {
                return  $.validator.methods.required.call(this, value, element, true);
            }
            return true;
        },

        /**
         * Validate that an attribute exists when all other attribute does not exists.
         *
         * @return {boolean}
         */
        RequiredWithoutAll: function(value, element, params) {
            var validator=this,
                required=true,
                currentObject=this;

            $.each(params,function(i, param) {
                var target=laravelValidation.helpers.dependentElement(
                    currentObject, element, param
                );
                required = required && (
                    target===undefined ||
                    !$.validator.methods.required.call(
                        validator,
                        currentObject.elementValue(target),
                        target,true
                    ));
            });

            if (required) {
                return  $.validator.methods.required.call(this, value, element, true);
            }
            return true;
        },

        /**
         * Validate that an attribute exists when another attribute has a given value.
         *
         * @return {boolean}
         */
        RequiredIf: function(value, element, params) {

            var target=laravelValidation.helpers.dependentElement(
                this, element, params[0]
            );

            if (target!==undefined) {
                var val=String(this.elementValue(target));
                if (typeof val !== 'undefined') {
                    var data = params.slice(1);
                    if ($.inArray(val, data) !== -1) {
                        return $.validator.methods.required.call(
                            this, value, element, true
                        );
                    }
                }
            }

            return true;
        },

        /**
         * Validate that an attribute exists when another
         * attribute does not have a given value.
         *
         * @return {boolean}
         */
        RequiredUnless: function(value, element, params) {

            var target=laravelValidation.helpers.dependentElement(
                this, element, params[0]
            );

            if (target!==undefined) {
                var val=String(this.elementValue(target));
                if (typeof val !== 'undefined') {
                    var data = params.slice(1);
                    if ($.inArray(val, data) !== -1) {
                        return true;
                    }
                }
            }

            return $.validator.methods.required.call(
                this, value, element, true
            );

        },

        /**
         * Validate that an attribute has a matching confirmation.
         *
         * @return {boolean}
         */
        Confirmed: function(value, element, params) {
            return laravelValidation.methods.Same.call(this,value, element, params);
        },

        /**
         * Validate that two attributes match.
         *
         * @return {boolean}
         */
        Same: function(value, element, params) {

            var target=laravelValidation.helpers.dependentElement(
                this, element, params[0]
            );

            if (target!==undefined) {
                return String(value) === String(this.elementValue(target));
            }
            return false;
        },

        /**
         * Validate that the values of an attribute is in another attribute.
         *
         * @param value
         * @param element
         * @param params
         * @returns {boolean}
         * @constructor
         */
        InArray: function (value, element, params) {
            if (typeof params[0] === 'undefined') {
                return false;
            }
            var elements = this.elements();
            var found = false;
            var nameRegExp = laravelValidation.helpers.regexFromWildcard(params[0]);

            for ( var i = 0; i < elements.length ; i++ ) {
                var targetName = elements[i].name;
                if (targetName.match(nameRegExp)) {
                    var equals = laravelValidation.methods.Same.call(this,value, element, [targetName]);
                    found = found || equals;
                }
            }

            return found;
        },

        /**
         * Validate an attribute is unique among other values.
         *
         * @param value
         * @param element
         * @param params
         * @returns {boolean}
         */
        Distinct: function (value, element, params) {
            if (typeof params[0] === 'undefined') {
                return false;
            }

            var elements = this.elements();
            var found = false;
            var nameRegExp = laravelValidation.helpers.regexFromWildcard(params[0]);

            for ( var i = 0; i < elements.length ; i++ ) {
                var targetName = elements[i].name;
                if (targetName !== element.name && targetName.match(nameRegExp)) {
                    var equals = laravelValidation.methods.Same.call(this,value, element, [targetName]);
                    found = found || equals;
                }
            }

            return !found;
        },


        /**
         * Validate that an attribute is different from another attribute.
         *
         * @return {boolean}
         */
        Different: function(value, element, params) {
            return ! laravelValidation.methods.Same.call(this,value, element, params);
        },

        /**
         * Validate that an attribute was "accepted".
         * This validation rule implies the attribute is "required".
         *
         * @return {boolean}
         */
        Accepted: function(value) {
            var regex = new RegExp("^(?:(yes|on|1|true))$",'i');
            return regex.test(value);
        },

        /**
         * Validate that an attribute is an array.
         *
         * @param value
         * @param element
         */
        Array: function(value, element) {
            if (element.name.indexOf('[') !== -1 && element.name.indexOf(']') !== -1) {
                return true;
            }

            return laravelValidation.helpers.isArray(value);
        },

        /**
         * Validate that an attribute is a boolean.
         *
         * @return {boolean}
         */
        Boolean: function(value) {
            var regex= new RegExp("^(?:(true|false|1|0))$",'i');
            return  regex.test(value);
        },

        /**
         * Validate that an attribute is an integer.
         *
         * @return {boolean}
         */
        Integer: function(value) {
            var regex= new RegExp("^(?:-?\\d+)$",'i');
            return  regex.test(value);
        },

        /**
         * Validate that an attribute is numeric.
         */
        Numeric: function(value, element) {
            return $.validator.methods.number.call(this, value, element, true);
        },

        /**
         * Validate that an attribute is a string.
         *
         * @return {boolean}
         */
        String: function(value) {
            return typeof value === 'string';
        },

        /**
         * The field under validation must be numeric and must have an exact length of value.
         */
        Digits: function(value, element, params) {
            return (
                $.validator.methods.number.call(this, value, element, true) &&
                value.length === parseInt(params, 10)
            );
        },

        /**
         * The field under validation must have a length between the given min and max.
         */
        DigitsBetween: function(value, element, params) {
            return ($.validator.methods.number.call(this, value, element, true)
                && value.length>=parseFloat(params[0]) && value.length<=parseFloat(params[1]));
        },

        /**
         * Validate the size of an attribute.
         *
         * @return {boolean}
         */
        Size: function(value, element, params) {
            return laravelValidation.helpers.getSize(this, element,value) === parseFloat(params[0]);
        },

        /**
         * Validate the size of an attribute is between a set of values.
         *
         * @return {boolean}
         */
        Between: function(value, element, params) {
            return ( laravelValidation.helpers.getSize(this, element,value) >= parseFloat(params[0]) &&
                laravelValidation.helpers.getSize(this,element,value) <= parseFloat(params[1]));
        },

        /**
         * Validate the size of an attribute is greater than a minimum value.
         *
         * @return {boolean}
         */
        Min: function(value, element, params) {
            value = laravelValidation.helpers.allElementValues(this, element);

            return laravelValidation.helpers.getSize(this, element, value) >= parseFloat(params[0]);
        },

        /**
         * Validate the size of an attribute is less than a maximum value.
         *
         * @return {boolean}
         */
        Max: function(value, element, params) {
            value = laravelValidation.helpers.allElementValues(this, element);

            return laravelValidation.helpers.getSize(this, element, value) <= parseFloat(params[0]);
        },

        /**
         * Validate an attribute is contained within a list of values.
         *
         * @return {boolean}
         */
        In: function(value, element, params) {
            if (laravelValidation.helpers.isArray(value)
                && laravelValidation.helpers.hasRules(element, "Array")
            ) {
                var diff = laravelValidation.helpers.arrayDiff(value, params);

                return Object.keys(diff).length === 0;
            }

            return params.indexOf(value.toString()) !== -1;
        },

        /**
         * Validate an attribute is not contained within a list of values.
         *
         * @return {boolean}
         */
        NotIn: function(value, element, params) {
            return params.indexOf(value.toString()) === -1;
        },

        /**
         * Validate that an attribute is a valid IP.
         *
         * @return {boolean}
         */
        Ip: function(value) {
            return /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(value) ||
                /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(value);
        },

        /**
         * Validate that an attribute is a valid e-mail address.
         */
        Email: function(value, element) {
            return $.validator.methods.email.call(this, value, element, true);
        },

        /**
         * Validate that an attribute is a valid URL.
         */
        Url: function(value, element) {
            return $.validator.methods.url.call(this, value, element, true);
        },

        /**
         * The field under validation must be a successfully uploaded file.
         *
         * @return {boolean}
         */
        File: function(value, element) {
            if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                return true;
            }
            if ('files' in element ) {
                return (element.files.length > 0);
            }
            return false;
        },

        /**
         * Validate the MIME type of a file upload attribute is in a set of MIME types.
         *
         * @return {boolean}
         */
        Mimes: function(value, element, params) {
            if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                return true;
            }
            var lowerParams = $.map(params, function(item) {
                return item.toLowerCase();
            });

            var fileinfo = laravelValidation.helpers.fileinfo(element);
            return (fileinfo !== false && lowerParams.indexOf(fileinfo.extension.toLowerCase())!==-1);
        },

        /**
         * The file under validation must match one of the given MIME types.
         *
         * @return {boolean}
         */
        Mimetypes: function(value, element, params) {
            if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                return true;
            }
            var lowerParams = $.map(params, function(item) {
                return item.toLowerCase();
            });

            var fileinfo = laravelValidation.helpers.fileinfo(element);

            if (fileinfo === false) {
                return false;
            }
            return (lowerParams.indexOf(fileinfo.type.toLowerCase())!==-1);
        },

        /**
         * Validate the MIME type of a file upload attribute is in a set of MIME types.
         */
        Image: function(value, element) {
            return laravelValidation.methods.Mimes.call(this, value, element, [
                'jpg', 'png', 'gif', 'bmp', 'svg', 'jpeg'
            ]);
        },

        /**
         * Validate dimensions of Image.
         *
         * @return {boolean|string}
         */
        Dimensions: function(value, element, params, callback) {
            if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                return true;
            }
            if (element.files === null || typeof element.files[0] === 'undefined') {
                return false;
            }

            var fr = new FileReader;
            fr.onload = function () {
                var img = new Image();
                img.onload = function () {
                    var height = parseFloat(img.naturalHeight);
                    var width = parseFloat(img.naturalWidth);
                    var ratio = width / height;
                    var notValid = ((params['width']) && parseFloat(params['width'] !== width)) ||
                        ((params['min_width']) && parseFloat(params['min_width']) > width) ||
                        ((params['max_width']) && parseFloat(params['max_width']) < width) ||
                        ((params['height']) && parseFloat(params['height']) !== height) ||
                        ((params['min_height']) && parseFloat(params['min_height']) > height) ||
                        ((params['max_height']) && parseFloat(params['max_height']) < height) ||
                        ((params['ratio']) && ratio !== parseFloat(eval(params['ratio']))
                        );
                    callback(! notValid);
                };
                img.onerror = function() {
                    callback(false);
                };
                img.src = fr.result;
            };
            fr.readAsDataURL(element.files[0]);

            return 'pending';
        },

        /**
         * Validate that an attribute contains only alphabetic characters.
         *
         * @return {boolean}
         */
        Alpha: function(value) {
            if (typeof  value !== 'string') {
                return false;
            }

            var regex = new RegExp("^(?:^[a-z\u00E0-\u00FC]+$)$",'i');
            return  regex.test(value);

        },

        /**
         * Validate that an attribute contains only alpha-numeric characters.
         *
         * @return {boolean}
         */
        AlphaNum: function(value) {
            if (typeof  value !== 'string') {
                return false;
            }
            var regex = new RegExp("^(?:^[a-z0-9\u00E0-\u00FC]+$)$",'i');
            return regex.test(value);
        },

        /**
         * Validate that an attribute contains only alphabetic characters.
         *
         * @return {boolean}
         */
        AlphaDash: function(value) {
            if (typeof  value !== 'string') {
                return false;
            }
            var regex = new RegExp("^(?:^[a-z0-9\u00E0-\u00FC_-]+$)$",'i');
            return regex.test(value);
        },

        /**
         * Validate that an attribute passes a regular expression check.
         *
         * @return {boolean}
         */
        Regex: function(value, element, params) {
            var invalidModifiers=['x','s','u','X','U','A'];
            // Converting php regular expression
            var phpReg= new RegExp('^(?:\/)(.*\\\/?[^\/]*|[^\/]*)(?:\/)([gmixXsuUAJ]*)?$');
            var matches=params[0].match(phpReg);
            if (matches === null) {
                return false;
            }
            // checking modifiers
            var php_modifiers=[];
            if (matches[2]!==undefined) {
                php_modifiers=matches[2].split('');
                for (var i=0; i<php_modifiers.length<i ;i++) {
                    if (invalidModifiers.indexOf(php_modifiers[i])!==-1) {
                        return true;
                    }
                }
            }
            var regex = new RegExp("^(?:"+matches[1]+")$",php_modifiers.join());
            return   regex.test(value);
        },

        /**
         * Validate that an attribute is a valid date.
         *
         * @return {boolean}
         */
        Date: function(value) {
            return (laravelValidation.helpers.strtotime(value)!==false);
        },

        /**
         * Validate that an attribute matches a date format.
         *
         * @return {boolean}
         */
        DateFormat: function(value, element, params) {
            return laravelValidation.helpers.parseTime(value,params[0])!==false;
        },

        /**
         * Validate the date is before a given date.
         *
         * @return {boolean}
         */
        Before: function(value, element, params) {
            return laravelValidation.helpers.compareDates(this, value, element, params[0], '<');
        },

        /**
         * Validate the date is equal or before a given date.
         *
         * @return {boolean}
         */
        BeforeOrEqual: function(value, element, params) {
            return laravelValidation.helpers.compareDates(this, value, element, params[0], '<=');
        },

        /**
         * Validate the date is after a given date.
         *
         * @return {boolean}
         */
        After: function(value, element, params) {
            return laravelValidation.helpers.compareDates(this, value, element, params[0], '>');
        },

        /**
         * Validate the date is equal or after a given date.
         *
         * @return {boolean}
         */
        AfterOrEqual: function(value, element, params) {
            return laravelValidation.helpers.compareDates(this, value, element, params[0], '>=');
        },


        /**
         * Validate that an attribute is a valid date.
         */
        Timezone: function(value) {
            return  laravelValidation.helpers.isTimezone(value);
        },


        /**
         * Validate the attribute is a valid JSON string.
         *
         * @param  value
         * @return bool
         */
        Json: function(value) {
            var result = true;
            try {
                JSON.parse(value);
            } catch (e) {
                result = false;
            }
            return result;
        },

        /**
         * Noop (always returns true).
         *
         * @param value
         * @returns {boolean}
         */
        ProengsoftNoop: function (value) {
            return true;
        },
    }
});

//# sourceMappingURL=jsvalidation.js.map
