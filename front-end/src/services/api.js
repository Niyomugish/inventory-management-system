const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("inventory_token");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes("/auth/login")) {
      localStorage.removeItem("inventory_token");
      localStorage.removeItem("inventory_user");
      window.dispatchEvent(new Event("auth_logout"));
    }
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  getMe: () => request("/auth/me"),
  getUsers: () => request("/auth/users"),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: "DELETE" }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ""}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  checkPrice: (sku) => request(`/products/scan/${encodeURIComponent(sku)}`),
  getScanCatalog: () => request("/products/scan-catalog"),
  createProduct: (product) => request("/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Stock Movement & Product In/Out
  productIn: (payload) => request("/transactions/in", { method: "POST", body: JSON.stringify(payload) }),
  productOut: (payload) => request("/transactions/out", { method: "POST", body: JSON.stringify(payload) }),
  getProdInHistory: () => request("/transactions/prod-in"),
  getProdOutHistory: () => request("/transactions/prod-out"),
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions${query ? `?${query}` : ""}`);
  },
  getSummary: () => request("/transactions/summary")
};
