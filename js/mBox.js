// Wrap in IIFE
$(function($) {

	'use strict';

	/**
	 * Simple lightbox.
	 */

	 // Constructor
	function MBox(selector, clicked, options = null) {
		
		this.settings = this.mergeOptions(options);

		this.selector = $(selector);
		this.images = this.getImages();
		this.imagesCount = this.images.length;
		this.currentImage = clicked;
		this.currentImageNo = 0;
		this.currentPageNo = 0;
		this.scrollPosition = $(window).scrollTop();
		this.navigation = '';

		this.mBox = this.build();

		this.updateVars();
		this.createNavigation();
		this.addEventListeners();

		this.open();

	}

	MBox.prototype = {

		// Set default options.
		defaults: {
			imagesPerPage: 3,
			displayNavigation: true,
			displayTitle: true,
			rounded: true,
			displayThumbnails: true,
			keyboardNavigation: true
		},

		mergeOptions: function(options) {

			return $.extend({}, this.defaults, options);

		},

		// Fetch images from a selector.
		// @return jQuery
		getImages: function() {

			var tag = this.selector[0].tagName;

			// Check if working with collection or single image.
			if(tag == 'IMG') {
				return $(this.selector[0]);
			}
			else {

				var images = this.selector.find('img').toArray(); // Find original images.

				var arr = new Array();
 
				images.forEach(function(element) {

					var img = $('<img/>', {
						'src': element.src,
					});

					// Check for attributes.
					if(element.title !== '') img.attr('title', element.title);
					if(element.alt !== '') img.attr('alt', element.alt);

					arr.push(img); // Add to images array.

				});

				arr = $(arr).map(function() {
					return this.toArray(); // it will be an jQuery selection.
				});

				return arr;

			}

		},

		// @todo additional parameters like % etc.?
		// @return {string}
		calculatePosition: function(position) {

			return position + 25 + 'px';

		},

		// To make gallery plugin plug & play, its interface is build here.
		// @return jQuery
		build: function() {

			var container = this.createContainer();

			// Current image.
			var currentImageBox = $('<div/>', {
				'class': 'mBox-current'
			}).prependTo(container);

			$('<img/>', {
				'src': this.currentImage.src,
				'title': this.currentImage.title
			}).prependTo(currentImageBox).wrap('<figure class = "image"></figure>');

			// Image x of xx count.
			$('<p/>', {
				'class': 'mBox-navigation-txt'
			}).appendTo(currentImageBox).wrap('<div class = "small mBox-navigation-count"></div>'); // Still working on current image.

			// No need to show navigation/thumbnails for a single image.
			if(this.imagesCount > 1) {

				// Next & previous navigation arrows.
				var navigationArrows = $('<div/>').addClass('mBox-navigation').css('display', 'none');

				$('<i/>', {
					'class': 'fas fa-chevron-circle-left point mBox-previous float-left hide'
				}).appendTo(navigationArrows);

				$('<i/>', {
					'class': 'fas fa-chevron-circle-right point mBox-next float-right hide'
				}).appendTo(navigationArrows);

				this.navigation = navigationArrows.appendTo(currentImageBox);

				if(this.settings.displayThumbnails) {

					// Thumbnails (on the bottom of the gallery).
					var thumbnails = $('<div/>').addClass('mBox-content').appendTo(container);

					// Pagination. Add before anything else.
					$('<p/>', {
						'class': 'mb-1 mt-1 mBox-thumbnail-pagination'
					}).appendTo(thumbnails);

					var thumbnailsImages = $('<div/>', {
						'class': 'mBox-images'
					}).prependTo(thumbnails); // Prepend it!

					var width = 100 / this.settings.imagesPerPage + '%'; // Calculate width.

					// Append to thumbnails div.
					this.images.each(function() {

						$(this).addClass('mBox-thumbnail').appendTo(thumbnailsImages);
						$(this).wrap('<div class = "mBox-image" style = "width: ' + width + ';"></div>'); // @ size of the tile should be a size of images per page.

					});
				}

			}

			// Close button. Add last.
			$('<button/>', {
				'class': 'mBox-close point dialog-close'
			}).append('<span>&times;</span>').prependTo(container);

			return container;

		},

		// Separate method to easily maintain the main container.
		// @return jQuery
		createContainer: function() {

			var container = $('<div/>').attr('id', 'mBox').appendTo('body');  // Very important to append it to the body.#

			// Check if user scrolled down and update the position.
			if(this.scrollPosition > 0) {

				var top = this.calculatePosition(this.scrollPosition);

				container.css('top', top);

			}

			return container;

		},

		// Run this method only once.
		createNavigation: function() {

			var navigationCount = $('p.mBox-navigation-txt');

			navigationCount.text('Image ');

			$('<span />', {
				'class': 'mBox-current-image-no',
				'text': (this.currentImageNo + 1)
			}).appendTo(navigationCount);

			if(this.settings.displayTitle == true) {

				var title = (this.currentImage.attr('title')) ? this.currentImage.attr('title') : '';

				$('<span />', {
					'class': 'mBox-current-image-title',
					'text': title
				}).appendTo(navigationCount);

			}

			if(this.imagesCount > 1) {
			
				var thumbnailPagination = $('p.mBox-thumbnail-pagination');
				
				navigationCount.append(' of ' + this.imagesCount); // Add to the end.

				// Navigation arrows are hidden by default.
				if((this.currentImageNo + 1) != this.imagesCount) {
					$('i.mBox-next').removeClass('hide');	
				} 
				if(this.currentImageNo != 0) {
					$('i.mBox-previous').removeClass('hide');
				}

				// Create pagination if needed.
				if(this.imagesCount > this.settings.imagesPerPage) {

					var totalPages = Math.ceil(this.imagesCount / this.settings.imagesPerPage);

					for(var i = 0; i < totalPages; i++) {
						var circ = $('<i/>', {
							'class': 'fas fa-circle point',
							'data-page-number': i
						}).appendTo(thumbnailPagination);
						if(i === this.currentPageNo) circ.addClass('active'); // Add active class to the 'current page' circle.
					}

					// Move to right thumbnail page if featured image is not the first one.
					if(Math.floor(this.currentImageNo / this.settings.imagesPerPage) !== this.currentPageNo) {

						var left = Math.floor(this.currentImageNo / this.settings.imagesPerPage); // Calculate the right page number.

						$('.mBox-thumbnail-pagination i').removeClass('active');
						$('.mBox-thumbnail-pagination i[data-page-number = ' + left + ']').addClass('active');

						this.currentPageNo = left; // Set new page number before multiplying by 100.

						left = left * 100;

						$('.mBox-images').css('left', '-' + left + '%'); // Animation not needed here.
					}
				}

			}

		},

		// @return jQuery
		createThumbnails: function() {

			var images = new Array();
 
			this.images.forEach(function(element) {

				var img = $('<img/>', {
					'class': 'img-fluid mBox-thumbnail',
					'src': element.src,
				});

				// Check for attributes.
				if(element.title !== '') img.attr('title', element.title);
				if(element.alt !== '') img.attr('alt', element.alt);

				images.push(img); // Add to images array.

			});	

			images = $(images).map(function() {
				return this.toArray(); // it will be an jQuery selection.
			});

			return images;

		},

		// @param no {int}
		navigationUpdate: function(no) {

			this.currentImageNo = no; // Update current image number otherwise arrow navigation is not gonna work.

			$('.mBox-current-image-no').text(no + 1);

			if(this.settings.displayTitle == true) {

				var title = ($(this.currentImage).attr('title')) ? $(this.currentImage).attr('title') : '';

				$('.mBox-current-image-title').text(title);

			}

			// Update navigation arrows.

			if((no + 1) != this.imagesCount) $('i.mBox-next').removeClass('hide');
			else $('i.mBox-next').addClass('hide');
			if(no != 0) $('i.mBox-previous').removeClass('hide');
			else $('i.mBox-previous').addClass('hide');

			// Upadate thumbnails page when moving out of current one using arrows.

			if(this.imagesCount > this.settings.imagesPerPage) {

				if(Math.floor(this.currentImageNo / this.settings.imagesPerPage) !== this.currentPageNo) {

					var left = Math.floor(this.currentImageNo / this.settings.imagesPerPage); // Calculate current page number.

					$('.mBox-thumbnail-pagination i').removeClass('active');
					$('.mBox-thumbnail-pagination i[data-page-number = ' + left + ']').addClass('active');

					this.currentPageNo = left; // Set new page number before multiplying by 100.

					left = left * 100;

					$('.mBox-images').animate({'left': '-' + left + '%'}, 'slow');

				}

			}
		},

		// Run when changing the image.
		// @param newCurrent {jQuery}
		updateCurrentImage: function(newCurrent) {

			this.currentImage.attr('src', newCurrent.attr('src'));

			if(newCurrent.attr('title')) this.currentImage.attr('title', newCurrent.attr('title'));	 
			else this.currentImage.removeAttr('title');

			if(newCurrent.attr('alt')) this.currentImage.attr('title', newCurrent.attr('alt'));
			else this.currentImage.removeAttr('alt');

		},

		// Some variables needs to be updated when interface is ready.
		updateVars: function() {

			this.currentImage = $('.mBox-current img'); // current_image var points now to the featured image.

			//if(this.imagesCount > 1) this.images = $('.mBox-images img'); // Images array points to the thumbnails right now.

			this.currentImageNo = this.getCurrentNumber(this.currentImage.attr('src'));

		},

		// To find out what is the index number of the current image in the images array, compare all src's. 
		// @param src {string}
		// @return int
		getCurrentNumber: function(src) {

			if(this.imagesCount > 1) {
				
				var index = 0;

				this.images.each(function(no) {
					if(this.src === src) {
						index = no;
						return false; // Break the loop here.
					}
				});

				return index;
			}
			else {
				return 0;
			}

		},

		// Listen to user interacting with the gallery.
		addEventListeners: function() {

			if(this.settings.keyboardNavigation == true) {

				// Keyboard events
				$(document).on('keyup', $.proxy(function(e) {

					switch(e.keyCode) {
						case 27:
							this.close();
						break;
						case 39:
							this.next();
						break;
						case 37:
							this.previous();
						break;

					}

				}, this));
				
			}

			// Close events
			$('button.mBox-close').on('click', $.proxy(function() {
				this.close();
			}, this));

			// Listen to the scroll event to keep, box in the view.
			$(window).scroll($.proxy(function() {

				var top = this.calculatePosition($(window).scrollTop());

				this.mBox.css('top', top);

			}, this));

			//
			// Images events
			//

			// Change currently displayed image on click on thumbnail. 
			$('img.mBox-thumbnail').on('click', $.proxy(function(e) {

				var newSrc = e.target.src; // This variable must be created and used inside next function.

				var no = this.getCurrentNumber(newSrc);

				var newCurrent = $(this.images[no]);

				if(this.currentImage.attr('src') != newSrc) {
					$(this.currentImage).fadeOut('fast', $.proxy(function() {

						this.updateCurrentImage(newCurrent);	
						this.navigationUpdate(no);

					}, this)).fadeIn('fast');

				}
			}, this));

			// Next & previous arrows.
			$('i.mBox-next').on('click', $.proxy(function(e) {
				
				this.next();

			}, this));

			$('i.mBox-previous').on('click', $.proxy(function(e) {

				this.previous();

			}, this));

			// Thumbnail navigation
			$('.mBox-thumbnail-pagination i').on('click', $.proxy(function(e) {

				var $this = $(e.target);

				var pageNo = $this.data('page-number'); // Get a page number.

				// No need to do anything when clicking on current page.
				if(pageNo !== this.currentPageNo) {
					this.currentPageNo = pageNo;
					$('.mBox-thumbnail-pagination i').removeClass('active');
					$this.addClass('active');

					// Each page takes a 100% width. To move between pages, set left.

					var left = pageNo * 100;
					$('.mBox-images').animate({'left': '-' + left + '%'}, 'slow');
				}
			}, this));

			// Display navigation when mouse enters lightbox.
			if(this.imagesCount > 1 && this.settings.displayNavigation == true) {

				$('.mBox-current').on('mouseenter', $.proxy(function(e) {

					if(this.settings.displayNavigation == true) {

						this.navigation.css('display', 'block');

					}

				}, this));

				$('.mBox-current').on('mouseleave', $.proxy(function(e) {

					if(this.settings.displayNavigation == true) {

						this.navigation.css('display', 'none');

					}

				}, this));
				
			}


		},

		next: function() {

			var nextNo = this.currentImageNo + 1; // Next = increase current by 1 :)

			if(nextNo < this.imagesCount) {

				var newCurrent = $(this.images[nextNo]);

				if(this.currentImage.attr('src') != newCurrent.attr('src')) {
					
					this.currentImage.fadeOut('fast', $.proxy(function() {

						this.updateCurrentImage(newCurrent);
						this.navigationUpdate(this.currentImageNo + 1);

					}, this)).fadeIn('fast');

				}
			}

		},

		previous: function() {

			var previousNo = this.currentImageNo - 1;

			if(previousNo >= 0) {

				var newCurrent = $(this.images[previousNo]);

				if(this.currentImage.attr('src') != newCurrent.attr('src')) {

					this.currentImage.fadeOut('fast', $.proxy(function() {

						this.updateCurrentImage(newCurrent);
						this.navigationUpdate(this.currentImageNo - 1);

					}, this)).fadeIn('fast');

				}

			}

		},

		open: function() {

			if($(document).find('.body-overlay').length == 0) $('body').append('<div class = "body-overlay"></div>'); // Overlay.

			this.mBox.fadeIn('slow');

		},

		close: function() {

			$('.body-overlay').fadeOut(function() {

				this.remove(); // Run after fade out is completed.

			});

			this.mBox.fadeOut(function() {

				this.remove();
				
			});

		},

		destroy: function() {

			this.mBox.remove();

		}

	}

	// Register new jQuery plugin.
	$.fn.mBox = function(options) {

		$(this).on('click', function(e) {

			var clicked = e.target;

			if(clicked.tagName == 'IMG') {

				new MBox(this, clicked, options);
				
			}

		});

		return this; // return this to enable method chaining.

	}

}(jQuery));