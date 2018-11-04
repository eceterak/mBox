// Wrap in IIFE
$(function($) {

	/**
	 * Simple images gallery/lightbox.
	 * @param per_page [int]
	 */

	$.fn.gallery = function(action = null) {
		if($(this).length < 1) return; // No gallery here.
		var $this = $(this);
		var images = $this.find('img'); // Find all images.
		if(images.length < 1) return; // No images to display.
		var current_image = images[0];
		var current_nb = 0;
		var current_page_nb = 0;

		// If action is set, run it and return to stop the script.
		if(action) {
			switch(action) {
				case 'open':
					open();
				break;
				case 'close':
					close();
				break;
			}
			return; // Stop here.
		}

		// Build interface.
		build();
		update_vars();
		navigation_create();

		// Those functions must come after interface is ready to use.

		// Change currently displayed image on click on thumbnail. 
		$('img.gallery-img', $this).on('click', function() {
			var n_src = this.src; // This variable must be created to use ir inside next function.
			if(current_image.attr('src') != n_src) {
				$(current_image).fadeOut('fast', function() {
					this.src = n_src;
				}).fadeIn('fast');
				navigation_update(get_current_number(n_src));
			}
		});

		// Next & previous arrows.

		$('i.gallery-next').on('click', function() {
			var next_nb = current_nb + 1; // Next = increase current by 1 :)
			if(next_nb < images.length) {
				var new_current = $(images[next_nb]);
				if(current_image.attr('src') != new_current.attr('src')) {
					current_image.fadeOut('fast', function() {
						$(this).attr('src', new_current.attr('src'));
					}).fadeIn('fast');
				}
				navigation_update(current_nb + 1);
			}
		});

		$('i.gallery-previous').on('click', function() {
			var previous_nb = current_nb - 1;
			if(previous_nb >= 0) {
				var new_current = $(images[previous_nb]);
				if(current_image.attr('src') != new_current.attr('src')) {
					current_image.fadeOut('fast', function() {
						$(this).attr('src', new_current.attr('src'));
					}).fadeIn('fast');
				}
				navigation_update(current_nb - 1);
			}
		});

		// Thumbnail pagination

		$('.gallery-thumbnail-pagination i').on('click', function() {
			page_nb = $(this).data('page-number'); // Get a page number.

			// No need to do anything when clicking on current page.

			if(page_nb !== current_page_nb) {
				current_page_nb = page_nb;
				$('.gallery-thumbnail-pagination i').removeClass('active');
				$(this).addClass('active');

				// Each page takes a 100% width. To move between pages, set left.

				left = page_nb * 100;
				$('.gallery-images').animate({'left': '-' + left + '%'}, 'slow');
			}
		});

		// Two ways to close the gallery lightbox. 

		$('button.close').on('click', close);

		$(document).on('keyup', function(e) {
			if(e.keyCode === 27 ) {
				close();
			}
		});


		// Open & close functions.

		function open() {
			if($(document).find('.body-overlay').length == 0) $('body').append('<div class = "body-overlay"></div>'); // Overlay.
			$this.appendTo('body').css('display', 'block');
		}

		function close() {
			$('.body-overlay').remove();
			$('.gallery').css('display', 'none');		
		}

		// To make gallery plugin plug & play, its whole interface is build here.

		function build() {

			// Thumbnails (on the bottom of the gallery).

			var thumbnails = $('<div/>').addClass('gallery-content');

			// Pagination. Add before anything else.

			$('<p/>', {
				'class': 'mb-1 mt-1 gallery-thumbnail-pagination'
			}).appendTo(thumbnails);

			$('<div/>', {
				'class': 'gallery-images'
			}).prependTo(thumbnails); // Prepend it!
			images.wrapAll(thumbnails).wrap('<div class = "gallery-image col-1"></div>'); // Wrap all images into content.


			// Current image.

			var current_image_box = $('<div/>').addClass('gallery-current').prependTo($this);;
			$('<img/>', {
				'class': 'img-fluid',
				'src': current_image.src
			}).prependTo(current_image_box);

			// Next & previous navigation arrows.

			var navigation_arrows = $('<div/>').addClass('gallery-navigation');
			$('<i/>', {
				'class': 'fas fa-chevron-left point gallery-previous float-left d-none'
			}).appendTo(navigation_arrows);
			$('<i/>', {
				'class': 'fas fa-chevron-right point gallery-next float-right d-none'
			}).appendTo(navigation_arrows);

			navigation_arrows.appendTo(current_image_box);

			// Image x of xx count.

			$('<p/>', {
				'class': 'small gallery-navigation-count'
			}).appendTo(current_image_box); // Still working on current image.

			// Close button. Add last.

			$('<button/>', {
				'class': 'close point dialog-close'
			}).append('<span>&times;</span>').prependTo($this);	
		}

		// Some variables needs to be updated when interface is ready.

		function update_vars() {
			current_image = $('.gallery-current img', $this); // current_image var points now to the big, featured image rather than value of images array.
			current_nb = get_current_number(current_image.attr('src'));
		}

		// To find out what is the index number of the current image in the images array, compare all src's.  

		function get_current_number(src) {
			var index = 0;
			images.each(function(nb) {
				if(this.src === src) {
					index = nb;
					return false; // Break the loop here.
				}
			});
			return index;
		}

		// Run this function only once.

		function navigation_create() {
			var navigation_count = $('p.gallery-navigation-count', $this);
			navigation_count.text('Image ');
			$('<span />', {
				'class': 'current-image-number',
				'text': (current_nb + 1)
			}).appendTo(navigation_count);
			if(images.length > 1) navigation_count.append(' of ' + images.length); // Add to the end.

			// Navigation arrows are hidden by default.

			if((current_nb + 1) != images.length) $('i.gallery-next').removeClass('d-none');
			if(current_nb != 0) $('i.gallery-previous').removeClass('d-none');

			// Create pagination if needed.

			if(images.length > 12) {
				var total_pages = Math.floor(images.length / 12);
				for (var i = 0; i <= total_pages; i++) {
					circ = $('<i />', {
						'class': 'fas fa-circle point',
						'data-page-number': i
					}).appendTo('.gallery-thumbnail-pagination', $this);
					if(i === current_page_nb) circ.addClass('active'); // Add active class to the 'current page' circle.
				}

				// Move to right thumbnail page if featured image is not on the first one.

				if(Math.floor(current_nb / 12) !== current_page_nb) {
					var left =  Math.ceil(current_nb / 12) * 100;
					$('.gallery-images').css('left', '-' + left + '%'); // Animation not needed here.
				}
			}
		}

		// @param nb [int]

		function navigation_update(nb) {
			current_nb = nb; // Update current image number otherwise arrow navigation is not gonna work.
			$('.current-image-number').text(nb + 1);

			// Update navigation arrows.

			if((nb + 1) != images.length) $('i.gallery-next').removeClass('d-none');
			else $('i.gallery-next').addClass('d-none');
			if(nb != 0) $('i.gallery-previous').removeClass('d-none');
			else $('i.gallery-previous').addClass('d-none');

			// Upadate thumbnails page when moving out of current one using arrows.

			if(images.length > 12) {
				if(Math.floor(current_nb / 12) !== current_page_nb) {
					var left = Math.floor(current_nb / 12); // Calculate current page number.
					$('.gallery-thumbnail-pagination i').removeClass('active');
					$('.gallery-thumbnail-pagination i[data-page-number = ' + left + ']').addClass('active');
					current_page_nb = left; // Set new page number before multiplying by 100.
					left = left * 100;
					$('.gallery-images').animate({'left': '-' + left + '%'}, 'slow');
				}
			}
		}

		return $this; // Return this to allow chaining with other jquery plugins.
		
	} // Gallery plugin ends here.

}(jQuery));