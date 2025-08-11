document.addEventListener('DOMContentLoaded', function() {
  // Cart functionality
  let cart = loadCart();
  
  // DOM Elements
  const cartButtons = document.querySelectorAll('.add-to-cart');
  const cartBtn = document.getElementById('cart-btn');
  const mobileCartBtn = document.getElementById('mobile-cart-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const closeCartButton = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartCountElements = document.querySelectorAll('#cart-count, #mobile-cart-count');
  const addToCartModalBtn = document.getElementById('add-to-cart-modal');
  
  // Initialize cart UI
  updateCartUI();
  
  // Event Listeners
  cartButtons.forEach(button => {
      button.addEventListener('click', function() {
          const productId = this.getAttribute('data-product-id');
          const productName = this.getAttribute('data-product-name');
          const productPrice = parseFloat(this.getAttribute('data-product-price'));
          
          addToCart({
              id: productId,
              name: productName,
              price: productPrice,
              quantity: 1,
              size: 'M',
              color: 'Indigo',
              image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80'
          });
          
          showNotification(`${productName} added to cart`);
      });
  });
  
  // Add to cart from modal
  if (addToCartModalBtn) {
      addToCartModalBtn.addEventListener('click', function() {
          const productTitle = document.getElementById('modal-product-title').textContent;
          const selectedSize = document.querySelector('.size-option.selected').textContent;
          const selectedColor = document.querySelector('.color-option.selected').getAttribute('data-color');
          const quantity = parseInt(document.getElementById('quantity').textContent);
          const price = 89; // This would come from the product data in a real implementation
          
          addToCart({
              id: 'modal-prod-001',
              name: productTitle,
              price: price,
              quantity: quantity,
              size: selectedSize,
              color: selectedColor,
              image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80'
          });
          
          // Close the modal
          const productModal = document.getElementById('product-modal');
          productModal.classList.remove('active');
          document.body.style.overflow = '';
          
          showNotification(`${productTitle} added to cart`);
      });
  }
  
  // Cart sidebar toggle
  if (cartBtn) {
      cartBtn.addEventListener('click', toggleCart);
  }
  
  if (mobileCartBtn) {
      mobileCartBtn.addEventListener('click', function() {
          // Close mobile menu if open
          const mobileMenu = document.getElementById('mobile-menu');
          if (mobileMenu.classList.contains('open')) {
              mobileMenu.classList.remove('open');
          }
          toggleCart();
      });
  }
  
  if (closeCartButton) {
      closeCartButton.addEventListener('click', toggleCart);
  }
  
  // Functions
  function loadCart() {
      const savedCart = localStorage.getItem('heems-cart');
      return savedCart ? JSON.parse(savedCart) : [];
  }
  
  function saveCart() {
      localStorage.setItem('heems-cart', JSON.stringify(cart));
  }
  
  function addToCart(item) {
      // Check if product already in cart
      const existingItemIndex = cart.findIndex(cartItem => 
          cartItem.id === item.id && 
          cartItem.size === item.size && 
          cartItem.color === item.color
      );
      
      if (existingItemIndex !== -1) {
          // Update quantity if item already exists
          cart[existingItemIndex].quantity += item.quantity;
      } else {
          // Add new item to cart
          cart.push(item);
      }
      
      saveCart();
      updateCartUI();
  }
  
  function removeFromCart(itemId) {
      cart = cart.filter(item => item.id !== itemId);
      saveCart();
      updateCartUI();
  }
  
  function updateCartUI() {
      // Update cart count
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      cartCountElements.forEach(el => el.textContent = totalItems);
      
      // Update cart sidebar if it exists on the page
      if (!cartItemsContainer || !cartSubtotal) {
          return; // Not on a page with cart sidebar
      }
      
      if (cart.length === 0) {
          cartItemsContainer.innerHTML = `
              <div class="text-center py-12 text-bistre/70">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-bistre/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Your cart is empty</p>
              </div>
          `;
          cartSubtotal.textContent = '$0.00';
          return;
      }
      
      let itemsHTML = '';
      let subtotal = 0;
      
      cart.forEach(item => {
          subtotal += item.price * item.quantity;
          itemsHTML += `
              <div class="flex py-4 border-b border-bistre/20">
                  <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                  </div>
                  <div class="flex-1 pl-4">
                      <h4 class="font-bold text-bistre">${item.name}</h4>
                      <p class="text-sm text-bistre/70 mb-1">${item.color}, ${item.size}</p>
                      <p class="text-sm text-bistre/70">$${item.price} × ${item.quantity}</p>
                  </div>
                  <div class="flex flex-col items-end">
                      <p class="font-bold text-bistre mb-2">$${(item.price * item.quantity).toFixed(2)}</p>
                      <button class="text-xs text-bistre/50 hover:text-mauveine transition remove-item" data-id="${item.id}">
                          Remove
                      </button>
                  </div>
              </div>
          `;
      });
      
      cartItemsContainer.innerHTML = itemsHTML;
      cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
      
      // Add event listeners to remove buttons
      document.querySelectorAll('.remove-item').forEach(button => {
          button.addEventListener('click', function() {
              const itemId = this.getAttribute('data-id');
              removeFromCart(itemId);
          });
      });
  }
  
  function toggleCart() {
      cartSidebar.classList.toggle('translate-x-full');
      document.body.style.overflow = cartSidebar.classList.contains('translate-x-full') ? '' : 'hidden';
  }
  
  function showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-bistre text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
          notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
          setTimeout(() => notification.remove(), 300);
      }, 2000);
  }
});