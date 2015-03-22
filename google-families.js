(function($){

	// API URL with my own (Chris Swithinbank’s) key. Please get your own if you want to use it.
	var api = 'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyDt5F-_-m5Sjr6SbWB75dQE_kiJUGHVBjQ&sort=style';
	// Will hold the font data returned by the API for future filtering operations
	var fontData;
	// Cached reference
	var head = $("head");
	// Minimum font variants to show a font
	var minVariants = 3;
	// Template for a single font
	var template = _.template($("#font-template").html());
	// Manually exclude these stupid fonts
	var manualExcludes = ['Averia Libre', 'Averia Sans Libre', 'Averia Serif Libre'];

	var Font = Backbone.Model.extend({
		extUrlRoot: 'http://www.google.com/webfonts/specimen/',
		// normalize our font data a bit
		getFontData: function() {
			var fontData = this.toJSON();
			fontData.extlink = this.extUrlRoot + encodeURIComponent(fontData.family);
			fontData.variants = _.map(fontData.variants, function(val){
				return val.replace(/italic$/, ' italic');
			});
			return fontData;
		}
	});

	var FontView = Backbone.View.extend({
		className: 'font',
		template: template,
		apiBase: 'http://fonts.googleapis.com/css?family=',
		render: function() {
			var fontData = this.model.getFontData(),
				family = '"' + fontData.family + '"';
			this.getFont();
			this.$el.html(this.template(fontData)).css({fontFamily: family });
		},
		getFont: function() {
			var fontData = this.model.toJSON(),
				tail = fontData.family + ':' + fontData.variants.join(',') + '&text=' + fontData.family + 'Iitalic1234567890',
				url = this.apiBase + tail;
			$('<link rel="stylesheet" href="'+url+'" >').appendTo(head);
		}
	});

	var Fonts = Backbone.Collection.extend({
		model: Font
	});
	var fonts = new Fonts();

	var FontsView = Backbone.View.extend({
		collection: fonts,
		render: function() {
			$("h1").prepend(this.collection.length + ' ');
			this.collection.forEach(this.addOne, this);
		},
		addOne: function(font) {
			var fontView = new FontView({model: font});
			fontView.render();
			this.$el.append(fontView.el);
		}
	});
	var fontsView = new FontsView();

	var renderFonts = function(data) {
		if ( data.kind !== "webfonts#webfontList" )
			return;

		var items = _.filter(data.items, function(item){
			return item.variants.length >= minVariants && manualExcludes.indexOf(item.family) == -1;
		});
		// filter for families with at least one roman, one bold, and one medium-weight italic, that are not categorised as ‘display’
		items = _.filter(items, function(item){
			return (_.contains(item.variants, '300') || _.contains(item.variants, 'regular') || _.contains(item.variants, '500')) && (_.contains(item.variants, '300italic') || _.contains(item.variants, 'italic') || _.contains(item.variants, '500italic')) && (_.contains(item.variants, '700') || _.contains(item.variants, '800') || _.contains(item.variants, '800')) && item.category !== "display" && item.category !== "handwriting";
		});

		// if there is a cat query variable, display only matching fonts
		if(getQueryVariable("cat")) {
			var fontcategory = getQueryVariable("cat");
			items = _.filter(items, function(item){
				return item.category == fontcategory;
			});
		}

		fontData = items;
		fonts.reset(items);
		fontsView.render();
		$("#fonts").html(fontsView.el);
	}

	// gets query variables from URL
	function getQueryVariable(variable){
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
						var pair = vars[i].split("=");
						if(pair[0] == variable){return pair[1];}
		}
		return(false);
	}

	jQuery(document).ready(function() {
		$.ajax(api, {
			dataType: 'jsonp',
			jsonpCallback: 'callback',
			success: renderFonts
		});
	});

})(jQuery);
