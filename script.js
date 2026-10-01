document.addEventListener("DOMContentLoaded", () => {
    // --- SELETORES GLOBAIS ---
    const cartIcon = document.querySelector(".cart-icon"),
        cartSidebar = document.querySelector(".cart-sidebar"),
        cartOverlay = document.querySelector(".cart-overlay"),
        closeCartBtn = document.querySelector(".close-cart-btn"),
        cartBody = document.querySelector(".cart-body"),
        cartBadge = document.querySelector(".cart-badge");
    const deliveryToggleBtns = document.querySelectorAll(".delivery-btn");
    const deliveryForm = document.getElementById("delivery-form-container"),
        pickupForm = document.getElementById("pickup-form-container");
    const trocoContainer = document.getElementById("troco-container");
    const couponInput = document.getElementById("coupon-input"),
        applyCouponBtn = document.getElementById("apply-coupon-btn"),
        couponFeedback = document.getElementById("coupon-feedback");
    const subtotalElem = document.getElementById("cart-subtotal"),
        cartDiscountElem = document.getElementById("cart-discount"),
        discountLineElem = document.querySelector(".discount-line"),
        totalElem = document.getElementById("cart-total");
    const finishOrderBtn = document.getElementById("finish-order-btn");
    const deliveryCostLine = document.getElementById("delivery-cost-line");
    const cartDeliveryCostElem = document.getElementById("cart-delivery-cost");
    let deliveryQuote = null;
    // Seletores da barra inferior
    const viewCartBanner = document.querySelector(".view-cart-banner");
    const bannerTotalElem = document.getElementById("banner-total");
    const viewCartBannerBtn = document.querySelector(".view-cart-banner-btn");

    // Seletores para o sistema de filtro
    const categoryBtns = document.querySelectorAll(".category-btn");
    const searchInput = document.querySelector(".search-input");

    // --- ESTADO DA APLICAÇÃO ---
    const produtos = [
        { id:1, sku:"ELN-TEN-001", nome:"Tênis Casual Branco", categoria:"tenis", preco:149.90, imagem:"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700", descricao:"Versátil, confortável e perfeito para o dia a dia.", variantes:[] },
        { id:2, sku:"ELN-TEN-002", nome:"Tênis Casual Rosé", categoria:"tenis", preco:159.90, imagem:"https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=700", descricao:"Visual moderno com toque delicado para compor seus looks.", variantes:[] },
        { id:3, sku:"ELN-SAN-001", nome:"Sandália Salto Bloco Nude", categoria:"sandalias", preco:139.90, imagem:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700", descricao:"Elegância e estabilidade para ocasiões especiais.", variantes:[] },
        { id:4, sku:"ELN-SAN-002", nome:"Sandália Clássica Preta", categoria:"sandalias", preco:129.90, imagem:"https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=700", descricao:"Um clássico indispensável, elegante e fácil de combinar.", variantes:[] },
        { id:5, sku:"ELN-SAP-001", nome:"Sapatilha Confort Nude", categoria:"sapatilhas", preco:99.90, imagem:"https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=700", descricao:"Leveza e conforto para acompanhar sua rotina.", variantes:[] },
        { id:6, sku:"ELN-MOC-001", nome:"Mocassim Elegance", categoria:"mocassins", preco:149.90, imagem:"https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=700", descricao:"Sofisticação com conforto em um modelo atemporal.", variantes:[] },
        { id:7, sku:"ELN-BOT-001", nome:"Bota Cano Curto Preta", categoria:"botas", preco:199.90, imagem:"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=700", descricao:"Personalidade e estilo para produções marcantes.", variantes:[] },
        { id:8, sku:"ELN-SAN-003", nome:"Sandália Plataforma Bege", categoria:"sandalias", preco:159.90, imagem:"https://images.unsplash.com/photo-1603487742131-4160ec999306?w=700", descricao:"Altura, conforto e um visual contemporâneo.", variantes:[] }
    ];
    const DEFAULT_COUPONS = [{ code: "DESCONTO10", type: "percentage", value: 10, active: true }];
    const getStoreSettings = () => { try { return JSON.parse(localStorage.getItem("elnora_store_settings_v1") || "{}"); } catch { return {}; } };
    const getValidCoupons = () => { try { const saved=JSON.parse(localStorage.getItem("elnora_coupons_v1")||"null"); return Array.isArray(saved)?saved.filter(c=>c.active!==false):DEFAULT_COUPONS; } catch { return DEFAULT_COUPONS; } };
    let carrinho = [],
        tipoEntrega = "delivery",
        appliedCoupon = null;

    // Variáveis de estado para filtros
    let categoriaAtiva = "all";
    let termoBusca = "";

    const formatarMoeda = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const getScrollbarWidth = () =>
        window.innerWidth - document.documentElement.clientWidth;
    const lockScroll = () => {
        document.body.style.paddingRight = `${getScrollbarWidth()}px`;
        document.body.classList.add("no-scroll");
    };
    const unlockScroll = () => {
        document.body.style.paddingRight = "";
        document.body.classList.remove("no-scroll");
    };
    const abrirCarrinho = () => {
        cartSidebar.classList.add("show");
        cartOverlay.classList.add("show");

        // Oculta a Elnora enquanto o carrinho/checkout estiver aberto.
        // Isso impede que o botão flutuante cubra "Finalizar Pedido".
        document.body.classList.add("cart-open");

        lockScroll();
    };

    const fecharCarrinho = () => {
        cartSidebar.classList.remove("show");
        cartOverlay.classList.remove("show");
        document.body.classList.remove("cart-open");
        unlockScroll();
    };

    const animacaoVoarParaCarrinho = (productCard) => {
        const productImg = productCard.querySelector(".product-img"),
            imgRect = productImg.getBoundingClientRect(),
            cartRect = cartIcon.getBoundingClientRect(),
            flyingImg = document.createElement("img");
        flyingImg.src = productImg.src;
        flyingImg.classList.add("product-image-fly");
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        document.body.appendChild(flyingImg);
        requestAnimationFrame(() => {
            flyingImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
            flyingImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
            flyingImg.style.width = "0px";
            flyingImg.style.height = "0px";
            flyingImg.style.opacity = "0";
        });
        flyingImg.addEventListener("transitionend", () => flyingImg.remove());
    };

    // Função para filtrar e mostrar produtos
    const filtrarEMostrarProdutos = () => {
        let produtosFiltrados = produtos;

        // Filtro por categoria
        if (categoriaAtiva !== "all") {
            produtosFiltrados = produtosFiltrados.filter(
                (produto) => produto.categoria === categoriaAtiva,
            );
        }

        // Filtro por busca
        if (termoBusca.trim() !== "") {
            const termo = termoBusca.toLowerCase();
            produtosFiltrados = produtosFiltrados.filter(
                (produto) =>
                    produto.nome.toLowerCase().includes(termo) ||
                    produto.descricao.toLowerCase().includes(termo),
            );
        }

        // Renderizar produtos filtrados
        const container = document.querySelector(".products-container");
        if (produtosFiltrados.length === 0) {
            container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
                            <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p style="font-size: 1.2rem; font-weight: 600;">Nenhum produto encontrado</p>
                        </div>
                    `;
        } else {
            container.innerHTML = produtosFiltrados
                .map(
                    (p) => `
                        <div class="product-card" data-id="${p.id}">
                            <img class="product-img" src="${p.imagem}" alt="${p.nome}">
                            <div class="product-info">
                                <h3 class="product-name">${p.nome}</h3>
                                <p class="product-description">${p.descricao}</p>
                                <p class="product-price">${formatarMoeda(p.preco)}</p>
                                <label class="product-size-label">Tamanho
                                  <select class="product-size-select" aria-label="Tamanho de ${p.nome}">
                                    <option value="">Selecione</option>
                                    ${(p.variantes||[]).filter(v=>v.active!==false&&Number(v.stock)>0).map(v=>`<option value="${v.id}" data-size="${v.size}" data-stock="${v.stock}">${v.size} — ${v.stock} em estoque</option>`).join("") || '<option value="" disabled>Estoque será carregado do sistema</option>'}
                                  </select>
                                </label>
                                <a class="product-details-link" href="produto.html?sku=${encodeURIComponent(p.sku)}">Ver detalhes</a>
                                <button class="product-button">Comprar</button>
                            </div>
                        </div>
                    `,
                )
                .join("");
        }
    };

    const adicionarAoCarrinho = (produtoId, productCard) => {
        const produto=produtos.find(p=>String(p.id)===String(produtoId));
        const sel=productCard?.querySelector(".product-size-select");
        const opt=sel?.selectedOptions?.[0],variantId=sel?.value||"",tamanho=opt?.dataset?.size||"",estoque=Number(opt?.dataset?.stock||0);
        if(!variantId){alert("Selecione o tamanho antes de comprar.");sel?.focus();return}
        const cartKey=`${produto.id}:${variantId}`,itemNoCarrinho=carrinho.find(i=>i.cartKey===cartKey);
        if(itemNoCarrinho&&itemNoCarrinho.quantidade>=estoque)return alert(`Estoque máximo do tamanho ${tamanho}: ${estoque}.`);
        if(productCard)animacaoVoarParaCarrinho(productCard);
        if(itemNoCarrinho)itemNoCarrinho.quantidade++;else carrinho.push({...produto,variantId,tamanho,estoque,cartKey,quantidade:1});
        window.elnoraTrack?.("add_to_cart",{currency:"BRL",value:produto.preco,items:[{item_id:produto.sku,item_name:produto.nome,item_variant:tamanho,price:produto.preco,quantity:1}]});
        atualizarCarrinho();
    };

    const alterarQuantidade = (cartKey, acao) => {
        const item=carrinho.find(i=>i.cartKey===cartKey);if(!item)return;
        if(acao==="aumentar"){if(item.quantidade>=item.estoque)return alert(`Estoque máximo do tamanho ${item.tamanho}: ${item.estoque}.`);item.quantidade++}
        else if(acao==="diminuir"){item.quantidade--;if(item.quantidade<=0)carrinho=carrinho.filter(i=>i.cartKey!==cartKey)}
        atualizarCarrinho();
    };

    const atualizarCarrinho = () => {
        if (carrinho.length === 0) {
            cartBody.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-box-open"></i><p>Seu carrinho está vazio.</p></div>`;
        } else {
            cartBody.innerHTML = carrinho
                .map(
                    (item) =>
                        `<div class="cart-item" data-cart-key="${item.cartKey}"><img src="${item.imagem}" alt="${item.nome}" class="cart-item-img"><div class="cart-item-info"><h4 class="cart-item-name">${item.nome}</h4><p class="cart-item-variant">Tamanho: <strong>${item.tamanho}</strong></p><p class="cart-item-price">${formatarMoeda(item.preco)}</p><div class="cart-item-controls"><button class="quantity-btn" data-action="diminuir">-</button><span class="quantity">${item.quantidade}</span><button class="quantity-btn" data-action="aumentar">+</button></div></div><button class="remove-item-btn">&times;</button></div>`,
                )
                .join("");
        }
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );
        let discountAmount = 0;
        if (appliedCoupon && appliedCoupon.type === "percentage")
            discountAmount = subtotal * (appliedCoupon.value / 100);
        const settings = getStoreSettings();
        if (!appliedCoupon && Number(settings.promotionPercent) > 0) discountAmount = subtotal * (Number(settings.promotionPercent) / 100);
        const deliveryFee = (tipoEntrega === "delivery" && deliveryQuote?.eligible && !getStoreSettings().freeShipping) ? Number(deliveryQuote.fee || 0) : 0;
        const total = subtotal - discountAmount + deliveryFee;
        if (deliveryCostLine && cartDeliveryCostElem) {
            deliveryCostLine.style.display = tipoEntrega === "delivery" && deliveryQuote?.eligible ? "flex" : "none";
            cartDeliveryCostElem.textContent = formatarMoeda(deliveryFee);
        }
        subtotalElem.textContent = formatarMoeda(subtotal);
        if (discountAmount > 0) {
            cartDiscountElem.textContent = `- ${formatarMoeda(discountAmount)}`;
            discountLineElem.style.display = "flex";
        } else {
            discountLineElem.style.display = "none";
        }
        totalElem.textContent = formatarMoeda(total);
        cartBadge.textContent = carrinho.reduce(
            (acc, item) => acc + item.quantidade,
            0,
        );
        finishOrderBtn.disabled = carrinho.length === 0;

        if (carrinho.length > 0 && window.innerWidth <= 768) {
            bannerTotalElem.textContent = formatarMoeda(total);
            viewCartBanner.classList.add("show");
        } else {
            viewCartBanner.classList.remove("show");
        }
    };

    const applyCoupon = () => {
        const code = couponInput.value.trim().toUpperCase(),
            foundCoupon = getValidCoupons().find((c) => String(c.code).toUpperCase() === code);
        couponFeedback.classList.remove("success", "error");
        if (foundCoupon) {
            appliedCoupon = foundCoupon;
            couponFeedback.textContent = "Cupom aplicado!";
            couponFeedback.classList.add("success");
        } else {
            appliedCoupon = null;
            couponFeedback.textContent = "Cupom inválido.";
            couponFeedback.classList.add("error");
        }
        atualizarCarrinho();
    };

    // --- PIX MERCADO PAGO ---
    const pixModal = document.getElementById("pix-payment-modal");
    const pixMessage = document.getElementById("pix-payment-message");
    const pixLoading = document.getElementById("pix-payment-loading");
    const pixContent = document.getElementById("pix-payment-content");
    const pixError = document.getElementById("pix-payment-error");
    const pixTotal = document.getElementById("pix-payment-total");
    const pixQrImage = document.getElementById("pix-qr-image");
    const pixCopyCode = document.getElementById("pix-copy-code");
    const pixCopyBtn = document.getElementById("pix-copy-btn");
    const pixStatus = document.getElementById("pix-payment-status");
    const pixWhatsappOrder = document.getElementById("pix-whatsapp-order");
    let pixStatusTimer = null;
    let pixOrderWhatsappUrl = "";

    const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

    const validarCPF = (value) => {
        const cpf = onlyDigits(value);
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        const calc = (base) => {
            let sum = 0;
            for (let i = 0; i < base; i++) sum += Number(cpf[i]) * (base + 1 - i);
            const rest = (sum * 10) % 11;
            return rest === 10 ? 0 : rest;
        };
        return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
    };

    const fecharPixModal = () => {
        if (pixStatusTimer) clearInterval(pixStatusTimer);
        pixStatusTimer = null;
        pixModal?.classList.remove("show");
        pixModal?.setAttribute("aria-hidden", "true");
    };

    const abrirPixModal = () => {
        pixModal?.classList.add("show");
        pixModal?.setAttribute("aria-hidden", "false");
    };

    document.querySelectorAll("[data-pix-close]").forEach((el) =>
        el.addEventListener("click", fecharPixModal)
    );

    pixCopyBtn?.addEventListener("click", async () => {
        const code = pixCopyCode?.value || "";
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            pixCopyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
            setTimeout(() => pixCopyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar', 1800);
        } catch {
            pixCopyCode.select();
            document.execCommand("copy");
        }
    });

    pixWhatsappOrder?.addEventListener("click", () => {
        if (pixOrderWhatsappUrl) window.open(pixOrderWhatsappUrl, "_blank");
    });

    const atualizarStatusPix = (status) => {
        if (!pixStatus) return;
        pixStatus.className = "pix-payment-status";
        if (status === "approved") {
            pixStatus.classList.add("approved");
            pixStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Pagamento aprovado';
            pixMessage.textContent = "Pagamento confirmado. Seu pedido está pronto para ser enviado à ELNORA.";
            pixWhatsappOrder.hidden = false;
            if (pixStatusTimer) clearInterval(pixStatusTimer);
            pixStatusTimer = null;
        } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
            pixStatus.classList.add("rejected");
            pixStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Pagamento não aprovado';
            if (pixStatusTimer) clearInterval(pixStatusTimer);
            pixStatusTimer = null;
        } else {
            pixStatus.classList.add("pending");
            pixStatus.innerHTML = '<i class="fa-regular fa-clock"></i> Aguardando pagamento';
        }
    };

    const gerarPix = async ({ amount, email, cpf, description, whatsappUrl }) => {
        abrirPixModal();
        pixLoading.hidden = false;
        pixContent.hidden = true;
        pixError.hidden = true;
        pixWhatsappOrder.hidden = true;
        pixMessage.textContent = "Gerando seu Pix com segurança...";
        pixOrderWhatsappUrl = whatsappUrl;

        if (!window.ELNORA_PRO?.ready) {
            pixLoading.hidden = true;
            pixError.hidden = false;
            pixError.textContent = "Configure o Supabase em config/config.js para ativar o Pix.";
            return;
        }

        try {
            const idempotencyKey = crypto.randomUUID();
            const payment = await window.ELNORA_PRO.createPayment({
                amount,
                payer: { email, cpf: onlyDigits(cpf) },
                description,
                external_reference: `ELNORA-${Date.now()}`,
                idempotency_key: idempotencyKey
            });

            if (!payment?.payment_id || !payment?.qr_code) {
                throw new Error(payment?.error || "O Mercado Pago não retornou o código Pix.");
            }

            pixLoading.hidden = true;
            pixContent.hidden = false;
            pixTotal.textContent = formatarMoeda(Number(payment.amount || amount));
            pixCopyCode.value = payment.qr_code;
            if (payment.qr_code_base64) {
                pixQrImage.src = `data:image/png;base64,${payment.qr_code_base64}`;
                pixQrImage.hidden = false;
            } else {
                pixQrImage.hidden = true;
            }
            pixMessage.textContent = "Escaneie o QR Code ou use o Pix Copia e Cola.";
            atualizarStatusPix(payment.status);

            if (payment.status !== "approved") {
                pixStatusTimer = setInterval(async () => {
                    try {
                        const current = await window.ELNORA_PRO.paymentStatus(payment.payment_id);
                        atualizarStatusPix(current?.status || "pending");
                    } catch (error) {
                        console.warn("Não foi possível atualizar o status do Pix.", error);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error("Erro ao gerar Pix", error);
            pixLoading.hidden = true;
            pixContent.hidden = true;
            pixError.hidden = false;
            pixError.textContent = error?.message || "Não foi possível gerar o Pix. Tente novamente.";
            pixMessage.textContent = "Não foi possível iniciar o pagamento.";
        }
    };

    const finalizarPedido = async () => {
        let valid = true;
        let fieldsToValidate = [];

        if (tipoEntrega === "delivery") {
            fieldsToValidate = [
                "delivery-name",
                "delivery-phone",
                "delivery-cep",
                "delivery-address",
            ];
        } else {
            fieldsToValidate = ["pickup-name", "pickup-date", "pickup-time"];
        }

        const selectedPaymentMethod = tipoEntrega === "delivery"
            ? document.querySelector('input[name="payment"]:checked')?.value
            : null;

        if (tipoEntrega === "delivery" && selectedPaymentMethod === "PIX") {
            fieldsToValidate.push("delivery-email", "delivery-cpf");
        }

        fieldsToValidate.forEach((id) => {
            const el = document.getElementById(id);
            let isFieldValid = el.value.trim() !== "";

            if (id.includes("name") && isFieldValid) {
                if (
                    el.value
                        .trim()
                        .split(" ")
                        .filter((word) => word).length < 2
                ) {
                    isFieldValid = false;
                }
            }

            if (id === "delivery-email" && isFieldValid) {
                isFieldValid = /^\S+@\S+\.\S+$/.test(el.value.trim());
            }
            if (id === "delivery-cpf" && isFieldValid) {
                isFieldValid = validarCPF(el.value);
            }

            if (!isFieldValid) {
                el.classList.add("error");
                valid = false;
            } else {
                el.classList.remove("error");
            }
        });

        if (!valid) {
            alert(
                "Por favor, preencha todos os campos obrigatórios marcados em vermelho.",
            );
            return;
        }

        if (tipoEntrega === "delivery") {
            if (!deliveryQuote) {
                alert("Aguarde o cálculo automático da taxa de entrega pelo CEP.");
                window.ELNORA_DELIVERY?.calculate();
                return;
            }
            if (!deliveryQuote.eligible) {
                alert("Este CEP está fora da área de entrega da ELNORA (máximo de 10 km na ida).");
                return;
            }
        }

        const numeroWhatsApp = "5511997523804";
        const itensPedido = carrinho
            .map((item) => `  - ${item.quantidade}x ${item.nome}`)
            .join("\n");
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );
        let discountAmount = 0,
            cupomInfo = "";
        if (appliedCoupon) {
            discountAmount = subtotal * (appliedCoupon.value / 100);
            cupomInfo = `\n*Cupom Aplicado:* ${appliedCoupon.code} (${formatarMoeda(discountAmount)})`;
        } else {
            const promo = Number(getStoreSettings().promotionPercent || 0);
            if (promo > 0) { discountAmount = subtotal * (promo / 100); cupomInfo = `\n*Promoção automática:* ${promo}% (${formatarMoeda(discountAmount)})`; }
        }
        const deliveryFee = (tipoEntrega === "delivery" && deliveryQuote?.eligible && !getStoreSettings().freeShipping) ? Number(deliveryQuote.fee || 0) : 0;
        const total = subtotal - discountAmount + deliveryFee;
        const entregaInfo = tipoEntrega === "delivery" ? `\n*Taxa de entrega:* ${formatarMoeda(deliveryFee)}\n*Distância:* ${deliveryQuote.oneWayKm.toFixed(1)} km ida / ${deliveryQuote.roundTripKm.toFixed(1)} km ida+volta` : "";
        let mensagem = `*-- NOVO PEDIDO ELNORA CALÇADOS & VAREJO --*\n\n*Itens:*\n${itensPedido}\n\n*Subtotal:* ${formatarMoeda(subtotal)}${cupomInfo}${entregaInfo}\n*Total:* ${formatarMoeda(total)}\n\n-------------------------\n\n`;

        if (tipoEntrega === "delivery") {
            const nome = document.getElementById("delivery-name").value;
            const phone = document.getElementById("delivery-phone").value;
            const address = document.getElementById("delivery-address").value;

            const paymentMethod = selectedPaymentMethod;
            let paymentInfo = `*Forma de Pagamento:* ${paymentMethod}`;
            if (paymentMethod === "Dinheiro") {
                const troco = document.getElementById("troco-para").value;
                paymentInfo += troco
                    ? ` (Troco para R$ ${troco})`
                    : " (Não precisa de troco)";
            }
            mensagem += `*Tipo de Pedido:* Entrega\n\n*Nome:* ${nome}\n*Telefone:* ${phone}\n*Endereço:* ${address}\n\n${paymentInfo}`;
        } else {
            const nome = document.getElementById("pickup-name").value;
            const dataInput = document.getElementById("pickup-date").value;
            const hora = document.getElementById("pickup-time").value;
            const [year, month, day] = dataInput.split("-");
            const dataFormatada = `${day}/${month}/${year}`;

            mensagem += `*Tipo de Pedido:* Retirada\n\n*Nome para Retirada:* ${nome}\n*Data Agendada:* ${dataFormatada}\n*Hora Agendada:* ${hora}`;
        }

        if (!/^55\d{10,11}$/.test(numeroWhatsApp)) {
            alert("Configure o número do WhatsApp da Elnora no arquivo script.js antes de publicar a loja.");
            return;
        }
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

        if(tipoEntrega==="delivery"&&selectedPaymentMethod==="PIX"){
            if(!window.ELNORA_PRO?.ready)return alert("A conexão segura da loja ainda não está disponível.");
            const email=document.getElementById("delivery-email").value.trim(),cpf=document.getElementById("delivery-cpf").value;
            try{
                window.elnoraTrack?.("begin_checkout",{currency:"BRL",value:total,items:carrinho.map(i=>({item_id:i.sku,item_name:i.nome,item_variant:i.tamanho,price:i.preco,quantity:i.quantidade}))});
                const created=await window.ELNORA_PRO.createOrder({
                    items:carrinho.map(i=>({variant_id:i.variantId,quantity:i.quantidade})),
                    coupon_code:appliedCoupon?.code||null,fulfillment:"delivery",one_way_km:Number(deliveryQuote?.oneWayKm||0),
                    payment_method:"PIX",payer_cpf:cpf,shipping_address:{cep:document.getElementById("delivery-cep").value,address:document.getElementById("delivery-address").value}
                });
                if(!created?.payment_id||!created?.qr_code)throw new Error(created?.error||"Não foi possível gerar o Pix.");
                abrirPixModal();pixLoading.hidden=true;pixContent.hidden=false;pixError.hidden=true;pixWhatsappOrder.hidden=true;
                pixTotal.textContent=formatarMoeda(Number(created.amount||created.order?.total||total));pixCopyCode.value=created.qr_code;
                if(created.qr_code_base64){pixQrImage.src=`data:image/png;base64,${created.qr_code_base64}`;pixQrImage.hidden=false}else pixQrImage.hidden=true;
                pixMessage.textContent=`Pedido ${created.order?.order_number||""} criado. Escaneie o QR Code ou use o Pix Copia e Cola.`;
                atualizarStatusPix(created.status||"pending");pixOrderWhatsappUrl=url;
                if(created.status!=="approved"){pixStatusTimer=setInterval(async()=>{try{const current=await window.ELNORA_PRO.paymentStatus(created.payment_id);atualizarStatusPix(current?.status||"pending");if(current?.status==="approved"){window.elnoraTrack?.("purchase",{transaction_id:created.order?.order_number||created.order?.id,value:Number(created.order?.total||total),currency:"BRL",shipping:Number(created.order?.shipping||0),items:carrinho.map(i=>({item_id:i.sku,item_name:i.nome,item_variant:i.tamanho,price:i.preco,quantity:i.quantidade}))})}}catch(e){console.warn(e)}},5000)}
            }catch(error){alert(error?.message||"Não foi possível criar o pedido. Faça login e tente novamente.");}
            return;
        }

        window.open(url, "_blank");
    };

    window.addEventListener("elnora:delivery-quote", (e) => {
        deliveryQuote = e.detail || null;
        atualizarCarrinho();
    });

    const carregarCatalogoProfissional=async()=>{
        if(!window.ELNORA_PRO?.ready)return;
        try{
            const data=await window.ELNORA_PRO.catalog();if(!data.length)return;
            produtos.splice(0,produtos.length,...data.map((p,i)=>({id:p.id,sku:p.sku,nome:p.name,categoria:p.category,preco:Number(p.price),imagem:p.image_url||"",descricao:p.description||"",variantes:p.product_variants||[]})));
            filtrarEMostrarProdutos();
        }catch(e){console.warn("ELNORA: catálogo Supabase indisponível; mantendo vitrine atual.",e)}
    };
    carregarCatalogoProfissional();

    // --- EVENT LISTENERS ---
    cartIcon.addEventListener("click", abrirCarrinho);
    closeCartBtn.addEventListener("click", fecharCarrinho);
    cartOverlay.addEventListener("click", fecharCarrinho);
    applyCouponBtn.addEventListener("click", applyCoupon);
    finishOrderBtn.addEventListener("click", finalizarPedido);
    viewCartBannerBtn.addEventListener("click", abrirCarrinho);

    // Barra de categorias funcional
    categoryBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            categoryBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            categoriaAtiva = btn.dataset.category || "all";

            // Ao trocar de categoria, limpa uma busca anterior para que
            // os produtos da categoria escolhida sempre apareçam.
            termoBusca = "";
            if (searchInput) searchInput.value = "";

            filtrarEMostrarProdutos();

            // Leva o cliente até a vitrine após selecionar a categoria.
            document.getElementById("produtos")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });

    // Event listener para campo de busca
    searchInput.addEventListener("input", (e) => {
        termoBusca = e.target.value;
        filtrarEMostrarProdutos();
    });

    document
        .querySelector(".products-container")
        .addEventListener("click", (e) => {
            if (e.target.matches(".product-button")) {
                const productCard = e.target.closest(".product-card");
                adicionarAoCarrinho(
                    Number.parseInt(productCard.dataset.id),
                    productCard,
                );
            }
        });
    cartBody.addEventListener("click", (e) => {
        const cartItem = e.target.closest(".cart-item");
        if (cartItem) {
            const cartKey=cartItem.dataset.cartKey;
            if(e.target.matches(".quantity-btn"))alterarQuantidade(cartKey,e.target.dataset.action);
            if(e.target.matches(".remove-item-btn")){
                carrinho=carrinho.filter(i=>i.cartKey!==cartKey);
                atualizarCarrinho();
            }
        }
    });

    deliveryToggleBtns.forEach((btn) =>
        btn.addEventListener("click", () => {
            deliveryToggleBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            tipoEntrega = btn.dataset.option;
            if (tipoEntrega === "delivery") {
                deliveryForm.style.display = "block";
                pickupForm.style.display = "none";
            } else {
                deliveryForm.style.display = "none";
                pickupForm.style.display = "block";
            }
        }),
    );

    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            trocoContainer.style.display =
                e.target.value === "Dinheiro" ? "block" : "none";
            document.querySelectorAll(".pix-customer-field").forEach((field) => {
                field.style.display = e.target.value === "PIX" ? "block" : "none";
            });
            document
                .querySelectorAll(".payment-option")
                .forEach((label) => label.classList.remove("selected"));
            e.target.closest(".payment-option").classList.add("selected");
        });
    });

    // Remove o erro ao digitar
    document
        .querySelectorAll(
            "#delivery-form-container input[required], #pickup-form-container input[required], #pickup-form-container select[required]",
        )
        .forEach((input) => {
            input.addEventListener("input", () => {
                if (input.value.trim() !== "") input.classList.remove("error");
            });
        });

    const cpfInput = document.getElementById("delivery-cpf");
    cpfInput?.addEventListener("input", () => {
        const digits = onlyDigits(cpfInput.value).slice(0, 11);
        cpfInput.value = digits
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    });

    // --- INICIALIZAÇÃO ---
    filtrarEMostrarProdutos();
    atualizarCarrinho();
});


// ===== ELNORA PREMIUM V3 — interações adicionais do cabeçalho =====
document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("header-search-form");
    const searchInput = document.querySelector(".search-input");
    const products = document.getElementById("produtos");

    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            searchInput?.dispatchEvent(new Event("input", { bubbles: true }));
            products?.scrollIntoView({ behavior: "smooth", block: "start" });
            searchInput?.focus();
        });
    }

    const modal = document.getElementById("elnora-modal");
    const modalText = document.getElementById("elnora-modal-text");
    const modalClose = document.querySelector(".elnora-modal-close");
    const modalOk = document.querySelector(".elnora-modal-ok");

    const showInfo = (message) => {
        if (!modal || !modalText) return;
        modalText.textContent = message;
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    };
    const closeInfo = () => {
        modal?.classList.remove("show");
        modal?.setAttribute("aria-hidden", "true");
    };

    document.getElementById("account-btn-placeholder-disabled")?.addEventListener("click", () =>
        showInfo("A área Minha Conta está preparada visualmente. Quando você definir o sistema de cadastro/login, ela poderá ser conectada sem alterar o layout.")
    );
    document.getElementById("favorites-btn-placeholder-disabled")?.addEventListener("click", () =>
        showInfo("A área de Favoritos está preparada. Na próxima etapa podemos salvar os produtos favoritos do cliente no navegador ou em um banco de dados.")
    );
    document.getElementById("whatsapp-header-placeholder-disabled")?.addEventListener("click", () =>
        showInfo("O atendimento via WhatsApp será ativado assim que você inserir o número oficial da ELNORA no arquivo script.js.")
    );

    modalClose?.addEventListener("click", closeInfo);
    modalOk?.addEventListener("click", closeInfo);
    modal?.addEventListener("click", (e) => { if (e.target === modal) closeInfo(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeInfo(); });
});


document.addEventListener("DOMContentLoaded",()=>{
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const open=id=>document.getElementById(id)?.classList.add("show"), close=id=>document.getElementById(id)?.classList.remove("show");
 $$(".panel-close").forEach(b=>b.onclick=()=>close(b.dataset.close));
 ["account-panel","favorites-panel"].forEach(id=>document.getElementById(id)?.addEventListener("click",e=>{if(e.target.id===id)close(id)}));

 // Conta: implementação única mantida nos blocos V15/V17 abaixo.
 // Favoritos persistentes neste navegador.
 const FK="elnora_favoritos_v1",read=()=>{try{return JSON.parse(localStorage.getItem(FK)||"[]")}catch{return[]}},write=a=>{
   localStorage.setItem(FK,JSON.stringify(a));
   window.dispatchEvent(new CustomEvent("elnora:favorites-changed",{detail:{count:a.length}}));
 };
 function decorate(){let f=read();$$(".product-card").forEach(c=>{if(c.querySelector(".favorite-toggle"))return;let id=+c.dataset.id,b=document.createElement("button");b.type="button";b.className="favorite-toggle"+(f.some(x=>x.id===id)?" active":"");b.innerHTML='<i class="'+(b.classList.contains("active")?"fa-solid":"fa-regular")+' fa-heart"></i>';b.onclick=e=>{e.stopPropagation();let a=read(),on=a.some(x=>x.id===id);a=on?a.filter(x=>x.id!==id):[...a,{id,nome:c.querySelector(".product-name")?.textContent||"Produto",preco:c.querySelector(".product-price")?.textContent||"",imagem:c.querySelector(".product-img")?.getAttribute("src")||""}];write(a);b.classList.toggle("active",!on);b.innerHTML='<i class="'+(!on?"fa-solid":"fa-regular")+' fa-heart"></i>'};c.appendChild(b)})}
 function renderFav(){let b=$("#favorites-list"),f=read();if(!b)return;b.innerHTML=f.length?f.map(p=>`<div class="favorite-row"><img src="${p.imagem}" alt=""><div><b>${p.nome}</b><br><strong>${p.preco}</strong></div><button data-rm="${p.id}"><i class="fa-solid fa-trash"></i></button></div>`).join(""):'<div class="empty-favorites"><i class="fa-regular fa-heart"></i><br>Nenhum produto favorito ainda.</div>';$$("[data-rm]",b).forEach(x=>x.onclick=()=>{write(read().filter(p=>p.id!==+x.dataset.rm));renderFav();let h=document.querySelector(`.product-card[data-id="${x.dataset.rm}"] .favorite-toggle`);h?.classList.remove("active");if(h)h.innerHTML='<i class="fa-regular fa-heart"></i>'})}
 $("#favorites-btn")?.addEventListener("click",()=>{renderFav();open("favorites-panel")});
 const pc=$(".products-container");if(pc)new MutationObserver(decorate).observe(pc,{childList:true,subtree:true});decorate();

 // WhatsApp do cabeçalho. Preencha abaixo com DDI+DDD+número, somente dígitos.
 const ELNORA_WHATSAPP="5511997523804";
 $("#whatsapp-header-btn")?.addEventListener("click",()=>{if(!ELNORA_WHATSAPP)return alert("Configure o número oficial da ELNORA na constante ELNORA_WHATSAPP no final do script.js.");window.open(`https://wa.me/${ELNORA_WHATSAPP}?text=${encodeURIComponent("Olá! Vim pelo site da ELNORA Calçados & Varejo e gostaria de atendimento.")}`,"_blank","noopener")});
});


// ===== ELNORA V6: indicador de favoritos no cabeçalho =====
document.addEventListener("DOMContentLoaded", () => {
  const FAVORITES_KEY = "elnora_favoritos_v1";
  const headerFavorite = document.getElementById("favorites-btn");

  function getFavoritesV6() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }
    catch { return []; }
  }

  function updateHeaderFavoriteV6() {
    if (!headerFavorite) return;
    const hasFavorites = getFavoritesV6().length > 0;
    headerFavorite.classList.toggle("has-favorites", hasFavorites);
    const icon = headerFavorite.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-solid", hasFavorites);
      icon.classList.toggle("fa-regular", !hasFavorites);
    }
  }

  // Atualiza após qualquer clique em coração/remover favorito.
  document.addEventListener("click", (event) => {
    if (event.target.closest(".favorite-toggle") || event.target.closest("[data-rm]")) {
      setTimeout(updateHeaderFavoriteV6, 0);
    }
  });

  window.addEventListener("storage", updateHeaderFavoriteV6);
  window.addEventListener("elnora:favorites-changed", updateHeaderFavoriteV6);
  updateHeaderFavoriteV6();
});


// ===== ELNORA V15 — cadastro e login aprimorados =====
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s,r=document)=>r.querySelector(s);
  const USERS_KEY="elnora_users_v2";
  const SESSION_KEY="elnora_session_v2";
  const REMEMBER_KEY="elnora_remember_email_v1";

  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||"[]")}catch{return[]}};
  const saveUsers=(v)=>localStorage.setItem(USERS_KEY,JSON.stringify(v));
  const getSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}};

  const onlyDigits=v=>(v||"").replace(/\D/g,"");
  const maskCPF=v=>onlyDigits(v).slice(0,11).replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2");
  const maskPhone=v=>onlyDigits(v).slice(0,11).replace(/^(\d{2})(\d)/,"($1) $2").replace(/(\d{5})(\d{1,4})$/,"$1-$2");
  const maskCEP=v=>onlyDigits(v).slice(0,8).replace(/(\d{5})(\d)/,"$1-$2");
  const validCPF=v=>{
    const c=onlyDigits(v); if(c.length!==11||/^(\d)\1{10}$/.test(c))return false;
    let s=0;for(let i=0;i<9;i++)s+=+c[i]*(10-i);let d=(s*10)%11;if(d===10)d=0;if(d!==+c[9])return false;
    s=0;for(let i=0;i<10;i++)s+=+c[i]*(11-i);d=(s*10)%11;if(d===10)d=0;return d===+c[10];
  };
  const setMsg=(id,msg,type="")=>{const e=$(id);if(e){e.textContent=msg;e.className="form-message "+type}};

  $("#register-cpf")?.addEventListener("input",e=>e.target.value=maskCPF(e.target.value));
  $("#register-phone")?.addEventListener("input",e=>e.target.value=maskPhone(e.target.value));
  $("#register-cep")?.addEventListener("input",e=>e.target.value=maskCEP(e.target.value));

  document.querySelectorAll(".password-toggle").forEach(btn=>btn.addEventListener("click",()=>{
    const input=document.getElementById(btn.dataset.passwordTarget); if(!input)return;
    input.type=input.type==="password"?"text":"password";
    btn.innerHTML=input.type==="text"?'<i class="fa-regular fa-eye-slash"></i>':'<i class="fa-regular fa-eye"></i>';
  }));

  function switchTab(tab){
    document.querySelectorAll(".account-tab").forEach(b=>b.classList.toggle("active",b.dataset.accountTab===tab));
    $("#account-login-view")?.classList.toggle("hidden",tab!=="login");
    $("#account-register-view")?.classList.toggle("hidden",tab!=="register");
    setMsg("#login-message","");setMsg("#register-message","");
  }
  document.querySelectorAll(".account-tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.accountTab)));

  const remembered=localStorage.getItem(REMEMBER_KEY);
  if(remembered && $("#login-email")){$("#login-email").value=remembered;$("#remember-login").checked=true}

  function updateDashboard(){
    const s=getSession(), guest=$("#account-guest"), user=$("#account-user");
    if(!guest||!user)return;
    guest.classList.toggle("hidden",!!s); user.classList.toggle("hidden",!s);
    if(!s)return;
    const u=readUsers().find(x=>x.id===s.userId||x.email===s.email)||s;
    $("#account-user-name").textContent=u.name||"Cliente ELNORA";
    $("#account-user-email").textContent=u.email||"";
    $("#account-user-phone").textContent=u.phone||"—";
    $("#account-user-cpf").textContent=u.cpf||"—";
    const address=[u.address,u.number,u.complement,u.neighborhood,u.city,u.state].filter(Boolean).join(", ");
    $("#account-user-address").textContent=address||"—";
    $("#account-address-status").textContent=address?"Cadastrado":"Cadastrar";
    try{$("#account-favorites-count").textContent=JSON.parse(localStorage.getItem("elnora_favoritos_v1")||"[]").length}catch{}
  }

  // Captura antes dos listeners antigos para evitar cadastro/login duplicado.
  $("#register-form")?.addEventListener("submit",async e=>{
    e.preventDefault();e.stopImmediatePropagation();setMsg("#register-message","");
    const password=$("#register-password").value,confirm=$("#register-password-confirm").value,cpf=$("#register-cpf").value.trim(),email=$("#register-email").value.trim().toLowerCase();
    if(!validCPF(cpf)){setMsg("#register-message","Informe um CPF válido.","error");return}
    if(password.length<6){setMsg("#register-message","A senha precisa ter pelo menos 6 caracteres.","error");return}
    if(password!==confirm){setMsg("#register-message","As senhas não são iguais.","error");return}
    if(!window.ELNORA_PRO?.ready){setMsg("#register-message","Cadastro seguro temporariamente indisponível.","error");return}
    const profile={full_name:$("#register-name").value.trim(),cpf,birth_date:$("#register-birth").value||null,phone:$("#register-phone").value.trim(),cep:$("#register-cep").value.trim(),street:$("#register-address").value.trim(),number:$("#register-number").value.trim(),complement:$("#register-complement").value.trim(),neighborhood:$("#register-neighborhood").value.trim(),city:$("#register-city").value.trim(),state:$("#register-state").value};
    try{const data=await window.ELNORA_PRO.signUp(email,password,profile);localStorage.setItem(SESSION_KEY,JSON.stringify({userId:data.user?.id,email,name:profile.full_name,...profile}));setMsg("#register-message",data.session?"Conta criada com sucesso.":"Conta criada. Confira seu e-mail para confirmar o cadastro.","success");e.target.reset();updateDashboard()}catch(err){setMsg("#register-message",err?.message||"Não foi possível criar a conta.","error")}
  },true);

  $("#login-form")?.addEventListener("submit",async e=>{
    e.preventDefault();e.stopImmediatePropagation();setMsg("#login-message","");
    const email=$("#login-email").value.trim().toLowerCase(),password=$("#login-password").value;
    if(!window.ELNORA_PRO?.ready){setMsg("#login-message","Login seguro temporariamente indisponível.","error");return}
    try{const data=await window.ELNORA_PRO.signIn(email,password);const info=await window.ELNORA_PRO.myProfile();const p=info?.profile||{},a=info?.address||{};if($("#remember-login").checked)localStorage.setItem(REMEMBER_KEY,email);else localStorage.removeItem(REMEMBER_KEY);localStorage.setItem(SESSION_KEY,JSON.stringify({userId:data.user?.id,email,name:p.full_name||email,phone:p.phone||"",cpf:p.cpf||"",address:a.street||"",number:a.number||"",complement:a.complement||"",neighborhood:a.neighborhood||"",city:a.city||"",state:a.state||""}));updateDashboard();setMsg("#login-message","Login realizado com sucesso.","success")}catch(err){setMsg("#login-message","E-mail ou senha incorretos.","error")}
  },true);

  $("#logout-btn")?.addEventListener("click",async e=>{
    e.preventDefault();e.stopImmediatePropagation();try{await window.ELNORA_PRO?.signOut?.()}catch{}
    localStorage.removeItem(SESSION_KEY);updateDashboard();switchTab("login");
  },true);

  // Ao abrir Minha Conta, mostra os dados atuais.
  $("#account-btn")?.addEventListener("click",()=>setTimeout(updateDashboard,0));
  window.addEventListener("elnora:favorites-changed",updateDashboard);
  updateDashboard();
});


// ===== ELNORA V16 TESTE — edição da conta e recuperação simulada =====
document.addEventListener("DOMContentLoaded",()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const UK="elnora_users_v2", SK="elnora_session_v2";
  const read=()=>{try{return JSON.parse(localStorage.getItem(UK)||"[]")}catch{return[]}};
  const sess=()=>{try{return JSON.parse(localStorage.getItem(SK)||"null")}catch{return null}};
  const msg=(el,text,type="")=>{if(el){el.textContent=text;el.className="form-message "+type}};

  $("#forgot-password-btn")?.addEventListener("click",()=>{
    document.getElementById("account-panel")?.classList.remove("show");
    document.getElementById("forgot-password-panel")?.classList.add("show");
  });
  document.querySelector('[data-close="forgot-password-panel"]')?.addEventListener("click",()=>document.getElementById("forgot-password-panel")?.classList.remove("show"));

  $("#forgot-password-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#forgot-email").value.trim().toLowerCase();
    const output = $("#forgot-message");

    if (window.ELNORA_PRO?.ready) {
      try {
        await window.ELNORA_PRO.resetPassword(email);
        msg(output, "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.", "success");
      } catch (error) {
        console.error("ELNORA: falha ao solicitar redefinição de senha.", error);
        msg(output, "Não foi possível enviar a recuperação agora. Tente novamente.", "error");
      }
      return;
    }

    const found = read().some(u => u.email === email);
    msg(
      output,
      found
        ? "Cadastro localizado no modo local. Configure o Supabase para enviar o link de redefinição por e-mail."
        : "Não encontramos uma conta local com este e-mail.",
      found ? "success" : "error"
    );
  });

  $("#edit-account-btn")?.addEventListener("click",()=>{
    const s=sess(), users=read(), u=users.find(x=>x.id===s?.userId||x.email===s?.email);
    if(!u)return;
    $("#edit-name").value=u.name||""; $("#edit-phone").value=u.phone||""; $("#edit-cep").value=u.cep||"";
    $("#edit-address").value=u.address||""; $("#edit-number").value=u.number||""; $("#edit-complement").value=u.complement||"";
    $("#edit-neighborhood").value=u.neighborhood||""; $("#edit-city").value=u.city||""; $("#edit-state").value=u.state||"";
    $("#account-edit-box").classList.toggle("hidden");
  });

  $("#edit-account-form")?.addEventListener("submit",e=>{
    e.preventDefault();
    const s=sess(), users=read(), i=users.findIndex(x=>x.id===s?.userId||x.email===s?.email);
    if(i<0)return;
    Object.assign(users[i],{
      name:$("#edit-name").value.trim(), phone:$("#edit-phone").value.trim(), cep:$("#edit-cep").value.trim(),
      address:$("#edit-address").value.trim(), number:$("#edit-number").value.trim(), complement:$("#edit-complement").value.trim(),
      neighborhood:$("#edit-neighborhood").value.trim(), city:$("#edit-city").value.trim(), state:$("#edit-state").value.trim().toUpperCase()
    });
    localStorage.setItem(UK,JSON.stringify(users));
    localStorage.setItem(SK,JSON.stringify({userId:users[i].id,email:users[i].email,name:users[i].name}));
    msg($("#edit-account-message"),"Dados atualizados com sucesso.","success");
    setTimeout(()=>location.reload(),700);
  });
});


// ===== ELNORA V17 — Central do Cliente =====
document.addEventListener("DOMContentLoaded",()=>{
 const $=(s,r=document)=>r.querySelector(s);
 const USERS="elnora_users_v2", SESSION="elnora_session_v2", FAV="elnora_favoritos_v1";
 const users=()=>{try{return JSON.parse(localStorage.getItem(USERS)||"[]")}catch{return[]}};
 const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||"null")}catch{return null}};
 const current=()=>{const s=session();return users().find(u=>u.id===s?.userId||u.email===s?.email)};
 const maskCpf=v=>{const d=(v||"").replace(/\D/g,"");return d.length===11?`***.***.***-${d.slice(-2)}`:"—"};

 function go(page){
   document.querySelectorAll(".cc-page").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
   document.querySelectorAll(".cc-nav-btn[data-cc-page]").forEach(x=>x.classList.toggle("active",x.dataset.ccPage===page));
 }
 document.querySelectorAll("[data-cc-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.ccPage)));
 document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));

 function refresh(){
   const u=current(); if(!u)return;
   const address=[u.address,u.number,u.complement,u.neighborhood,u.city,u.state].filter(Boolean).join(", ");
   const favs=(()=>{try{return JSON.parse(localStorage.getItem(FAV)||"[]")}catch{return[]}})();
   $("#account-user-name") && ($("#account-user-name").textContent=(u.name||"Cliente").split(" ")[0]);
   $("#account-user-email") && ($("#account-user-email").textContent=u.email||"");
   $("#cc-profile-email") && ($("#cc-profile-email").textContent=u.email||"—");
   $("#account-user-phone") && ($("#account-user-phone").textContent=u.phone||"—");
   $("#account-user-cpf") && ($("#account-user-cpf").textContent=maskCpf(u.cpf));
   $("#account-user-address") && ($("#account-user-address").textContent=address||"Nenhum endereço cadastrado.");
   $("#cc-address-short") && ($("#cc-address-short").textContent=address||"—");
   $("#account-address-status") && ($("#account-address-status").textContent=address?"Cadastrado":"Cadastrar");
   $("#account-favorites-count") && ($("#account-favorites-count").textContent=favs.length);
   $("#cc-favorites-text") && ($("#cc-favorites-text").textContent=`${favs.length} ${favs.length===1?"produto salvo":"produtos salvos"}`);
 }
 $("#cc-view-products")?.addEventListener("click",()=>{
   document.getElementById("account-panel")?.classList.remove("show");
   document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"});
 });
 $("#cc-change-password")?.addEventListener("click",()=>$("#cc-password-box")?.classList.toggle("hidden"));
 $("#cc-password-form")?.addEventListener("submit",e=>{
   e.preventDefault(); const u=current(); if(!u)return;
   const cur=$("#cc-current-password").value,n=$("#cc-new-password").value,c=$("#cc-confirm-password").value,m=$("#cc-password-message");
   const set=(t,ok)=>{m.textContent=t;m.className="form-message "+(ok?"success":"error")};
   if(cur!==u.password)return set("A senha atual está incorreta.",false);
   if(n.length<6)return set("A nova senha precisa ter pelo menos 6 caracteres.",false);
   if(n!==c)return set("A confirmação da nova senha não confere.",false);
   const a=users(),i=a.findIndex(x=>x.id===u.id);a[i].password=n;localStorage.setItem(USERS,JSON.stringify(a));
   e.target.reset();set("Senha alterada nesta versão de teste.",true);
 });
 window.addEventListener("elnora:favorites-changed",refresh);
 $("#account-btn")?.addEventListener("click",()=>setTimeout(refresh,20));
 refresh();
});


// ===== ELNORA V18 — sessão da Minha Conta corrigida =====
document.addEventListener("DOMContentLoaded",()=>{
  const SESSION_KEY="elnora_session_v2";
  const accountPanel=document.getElementById("account-panel");
  const accountBtn=document.getElementById("account-btn");
  const closeBtn=accountPanel?.querySelector('[data-close="account-panel"]');

  // V39: abre a área Minha Conta pelo botão do cabeçalho.
  accountBtn?.addEventListener("click",()=>{
    accountPanel?.classList.add("show");
    accountPanel?.setAttribute("aria-hidden","false");
  });

  function clearAccountSession(){
    localStorage.removeItem(SESSION_KEY);
    const guest=document.getElementById("account-guest");
    const user=document.getElementById("account-user");
    if(guest) guest.classList.remove("hidden");
    if(user) user.classList.add("hidden");
    const loginView=document.getElementById("account-login-view");
    const registerView=document.getElementById("account-register-view");
    if(loginView) loginView.classList.remove("hidden");
    if(registerView) registerView.classList.add("hidden");
    document.querySelectorAll(".account-tab").forEach(b=>b.classList.toggle("active",b.dataset.accountTab==="login"));
    const pass=document.getElementById("login-password");
    if(pass) pass.value="";
  }

  // Fechar a janela da conta equivale a encerrar o acesso à área protegida.
  closeBtn?.addEventListener("click",clearAccountSession,true);

  // Ao clicar novamente em Minha Conta, se a janela foi fechada, pede login e senha.
  accountBtn?.addEventListener("click",()=>{
    if(!localStorage.getItem(SESSION_KEY)){
      const guest=document.getElementById("account-guest");
      const user=document.getElementById("account-user");
      if(guest) guest.classList.remove("hidden");
      if(user) user.classList.add("hidden");
    }
  },true);

  // Se recarregar/abrir novamente o arquivo, não mantém uma sessão anterior.
  // O e-mail pode continuar lembrado se o cliente marcou essa opção, mas a senha é sempre solicitada.
  clearAccountSession();
});


// ===== ELNORA V19 — Favoritos detalhados =====
document.addEventListener("DOMContentLoaded",()=>{
 const FKEY="elnora_favoritos_v1";
 const list=document.getElementById("cc-favorites-list");
 const summary=document.getElementById("cc-favorites-text");

 function favValues(){try{return JSON.parse(localStorage.getItem(FKEY)||"[]")}catch{return[]}}
 function norm(v){return String(v??"").trim().toLowerCase()}

 function productCards(){
   return [...document.querySelectorAll(".product-card")];
 }
 function cardData(card){
   const title=card.querySelector(".product-title,h3,h4,[data-product-name]")?.textContent?.trim() || card.dataset.name || "";
   const price=card.querySelector(".product-price,.price,[data-price]")?.textContent?.trim() || "";
   const img=card.querySelector("img");
   const id=card.dataset.id || card.dataset.productId || card.getAttribute("data-product") || title;
   return {id,title,price,img:img?.getAttribute("src")||"",card};
 }
 function isFav(p,favs){
   return favs.some(f=>{
     if(typeof f==="object") return norm(f.id)===norm(p.id)||norm(f.name||f.nome||f.title)===norm(p.title);
     return norm(f)===norm(p.id)||norm(f)===norm(p.title);
   });
 }
 function render(){
   if(!list)return;
   const favs=favValues(), products=productCards().map(cardData), selected=products.filter(p=>isFav(p,favs));
   if(summary) summary.textContent=`${favs.length} ${favs.length===1?"produto salvo":"produtos salvos"}`;
   list.innerHTML="";
   if(!favs.length){
     list.innerHTML='<div class="cc-favorites-empty"><i class="fa-regular fa-heart"></i><p>Você ainda não adicionou produtos aos favoritos.</p></div>';
     return;
   }
   // Mostra os produtos encontrados no catálogo atual.
   selected.forEach(p=>{
     const item=document.createElement("article"); item.className="cc-favorite-item";
     item.innerHTML=`<div class="cc-favorite-img">${p.img?`<img src="${p.img}" alt="${p.title}">`:'<i class="fa-solid fa-shoe-prints"></i>'}</div>
       <div class="cc-favorite-info"><h5>${p.title||"Produto favorito"}</h5><p>Produto salvo nos seus favoritos</p><strong>${p.price||""}</strong></div>
       <div class="cc-favorite-actions"><button class="cc-favorite-open" type="button">Ver produto</button><button class="cc-favorite-remove" type="button">Remover</button></div>`;
     item.querySelector(".cc-favorite-open").addEventListener("click",()=>{
       document.getElementById("account-panel")?.classList.remove("show");
       setTimeout(()=>{
         p.card.scrollIntoView({behavior:"smooth",block:"center"});
         p.card.classList.add("elnora-favorite-highlight");
         setTimeout(()=>p.card.classList.remove("elnora-favorite-highlight"),2600);
       },180);
     });
     item.querySelector(".cc-favorite-remove").addEventListener("click",()=>{
       const next=favValues().filter(f=>{
         if(typeof f==="object") return !(norm(f.id)===norm(p.id)||norm(f.name||f.nome||f.title)===norm(p.title));
         return !(norm(f)===norm(p.id)||norm(f)===norm(p.title));
       });
       localStorage.setItem(FKEY,JSON.stringify(next));
       window.dispatchEvent(new CustomEvent("elnora:favorites-changed",{detail:{count:next.length}}));
       render();
     });
     list.appendChild(item);
   });
   // Fallback caso um favorito antigo não possa ser associado a um card atual.
   if(!selected.length && favs.length){
     list.innerHTML='<div class="cc-favorites-empty"><p>Atualize seus favoritos clicando novamente no coração dos produtos para exibir imagem e detalhes aqui.</p></div>';
   }
 }
 window.addEventListener("elnora:favorites-changed",render);
 document.querySelector('[data-cc-page="favorites"]')?.addEventListener("click",()=>setTimeout(render,0));
 document.getElementById("account-btn")?.addEventListener("click",()=>setTimeout(render,50));
 render();
});

// V27: atualiza o total imediatamente ao alternar Entrega/Retirada
document.addEventListener("click", (e) => {
  const b=e.target.closest(".delivery-btn");
  if(!b) return;
  if(b.dataset.option==="pickup") window.dispatchEvent(new CustomEvent("elnora:delivery-quote",{detail:null}));
});

// ELNORA V40 — redes sociais: enquanto os perfis oficiais não forem configurados,
// os ícones permanecem visíveis sem redirecionar para endereços inventados.
document.querySelectorAll('[data-social]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
      event.preventDefault();
      alert('Perfil oficial ainda não configurado. Informe o link desta rede social para ativar o acesso.');
    }
  });
});


// ELNORA V41 — Usuário Master privado.
(async function elnoraMasterVisibility(){
 const link=document.getElementById('master-nav-link'); if(!link)return; link.hidden=true;
 const cfg=window.ELNORA_CONFIG||{}, master=String(cfg.MASTER_EMAIL||'').trim().toLowerCase();
 try{
  if(cfg.SUPABASE_URL&&cfg.SUPABASE_PUBLISHABLE_KEY&&window.supabase){
   const sb=window.ELNORA_PRO?.supabase||window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);
   const {data:{user}}=await sb.auth.getUser();
   if(user){const {data:p}=await sb.from('profiles').select('role').eq('id',user.id).single();if(p?.role==='admin'){link.hidden=false;return;}}
  }
  const session=JSON.parse(localStorage.getItem('elnora_session_v2')||'null');
  if(master&&String(session?.email||'').toLowerCase()===master)link.hidden=false;
 }catch{}
})();


// ===== ELNORA — sincroniza estado dos favoritos no menu mobile =====
document.addEventListener("DOMContentLoaded", () => {
  const KEY = "elnora_favoritos_v1";
  const mobileFavorite = document.querySelector(
    '.mobile-actions-menu [data-mobile-target="favorites-btn"]'
  );

  function syncMobileFavoriteState() {
    if (!mobileFavorite) return;
    let favorites = [];
    try {
      favorites = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(favorites)) favorites = [];
    } catch {
      favorites = [];
    }
    const active = favorites.length > 0;
    mobileFavorite.classList.toggle("has-favorites", active);
    const icon = mobileFavorite.querySelector(".fa-heart");
    if (icon) {
      icon.classList.toggle("fa-solid", active);
      icon.classList.toggle("fa-regular", !active);
    }
  }

  window.addEventListener("elnora:favorites-changed", syncMobileFavoriteState);
  window.addEventListener("storage", syncMobileFavoriteState);
  document.addEventListener("click", event => {
    if (event.target.closest(".favorite-toggle") || event.target.closest("[data-rm]")) {
      setTimeout(syncMobileFavoriteState, 0);
    }
  });
  syncMobileFavoriteState();
});
