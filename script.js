const categories = [
  {
    id: "donuts", name: "ドーナツ", items: [
      ["ドーナツ", 250], ["ココアドーナツ", null], ["あんどーなつ", null]
    ]
  },
  {
    id: "bagels", name: "ベーグル", items: [
      ["プレーン", null], ["チョコチップ", null], ["チョコくるみ", null],
      ["チョコクランベリー", null], ["ダブルチーズ", null], ["枝豆チーズ", null],
      ["オニオンチーズベーコン", null], ["ウインナー", 350], ["豚バラれんこん", null],
      ["あんことクリームチーズ", null], ["クランベリーとクリームチーズ", null],
      ["あんバター", null], ["黒ゴマ塩", null], ["黒ゴマチーズ", null],
      ["さつまいも", null]
    ]
  },
  {
    id: "bread", name: "食パン", items: [
      ["ホテルブレッド", null], ["くるみとレーズンの黒糖食パン", null]
    ]
  },
  {
    id: "sweets", name: "米粉のおやつ", items: [
      ["シフォンケーキ(プレーン)", null], ["シフォンケーキ(チョコチップ)", 270],
      ["シフォンケーキ(ミルクティー)", null], ["米粉のベイクドチーズケーキ", 400],
      ["米粉のあんこチーズケーキ", null], ["米粉のレモンパウンドケーキ", null],
      ["米粉のココアクッキー", null], ["米粉のスノーボールクッキー", null],
      ["クッキーセット", null]
    ]
  }
];

const allProducts = categories.flatMap(c => c.items.map(([name, price]) => ({
  id: `${c.id}-${name}`, category:c.id, name, price
})));

let activeCategory = categories[0].id;
let cart = [];

const $ = s => document.querySelector(s);
const categoriesEl = $("#categories");
const productsEl = $("#products");
const searchEl = $("#search");

function yen(n) {
  return n == null ? "価格未設定" : `¥${n.toLocaleString("ja-JP")}`;
}

function renderCategories() {
  categoriesEl.innerHTML = categories.map(c =>
    `<button class="category-btn ${c.id === activeCategory ? "active":""}" data-category="${c.id}">${c.name}</button>`
  ).join("");
}

function renderProducts() {
  const query = searchEl.value.trim().toLowerCase();
  let list = allProducts.filter(p => p.category === activeCategory);
  if (query) list = allProducts.filter(p => p.name.toLowerCase().includes(query));

  $("#categoryTitle").textContent = query ? "検索結果" : categories.find(c => c.id === activeCategory).name;

  productsEl.innerHTML = list.map(p => `
    <button class="product" data-id="${p.id}" ${p.price == null ? 'title="価格を設定してから会計できます"' : ""}>
      <span class="product-name">${p.name}</span>
      <span class="product-bottom">
        <span class="price ${p.price == null ? "unset":""}">${yen(p.price)}</span>
        <span class="add">${p.price == null ? "未設定":"＋追加"}</span>
      </span>
    </button>
  `).join("") || `<div class="empty-cart"><strong>商品が見つかりません</strong></div>`;
}

function renderCart() {
  const validCart = cart;
  $("#itemCount").textContent = `${validCart.reduce((s,i)=>s+i.qty,0)}点`;

  if (!validCart.length) {
    $("#cart").innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛍️</div>
        <strong>商品を選択してください</strong>
        <span>右側の商品パネルをタップすると<br>ここに追加されます。</span>
      </div>`;
  } else {
    $("#cart").innerHTML = validCart.map((i, index) => `
      <div class="cart-item">
        <div>
          <div class="cart-name">${i.name}</div>
          <div class="cart-price">${yen(i.price)} × ${i.qty} = ${yen(i.price * i.qty)}</div>
        </div>
        <div class="qty">
          <button data-action="minus" data-index="${index}">−</button>
          <span>${i.qty}</span>
          <button data-action="plus" data-index="${index}">＋</button>
        </div>
      </div>`).join("");
  }

  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  // 食品の軽減税率8%を前提に、税込価格表示として扱う簡易POS。
  // 登録価格が税込の場合は税額表示を0にしても構いません。
  const tax = Math.floor(subtotal * 8 / 108);
  const total = subtotal;
  $("#subtotal").textContent = yen(subtotal - tax);
  $("#tax").textContent = yen(tax);
  $("#total").textContent = yen(total);
  $("#checkoutAmount").textContent = yen(total);
  $("#checkoutBtn").disabled = !cart.length;
}

function addProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  if (p.price == null) {
    showToast("この商品の価格が未設定です");
    return;
  }
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty++;
  else cart.push({...p, qty:1});
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function showToast(message) {
  const t = $("#toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}

categoriesEl.addEventListener("click", e => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  searchEl.value = "";
  renderCategories();
  renderProducts();
});

productsEl.addEventListener("click", e => {
  const btn = e.target.closest("[data-id]");
  if (btn) addProduct(btn.dataset.id);
});

$("#cart").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const i = Number(btn.dataset.index);
  if (btn.dataset.action === "plus") cart[i].qty++;
  if (btn.dataset.action === "minus") {
    cart[i].qty--;
    if (cart[i].qty <= 0) cart.splice(i,1);
  }
  renderCart();
});

searchEl.addEventListener("input", renderProducts);
$("#clearBtn").addEventListener("click", clearCart);
$("#clearBtn2").addEventListener("click", clearCart);

$("#checkoutBtn").addEventListener("click", () => {
  $("#modalTotal").textContent = yen(cart.reduce((s,i)=>s+i.price*i.qty,0));
  $("#completeMessage").hidden = true;
  document.querySelector(".payment-grid").hidden = false;
  $("#checkoutModal").hidden = false;
});

$("#modalClose").addEventListener("click", ()=> $("#checkoutModal").hidden = true);

document.querySelectorAll(".payment-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const payment = btn.dataset.payment;
    const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
    $("#completeDetail").textContent = `${yen(total)} / ${payment}`;
    document.querySelector(".payment-grid").hidden = true;
    $("#completeMessage").hidden = false;
  });
});

$("#newTicketBtn").addEventListener("click", () => {
  $("#checkoutModal").hidden = true;
  clearCart();
  showToast("新しい会計を開始しました");
});

renderCategories();
renderProducts();
renderCart();
