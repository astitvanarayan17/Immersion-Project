async function fetchProducts(url) {
  const res = await fetch(url);
  const data = await res.json();
  return data.products;
}

function sortProducts(products, order) {
  if (order === 'asc') {
    return products.sort((a, b) => a.price - b.price);
  } else if (order === 'desc') {
    return products.sort((a, b) => b.price - a.price);
  }
  return products;
}

function renderProducts(products, isSearch = false) {
  const highlightContainer = document.getElementById('highlightContainer');
  const productContainer = document.getElementById('productContainer');
  highlightContainer.innerHTML = '';
  productContainer.innerHTML = '';

  if (products.length === 0) {
    highlightContainer.innerHTML = '<p>No products found.</p>';
    return;
  }

  const container = isSearch ? highlightContainer : productContainer;

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.thumbnail}" alt="${product.title}">
      <div class="card-details">
        <h3>${product.title}</h3>
        <p><strong>Brand:</strong> ${product.brand}</p>
        <p><strong>Price:</strong> $${product.price}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

async function searchProducts() {
  const query = document.getElementById('searchInput').value.trim();
  const sortOrder = document.getElementById('sortSelect').value;

  const url = query 
    ? `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`
    : `https://dummyjson.com/products`;

  let products = await fetchProducts(url);
  products = sortProducts(products, sortOrder);

  renderProducts(products, !!query);
}


async function searchProducts() {
  const query = document.getElementById('searchInput').value.trim();
  const sortOrder = document.getElementById('sortSelect').value;
  const selectedBrand = document.getElementById('brandSelect').value;

  const url = query
    ? `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`
    : `https://dummyjson.com/products`;

  let products = await fetchProducts(url);

  // Filter by brand if selected
  if (selectedBrand) {
    products = products.filter(p => p.brand === selectedBrand);
  }

  products = sortProducts(products, sortOrder);
  renderProducts(products, !!query);
}
async function populateBrands() {
  const allProducts = await fetchProducts("https://dummyjson.com/products");
  const brands = [...new Set(allProducts.map(p => p.brand))];

  const brandSelect = document.getElementById('brandSelect');
  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandSelect.appendChild(option);
  });
}


window.onload = async function () {
  await populateBrands();
  searchProducts();
};


function toggleDarkMode() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');

  // Optionally update button text/icon
  const toggleBtn = document.getElementById('darkModeToggle');
  toggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}
